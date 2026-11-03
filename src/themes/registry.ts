/**
 * Registre des thèmes Enova — Étape 1 de la refonte du système de thèmes.
 *
 * Chaque thème professionnel est décrit par un manifeste autonome :
 * identité, catégorie, points forts, sections par défaut, palette, polices,
 * variantes de mise en page et capacités (panier / devis).
 *
 * Le rendu continue d'utiliser les données de démonstration existantes
 * (StoreTheme, cf. legacyStoreThemeId) ; les designs réellement distincts
 * arrivent avec l'étape 3 (thèmes un par un).
 *
 * Ce fichier est volontairement sans dépendance (pur TS) : testable isolément.
 */

export type ThemeCategory = "ecommerce" | "digital_services" | "corporate";

export interface ThemeSectionPreset {
  id: string;
  enabled: boolean;
}

export interface ThemeColorsPreset {
  primary: string;
  secondary: string;
  background: string;
  heading: string;
}

export interface ThemeFontsPreset {
  /** Google Fonts — doit supporter l'arabe (Cairo, Tajawal, Almarai, …). */
  heading: string;
  body: string;
}

export interface ThemeLayoutVariants {
  heroStyle: "fullscreen" | "split" | "banner" | "minimal";
  productCard: "standard" | "compact" | "editorial" | "bold";
  categoryStyle: "circles" | "cards" | "list";
  gridColumns: 2 | 3 | 4;
}

export interface EnovaThemeManifest {
  id: string;
  name: string;
  nameAr: string;
  category: ThemeCategory;
  previewImage: string;
  description: string;
  /** 4 points forts affichés sur la carte du thème. */
  features: string[];
  defaultSections: ThemeSectionPreset[];
  defaultColors: ThemeColorsPreset;
  defaultFonts: ThemeFontsPreset;
  layoutVariants: ThemeLayoutVariants;
  /** Le thème gère-t-il un panier / commande COD ? */
  supportsCart: boolean;
  /** Le thème gère-t-il les demandes de devis (leads) ? */
  supportsQuote: boolean;
  /** StoreTheme existant utilisé pour l'aperçu de démonstration. */
  legacyStoreThemeId: string;
  /** Badge « NOUVEAU » sur la carte. */
  isNew?: boolean;
}

export const THEME_CATEGORIES: { id: ThemeCategory | "all"; label: string }[] = [
  { id: "all", label: "Tous les thèmes" },
  { id: "ecommerce", label: "E-Commerce" },
  { id: "digital_services", label: "Digital & Services" },
  { id: "corporate", label: "Vitrine Entreprise" },
];

/** Thème universel par défaut (migration des boutiques existantes). */
export const UNIVERSAL_THEME_ID = "starter_v2";

/** Correspondance ancien identifiant StoreTheme -> identifiant du registre. */
export const LEGACY_TO_REGISTRY: Record<string, string> = {
  starter: "starter_v2",
  fashion_chic: "fashion_clothes",
  digital: "digital_products",
  glow_beauty: "glow_beauty",
  brico: "brico_tools",
  electro_zone: "electro_zone",
  turbo_mono: "turbo_mono",
  // Identifiants du registre : mappés sur eux-mêmes (idempotence).
  starter_v2: "starter_v2",
  fashion_clothes: "fashion_clothes",
  digital_products: "digital_products",
  organic_bio: "organic_bio",
  brico_tools: "brico_tools",
  corporate_showcase: "corporate_showcase",
  pro_services: "pro_services",
};

const section = (id: string, enabled = true): ThemeSectionPreset => ({ id, enabled });

export const THEME_REGISTRY: EnovaThemeManifest[] = [
  {
    id: "starter_v2",
    name: "Universel",
    nameAr: "الشامل",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    description:
      "Design épuré et polyvalent pour tout type de commerce en ligne. Sections standard et conversion COD optimisée — le choix sûr pour démarrer vite.",
    features: [
      "Design épuré adapté à tous les secteurs",
      "Sections : hero, catégories, vedettes, avis, marque",
      "Conversion COD optimisée (Fast Checkout 58 wilayas)",
      "Entièrement personnalisable en direct",
    ],
    defaultSections: [
      section("hero"),
      section("trust"),
      section("categories"),
      section("featured"),
      section("reviews"),
      section("brand"),
    ],
    defaultColors: { primary: "#f59e0b", secondary: "#d97706", background: "#ffffff", heading: "#1f2937" },
    defaultFonts: { heading: "Cairo", body: "Tajawal" },
    layoutVariants: { heroStyle: "banner", productCard: "standard", categoryStyle: "circles", gridColumns: 4 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "starter",
  },
  {
    id: "fashion_clothes",
    name: "Vêtement",
    nameAr: "الملابس",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    description:
      "Hero plein écran façon lookbook, carte produit avec 2ᵉ image au survol, filtres taille et couleur, guide des tailles sur la fiche produit.",
    features: [
      "Hero lookbook plein écran + bannières",
      "2ᵉ image au survol des cartes produits",
      "Filtres taille / couleur + guide des tailles",
      "Badges Nouveau / Promo, grille 4 colonnes",
    ],
    defaultSections: [
      section("hero"),
      section("categories"),
      section("featured"),
      section("reviews"),
      section("brand"),
    ],
    defaultColors: { primary: "#18181b", secondary: "#b08968", background: "#faf9f7", heading: "#18181b" },
    defaultFonts: { heading: "Reem Kufi", body: "Tajawal" },
    layoutVariants: { heroStyle: "fullscreen", productCard: "editorial", categoryStyle: "circles", gridColumns: 4 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "fashion_chic",
  },
  {
    id: "digital_products",
    name: "Produit Digital",
    nameAr: "المنتجات الرقمية",
    category: "digital_services",
    previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    description:
      "Pensé pour les e-books, logiciels, abonnements et clés de licence : pas de livraison ni de stock, CTA « Accès immédiat », FAQ intégrée.",
    features: [
      "Sans champs wilaya / adresse de livraison",
      "CTA « Acheter / Télécharger — Accès immédiat »",
      "Aperçu du produit + livraison par code",
      "FAQ intégrée et badges de confiance digitale",
    ],
    defaultSections: [
      section("hero"),
      section("featured"),
      section("faq"),
      section("trust"),
      section("brand"),
    ],
    defaultColors: { primary: "#8b5cf6", secondary: "#6366f1", background: "#ffffff", heading: "#1e1b4b" },
    defaultFonts: { heading: "Changa", body: "Almarai" },
    layoutVariants: { heroStyle: "split", productCard: "compact", categoryStyle: "cards", gridColumns: 3 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "digital",
  },
  {
    id: "electro_zone",
    name: "Accessoires & High-Tech",
    nameAr: "إلكترونيات وملحقات",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
    description:
      "Grille dense, zoom image, pastilles de variantes couleur, produits associés et bandeau « Livraison 58 wilayas en 24h/48h ».",
    features: [
      "Grille produits dense et zoom image",
      "Variantes couleur en pastilles",
      "Produits associés sur la fiche",
      "Bandeau « Livraison 58 wilayas 24h/48h »",
    ],
    defaultSections: [
      section("hero"),
      section("trust"),
      section("categories"),
      section("featured"),
    ],
    defaultColors: { primary: "#0ea5e9", secondary: "#0369a1", background: "#f8fafc", heading: "#0f172a" },
    defaultFonts: { heading: "Cairo", body: "Tajawal" },
    layoutVariants: { heroStyle: "banner", productCard: "compact", categoryStyle: "cards", gridColumns: 4 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "electro_zone",
  },
  {
    id: "organic_bio",
    name: "Bio & Naturel",
    nameAr: "بيو وطبيعي",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
    description:
      "Palette verte et naturelle, badges Certifié / Local / Naturel, section histoire du terroir et fiche produit avec composition.",
    features: [
      "Palette verte / naturelle apaisante",
      "Badges 100% Bio · Local · Naturel",
      "Section origine / histoire du producteur",
      "Fiche produit : ingrédients & composition",
    ],
    defaultSections: [
      section("hero"),
      section("story"),
      section("categories"),
      section("featured"),
      section("trust"),
    ],
    defaultColors: { primary: "#16a34a", secondary: "#4d7c0f", background: "#f7faf3", heading: "#14532d" },
    defaultFonts: { heading: "El Messiri", body: "Almarai" },
    layoutVariants: { heroStyle: "split", productCard: "standard", categoryStyle: "cards", gridColumns: 3 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "organic_bio",
    isNew: true,
  },
  {
    id: "glow_beauty",
    name: "Cosmétique & Beauté",
    nameAr: "مستحضرات التجميل",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    description:
      "Style doux aux tons rosés et dorés : comparateur avant/après, badges par type de peau, packs de routines beauté et témoignages.",
    features: [
      "Style doux, tons rosés / dorés",
      "Comparateur visuel Avant / Après",
      "Badges par type de peau + ingrédients",
      "Packs & routines beauté, témoignages",
    ],
    defaultSections: [
      section("hero"),
      section("featured"),
      section("testimonials"),
      section("story"),
      section("trust"),
    ],
    defaultColors: { primary: "#e11d48", secondary: "#c9a227", background: "#fffbfa", heading: "#3f3f46" },
    defaultFonts: { heading: "Reem Kufi", body: "Almarai" },
    layoutVariants: { heroStyle: "split", productCard: "editorial", categoryStyle: "circles", gridColumns: 3 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "glow_beauty",
  },
  {
    id: "brico_tools",
    name: "Bricolage & Outillage",
    nameAr: "أدوات البناء",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80",
    description:
      "Grandes catégories imagées, filtres techniques (marque, spécifications), tableau de caractéristiques et barre de navigation mobile fixe en bas.",
    features: [
      "Grandes catégories avec images",
      "Filtres techniques : marque, spécifications",
      "Tableau de caractéristiques produit",
      "Barre de navigation mobile fixe en bas",
    ],
    defaultSections: [
      section("hero"),
      section("categories"),
      section("featured"),
      section("brand"),
      section("trust"),
    ],
    defaultColors: { primary: "#ea580c", secondary: "#9a3412", background: "#ffffff", heading: "#1c1917" },
    defaultFonts: { heading: "Changa", body: "Cairo" },
    layoutVariants: { heroStyle: "banner", productCard: "bold", categoryStyle: "list", gridColumns: 3 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "brico",
  },
  {
    id: "corporate_showcase",
    name: "Vitrine Entreprise",
    nameAr: "موقع الشركة",
    category: "corporate",
    previewImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    description:
      "Site vitrine institutionnel : À propos, Services, Réalisations, Équipe, Contact + catalogue. Bouton « Demander un devis » avec formulaire et leads.",
    features: [
      "Sections : À propos, Services, Réalisations, Équipe",
      "Bouton « Demander un devis » (formulaire)",
      "Demandes enregistrées en leads + notification",
      "Carte, horaires et coordonnées",
    ],
    defaultSections: [
      section("hero"),
      section("services"),
      section("gallery"),
      section("team"),
      section("testimonials"),
      section("contact"),
    ],
    defaultColors: { primary: "#1d4ed8", secondary: "#1e3a8a", background: "#ffffff", heading: "#0f172a" },
    defaultFonts: { heading: "Amiri", body: "Tajawal" },
    layoutVariants: { heroStyle: "minimal", productCard: "standard", categoryStyle: "cards", gridColumns: 3 },
    supportsCart: false,
    supportsQuote: true,
    legacyStoreThemeId: "corporate_showcase",
    isNew: true,
  },
  {
    id: "pro_services",
    name: "Services Professionnels",
    nameAr: "خدمات مهنية",
    category: "digital_services",
    previewImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    description:
      "Grille de tarifs / forfaits, prise de rendez-vous directe avec confirmation WhatsApp, témoignages clients et FAQ.",
    features: [
      "Grille de tarifs / forfaits par service",
      "Prise de RDV : formulaire + WhatsApp",
      "Témoignages clients + FAQ",
      "Badges de confiance et avis vérifiés",
    ],
    defaultSections: [
      section("hero"),
      section("services"),
      section("pricing"),
      section("testimonials"),
      section("faq"),
      section("contact"),
    ],
    defaultColors: { primary: "#0f766e", secondary: "#115e59", background: "#f8fafc", heading: "#134e4a" },
    defaultFonts: { heading: "El Messiri", body: "Cairo" },
    layoutVariants: { heroStyle: "minimal", productCard: "standard", categoryStyle: "cards", gridColumns: 3 },
    supportsCart: false,
    supportsQuote: true,
    legacyStoreThemeId: "pro_services",
    isNew: true,
  },
  {
    id: "turbo_mono",
    name: "Turbo COD Mono-Produit",
    nameAr: "توربو منتج واحد",
    category: "ecommerce",
    previewImage: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
    description:
      "Landing ultra-ciblée pour un seul produit : page longue, arguments, avis et Fast Checkout — conçue pour le COD à haute conversion.",
    features: [
      "Mise en avant d'un produit unique",
      "Page de vente longue et arguments",
      "Avis clients et preuve sociale",
      "Fast Checkout COD haute conversion",
    ],
    defaultSections: [
      section("hero"),
      section("featured"),
      section("testimonials"),
      section("faq"),
      section("trust"),
    ],
    defaultColors: { primary: "#ef4444", secondary: "#b91c1c", background: "#ffffff", heading: "#18181b" },
    defaultFonts: { heading: "Changa", body: "Tajawal" },
    layoutVariants: { heroStyle: "fullscreen", productCard: "bold", categoryStyle: "circles", gridColumns: 2 },
    supportsCart: true,
    supportsQuote: false,
    legacyStoreThemeId: "turbo_mono",
  },
];

export function getThemeManifest(id: string | undefined | null): EnovaThemeManifest {
  return THEME_REGISTRY.find(m => m.id === id) || THEME_REGISTRY[0];
}

export function getManifestByLegacyId(legacyId: string | undefined | null): EnovaThemeManifest | undefined {
  return THEME_REGISTRY.find(m => m.legacyStoreThemeId === legacyId);
}
