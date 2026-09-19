export interface StoreCustomizerConfig {
  isActivated: boolean;

  // Header
  logoUrl: string;
  faviconUrl: string;
  storeName: string;
  showStoreNameWithLogo: boolean;
  navBgColor: string;
  navTextColor: string;
  navStyle: "default" | "centered";
  menuStyle: "default" | "pills" | "underline" | "square" | "mega";
  logoSize: "small" | "medium" | "large";
  cartIconStyle: "default" | "filled" | "outline" | "minimal" | "bag" | "cart";
  isSticky: boolean;
  hasShadow: boolean;
  hasBottomBorder: boolean;
  showCartIcon: boolean;
  hideOnProductPage: boolean;

  // Colors & Font
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  headingColor: string;
  fontFamily: string;
  language: "ar" | "fr";
  buttonStyle: "rounded" | "pill" | "square";

  // Announcement Bar
  showAnnouncement: boolean;
  announcementAnimation: "static" | "marquee";
  announcementText: string;
  announcementLink: string;
  announcementBgColor: string;
  announcementTextColor: string;

  // Search Bar
  showSearch: boolean;

  // Hero Section
  showHero: boolean;
  heroDesktopBg: string;
  heroMobileBg: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;

  // Categories Section
  showCategories: boolean;

  // Promo Banner
  showPromoBanner: boolean;
  promoImage: string;
  promoTitle: string;
  promoSubtitle: string;
  promoButtonText: string;
  promoButtonLink: string;

  // Featured Products
  showFeatured: boolean;

  // Brand Info
  showBrandInfo: boolean;
  brandDescription: string;
  
  // Trust Badges
  showTrustBadges: boolean;
}

export const defaultStoreConfig: StoreCustomizerConfig = {
  isActivated: false,
  logoUrl: "",
  faviconUrl: "",
  storeName: "Ma Boutique",
  showStoreNameWithLogo: false,
  navBgColor: "#ffffff",
  navTextColor: "#1f2937",
  navStyle: "default",
  menuStyle: "default",
  logoSize: "medium",
  cartIconStyle: "default",
  isSticky: true,
  hasShadow: true,
  hasBottomBorder: false,
  showCartIcon: true,
  hideOnProductPage: false,
  primaryColor: "#1a1a2e",
  secondaryColor: "#16213e",
  bgColor: "#ffffff",
  headingColor: "#1f2937",
  fontFamily: "Cairo",
  language: "ar",
  buttonStyle: "rounded",
  showAnnouncement: false,
  announcementAnimation: "static",
  announcementText: "Livraison gratuite pour les commandes",
  announcementLink: "",
  announcementBgColor: "#1f2937",
  announcementTextColor: "#ffffff",
  showSearch: true,
  showHero: true,
  heroDesktopBg: "",
  heroMobileBg: "",
  heroTitle: "Titre principal",
  heroSubtitle: "Description courte",
  heroButtonText: "Acheter maintenant",
  heroButtonLink: "#products",
  showCategories: true,
  showPromoBanner: false,
  promoImage: "",
  promoTitle: "Offre spéciale",
  promoSubtitle: "Ne ratez pas cette occasion",
  promoButtonText: "Découvrir",
  promoButtonLink: "#",
  showFeatured: true,
  showBrandInfo: false,
  brandDescription: "",
  showTrustBadges: true,
};
