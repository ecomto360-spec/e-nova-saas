/**
 * T1 — Props communes des sections de la vitrine.
 * Les sections sont autonomes : elles reçoivent des données déjà normalisées
 * et ne dépendent ni de la session, ni du dashboard.
 */

export interface StorefrontProductLite {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  oldPrice: number | null;
  images: string[];
  category: string;
  isFeatured: boolean;
  stock: number;
  /** Variantes normalisées : [{ name, nameAr, options: [{label, labelAr, swatch?}] }]. */
  variants: Array<{
    name: string;
    nameAr: string;
    options: Array<{ label: string; labelAr: string; swatch?: string }>;
  }>;
  description: string;
  descriptionAr: string;
  isDemo: boolean;
}

export interface StorefrontCategoryLite {
  id: string;
  name: string;
  nameAr: string;
  image?: string;
  productCount: number;
}

export interface SectionViewProps {
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  headingColor: string;
  products: StorefrontProductLite[];
  categories: StorefrontCategoryLite[];
  /** Ouvre la modale « Choisir les options » du produit. */
  onChooseOptions: (product: StorefrontProductLite) => void;
  /** Ouverture directe de la fiche produit. */
  onOpenProduct: (product: StorefrontProductLite) => void;
  /** Pour le contour de sélection dans l'éditeur (T2). */
  onSectionClick?: (sectionId: string) => void;
  sectionId: string;
}

export const t = (lang: "fr" | "ar", fr: string, ar: string): string => (lang === "ar" ? ar : fr);
