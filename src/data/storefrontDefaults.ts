/**
 * T1 — Valeurs par défaut du modèle v2 (preset « Starter ») + migration v1→v2.
 * Textes bilingues réels (aucun placeholder), structure alignée sur la
 * référence (ordre : hero → catégories → vedettes → confiance → bannière →
 * collection → avis → FAQ → tous les produits → infos marque).
 */

import type {
  BilingualText,
} from "../types/storefront";
import type {
  AllProductsSection,
  BrandInfoSection,
  CategoriesSection,
  CollectionSection,
  FaqSection,
  FeaturedSection,
  HeroSection,
  HomeSection,
  PromoBannerSection,
  ReviewsSection,
  StoreV2Settings,
  StorefrontSections,
  TrustSection,
  HomeSectionType,
} from "../types/storefrontSections";
import type { StorefrontSettings } from "../types/storefront";

const bi = (fr: string, ar: string): BilingualText => ({ fr, ar });

export function newSectionId(): string {
  return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* -------------------------------------------------------------------------- */
/* Preset Starter — sections par défaut                                       */
/* -------------------------------------------------------------------------- */

export function defaultHeroSection(): HeroSection {
  return {
    id: "hero_main",
    type: "hero",
    visible: true,
    badgeText: bi("Nouvelle collection 2026", "تشكيلة جديدة 2026"),
    title: bi("Des produits tendance, livrés partout en Algérie", "منتجات عصرية مع التوصيل لكل الولايات"),
    description: bi(
      "Découvrez notre sélection au meilleur rapport qualité-prix, avec livraison rapide dans toutes les wilayas et paiement à la livraison.",
      "اكتشف تشكيلتنا الجديدة بأفضل الأسعار، مع توصيل سريع لجميع الولايات والدفع عند الاستلام."
    ),
    primaryButton: { visible: true, text: bi("Acheter maintenant", "اشتر الآن"), link: "#products" },
    secondaryButton: { visible: false, text: bi("En savoir plus", "اعرف المزيد"), link: "#categories" },
    desktopImage: "",
    mobileImage: "",
    overlayOpacity: 45,
    align: "start",
    minHeightPx: 480,
  };
}

export function defaultCategoriesSection(): CategoriesSection {
  return {
    id: "categories_main",
    type: "categories",
    visible: true,
    title: bi("Acheter par catégorie", "تصفح الأقسام"),
    subtitle: bi("Choisissez la catégorie qui vous convient", "اختر الفئة المناسبة لك"),
    style: "grid",
    onlyIds: [],
    maxItems: 8,
  };
}

export function defaultFeaturedSection(): FeaturedSection {
  return {
    id: "featured_main",
    type: "featured",
    visible: true,
    title: bi("Produits en vedette", "منتجات مميزة"),
    subtitle: bi("Une sélection choisie avec soin", "منتجات مختارة بعناية"),
    style: "carousel",
    maxItems: 8,
  };
}

export function defaultTrustSection(): TrustSection {
  return {
    id: "trust_main",
    type: "trust",
    visible: true,
    items: [
      {
        id: "t1",
        icon: "truck",
        title: bi("Livraison toutes wilayas", "توصيل لكل الولايات"),
        subtitle: bi("Votre commande livrée en 2 à 5 jours", "نوصل طلبك خلال 2 إلى 5 أيام"),
      },
      {
        id: "t2",
        icon: "package",
        title: bi("Paiement à la livraison", "الدفع عند الاستلام"),
        subtitle: bi("Payez à la réception, sans avance", "ادفع عند وصول الطلب دون أي دفع مسبق"),
      },
      {
        id: "t3",
        icon: "rotate",
        title: bi("Échange et retour", "استبدال وإرجاع"),
        subtitle: bi("Échange facile sous 7 jours", "استبدل المنتج خلال 7 أيام"),
      },
    ],
  };
}

export function defaultPromoBannerSection(): PromoBannerSection {
  return {
    id: "promo_main",
    type: "promoBanner",
    visible: true,
    image: "",
    title: bi("Offres spéciales de la semaine", "عروض خاصة لهذا الأسبوع"),
    description: bi(
      "Jusqu'à -30% sur une sélection de produits, pour une durée limitée.",
      "خصومات تصل إلى 30% على منتجات مختارة لفترة محدودة."
    ),
    buttonText: bi("Profiter de l'offre", "استفد من العرض"),
    buttonLink: "#products",
  };
}

export function defaultCollectionSection(): CollectionSection {
  return {
    id: "collection_main",
    type: "collection",
    visible: true,
    title: bi("Soldes de la saison", "تخفيضات الموسم"),
    subtitle: bi("Les meilleures promotions du moment", "أفضل العروض حالياً"),
    source: "onSale",
    categoryId: "",
    productIds: [],
    style: "carousel",
    maxItems: 10,
  };
}

/**
 * T2 — Fabrique de sections pour le bouton « Ajouter » de l'éditeur.
 * Chaque type a des défauts bilingues prêts à l'emploi.
 */
export function createHomeSection(type: HomeSectionType, index = 0): HomeSection {
  const uid = `${type}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "hero":
      return { ...defaultHeroSection(), id: uid };
    case "categories":
      return { ...defaultCategoriesSection(), id: uid };
    case "featured":
      return { ...defaultFeaturedSection(), id: uid };
    case "trust":
      return { ...defaultTrustSection(), id: uid };
    case "promoBanner":
      return { ...defaultPromoBannerSection(), id: uid };
    case "collection":
      return { ...defaultCollectionSection(), id: uid };
    case "reviews":
      return { ...defaultReviewsSection(), id: uid };
    case "faq":
      return { ...defaultFaqSection(), id: uid };
    case "brandInfo":
      return { ...defaultBrandInfoSection(), id: uid };
    case "allProducts":
      return { ...defaultAllProductsSection(), id: uid };
    case "textImage":
      return {
        id: uid,
        type: "textImage",
        visible: true,
        title: bi("Notre histoire", "قصتنا"),
        body: bi(
          "Racontez ce qui rend votre boutique unique : savoir-faire, qualité, service client.",
          "احكِ ما يجعل متجرك مختلفاً: الخبرة، الجودة، وخدمة العملاء."
        ),
        image: "",
        imagePosition: "start",
        button: { visible: false, text: bi("En savoir plus", "اعرف المزيد"), link: "" },
      };
    case "video":
      return {
        id: uid,
        type: "video",
        visible: true,
        title: bi("Notre boutique en vidéo", "متجرنا بالفيديو"),
        embedUrl: "",
      };
    default:
      return { ...defaultPromoBannerSection(), id: uid };
  }
}

/** Duplique une section (nouvel id, même contenu) — bouton « Dupliquer ». */
export function duplicateHomeSection(sec: HomeSection): HomeSection {
  return {
    ...structuredClone(sec),
    id: `${sec.type}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  };
}

export function defaultReviewsSection(): ReviewsSection {
  return {
    id: "reviews_main",
    type: "reviews",
    visible: true,
    title: bi("Avis de nos clients", "آراء زبائننا"),
    subtitle: bi("Ce que disent nos clients partout en Algérie", "ما يقوله زبائننا في كل الجزائر"),
    manualReviews: [],
    includeProductReviews: true,
    maxItems: 6,
  };
}

export function defaultFaqSection(): FaqSection {
  return {
    id: "faq_main",
    type: "faq",
    visible: true,
    title: bi("Questions fréquentes", "أسئلة شائعة"),
    subtitle: bi("Tout ce qu'il faut savoir avant de commander", "كل ما تحتاج معرفته قبل الطلب"),
    items: [
      {
        id: "f1",
        question: bi("Comment passer commande ?", "كيف أطلب من المتجر؟"),
        answer: bi(
          "Choisissez le produit et ses options, cliquez sur « Commande rapide », remplissez votre nom, téléphone et adresse. Nous vous appelons pour confirmer.",
          "اختر المنتج والمقاس ثم اضغط « الطلب السريع» واملأ الاسم ورقم الهاتف والعنوان. سنتصل بك لتأكيد الطلب."
        ),
      },
      {
        id: "f2",
        question: bi("Le paiement est-il à la livraison ?", "هل الدفع عند الاستلام؟"),
        answer: bi(
          "Oui, vous payez le livreur à la réception de votre commande. Aucun paiement en ligne n'est demandé.",
          "نعم، تدفع للموصّل عند استلام الطلب. لا نطلب أي دفع مسبق."
        ),
      },
      {
        id: "f3",
        question: bi("Quels sont les délais de livraison ?", "كم يستغرق التوصيل؟"),
        answer: bi(
          "De 24 à 48 heures pour Alger et sa région, et de 2 à 5 jours ouvrables pour les autres wilayas.",
          "من 24 إلى 48 ساعة للجزائر العاصمة، ومن 2 إلى 5 أيام لباقي الولايات."
        ),
      },
      {
        id: "f4",
        question: bi("Puis-je échanger un article ?", "ماذا لو لم يناسبني المقاس؟"),
        answer: bi(
          "Oui, contactez-nous dans les 7 jours suivant la réception : l'échange est gratuit si le produit est dans son état d'origine.",
          "تواصل معنا خلال 7 أيام من الاستلام ونستبدل المقاس مجاناً بشرط أن يكون المنتج في حالته الأصلية."
        ),
      },
      {
        id: "f5",
        question: bi("Comment suivre ma commande ?", "كيف أتابع طلبي؟"),
        answer: bi(
          "Depuis la page « Suivre la commande » avec votre numéro de téléphone, ou par WhatsApp.",
          "من صفحة « تتبع الطلب» بإدخال رقم الهاتف، أو عبر واتساب."
        ),
      },
    ],
  };
}

export function defaultAllProductsSection(): AllProductsSection {
  return {
    id: "all_main",
    type: "allProducts",
    visible: true,
    title: bi("Tous les produits", "جميع المنتجات"),
    subtitle: bi("Parcourez notre catalogue complet", "تصفح كل منتجاتنا"),
    showCategoryPills: true,
    defaultSort: "recent",
    pageSize: 8,
    showViewAllLink: true,
  };
}

export function defaultBrandInfoSection(): BrandInfoSection {
  return {
    id: "brand_main",
    type: "brandInfo",
    visible: true,
    title: bi("Notre boutique", "متجرنا"),
    description: bi(
      "Une équipe à votre écoute, des produits contrôlés et un service client réactif partout en Algérie.",
      "فريق في خدمتك، منتجات مضمونة الجودة وخدمة زبائن سريعة في كل الجزائر."
    ),
    showStats: true,
    whatsapp: "",
    facebook: "",
    instagram: "",
    tiktok: "",
  };
}

/** Preset complet « Starter » (ordre aligné sur la référence). */
export function defaultStarterSections(): HomeSection[] {
  return [
    defaultHeroSection(),
    defaultCategoriesSection(),
    defaultFeaturedSection(),
    defaultTrustSection(),
    defaultPromoBannerSection(),
    defaultCollectionSection(),
    defaultReviewsSection(),
    defaultFaqSection(),
    defaultAllProductsSection(),
    defaultBrandInfoSection(),
  ];
}

/* -------------------------------------------------------------------------- */
/* Réglages globaux v2 par défaut                                             */
/* -------------------------------------------------------------------------- */

export function defaultV2Settings(): StoreV2Settings {
  return {
    header: {
      showSearch: true,
      showCartIcon: true,
      sticky: true,
      showCategoriesDropdown: true,
      showTrackOrderLink: true,
      showLanguageSwitcher: true,
      showWhatsApp: true,
    },
    footer: {
      about: bi(
        "Votre boutique de confiance : produits sélectionnés, livraison rapide et paiement à la livraison.",
        "متجرك الموثوق: منتجات مختارة، توصيل سريع ودفع عند الاستلام."
      ),
      showQuickLinks: true,
      showCategories: true,
      whatsapp: "",
      facebook: "",
      instagram: "",
      tiktok: "",
      telegram: "",
      github: "",
      customLink: { name: "", url: "" },
      hideBrand: false,
    },
    helpWidget: {
      enabled: true,
      title: bi("Besoin d'aide ?", "تحتاج مساعدة؟"),
      subtitle: bi("Notre équipe vous répond rapidement", "فريقنا يجيبك بسرعة"),
      position: "right",
      channels: [],
      faqs: [],
      freeTexts: [],
      includeProductNameInWaMessage: true,
      buttonColor: "#22c55e",
      buttonIcon: "whatsapp",
      welcome: { text: bi("Bonjour 👋 Comment pouvons-nous vous aider ?", "مرحباً 👋 كيف يمكننا مساعدتك؟"), delaySeconds: 4, frequency: "oncePerSession" },
    },
    seo: { title: "", description: "", keywords: "", shareImage: "" },
    productPage: {
      blocksOrder: ["gallery", "category", "name", "price", "offers", "variants", "options", "buyButtons", "quickOrder", "description", "reviews", "related"],
      galleryLayout: "carousel",
      stickyBuyBarMobile: true,
      showQuantityInBar: true,
      showQuantityInForm: true,
      buttonSize: "normal",
    },
    checkout: {
      hideEmail: false,
      hideAddress: false,
      hideNotes: false,
      addressRequired: true,
      layout: "twoColumns",
      texts: {
        pageTitle: bi("Finaliser la commande", "إتمام الطلب"),
        personalInfo: bi("Informations personnelles", "المعلومات الشخصية"),
        address: bi("Adresse de livraison", "عنوان التوصيل"),
        deliveryMethod: bi("Méthode de livraison", "طريقة التوصيل"),
        summary: bi("Résumé de la commande", "ملخص الطلب"),
        confirmButton: bi("Confirmer la commande", "تأكيد الطلب"),
        paymentMode: bi("Paiement à la livraison", "الدفع عند الاستلام"),
        successMessage: bi("Commande confirmée ! Nous vous appelons très vite.", "تم تأكيد الطلب! سنتصل بك قريباً."),
      },
    },
    productCard: {
      hideAddToCartButton: false,
      quickAddOnHover: true,
      showCategoryName: true,
      showPrice: true,
      showOldPrice: true,
      showBadge: true,
      cardBorders: "rounded",
      buttonAction: "chooseOptions",
      buttonStyle: "text",
      buttonText: null,
    },
    priceFormat: "space",
    defaultProductSort: "recent",
    stockFirst: true,
  };
}

/* -------------------------------------------------------------------------- */
/* Migration v1 → v2 (sans perte)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Convertit l'ancien modèle { sectionsOrder, hero, trustBar, categories,
 * featured } en tableau v2. Les personnalisations existantes (textes, images,
 * visibilité, ordre) sont reportées telles quelles.
 */
export function migrateLegacySettings(legacy: StorefrontSettings | null | undefined): StorefrontSections {
  if (!legacy) return { sections: defaultStarterSections() };

  const hero: HeroSection = {
    ...defaultHeroSection(),
    ...(legacy.hero || {}),
    id: "hero_main",
    type: "hero",
    badgeText: legacy.hero?.badge?.visible ? legacy.hero.badge.text : null,
    // champs v1 -> v2
    title: legacy.hero?.title ?? defaultHeroSection().title,
    description: legacy.hero?.description ?? defaultHeroSection().description,
    primaryButton: legacy.hero?.primaryButton ?? defaultHeroSection().primaryButton,
    secondaryButton: legacy.hero?.secondaryButton ?? defaultHeroSection().secondaryButton,
    desktopImage: (legacy.hero as unknown as { desktopImage?: string })?.desktopImage || "",
    mobileImage: (legacy.hero as unknown as { mobileImage?: string })?.mobileImage || "",
  };

  const trust: TrustSection = {
    id: "trust_main",
    type: "trust",
    visible: legacy.trustBar?.visible ?? true,
    items: (legacy.trustBar?.items || defaultTrustSection().items).map((it, i) => ({
      id: it.id || "t" + (i + 1),
      icon: it.icon,
      title: it.title,
      subtitle: it.subtitle,
    })),
  };

  const categories: CategoriesSection = {
    ...defaultCategoriesSection(),
    ...(legacy.categories as unknown as CategoriesSection | undefined),
    id: "categories_main",
    type: "categories",
  };

  const featured: FeaturedSection = {
    ...defaultFeaturedSection(),
    ...(legacy.featured as unknown as FeaturedSection | undefined),
    id: "featured_main",
    type: "featured",
  };

  const byId: Record<string, HomeSection> = {
    hero,
    trust,
    categories,
    featured,
  };

  const order = legacy.sectionsOrder?.length ? legacy.sectionsOrder : ["hero", "trust", "categories", "featured"];
  const migrated: HomeSection[] = order
    .map((sid) => byId[sid])
    .filter((s): s is HomeSection => Boolean(s));

  // Compléter avec les sections v2 par défaut absentes de la v1 (après).
  const have = new Set(migrated.map((s) => s.type));
  for (const extra of [
    defaultPromoBannerSection(),
    defaultCollectionSection(),
    defaultReviewsSection(),
    defaultFaqSection(),
    defaultAllProductsSection(),
    defaultBrandInfoSection(),
  ]) {
    if (!have.has(extra.type)) migrated.push(extra);
  }

  return { sections: migrated.slice(0, 25) };
}

/** Fusion défensive d'un document Firestore partiel avec les défauts. */
export function mergeSections(raw: unknown): StorefrontSections {
  if (!raw || typeof raw !== "object") return { sections: defaultStarterSections() };
  const data = raw as Partial<StorefrontSections> & { sections?: unknown };
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    return migrateLegacySettings(raw as StorefrontSettings);
  }
  return { sections: data.sections as HomeSection[], updatedAt: data.updatedAt };
}
