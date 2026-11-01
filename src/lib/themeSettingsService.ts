/**
 * Service de persistance de la configuration par thème.
 * Étape 1 de la refonte : registre + activation + migration.
 *
 * Modèle Firestore :
 *   collection `store_theme_settings`
 *   document  `${storeId}__${themeId}`
 *     { storeId, themeId, draft: ThemeSettingsConfig, published: ThemeSettingsConfig, updatedAt }
 *
 * - La personnalisation de chaque thème est conservée séparément :
 *   changer de thème puis revenir restaure la personnalisation précédente.
 * - `draft` = brouillon en cours d'édition ; `published` = version en ligne
 *   (la boutique publique ne change qu'à la publication — étape 2).
 * - Au changement de thème, les données communes de la marque (logo, nom,
 *   couleurs personnalisées, textes d'annonce / marque) sont reprises.
 * - Compatibilité : le rendu actuel lit `store_config.activeThemeId`
 *   (identifiant StoreTheme legacy) et `tenants.activeTheme` — l'activation
 *   écrit les deux, plus `tenants.activeThemeRegistryId` (nouveau registre).
 */

import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  EnovaThemeManifest,
  ThemeSectionPreset,
  getThemeManifest,
  UNIVERSAL_THEME_ID,
  LEGACY_TO_REGISTRY,
} from "../themes/registry";
import {
  StoreCustomizerConfig,
  defaultStoreConfig,
} from "../components/admin/StoreCustomizerConfig";

export const THEME_SETTINGS_COLLECTION = "store_theme_settings";

/* ---------------------------------------------------------------------- */
/* Types de configuration                                                 */
/* ---------------------------------------------------------------------- */

export interface HeroSlide {
  id: string;
  image: string;
  imageMobile: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  buttonLabel: string;
  buttonLabelAr: string;
  buttonLink: string;
  overlayOpacity: number;
  align: "start" | "center" | "end";
}

export interface CategoryDisplayOverride {
  categoryId: string;
  displayName: string;
  image: string;
  position: number;
  hidden: boolean;
}

export interface ProductPosition {
  productId: string;
  section: string;
  position: number;
}

export type ProductSortMode = "recent" | "price_asc" | "price_desc" | "bestsales" | "manual";

export interface ThemeSettingsConfig {
  sections: ThemeSectionPreset[];
  colors: EnovaThemeManifest["defaultColors"];
  fonts: EnovaThemeManifest["defaultFonts"];
  layoutVariants: EnovaThemeManifest["layoutVariants"];
  heroSlides: HeroSlide[];
  texts: {
    announcement: string;
    announcementLink: string;
    brandDescription: string;
    footerNote: string;
  };
  images: { logo: string; favicon: string };
  categoryDisplay: CategoryDisplayOverride[];
  productPosition: ProductPosition[];
  productSort: ProductSortMode;
}

export interface StoreThemeSettingsDoc {
  storeId: string;
  themeId: string;
  draft: ThemeSettingsConfig;
  published: ThemeSettingsConfig;
  updatedAt: number;
}

/** Données communes reprises d'un thème à l'autre. */
export interface CommonBrandData {
  storeName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  announcementText: string;
  announcementLink: string;
  brandDescription: string;
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */

export function themeSettingsDocId(storeId: string, themeId: string): string {
  return `${storeId}__${themeId}`;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Construit la configuration d'un thème depuis son preset + données communes. */
export function configFromManifest(
  manifest: EnovaThemeManifest,
  common?: Partial<CommonBrandData>
): ThemeSettingsConfig {
  return {
    sections: clone(manifest.defaultSections),
    colors: { ...manifest.defaultColors },
    fonts: { ...manifest.defaultFonts },
    layoutVariants: { ...manifest.layoutVariants },
    heroSlides: [],
    texts: {
      announcement: common?.announcementText ?? "",
      announcementLink: common?.announcementLink ?? "",
      brandDescription: common?.brandDescription ?? "",
      footerNote: "",
    },
    images: {
      logo: common?.logo ?? "",
      favicon: common?.favicon ?? "",
    },
    categoryDisplay: [],
    productPosition: [],
    productSort: "recent",
  };
}

/** Extrait les données communes d'une StoreCustomizerConfig existante. */
export function extractCommonFromStoreConfig(
  config: StoreCustomizerConfig
): CommonBrandData {
  return {
    storeName: config.storeName || "",
    logo: config.logoUrl || "",
    favicon: config.faviconUrl || "",
    primaryColor: config.primaryColor || "",
    announcementText: config.announcementText || "",
    announcementLink: config.announcementLink || "",
    brandDescription: config.brandDescription || "",
  };
}

/** Lit la store_config d'une boutique (avec valeurs par défaut). */
export async function readStoreConfig(
  storeId: string
): Promise<StoreCustomizerConfig> {
  try {
    const snap = await getDoc(doc(db, "store_config", storeId));
    if (snap.exists() && snap.data().config) {
      return { ...defaultStoreConfig, ...(snap.data().config as Partial<StoreCustomizerConfig>) };
    }
  } catch (err) {
    console.warn("themeSettingsService: lecture store_config impossible", err);
  }
  return { ...defaultStoreConfig };
}

/* ---------------------------------------------------------------------- */
/* CRUD                                                                   */
/* ---------------------------------------------------------------------- */

export async function getThemeSettingsDoc(
  storeId: string,
  themeId: string
): Promise<StoreThemeSettingsDoc | null> {
  try {
    const snap = await getDoc(
      doc(db, THEME_SETTINGS_COLLECTION, themeSettingsDocId(storeId, themeId))
    );
    if (!snap.exists()) return null;
    const data = snap.data() as Partial<StoreThemeSettingsDoc>;
    const manifest = getThemeManifest(themeId);
    const fallback = configFromManifest(manifest);
    return {
      storeId,
      themeId,
      draft: { ...fallback, ...(data.draft ?? {}) },
      published: { ...fallback, ...(data.published ?? data.draft ?? {}) },
      updatedAt: data.updatedAt ?? 0,
    };
  } catch (err) {
    console.warn("themeSettingsService: lecture impossible", err);
    return null;
  }
}

/** Configuration active d'un thème (publiée, sinon brouillon). */
export async function getActiveThemeConfig(
  storeId: string,
  themeId: string
): Promise<ThemeSettingsConfig | null> {
  const docData = await getThemeSettingsDoc(storeId, themeId);
  return docData ? docData.published : null;
}

/** Sauvegarde le brouillon d'un thème (fusion superficielle). */
export async function saveThemeDraft(
  storeId: string,
  themeId: string,
  patch: Partial<ThemeSettingsConfig>
): Promise<void> {
  const existing = await getThemeSettingsDoc(storeId, themeId);
  const manifest = getThemeManifest(themeId);
  const draft = { ...configFromManifest(manifest), ...(existing?.draft ?? {}), ...patch };
  await setDoc(
    doc(db, THEME_SETTINGS_COLLECTION, themeSettingsDocId(storeId, themeId)),
    {
      storeId,
      themeId,
      draft,
      published: existing?.published ?? draft,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

/** Publie : la boutique publique passe sur le brouillon. */
export async function publishThemeSettings(
  storeId: string,
  themeId: string
): Promise<void> {
  const existing = await getThemeSettingsDoc(storeId, themeId);
  if (!existing) return;
  await setDoc(
    doc(db, THEME_SETTINGS_COLLECTION, themeSettingsDocId(storeId, themeId)),
    { published: existing.draft, updatedAt: Date.now() },
    { merge: true }
  );
}

/** Réinitialise un thème sur son preset (brouillon + publication). */
export async function resetThemeToPreset(
  storeId: string,
  themeId: string,
  common?: Partial<CommonBrandData>
): Promise<void> {
  const preset = configFromManifest(getThemeManifest(themeId), common);
  await setDoc(
    doc(db, THEME_SETTINGS_COLLECTION, themeSettingsDocId(storeId, themeId)),
    { storeId, themeId, draft: preset, published: preset, updatedAt: Date.now() },
    { merge: true }
  );
}

/* ---------------------------------------------------------------------- */
/* Activation d'un thème                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Active un thème pour une boutique :
 * 1. restaure la personnalisation précédente de ce thème si elle existe,
 *    sinon la crée depuis le preset (en reprenant les données communes) ;
 * 2. met à jour les points de compatibilité du rendu actuel
 *    (store_config.activeThemeId = identifiant legacy, tenants.activeTheme,
 *    tenants.activeThemeRegistryId, localStorage) ;
 * 3. applique la palette du thème si la boutique n'a pas de couleurs de
 *    marque personnalisées (sinon les couleurs de marque sont conservées).
 */
export async function activateTheme(
  storeId: string,
  themeId: string,
  currentStoreConfig?: StoreCustomizerConfig
): Promise<StoreThemeSettingsDoc> {
  const manifest = getThemeManifest(themeId);
  const config = currentStoreConfig ?? (await readStoreConfig(storeId));
  const common = extractCommonFromStoreConfig(config);

  // 1) Personnalisation par thème (restauration ou preset)
  let settings = await getThemeSettingsDoc(storeId, manifest.id);
  if (!settings) {
    const preset = configFromManifest(manifest, common);
    settings = {
      storeId,
      themeId: manifest.id,
      draft: preset,
      published: preset,
      updatedAt: Date.now(),
    };
    await setDoc(
      doc(db, THEME_SETTINGS_COLLECTION, themeSettingsDocId(storeId, manifest.id)),
      settings
    );
  }

  // 2) Palette : appliquée seulement si la boutique n'a pas personnalisé ses couleurs.
  const hasBrandColors =
    Boolean(common.primaryColor) &&
    common.primaryColor.toLowerCase() !== defaultStoreConfig.primaryColor.toLowerCase();

  const nextConfig: StoreCustomizerConfig = {
    ...config,
    ...(hasBrandColors
      ? {}
      : {
          primaryColor: manifest.defaultColors.primary,
          secondaryColor: manifest.defaultColors.secondary,
          fontFamily: manifest.defaultFonts.body,
        }),
  };

  // 3) Compatibilité rendu + registre
  await setDoc(
    doc(db, "store_config", storeId),
    { activeThemeId: manifest.legacyStoreThemeId, config: nextConfig },
    { merge: true }
  );
  await setDoc(
    doc(db, "tenants", storeId),
    {
      activeTheme: manifest.legacyStoreThemeId,
      activeThemeRegistryId: manifest.id,
      activeThemeName: manifest.name,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  try {
    localStorage.setItem("dzbuild_active_theme", manifest.legacyStoreThemeId);
  } catch {
    /* localStorage indisponible (SSR / navigation privée) : non bloquant */
  }

  return settings;
}

/* ---------------------------------------------------------------------- */
/* Migration des boutiques existantes                                     */
/* ---------------------------------------------------------------------- */

/**
 * Migration idempotente : toute boutique existante est rattachée à son thème
 * du nouveau registre (par défaut l'Universel) SANS perte de personnalisation
 * — la store_config actuelle devient le contenu initial du thème actif.
 */
export async function ensureStoreThemeMigration(
  storeId: string
): Promise<{ manifestId: string; migrated: boolean }> {
  try {
    const tenantSnap = await getDoc(doc(db, "tenants", storeId));
    const tenantData = tenantSnap.exists() ? tenantSnap.data() : {};

    const alreadySet =
      typeof tenantData.activeThemeRegistryId === "string" &&
      LEGACY_TO_REGISTRY[tenantData.activeThemeRegistryId] !== undefined;
    if (alreadySet) {
      return { manifestId: tenantData.activeThemeRegistryId as string, migrated: false };
    }

    // Thème actuel (legacy) -> identifiant du registre
    const legacyId =
      (tenantData.activeTheme as string | undefined) ??
      localStorage.getItem("dzbuild_active_theme") ??
      undefined;
    const manifestId = LEGACY_TO_REGISTRY[legacyId ?? ""] ?? UNIVERSAL_THEME_ID;
    const manifest = getThemeManifest(manifestId);

    // Seed : la personnalisation actuelle devient le contenu du thème actif
    const config = await readStoreConfig(storeId);
    const common = extractCommonFromStoreConfig(config);
    const existing = await getThemeSettingsDoc(storeId, manifestId);
    if (!existing) {
      const seeded = configFromManifest(manifest, {
        ...common,
        // Conserve la personnalisation réelle des couleurs / polices
        primaryColor: config.primaryColor || manifest.defaultColors.primary,
      });
      // Reprend les sections déjà connues du customizer actuel
      seeded.fonts = {
        heading: manifest.defaultFonts.heading,
        body: config.fontFamily || manifest.defaultFonts.body,
      };
      await setDoc(
        doc(db, THEME_SETTINGS_COLLECTION, themeSettingsDocId(storeId, manifestId)),
        {
          storeId,
          themeId: manifestId,
          draft: seeded,
          published: seeded,
          updatedAt: Date.now(),
        }
      );
    }

    await setDoc(
      doc(db, "tenants", storeId),
      {
        activeThemeRegistryId: manifestId,
        activeThemeName: manifest.name,
        ...(legacyId ? {} : { activeTheme: manifest.legacyStoreThemeId }),
      },
      { merge: true }
    );

    return { manifestId, migrated: true };
  } catch (err) {
    console.warn("themeSettingsService: migration impossible", err);
    return { manifestId: UNIVERSAL_THEME_ID, migrated: false };
  }
}
