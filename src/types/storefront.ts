/**
 * Modèle de données du contenu éditable de la page d'accueil de la vitrine.
 * Document Firestore : /tenants/{userId}/settings/storefront (écriture en merge).
 * La vitrine publique et l'aperçu du customizer lisent ce modèle ;
 * mergeStorefrontSettings() garantit des valeurs par défaut propres (jamais
 * de placeholder "Titre principal" visible en vitrine).
 */

export type StorefrontLang = "fr" | "ar";

/** Texte bilingue Français / Arabe. */
export interface BilingualText {
  fr: string;
  ar: string;
}

/** Identifiants des sections ordonnables de la page d'accueil. */
export type SectionId = "hero" | "trust" | "categories" | "featured";

/** Icônes disponibles pour les items de la barre de réassurance. */
export type TrustIconId =
  | "truck"
  | "shield"
  | "rotate"
  | "phone"
  | "clock"
  | "star"
  | "package"
  | "check";

export interface TrustItem {
  id: string;
  icon: TrustIconId;
  visible: boolean;
  title: BilingualText;
  subtitle: BilingualText;
}

export interface HeroButtonSettings {
  visible: boolean;
  text: BilingualText;
  link: string;
}

export interface HeroSettings {
  visible: boolean;
  badge: {
    visible: boolean;
    text: BilingualText;
  };
  title: BilingualText;
  description: BilingualText;
  primaryButton: HeroButtonSettings;
  secondaryButton: HeroButtonSettings;
  desktopImage: string;
  mobileImage: string;
  /** Opacité du voile sombre sur l'image de fond, en pourcentage (0-100). */
  overlayOpacity: number;
  align: "start" | "center" | "end";
}

export interface TrustBarSettings {
  visible: boolean;
  items: TrustItem[];
}

export interface CategoriesSettings {
  visible: boolean;
  title: BilingualText;
  subtitle: BilingualText;
  /** Catégories sélectionnées dans la collection `categories`. Vide = toutes. */
  categoryIds: string[];
  maxCount: number;
}

export interface FeaturedProductsSettings {
  visible: boolean;
  badge: BilingualText;
  title: BilingualText;
  viewAllText: BilingualText;
  source: "bestsales" | "manual";
  /** Produits choisis manuellement (source = "manual"). */
  productIds: string[];
  count: number;
}

export interface StorefrontSettings {
  sectionsOrder: SectionId[];
  hero: HeroSettings;
  trustBar: TrustBarSettings;
  categories: CategoriesSettings;
  featured: FeaturedProductsSettings;
}

/** Catégorie allégée pour les éditeurs et l'aperçu. */
export interface EditorCategoryLite {
  id: string;
  name: string;
  imageUrl?: string;
  productCount?: number;
}

/* ---------------------------------------------------------------------- */
/* Valeurs par défaut — copy réelle bilingue, jamais de placeholder.      */
/* ---------------------------------------------------------------------- */

export const defaultStorefrontSettings: StorefrontSettings = {
  sectionsOrder: ["hero", "trust", "categories", "featured"],
  hero: {
    visible: true,
    badge: {
      visible: true,
      text: {
        fr: "Nouvelle collection 2026",
        ar: "تشكيلة الموسم الجديدة 2026",
      },
    },
    title: {
      fr: "Des produits tendance, livrés partout en Algérie",
      ar: "أزياء عصرية لكل المناسبات",
    },
    description: {
      fr: "Découvrez notre nouvelle sélection au meilleur rapport qualité-prix, avec livraison rapide dans toutes les wilayas et paiement à la livraison.",
      ar: "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة وجودة عالية مع توصيل سريع لجميع الولايات.",
    },
    primaryButton: {
      visible: true,
      text: { fr: "Acheter maintenant", ar: "اشتري الآن" },
      link: "#all-products",
    },
    secondaryButton: {
      visible: true,
      text: { fr: "Voir les catégories", ar: "تصفح الأقسام" },
      link: "#categories",
    },
    desktopImage: "",
    mobileImage: "",
    overlayOpacity: 60,
    align: "start",
  },
  trustBar: {
    visible: true,
    items: [
      {
        id: "trust-truck",
        icon: "truck",
        visible: true,
        title: { fr: "Livraison dans 58 wilayas", ar: "توصيل لـ 58 ولاية" },
        subtitle: { fr: "Rapide, en 24 - 48h", ar: "سريع خلال 24 - 48 ساعة" },
      },
      {
        id: "trust-shield",
        icon: "shield",
        visible: true,
        title: { fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
        subtitle: { fr: "Vérifiez avant de payer", ar: "افحص طلبك قبل الدفع" },
      },
      {
        id: "trust-rotate",
        icon: "rotate",
        visible: true,
        title: { fr: "Échange facile garanti", ar: "ضمان استبدال سهل" },
        subtitle: { fr: "Sous 7 jours", ar: "خلال 7 أيام من الاستلام" },
      },
      {
        id: "trust-phone",
        icon: "phone",
        visible: true,
        title: { fr: "Service client 7j/7", ar: "خدمة عملاء 7/7" },
        subtitle: { fr: "Réponse rapide sur WhatsApp", ar: "رد فوري على الواتساب" },
      },
    ],
  },
  categories: {
    visible: true,
    title: { fr: "Parcourir les catégories", ar: "تصفح الأقسام" },
    subtitle: {
      fr: "Choisissez votre catégorie et découvrez nos meilleurs produits",
      ar: "اختر القسم المناسب وتصفح أفضل المنتجات",
    },
    categoryIds: [],
    maxCount: 10,
  },
  featured: {
    visible: true,
    badge: { fr: "Meilleures ventes", ar: "الأكثر مبيعاً" },
    title: { fr: "Produits en vedette", ar: "المنتجات المميزة" },
    viewAllText: { fr: "Voir tout", ar: "عرض الكل" },
    source: "bestsales",
    productIds: [],
    count: 4,
  },
};

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */

/**
 * Fusionne un document Firestore partiel avec les valeurs par défaut.
 * Tolérant aux champs absents, aux sections manquantes et aux items
 * incomplets : le résultat est toujours un StorefrontSettings complet.
 */
export function mergeStorefrontSettings(
  partial?: Partial<StorefrontSettings> | null
): StorefrontSettings {
  const d = defaultStorefrontSettings;
  if (!partial || typeof partial !== "object") {
    return JSON.parse(JSON.stringify(d)) as StorefrontSettings;
  }

  const order = Array.isArray(partial.sectionsOrder)
    ? partial.sectionsOrder.filter((id): id is SectionId =>
        ["hero", "trust", "categories", "featured"].includes(id)
      )
    : [];
  // Sections connues absentes de l'ordre sauvegardé : ajoutées à la fin.
  const missing = d.sectionsOrder.filter((id) => !order.includes(id));

  const hero: Partial<HeroSettings> = partial.hero ?? {};
  const trustBar: Partial<TrustBarSettings> = partial.trustBar ?? {};
  const categories: Partial<CategoriesSettings> = partial.categories ?? {};
  const featured: Partial<FeaturedProductsSettings> = partial.featured ?? {};

  return {
    sectionsOrder: [...order, ...missing],
    hero: {
      ...d.hero,
      ...hero,
      badge: { ...d.hero.badge, ...(hero.badge ?? {}) },
      primaryButton: { ...d.hero.primaryButton, ...(hero.primaryButton ?? {}) },
      secondaryButton: { ...d.hero.secondaryButton, ...(hero.secondaryButton ?? {}) },
      title: { ...d.hero.title, ...(hero.title ?? {}) },
      description: { ...d.hero.description, ...(hero.description ?? {}) },
    },
    trustBar: {
      ...d.trustBar,
      ...trustBar,
      items: Array.isArray(trustBar.items)
        ? trustBar.items.map((item, index) => ({
            ...d.trustBar.items[index % d.trustBar.items.length],
            ...item,
            title: { ...d.trustBar.items[index % d.trustBar.items.length].title, ...(item.title ?? {}) },
            subtitle: { ...d.trustBar.items[index % d.trustBar.items.length].subtitle, ...(item.subtitle ?? {}) },
          }))
        : d.trustBar.items,
    },
    categories: {
      ...d.categories,
      ...categories,
      title: { ...d.categories.title, ...(categories.title ?? {}) },
      subtitle: { ...d.categories.subtitle, ...(categories.subtitle ?? {}) },
      categoryIds: Array.isArray(categories.categoryIds) ? categories.categoryIds : [],
    },
    featured: {
      ...d.featured,
      ...featured,
      badge: { ...d.featured.badge, ...(featured.badge ?? {}) },
      title: { ...d.featured.title, ...(featured.title ?? {}) },
      viewAllText: { ...d.featured.viewAllText, ...(featured.viewAllText ?? {}) },
      productIds: Array.isArray(featured.productIds) ? featured.productIds : [],
    },
  };
}

/**
 * Retourne le texte dans la langue demandée ; à défaut la langue opposée
 * si elle est renseignée, sinon le fallback fourni.
 */
export function pickText(
  value: BilingualText | undefined,
  lang: StorefrontLang,
  fallback = ""
): string {
  if (!value) return fallback;
  const primary = (value[lang] ?? "").trim();
  if (primary) return primary;
  const other = lang === "fr" ? (value.ar ?? "").trim() : (value.fr ?? "").trim();
  return other || fallback;
}
