/**
 * T1 — Système de sections de la page d'accueil.
 * ---------------------------------------------------------------------------
 * Modèle extensible : la page d'accueil est une LISTE ORDONNÉE de sections
 * (jusqu'à 25 instances actives), chaque instance ayant un type, une visibilité
 * et des propriétés propres. L'éditeur (T2) manipule ce tableau (ajout,
 * duplication, glisser-déposer, suppression) ; la vitrine publique et l'aperçu
 * live rendent le même modèle — jamais de divergence.
 *
 * Stockage : /tenants/{uid}/settings/storefront (merge), champ `sections`.
 * Migration : migrateLegacySettings() convertit l'ancien modèle v1 (4 sections
 * fixes + sectionsOrder) sans perte — les boutiques existantes gardent leurs
 * personnalisations.
 *
 * Règles : bilingue fr/ar partout, valeurs par défaut réelles (jamais de
 * placeholder visible en vitrine), aucune dépendance à la session dashboard.
 */

import type { BilingualText } from "./storefront";

/* -------------------------------------------------------------------------- */
/* Types de sections disponibles (T1) — T3 pourra en ajouter.                  */
/* -------------------------------------------------------------------------- */

export type HomeSectionType =
  | "hero" // Grande bannière avec titre et bouton
  | "categories" // Grille de catégories avec images
  | "featured" // Produits vedettes (carrousel ou grille)
  | "trust" // Badges de confiance éditables
  | "promoBanner" // Bannière promotionnelle (image, titre, bouton)
  | "collection" // Produits d'une catégorie / en promotion
  | "reviews" // Avis clients (note /5, prénom, ville)
  | "faq" // FAQ en accordéon
  | "allProducts" // Tous les produits : pastilles, tri, « Afficher plus »
  | "brandInfo" // Infos de la marque (logo, description, stats, réseaux)
  | "textImage" // Bloc texte + image (T2)
  | "video"; // Bloc vidéo (T2)

/** Base commune à toute section de la page d'accueil. */
export interface HomeSectionBase {
  /** Identifiant unique d'instance (crypto.randomUUID ou suffixe). */
  id: string;
  visible: boolean;
}

/* ------------------------------- HERO ------------------------------------- */

export interface HeroSection extends HomeSectionBase {
  type: "hero";
  badgeText: BilingualText | null;
  title: BilingualText;
  description: BilingualText;
  primaryButton: { visible: boolean; text: BilingualText; link: string };
  secondaryButton: { visible: boolean; text: BilingualText; link: string };
  desktopImage: string;
  mobileImage: string;
  overlayOpacity: number; // 0-100
  align: "start" | "center" | "end";
  minHeightPx: number;
}

/* ----------------------------- CATÉGORIES --------------------------------- */

export interface CategoriesSection extends HomeSectionBase {
  type: "categories";
  title: BilingualText;
  subtitle: BilingualText;
  style: "grid" | "carousel";
  /** Limité aux catégories cochées « afficher en accueil » ; vide = toutes. */
  onlyIds: string[];
  maxItems: number;
}

/* -------------------------- PRODUITS VEDETTES ----------------------------- */

export interface FeaturedSection extends HomeSectionBase {
  type: "featured";
  title: BilingualText;
  subtitle: BilingualText;
  style: "carousel" | "grid";
  maxItems: number;
}

/* ------------------------- BADGES DE CONFIANCE ---------------------------- */

export interface TrustItemV2 {
  id: string;
  icon: "truck" | "shield" | "rotate" | "phone" | "clock" | "star" | "package" | "check";
  title: BilingualText;
  subtitle: BilingualText;
}

export interface TrustSection extends HomeSectionBase {
  type: "trust";
  items: TrustItemV2[];
}

/* ---------------------- BANNIÈRE PROMOTIONNELLE --------------------------- */

export interface PromoBannerSection extends HomeSectionBase {
  type: "promoBanner";
  image: string; // vide => dégradé généré à partir des couleurs du thème
  title: BilingualText;
  description: BilingualText;
  buttonText: BilingualText;
  buttonLink: string;
}

/* -------------------------- SECTION COLLECTION ---------------------------- */

export interface CollectionSection extends HomeSectionBase {
  type: "collection";
  title: BilingualText;
  subtitle: BilingualText;
  /** Source des produits : catégorie précise ou promotions. */
  source: "category" | "onSale" | "newest" | "bestSellers";
  categoryId: string;
  style: "carousel" | "grid";
  maxItems: number;
}

/* ----------------------------- AVIS CLIENTS ------------------------------- */

export interface StoreReview {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: BilingualText;
  author: string;
  city: string;
  /** Avis manuel du marchand (true) ou avis produit agrégé (false). */
  manual: boolean;
}

export interface ReviewsSection extends HomeSectionBase {
  type: "reviews";
  title: BilingualText;
  subtitle: BilingualText;
  manualReviews: StoreReview[];
  /** Compléter automatiquement avec les avis produits les mieux notés. */
  includeProductReviews: boolean;
  maxItems: number;
}

/* --------------------------------- FAQ ------------------------------------ */

export interface FaqItem {
  id: string;
  question: BilingualText;
  answer: BilingualText;
}

export interface FaqSection extends HomeSectionBase {
  type: "faq";
  title: BilingualText;
  subtitle: BilingualText;
  items: FaqItem[];
}

/* ---------------------------- TOUS LES PRODUITS --------------------------- */

export interface AllProductsSection extends HomeSectionBase {
  type: "allProducts";
  title: BilingualText;
  subtitle: BilingualText;
  showCategoryPills: boolean;
  defaultSort: "recent" | "priceAsc" | "priceDesc" | "bestSelling" | "stockFirst" | "manual";
  pageSize: number;
  showViewAllLink: boolean;
}

/* --------------------------- INFOS DE LA MARQUE --------------------------- */

export interface BrandInfoSection extends HomeSectionBase {
  type: "brandInfo";
  title: BilingualText;
  description: BilingualText;
  showStats: boolean;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

/* ----------------------------- TEXTE / IMAGE ------------------------------ */

export interface TextImageSection extends HomeSectionBase {
  type: "textImage";
  title: BilingualText;
  body: BilingualText;
  image: string;
  imagePosition: "start" | "end";
  button: { visible: boolean; text: BilingualText; link: string };
}

/* -------------------------------- VIDÉO ----------------------------------- */

export interface VideoSection extends HomeSectionBase {
  type: "video";
  title: BilingualText;
  /** URL embed YouTube/Dailymotion/Vimeo convertie en iframe lazy. */
  embedUrl: string;
}

/* -------------------------------------------------------------------------- */
/* Union + conteneur                                                          */
/* -------------------------------------------------------------------------- */

export type HomeSection =
  | HeroSection
  | CategoriesSection
  | FeaturedSection
  | TrustSection
  | PromoBannerSection
  | CollectionSection
  | ReviewsSection
  | FaqSection
  | AllProductsSection
  | BrandInfoSection
  | TextImageSection
  | VideoSection;

export const MAX_HOME_SECTIONS = 25;

/** Modèle v2 complet du contenu de la vitrine. */
export interface StorefrontSections {
  sections: HomeSection[];
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Réglages globaux de la vitrine (hors sections d'accueil)                    */
/* -------------------------------------------------------------------------- */

export interface StoreHeaderSettings {
  showSearch: boolean;
  showCartIcon: boolean;
  sticky: boolean;
  showCategoriesDropdown: boolean;
  showTrackOrderLink: boolean;
  showLanguageSwitcher: boolean;
  showWhatsApp: boolean;
}

export interface StoreFooterSettings {
  about: BilingualText;
  showQuickLinks: boolean;
  showCategories: boolean;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  telegram: string;
  github: string;
  customLink: { name: string; url: string };
  /** Masquer la marque Enova (selon plan — appliqué côté serveur aussi). */
  hideBrand: boolean;
}

export interface HelpChannel {
  id: string;
  type: "whatsapp" | "telegram" | "phone";
  label: BilingualText;
  value: string;
}

export interface StoreHelpWidgetSettings {
  enabled: boolean;
  title: BilingualText;
  subtitle: BilingualText;
  position: "left" | "right";
  channels: HelpChannel[];
  faqs: FaqItem[]; // max 30
  freeTexts: BilingualText[]; // max 6
  includeProductNameInWaMessage: boolean;
  buttonColor: string;
  buttonIcon: "chat" | "whatsapp" | "help";
  welcome: { text: BilingualText; delaySeconds: number; frequency: "always" | "oncePerSession" | "oncePerDay" };
}

export interface StoreSeoSettings {
  title: string;
  description: string;
  keywords: string;
  shareImage: string;
}

/** Réglages de la page produit (ordre des blocs — éditable T2). */
export type ProductBlockId =
  | "gallery"
  | "category"
  | "name"
  | "price"
  | "offers"
  | "variants"
  | "options"
  | "buyButtons"
  | "quickOrder"
  | "description"
  | "reviews"
  | "related";

export interface StoreProductPageSettings {
  blocksOrder: ProductBlockId[];
  galleryLayout: "carousel" | "grid";
  stickyBuyBarMobile: boolean;
  showQuantityInBar: boolean;
  showQuantityInForm: boolean;
  buttonSize: "normal" | "large";
}

/** Réglages de la page de paiement (éditable T2). */
export interface StoreCheckoutSettings {
  hideEmail: boolean;
  hideAddress: boolean;
  hideNotes: boolean;
  addressRequired: boolean;
  layout: "twoColumns" | "oneColumn";
  texts: {
    pageTitle: BilingualText;
    personalInfo: BilingualText;
    address: BilingualText;
    deliveryMethod: BilingualText;
    summary: BilingualText;
    confirmButton: BilingualText;
    paymentMode: BilingualText;
    successMessage: BilingualText;
  };
}

/** Carte produit (éditable T2). */
export interface ProductCardSettings {
  hideAddToCartButton: boolean;
  quickAddOnHover: boolean;
  showCategoryName: boolean;
  showPrice: boolean;
  showOldPrice: boolean;
  showBadge: boolean;
  cardBorders: "rounded" | "square" | "pill";
  buttonAction: "addToCart" | "chooseOptions" | "orderNow";
  buttonStyle: "text" | "roundIcon";
  buttonText: BilingualText | null; // null => texte par défaut du thème
}

/** Affichage du prix (appliqué partout). */
export type PriceFormat = "plain" | "comma" | "space"; // 15000 DA / 15,000 DA / 15 000 DA

export interface StoreV2Settings {
  header: StoreHeaderSettings;
  footer: StoreFooterSettings;
  helpWidget: StoreHelpWidgetSettings;
  seo: StoreSeoSettings;
  productPage: StoreProductPageSettings;
  checkout: StoreCheckoutSettings;
  productCard: ProductCardSettings;
  priceFormat: PriceFormat;
  /** Tri appliqué quand le client n'a rien choisi. */
  defaultProductSort: AllProductsSection["defaultSort"];
  stockFirst: boolean;
}
