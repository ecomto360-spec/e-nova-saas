import type { HomeSection } from "../types/storefrontSections";
export interface ThemeFeature {
  text: string;
}

export interface StoreDemoProduct {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  isFeatured?: boolean;
  category: string;
  categoryAr?: string;
  image: string;
  images?: string[];
  description?: string;
  rating?: number;
  reviewsCount?: number;
  reviews?: {
    id: string;
    author: string;
    rating: number;
    date: string;
    text: string;
    avatar?: string;
  }[];
  variants?: {
    name: string;
    type?: string;
    options: any[];
  }[];
  offers?: any[];
}

export interface StoreDemoCategory {
  id: string;
  name: string;
  nameAr: string;
  productCount: number;
  image: string;
}

export interface StoreTheme {
  id: string;
  name: string;
  nameAr?: string;
  version?: string;
  type: "store" | "checkout" | "variant";
  badge?: string;
  description: string;
  features: string[];
  primaryColor: string;
  accentColor?: string;
  isDark?: boolean;
  thumbnail: string;
  demoUrl: string;
  bannerHeadline?: string;
  bannerHeadlineAr?: string;
  bannerSubheadline?: string;
  bannerSubheadlineAr?: string;
  bannerImage?: string;
  bannerCtaAr?: string;
  heroBadge?: string;
  heroBadgeAr?: string;
  bannerImageMobile?: string;
  /** Mode vitrine : shop (panier actif) ou showcase (vitrine, pas de panier). */
  mode?: "shop" | "showcase";
  /** Liens de navigation du header (ancres #). */
  navItems?: { id: string; label: { fr: string; ar: string }; anchor: string }[];
  /** Sections riches par défaut (T6) — rendues par ThemeStorePreview. */
  defaultSections?: HomeSection[];
  /** Numéro WhatsApp international (sans +) pour les CTA directs. */
  whatsappPhone?: string;
  categories: StoreDemoCategory[];
  products: StoreDemoProduct[];
}

export interface CheckoutDesign {
  id: string;
  name: string;
  description: string;
  planBadge?: "PRO" | "UNLIMITED" | "ENTERPRISE";
  isLocked?: boolean;
  type: "classique" | "commerce" | "editorial" | "stepper" | "compact";
  features: string[];
  previewImage?: string;
  iconName?: string;
}

export interface VariantDesign {
  id: string;
  name: string;
  description: string;
  planBadge?: "PRO" | "UNLIMITED" | "ENTERPRISE";
  isLocked?: boolean;
  type: "default" | "minimal" | "brutal" | "softplay" | "luxe" | "glass" | "material" | "pixel" | "editorial" | "mashrabiya" | "clay" | "stacked" | "offer";
  features: string[];
  previewImage?: string;
  iconName?: string;
}

// Fashion & Clothes Theme Demo Data (Matching Screenshots)
export const FASHION_CATEGORIES: StoreDemoCategory[] = [
  {
    id: "men",
    name: "Vêtements Homme",
    nameAr: "ملابس رجالية",
    productCount: 3,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80"
  },
  {
    id: "accessories",
    name: "Accessoires",
    nameAr: "إكسسوارات",
    productCount: 2,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80"
  },
  {
    id: "women",
    name: "Vêtements Femme",
    nameAr: "ملابس نسائية",
    productCount: 3,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80"
  },
  {
    id: "shoes",
    name: "Chaussures",
    nameAr: "أحذية",
    productCount: 2,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80"
  },
  {
    id: "kids",
    name: "Vêtements Enfants",
    nameAr: "ملابس أطفال",
    productCount: 2,
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=300&q=80"
  }
];

export const FASHION_PRODUCTS: StoreDemoProduct[] = [
  {
    id: "dress-1",
    name: "Robe de soirée élégante",
    nameAr: "فستان سهرة أنيق",
    price: 8500,
    originalPrice: 12000,
    discountBadge: "مميز",
    isFeatured: true,
    category: "women",
    categoryAr: "ملابس نسائية",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80",
    description: "فستان سهرة أنيق مصمم من أجود أنواع الأقمشة الفاخرة، بقصة عصرية ومريحة تناسب جميع المناسبات الخاصة والأفراح.",
    rating: 4.8,
    reviewsCount: 15,
    reviews: [
      { id: "r1", author: "سارة ك.", rating: 5, date: "15 أوت 2026", text: "فستان رائع جدا والقماش ممتاز، الشحن كان سريع." },
      { id: "r2", author: "مريم ب.", rating: 4, date: "02 أوت 2026", text: "جميل ولكن المقاس كان أصغر بقليل مما توقعت. لكن الجودة ممتازة." }
    ],
    variants: [
      { name: "المقاس (Taille)", options: ["S", "M", "L", "XL"] },
      { name: "اللون (Couleur)", options: ["بوردو (Bordeaux)", "أسود (Noir)", "أزرق ملكي (Bleu Roi)"] }
    ]
  },
  {
    id: "jacket-1",
    name: "Veste en cuir noir",
    nameAr: "جاكيت جلدى أسود",
    price: 12000,
    originalPrice: 15000,
    discountBadge: "-20%",
    isFeatured: true,
    category: "men",
    categoryAr: "ملابس رجالية",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
    description: "جاكيت جلد أصلي بتصميم كلاسيكي متين ومقاوم للرياح والأمطار، يمنحك إطلالة راقية في كل الأوقات.",
    rating: 4.5,
    reviewsCount: 8,
    reviews: [
      { id: "r3", author: "يوسف م.", rating: 5, date: "10 أوت 2026", text: "نوعية الجلد ممتازة والتفصيل مضبوط." },
      { id: "r4", author: "أحمد س.", rating: 4, date: "25 جويلية 2026", text: "جاكيت رائع ولكن التوصيل أخذ وقت طويل نوعا ما." }
    ],
    variants: [
      { name: "المقاس (Taille)", options: ["M", "L", "XL", "XXL"] }
    ]
  },
  {
    id: "suit-1",
    name: "Costume formel Slim Fit",
    nameAr: "بدلة رسمية سليم فيت",
    price: 15000,
    originalPrice: 19000,
    discountBadge: "مميز",
    isFeatured: true,
    category: "men",
    categoryAr: "ملابس رجالية",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    description: "بدلة رجالية رسمية 3 قطع متناسقة بقصة سليم فيت عصرية للمناسبات وحفلات التخرج والأعراس.",
    variants: [
      { name: "المقاس (Taille)", options: ["48", "50", "52", "54", "56"] },
      { name: "اللون (Couleur)", options: ["أزرق كروهات (Bleu)", "رمادي غامق (Gris)"] }
    ]
  },
  {
    id: "shirt-1",
    name: "Chemise classique en coton",
    nameAr: "قميص قطنى كلاسيكى",
    price: 3500,
    originalPrice: 4500,
    discountBadge: "مميز",
    isFeatured: true,
    category: "men",
    categoryAr: "ملابس رجالية",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80",
    description: "قميص قطني 100% عالي الجودة بنقشة ناعمة مريحة للاستخدام اليومي والعمل.",
    variants: [
      { name: "المقاس (Taille)", options: ["S", "M", "L", "XL"] }
    ]
  },
  {
    id: "abaya-1",
    name: "Abaya brodée raffinée",
    nameAr: "عباية مطرزة",
    price: 6500,
    originalPrice: 8000,
    discountBadge: "مميز",
    isFeatured: true,
    category: "women",
    categoryAr: "ملابس نسائية",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    description: "عباية خليجية أنيقة بتطريز يدوي متقن وخامة ناعمة وخفيفة تناسب الإطلالات اليومية والمناسبات.",
    variants: [
      { name: "المقاس (Taille)", options: ["52", "54", "56", "58"] }
    ]
  },
  {
    id: "sneakers-1",
    name: "Baskets Sneakers Stylées",
    nameAr: "حذاء رياضي أبيض",
    price: 5500,
    originalPrice: 7000,
    discountBadge: "مميز",
    isFeatured: true,
    category: "shoes",
    categoryAr: "أحذية",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
    description: "حذاء سنيكرز أنيق ومريح بنعل طبي ممتص للصدمات مناسب للمشي والرياضة والإطلالات الكاجوال.",
    variants: [
      { name: "المقاس (Pointure)", options: ["40", "41", "42", "43", "44", "45"] }
    ]
  },
  {
    id: "kids-dress-1",
    name: "Robe fillette pour occasions",
    nameAr: "فستان أطفال مناسبات",
    price: 3800,
    originalPrice: 4800,
    discountBadge: "-21%",
    isFeatured: false,
    category: "kids",
    categoryAr: "ملابس أطفال",
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80",
    description: "فستان أطفال مميز بنقاط ناعمة وقماش قطني مريح جداً لبشرة الأطفال.",
    variants: [
      { name: "العمر (Âge)", options: ["2-3 سنوات", "4-5 سنوات", "6-7 سنوات", "8-9 سنوات"] }
    ]
  },
  {
    id: "kids-suit-1",
    name: "Ensemble garçon d'été",
    nameAr: "طقم أطفال صيفى",
    price: 2500,
    originalPrice: 3200,
    discountBadge: "-22%",
    isFeatured: false,
    category: "kids",
    categoryAr: "ملابس أطفال",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80",
    description: "طقم صيفي أنيق مع بابيون وقميص وشورت قطني فاخر للمناسبات الصيفية.",
    variants: [
      { name: "العمر (Âge)", options: ["1-2 سنوات", "3-4 سنوات", "5-6 سنوات"] }
    ]
  },
  {
    id: "sunglasses-1",
    name: "Lunettes de soleil polarisées",
    nameAr: "نظارات شمسية بولارايزد",
    price: 3200,
    originalPrice: 4500,
    discountBadge: "-29%",
    isFeatured: false,
    category: "accessories",
    categoryAr: "إكسسوارات",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80",
    description: "نظارات شمسية كلاسيكية بعدسات بولارايزد تحمي العينين بنسبة 100% من الأشعة فوق البنفسجية UV400.",
    variants: [
      { name: "لون الإطار", options: ["أسود مطفي (Noir Mat)", "فضي (Argenté)"] }
    ]
  },
  {
    id: "bag-1",
    name: "Sac à main en cuir luxe",
    nameAr: "حقيبة يد جلدية",
    price: 4800,
    originalPrice: 6200,
    discountBadge: "-23%",
    isFeatured: false,
    category: "accessories",
    categoryAr: "إكسسوارات",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
    description: "حقيبة يد نسائية أنيقة من الجلد الصناعي الفاخر مع حزام كتف قابل للتعديل وقفل معدني ذهبي.",
    variants: [
      { name: "اللون (Couleur)", options: ["أحمر قرميدي (Rouge)", "أسود (Noir)", "بيج (Beige)"] }
    ]
  }
];

/** Petit helper bilingue pour les sections riches T6. */
const t6 = (fr: string, ar: string): { fr: string; ar: string } => ({ fr, ar });

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "starter",
    name: "Starter",
    nameAr: "المتجر الأساسي",
    version: "Starter V2",
    type: "store",
    badge: "Recommandé",
    description: "Thème pro qui booste vos ventes - simple, rapide et entièrement personnalisable",
    features: [
      "Ventes élevées pour tout business",
      "Design épuré et simple",
      "Entièrement personnalisable",
      "Navigation fluide et rapide"
    ],
    primaryColor: "#f59e0b",
    accentColor: "#d97706",
    thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-starter",
    bannerHeadline: "Mode & Tendance pour toutes les occasions",
    bannerHeadlineAr: "أزياء عصرية لكل المناسبات",
    bannerSubheadline: "Découvrez notre nouvelle collection de vêtements et d'accessoires à prix imbattables",
    bannerSubheadlineAr: "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    bannerCtaAr: "تسوق الآن",
    categories: FASHION_CATEGORIES,
    products: FASHION_PRODUCTS
  },
  {
    id: "digital",
    name: "Digital",
    nameAr: "المنتجات الرقمية",
    type: "store",
    badge: "Produits digitaux uniquement",
    description: "Thème moderne pour produits digitaux et services",
    features: [
      "Conçu pour les produits digitaux",
      "Design moderne et élégant",
      "Entièrement personnalisable",
      "Rapide et léger"
    ],
    primaryColor: "#8b5cf6",
    accentColor: "#6366f1",
    isDark: true,
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-digital",
    bannerHeadline: "Abonnements & Logiciels Instantanés",
    bannerHeadlineAr: "اشتراكات وحسابات رقمية بأفضل الأسعار",
    bannerSubheadline: "Livraison instantanée par e-mail ou WhatsApp en quelques secondes",
    bannerSubheadlineAr: "استلم حسابك أو كود التفعيل مباشرة بعد تأكيد الطلب عبر واتساب أو الإيميل",
    bannerImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80",
    bannerCtaAr: "تصفح العروض",
    categories: [
      { id: "streaming", name: "Streaming & TV", nameAr: "بث وأفلام", productCount: 4, image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&q=80" },
      { id: "gaming", name: "Jeux Vidéo & Cartes", nameAr: "ألعاب وكروت شحن", productCount: 6, image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&q=80" },
      { id: "software", name: "Logiciels & Outils", nameAr: "برامج وتطبيقات", productCount: 3, image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80" },
      { id: "courses", name: "Formations & Ebooks", nameAr: "دورات وكتب رقمية", productCount: 2, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80" }
    ],
    products: [
      {
        id: "dig-1",
        name: "Abonnement Streaming 4K Ultra HD",
        nameAr: "اشتراك منصة ترفيهية 4K لمدة سنة",
        price: 2900,
        originalPrice: 4500,
        discountBadge: "-35%",
        isFeatured: true,
        category: "streaming",
        categoryAr: "بث وأفلام",
        image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80",
        description: "حساب أصلي بجودة فائقة 4K UHD يشتغل على جميع الأجهزة مع ضمان كامل المدة ودعم فني على مدار الساعة.",
        rating: 4.9,
        reviewsCount: 42,
        reviews: [
          { id: "rd1", author: "أمين ط.", rating: 5, date: "21 أوت 2026", text: "اشتراك ممتاز يعمل بدون تقطيع." },
          { id: "rd2", author: "كمال ب.", rating: 5, date: "12 أوت 2026", text: "تفعيل فوري وخدمة عملاء رائعة." }
        ],
        variants: [{ name: "المدة (Durée)", options: ["1 شهر", "3 أشهر", "6 أشهر", "12 شهر"] }]
      },
      {
        id: "dig-2",
        name: "Pack Logiciels de Création Pro",
        nameAr: "باقة برامج التصميم والمونتاج الاحترافية",
        price: 3900,
        originalPrice: 6000,
        discountBadge: "مميز",
        isFeatured: true,
        category: "software",
        categoryAr: "برامج وتطبيقات",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
        description: "تفعيل رسمي أصلي لجميع برامج التصميم الجرافيكي والمونتاج والهندسة المعمارية.",
        variants: [{ name: "نوع الرخصة", options: ["جهاز واحد (1 PC)", "جهازين (2 PCs)"] }]
      },
      {
        id: "dig-3",
        name: "Carte Cadeau Gaming 50$",
        nameAr: "بطاقة شحن متجر ألعاب 50 دولار",
        price: 11500,
        originalPrice: 12500,
        discountBadge: "فوري",
        isFeatured: true,
        category: "gaming",
        categoryAr: "ألعاب وكروت شحن",
        image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80",
        description: "كود شحن فوري يتم إرساله فوراً بعد تأكيد الدفع للاستمتاع بأحدث الألعاب والإضافات.",
        variants: [{ name: "القيمة (Solde)", options: ["10$", "25$", "50$", "100$"] }]
      }
    ]
  },
  {
    id: "brico",
    name: "Brico",
    nameAr: "بريكو والمعدات",
    type: "store",
    badge: "Technique & Outillage",
    description: "Thème professionnel pour boutiques techniques et artisanales - grandes catégories et affichage avancé",
    features: [
      "Grandes catégories claires avec images",
      "Affichage produits avancé avec filtres",
      "Section infos boutique sur la page d'accueil",
      "Barre de navigation mobile en bas"
    ],
    primaryColor: "#d97706",
    accentColor: "#b45309",
    thumbnail: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-brico",
    bannerHeadline: "Outillage Professionnel & Équipements de Chantier",
    bannerHeadlineAr: "أقوى المعدات والأدوات الاحترافية بأفضل الأسعار في الجزائر",
    bannerSubheadline: "Matériel certifié et garanti avec livraison rapide sur les 58 wilayas",
    bannerSubheadlineAr: "أدوات ومعدات أصلية مع ضمان رسمي وتوصيل سريع لباب الورشة أو المنزل",
    bannerImage: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1600&q=80",
    bannerCtaAr: "تصفح المعدات",
    categories: [
      { id: "power-tools", name: "Outillage Électroportatif", nameAr: "معدات كهربائية", productCount: 8, image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80" },
      { id: "hand-tools", name: "Outillage à main", nameAr: "أدوات يدوية", productCount: 12, image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&q=80" },
      { id: "welding", name: "Soudure & Métal", nameAr: "لحام ومعادن", productCount: 4, image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=300&q=80" },
      { id: "safety", name: "Sécurité & Protection", nameAr: "معدات السلامة", productCount: 5, image: "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=300&q=80" }
    ],
    products: [
      {
        id: "brico-1",
        name: "Perceuse Visseuse Sans Fil 21V + 2 Batteries",
        nameAr: "مثقاب ومفك براغي لاسلكي 21V مع بطاريتين وحقيبة إكسسوارات",
        price: 8900,
        originalPrice: 11500,
        discountBadge: "-22%",
        isFeatured: true,
        category: "power-tools",
        categoryAr: "معدات كهربائية",
        image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
        description: "مثقاب قوي عالي العزم مزود بمحرك نحاسي نقي وبطاريتي ليثيوم 21V وشاحن سريع للعمل الشاق في جميع الورش والمنازل.",
        rating: 4.6,
        reviewsCount: 28,
        reviews: [
          { id: "rb1", author: "سفيان", rating: 5, date: "05 أوت 2026", text: "قوية جدا والبطارية تدوم طويلا." },
          { id: "rb2", author: "عمر", rating: 4, date: "28 جويلية 2026", text: "جيدة للاستعمال المنزلي." }
        ],
        variants: [{ name: "الحزمة (Pack)", options: ["علبة قياسية + بطاريتين", "حقيبة ممتازة + 24 قطعة"] }]
      },
      {
        id: "brico-2",
        name: "Boîte à Outils Complète 108 Pièces Chrome Vanadium",
        nameAr: "صندوق أدوات متكامل 108 قطعة من الفولاذ المقاوم للصدأ",
        price: 13500,
        originalPrice: 16000,
        discountBadge: "مميز",
        isFeatured: true,
        category: "hand-tools",
        categoryAr: "أدوات يدوية",
        image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80",
        description: "طقم متكامل من المفاتيح والمفكات والمقابض الاحترافية للسيارات والميكانيك والصيانة المنزلية.",
        variants: [{ name: "الموديل", options: ["108 قطعة احترافية", "187 قطعة كاملة"] }]
      }
    ]
  },
  {
    id: "fashion_chic",
    name: "Élégance & Mode",
    nameAr: "أزياء الموضة الراقية",
    type: "store",
    badge: "Haute Couture & Prêt-à-porter",
    description: "Thème d'exception avec bannières immersives et filtres instantanés pour boutiques de mode",
    features: [
      "Disposition grand écran immersive et chic",
      "Sélecteur visuel des tailles et teintes",
      "Grille de catégories en vignettes rondes",
      "Formulaire express optimisé COD 58 Wilayas"
    ],
    primaryColor: "#f59e0b",
    accentColor: "#d97706",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-fashion",
    bannerHeadline: "Collection Automne / Hiver 2026",
    bannerHeadlineAr: "أزياء عصرية لكل المناسبات",
    bannerSubheadline: "L'élégance à l'algérienne : style moderne et confort absolu",
    bannerSubheadlineAr: "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    bannerCtaAr: "تسوق الآن",
    categories: FASHION_CATEGORIES,
    products: FASHION_PRODUCTS
  },
  {
    id: "glow_beauty",
    name: "Glow & Beauté",
    nameAr: "عناية وجمال",
    type: "store",
    badge: "Cosmétique & Soins",
    description: "Design doux et épuré spécialement pensé pour les soins de la peau, maquillage et parfums",
    features: [
      "Palette pastel luxueuse & or rose",
      "Section routine beauté et conseils d'utilisation",
      "Badges 100% Naturel et Testé Dermatologiquement",
      "Offres groupées avec réductions automatiques"
    ],
    primaryColor: "#ec4899",
    accentColor: "#db2777",
    thumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-glow",
    bannerHeadline: "Révélez Votre Éclat Naturel",
    bannerHeadlineAr: "تألقي بجمال طبيعي وبشرة نضرة",
    bannerSubheadline: "Des soins cosmétiques haut de gamme formulés avec des ingrédients naturels",
    bannerSubheadlineAr: "أفضل منتجات العناية بالبشرة والشعر المصنوعة من خلاصات طبيعية 100%",
    bannerImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&q=80",
    bannerCtaAr: "اكتشفي المنتجات",
    categories: [
      { id: "skincare", name: "Soins Visage", nameAr: "عناية بالبشرة", productCount: 6, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80" },
      { id: "perfume", name: "Parfums d'Exception", nameAr: "عطور فاخرة", productCount: 4, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&q=80" },
      { id: "haircare", name: "Soins Capillaires", nameAr: "عناية بالشعر", productCount: 5, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&q=80" }
    ],
    products: [
      {
        id: "cosm-1",
        name: "Sérum Anti-Âge & Éclat Vitamine C + Acide Hyaluronique",
        nameAr: "سيروم النضارة ومكافحة التجاعيد بالفيتامين C وحمض الهيالورونيك",
        price: 3400,
        originalPrice: 4800,
        discountBadge: "-29%",
        isFeatured: true,
        category: "skincare",
        categoryAr: "عناية بالبشرة",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        description: "تركيبة مركزة تمنح بشرتك إشراقة فورية وتوحد لون البشرة وتقلل من التصبغات والبقع الداكنة.",
        rating: 4.8,
        reviewsCount: 56,
        reviews: [
          { id: "rc1", author: "نوال ح.", rating: 5, date: "11 أوت 2026", text: "نتيجته مبهرة على البشرة يعطي لمعان ونضارة." },
          { id: "rc2", author: "فاطمة", rating: 5, date: "29 جويلية 2026", text: "أفضل سيروم جربته لحد الآن." }
        ],
        variants: [{ name: "الحجم (Contenance)", options: ["30 ml", "50 ml (أفضل قيمة)"] }]
      },
      {
        id: "cosm-2",
        name: "Eau de Parfum Oriental Prestige 100ml",
        nameAr: "عطر شرقي فاخر يدوم أكثر من 48 ساعة",
        price: 6900,
        originalPrice: 8500,
        discountBadge: "مميز",
        isFeatured: true,
        category: "perfume",
        categoryAr: "عطور فاخرة",
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80",
        description: "مزيج ساحر من العود الملكي والعنبر والمسك الأبيض بنفحات فرنسية راقية للجنسين.",
        variants: [{ name: "الحجم", options: ["100 ml مع علبة هدايا مخملية"] }]
      }
    ]
  },
  {
    id: "electro_zone",
    name: "Electro & Tech",
    nameAr: "إلكترونيات وتكنولوجيا",
    type: "store",
    badge: "High-Tech & Gaming",
    description: "Thème technologique ultra rapide pour smartphones, montres connectées, gaming et PC",
    features: [
      "Tableaux comparatifs et fiches techniques",
      "Compteur de stock et sentiment d'urgence",
      "Badge Garantie officielle 12 à 24 mois",
      "Bouton commande rapide en 1 clic"
    ],
    primaryColor: "#0284c7",
    accentColor: "#0369a1",
    thumbnail: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-electro",
    bannerHeadline: "Dernières Nouveautés High-Tech au Meilleur Prix",
    bannerHeadlineAr: "أحدث المنتجات التكنولوجية والإلكترونيات الأصلية في الجزائر",
    bannerSubheadline: "Smartphones, accessoires gaming et montres intelligentes avec garantie",
    bannerSubheadlineAr: "هواتف، ساعات ذكية، وإكسسوارات أصلية مع ضمان كامل وتوصيل لجميع الولايات",
    bannerImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&q=80",
    bannerCtaAr: "اكتشف العروض",
    categories: [
      { id: "audio", name: "Écouteurs & Audio", nameAr: "سماعات وصوتيات", productCount: 5, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80" },
      { id: "smartwatches", name: "Montres Connectées", nameAr: "ساعات ذكية", productCount: 4, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80" },
      { id: "gaming", name: "Accessoires Gaming", nameAr: "أجهزة ألعاب", productCount: 6, image: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300&q=80" }
    ],
    products: [
      {
        id: "tech-1",
        name: "Écouteurs Sans Fil Pro avec Réduction de Bruit Active",
        nameAr: "سماعات بلوتوث لاسلكية مع عزل حقيقي للضوضاء ANC",
        price: 4900,
        originalPrice: 7000,
        discountBadge: "-30%",
        isFeatured: true,
        category: "audio",
        categoryAr: "سماعات وصوتيات",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
        description: "صوت نقي عالي الدقة، بطارية تدوم حتى 36 ساعة مع علبة الشحن، مقاومة للماء والتعرق IPX5.",
        rating: 4.7,
        reviewsCount: 34,
        reviews: [
          { id: "rt1", author: "رياض", rating: 5, date: "16 أوت 2026", text: "صوت نقي جدا وعزل الضوضاء شغال 100%." },
          { id: "rt2", author: "مهدي", rating: 4, date: "02 أوت 2026", text: "البطارية جيدة ولكن المايك متوسط." }
        ],
        variants: [{ name: "اللون", options: ["أسود ملكي (Black)", "أبيض لؤلؤي (White)"] }]
      },
      {
        id: "tech-2",
        name: "Montre Intelligente Ultra Sport AMOLED 2026",
        nameAr: "ساعة ذكية رياضية فائقة مع شاشة AMOLED ومكالمات بلوتوث",
        price: 7800,
        originalPrice: 10500,
        discountBadge: "مميز",
        isFeatured: true,
        category: "smartwatches",
        categoryAr: "ساعات ذكية",
        image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80",
        description: "تدعم إجراء واستقبال المكالمات، قياس نبضات القلب ونسبة الأكسجين، تتبع أكثر من 100 رياضة مع بطارية تدوم 14 يوماً.",
        variants: [{ name: "لون الحزام", options: ["برتقالي رياضي (Orange)", "أسود كلاسيكي (Noir)", "رمادي تيتانيوم (Gris)"] }]
      }
    ]
  },
  {
    id: "turbo_mono",
    name: "Turbo COD Mono-Produit",
    nameAr: "تيربو - منتج واحد",
    type: "store",
    badge: "Tunnel Haute Conversion",
    description: "Tunnel de vente mono-produit optimisé pour maximiser le taux de conversion Cash On Delivery",
    features: [
      "Formulaire de commande direct intégré sur la page",
      "Compteur d'urgence et stock dynamique temps réel",
      "Offres groupées (1 acheté = le 2ème à -50%)",
      "Témoignages vidéos et avis clients vérifiés"
    ],
    primaryColor: "#10b981",
    accentColor: "#059669",
    thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80",
    demoUrl: "https://e-nova.vercel.app/store/demo-turbo",
    bannerHeadline: "Offre Exclusive Limitée : -50% Aujourd'hui",
    bannerHeadlineAr: "عرض حصري وخاص : تخفيض 50% مع توصيل سريع والدفع عند الاستلام",
    bannerSubheadline: "Commandez maintenant et recevez votre colis en 24 à 48 heures",
    bannerSubheadlineAr: "سارع بالطلب قبل نفاد الكمية المتوفرة في المخزن",
    bannerImage: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&q=80",
    bannerCtaAr: "اضغط هنا للطلب الآن",
    categories: [
      { id: "hero", name: "Produit Vedette", nameAr: "المنتج الرئيسي", productCount: 1, image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&q=80" }
    ],
    products: [
      {
        id: "turbo-1",
        name: "L'Appareil Révolutionnaire Tout-en-Un",
        nameAr: "الجهاز الذكي الأصلي متعدد الوظائف (الإصدار الجديد)",
        price: 4900,
        originalPrice: 8900,
        discountBadge: "-45%",
        isFeatured: true,
        category: "hero",
        categoryAr: "المنتج الرئيسي",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80",
        description: "الحل النهائي والفعال الذي يبحث عنه الجميع بجودة تصنيع فائقة وضمان استبدال فوري.",
        rating: 4.9,
        reviewsCount: 128,
        reviews: [
          { id: "rtu1", author: "سمير ج.", rating: 5, date: "24 أوت 2026", text: "جهاز ممتاز يغنيك عن عدة أجهزة أخرى." },
          { id: "rtu2", author: "حنان", rating: 5, date: "15 أوت 2026", text: "استعماله سهل جدا وفعال، شكرا لكم." }
        ],
        variants: [
          { name: "العرض الترويجي", options: ["قطعة واحدة (4,900 د.ج)", "قطعتين (8,500 د.ج + توصيل مجاني)", "3 قطع (11,500 د.ج + هدية خاصة)"] }
        ]
      }
    ]
  },
  {
    id: "organic_bio",
    name: "Organic Bio",
    nameAr: "العضوي الطبيعي",
    version: "Bio V3",
    type: "store",
    badge: "Bio",
    description: "Boutique de produits bio et naturels : huiles, miel, dattes, herbes, épices et savons — photos locales, histoire du terroir et bienfaits.",
    features: [
      "Photos produits et catégories incluses",
      "Section histoire / origine du producteur",
      "Bienfaits et labels Bio · Local · Naturel",
      "Palette crème et vert nature",
    ],
    primaryColor: "#2F7D32",
    accentColor: "#4C8C2B",
    thumbnail: "/themes/bio/cat-huiles.webp",
    demoUrl: "https://e-nova-saas.vercel.app/store/demo-organic",
    bannerHeadline: "Le meilleur de la nature, livré chez vous",
    bannerHeadlineAr: "خيرات الطبيعة إلى باب منزلك",
    bannerSubheadline: "Huiles, miel, dattes et savons 100% naturels de producteurs algériens de confiance",
    bannerSubheadlineAr: "زيوت وعسل وتمور طبيعية 100% من منتجين جزائريين موثوقين",
    bannerImage: "/themes/bio/hero-desktop.webp",
    bannerImageMobile: "/themes/bio/hero-mobile.webp",
    bannerCtaAr: "اكتشف منتجاتنا",
    heroBadge: "✅ Produits bio certifiés",
    heroBadgeAr: "✅ منتجات عضوية معتمدة",
    mode: "shop",
    whatsappPhone: "213555010203",
    navItems: [
      { id: "nav-home", label: t6("Accueil", "الرئيسية"), anchor: "#hero" },
      { id: "nav-cats", label: t6("Nos rayons", "أقسامنا"), anchor: "#categories" },
      { id: "nav-story", label: t6("Notre histoire", "قصتنا"), anchor: "#section-about_main" },
      { id: "nav-faq", label: t6("FAQ", "الأسئلة"), anchor: "#section-faq_main" },
    ],
    categories: [
      { id: "huiles", name: "Huiles & Olives", nameAr: "زيوت وزيتون", productCount: 2, image: "/themes/bio/cat-huiles.webp" },
      { id: "miel", name: "Miel & Confitures", nameAr: "عسل ومربى", productCount: 2, image: "/themes/bio/cat-miel.webp" },
      { id: "dattes", name: "Dattes & Dérivés", nameAr: "تمور ومنتجاتها", productCount: 2, image: "/themes/bio/cat-dattes.webp" },
      { id: "herbes", name: "Herbes & Tisanes", nameAr: "أعشاب وشاي", productCount: 2, image: "/themes/bio/cat-herbes.webp" },
      { id: "epices", name: "Épices", nameAr: "توابل وبهارات", productCount: 2, image: "/themes/bio/cat-epices.webp" },
      { id: "savon", name: "Savons naturels", nameAr: "صابون طبيعي", productCount: 2, image: "/themes/bio/cat-savon.webp" },
    ],
    products: [
      {
        id: "bio-huile-1", name: "Huile d'olive extra vierge 1L", nameAr: "زيت زيتون بكر ممتاز 1ل",
        price: 1800, originalPrice: 2200, discountBadge: "-18%", isFeatured: true,
        category: "Huiles & Olives", categoryAr: "زيوت وزيتون", image: "/themes/bio/prod-huile-1.webp",
        description: "Première pression à froid, récolte 2026, olives de Kabylie.",
        rating: 5, reviewsCount: 2,
        reviews: [
          { id: "br1", author: "أمين ب.", rating: 5, date: "12 سبتمبر 2026", text: "زيت ممتاز وطعمه أصيل، سأعيد الطلب بالتأكيد." },
          { id: "br2", author: "Sofia M.", rating: 5, date: "28 août 2026", text: "La meilleure huile que j'ai goûtée, livraison rapide." },
        ],
        variants: [{ name: "الحجم / Format", options: ["500 مل", "1 لتر", "2 لتر (+1600 دج)"] }],
      },
      {
        id: "bio-huile-2", name: "Huile d'olive bio 500ml", nameAr: "زيت زيتون عضوي 500 مل",
        price: 1100,
        category: "Huiles & Olives", categoryAr: "زيوت وزيتون", image: "/themes/bio/prod-huile-2.webp",
        description: "Bouteille verre foncé, certification bio du producteur.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "br3", author: "ليلى ح.", rating: 4, date: "3 أوت 2026", text: "جودة عالية والتغليف محترم جداً." }],
      },
      {
        id: "bio-miel-1", name: "Miel de montagne 1kg", nameAr: "عسل جبلي طبيعي 1 كغ",
        price: 3500, originalPrice: 4000, discountBadge: "-13%", isFeatured: true,
        category: "Miel & Confitures", categoryAr: "عسل ومربى", image: "/themes/bio/prod-miel-1.webp",
        description: "Miel brut non chauffé, récolte d'été des hauts plateaux.",
        rating: 5, reviewsCount: 2,
        reviews: [
          { id: "br4", author: "Karim T.", rating: 5, date: "19 سبتمبر 2026", text: "عسل أصيل بلا شك، رائحته تذكرني بعسل جدي." },
          { id: "br5", author: "نسرين", rating: 5, date: "5 سبتمبر 2026", text: "استعملته للعلاج البديل والنتيجة ممتازة." },
        ],
        variants: [{ name: "الوزن / Poids", options: ["500 غ", "1 كغ"] }],
      },
      {
        id: "bio-miel-2", name: "Miel de jujubier 500g", nameAr: "عسل السدر الفاخر 500 غ",
        price: 2800,
        category: "Miel & Confitures", categoryAr: "عسل ومربى", image: "/themes/bio/prod-miel-2.webp",
        description: "Sidr premium, cristallisation lente naturelle.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "br6", author: "Yacine B.", rating: 5, date: "22 أوت 2026", text: "Un vrai miel de sidr, le goût est puissant." }],
      },
      {
        id: "bio-dattes-1", name: "Dattes Deglet Nour 1kg", nameAr: "دقلة نور درجة أولى 1 كغ",
        price: 900, isFeatured: true,
        category: "Dattes & Dérivés", categoryAr: "تمور ومنتجاتها", image: "/themes/bio/prod-dattes-1.webp",
        description: "Calibre extra, dattes de Tolga translucides et fondantes.",
        rating: 5, reviewsCount: 2,
        reviews: [
          { id: "br7", author: "فاطمة", rating: 5, date: "1 أكتوبر 2026", text: "دقلة نور طرية وحلوة، أفضل من السوق." },
          { id: "br8", author: "Mourad L.", rating: 4, date: "14 سبتمبر 2026", text: "Très bonnes dattes, bien calibrées." },
        ],
      },
      {
        id: "bio-dattes-2", name: "Pâte de dattes aux noix 250g", nameAr: "معجون التمر بالجوز 250 غ",
        price: 650,
        category: "Dattes & Dérivés", categoryAr: "تمور ومنتجاتها", image: "/themes/bio/prod-dattes-2.webp",
        description: "Énergie naturelle, sans sucre ajouté.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "br9", author: "هدى", rating: 4, date: "9 سبتمبر 2026", text: "لذيذ ومفيد للأطفال كمصدر طاقة طبيعي." }],
      },
      {
        id: "bio-savon-1", name: "Savon naturel à l'huile d'olive", nameAr: "صابون طبيعي بزيت الزيتون",
        price: 350, isFeatured: true,
        category: "Savons naturels", categoryAr: "صابون طبيعي", image: "/themes/bio/prod-savon-1.webp",
        description: "Saponifié à froid, sans parfum ni colorant.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "br10", author: "Samia R.", rating: 5, date: "30 أوت 2026", text: "مناسب للبشرة الحساسة، أنصح به بشدة." }],
      },
      {
        id: "bio-savon-2", name: "Savon de garde traditionnel", nameAr: "صابون الغار التقليدي",
        price: 400, originalPrice: 480, discountBadge: "-17%",
        category: "Savons naturels", categoryAr: "صابون طبيعي", image: "/themes/bio/prod-savon-2.webp",
        description: "Cuit au chaudron, séchage 9 mois.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "br11", author: "عمر", rating: 4, date: "18 جويلية 2026", text: "صابون قوي ويدوم طويلاً." }],
      },
      {
        id: "bio-herbes-1", name: "Herbes séchées mélangées 100g", nameAr: "أعشاب مجففة مشكلة 100 غ",
        price: 500,
        category: "Herbes & Tisanes", categoryAr: "أعشاب وشاي", image: "/themes/bio/prod-herbes-1.webp",
        description: "Mélange maison : thym, romarin, sauge des Aurès.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "br12", author: "Wassila K.", rating: 5, date: "25 سبتمبر 2026", text: "رائحة الأعشاب قوية وطبيعية تماماً." }],
      },
      {
        id: "bio-herbes-2", name: "Tisane digestive 100g", nameAr: "شاي أعشاب هاضم 100 غ",
        price: 450,
        category: "Herbes & Tisanes", categoryAr: "أعشاب وشاي", image: "/themes/bio/prod-herbes-2.webp",
        description: "Verveine, menthe pouliot, fenouil — récolte sauvage.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "br13", author: "زينب", rating: 4, date: "7 سبتمبر 2026", text: "مريح للمعدة بعد العشاء." }],
      },
      {
        id: "bio-epices-1", name: "Épices mélangées fraîches 150g", nameAr: "بهارات مشكلة طازجة 150 غ",
        price: 550,
        category: "Épices", categoryAr: "توابل وبهارات", image: "/themes/bio/prod-epices-1.webp",
        description: "Moulues à la commande : ras el hanout 12 épices.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "br14", author: "Bilal A.", rating: 5, date: "2 أكتوبر 2026", text: "البهارات مطحونة طازجة والفرق واضح في الطبخ." }],
      },
      {
        id: "bio-epices-2", name: "Bâtons de cannelle 50g", nameAr: "أعواد قرفة 50 غ",
        price: 480, originalPrice: 560, discountBadge: "-14%",
        category: "Épices", categoryAr: "توابل وبهارات", image: "/themes/bio/prod-epices-2.webp",
        description: "Cannelle de Ceylan entière, qualité supérieure.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "br15", author: "Chahinez", rating: 4, date: "20 أوت 2026", text: "قرفة عطرية وممتازة للحلويات." }],
      },
    ],
    defaultSections: [
      {
        id: "hero_main", type: "hero", visible: true,
        badgeText: t6("✅ Produits bio certifiés", "✅ منتجات عضوية معتمدة"),
        title: t6("Le meilleur de la nature, livré chez vous", "خيرات الطبيعة إلى باب منزلك"),
        description: t6(
          "Huiles, miel, dattes et savons 100% naturels de producteurs algériens de confiance.",
          "زيوت وعسل وتمور طبيعية 100% من منتجين جزائريين موثوقين."
        ),
        primaryButton: { visible: true, text: t6("Découvrir nos produits", "اكتشف منتجاتنا"), link: "#all-products" },
        secondaryButton: { visible: true, text: t6("Notre histoire", "قصتنا"), link: "#section-about_main" },
        desktopImage: "/themes/bio/hero-desktop.webp",
        mobileImage: "/themes/bio/hero-mobile.webp",
        overlayOpacity: 45, align: "start", minHeightPx: 520,
      },
      {
        id: "trust_main", type: "trust", visible: true,
        items: [
          { id: "t1", icon: "check", title: t6("100% naturel", "طبيعي 100%"), subtitle: t6("Sans additifs ni conservateurs", "بدون إضافات أو مواد حافظة") },
          { id: "t2", icon: "package", title: t6("Producteurs locaux", "منتجون محليون"), subtitle: t6("Soutien direct aux fermiers", "دعم مباشر للفلاحين") },
          { id: "t3", icon: "truck", title: t6("Livraison 58 wilayas", "توصيل 58 ولاية"), subtitle: t6("Expédition sous 24-48h", "إرسال خلال 24-48 ساعة") },
        ],
      },
      {
        id: "categories_main", type: "categories", visible: true,
        title: t6("Nos rayons", "تصفح الأقسام"),
        subtitle: t6("Choisissez ce que la nature vous offre", "اختر ما تقدمه لك الطبيعة"),
        style: "grid", onlyIds: [], maxItems: 6,
      },
      { id: "featured_main", type: "featured", visible: true, title: t6("Sélection du mois", "تشكيلة الموسم"), subtitle: t6("Nos produits phares", "منتجاتنا المميزة"), style: "grid", maxItems: 8 },
      {
        id: "about_main", type: "textImage", visible: true,
        title: t6("Notre histoire", "قصتنا"),
        body: t6(
          "Tout a commencé dans un petit verger familial, où nos grands-parents pressaient l'olive chaque hiver.\nAujourd'hui, nous travaillons avec une coopérative de producteurs qui partagent la même exigence : des produits bruts, traçables et honnêtes.\nChaque pot, chaque bouteille porte le nom du producteur et sa wilaya.",
          "بدأت الحكاية في بستان عائلي صغير، حيث كان أجدادنا يعصرون الزيتون كل شتاء.\nاليوم نتعاون مع تعاونية من المنتجين الذين يشاركوننا نفس المعايير: منتجات طبيعية، معروفة المصدر وأمينة.\nكل وعاء وكل زجاجة تحمل اسم المنتج وولايته."
        ),
        image: "/themes/bio/about.webp", imagePosition: "start",
        button: { visible: false, text: t6("", ""), link: "" },
      },
      {
        id: "benefits_main", type: "servicesCards", visible: true,
        title: t6("Pourquoi nos clients reviennent", "لماذا يعود إلينا زبائننا"),
        subtitle: t6("Des bienfaits réels, pas des promesses", "فوائد حقيقية لا وعود"),
        cards: [
          { id: "b1", icon: "shield", title: t6("Traçabilité totale", "مصدر معروف"), text: t6("Producteur et wilaya indiqués sur chaque produit.", "اسم المنتج وولايته مدونان على كل منتج.") },
          { id: "b2", icon: "sparkles", title: t6("Brut et vivant", "طبيعي وحي"), text: t6("Miel non chauffé, huiles à froid, sans mélange.", "عسل غير مسخن، زيوت باردة العصر، بلا خلط.") },
          { id: "b3", icon: "thumbsup", title: t6("Testé en laboratoire", "مفحوص مخبرياً"), text: t6("Analyses d'humidité et de pureté à chaque récolte.", "تحاليل الرطوبة والنقاء في كل موسم.") },
          { id: "b4", icon: "handshake", title: t6("Prix juste", "سعر عادل"), text: t6("Du producteur à vous, sans intermédiaires.", "من الفلاح إليك مباشرة، بدون وسطاء.") },
        ],
      },
      {
        id: "promo_main", type: "promoBanner", visible: true,
        image: "/themes/bio/banner.webp",
        title: t6("La récolte d'automne est arrivée", "موصول الخريف وصل"),
        description: t6("Jusqu'à -18% sur les huiles et miels de la nouvelle récolte, pour une durée limitée.", "خصومات تصل إلى 18% على زيوت وعسل الموصول الجديد لفترة محدودة."),
        buttonText: t6("En profiter", "استفد من العرض"), buttonLink: "#all-products",
      },
      {
        id: "reviews_main", type: "reviews", visible: true,
        title: t6("Avis de nos clients", "آراء زبائننا"),
        subtitle: t6("Des familles partout en Algérie", "عائلات من كل الجزائر"),
        manualReviews: [
          { id: "r1", rating: 5, text: t6("Enfin un miel qui goûte le vrai miel. Commande arrivée en 48h à Oran.", "أخيراً عسل بطعم العسل الحقيقي. وصل الطلب في 48 ساعة إلى وهران."), author: "Amel", city: "Oran", manual: true },
          { id: "r2", rating: 5, text: t6("L'huile d'olive me rappelle celle de mon grand-père. Bravo !", "زيت الزيتون يذكرني بزيت جدي. أحسنتم!"), author: "رضا", city: "سطيف", manual: true },
          { id: "r3", rating: 4, text: t6("Bons produits et emballage soigné. Je recommande.", "منتجات جيدة وتغليف مرتب. أنصح بهم."), author: "Nadia", city: "Alger", manual: true },
        ],
        includeProductReviews: true, maxItems: 6,
      },
      {
        id: "faq_main", type: "faq", visible: true,
        title: t6("Questions fréquentes", "أسئلة شائعة"),
        subtitle: t6("Tout savoir avant de commander", "كل ما تحتاج معرفته قبل الطلب"),
        items: [
          { id: "f1", question: t6("Vos produits sont-ils vraiment bio ?", "هل منتجاتكم عضوية فعلاً؟"), answer: t6("Chaque produit porte le nom du producteur et sa wilaya, et les récoltes sont analysées (humidité, pureté). Aucun mélange ni additif.", "كل منتج يحمل اسم المنتج وولايته، والموصولات تُفحص (الرطوبة والنقاء). لا خلط ولا إضافات.") },
          { id: "f2", question: t6("Comment conserver le miel ?", "كيف أحفظ العسل؟"), answer: t6("À l'abri de la lumière, à température ambiante. La cristallisation est naturelle et prouve que le miel n'a pas été chauffé.", "بعيداً عن الضوء وفي حرارة الغرفة. التبلور طبيعي ويدل على أن العسل غير مسخن.") },
          { id: "f3", question: t6("Quels sont les délais de livraison ?", "كم يستغرق التوصيل؟"), answer: t6("24 à 48h pour Alger, 2 à 5 jours pour les autres wilayas. Paiement à la livraison.", "من 24 إلى 48 ساعة للجزائر، ومن 2 إلى 5 أيام لباقي الولايات. الدفع عند الاستلام.") },
          { id: "f4", question: t6("Puis-je commander en grande quantité ?", "هل يمكنني الطلب بالجملة؟"), answer: t6("Oui, contactez-nous par WhatsApp pour les tarifs grossistes (5L, 10kg et plus).", "نعم، تواصل معنا عبر واتساب لأسعار الجملة (5 لتر، 10 كغ وأكثر).") },
          { id: "f5", question: t6("Échange ou retour ?", "الاستبدال أو الإرجاع؟"), answer: t6("Produit non conforme ? Échangé ou remboursé sous 7 jours.", "منتج غير مطابق؟ يُستبدل أو يُرجع خلال 7 أيام.") },
        ],
      },
      { id: "all_main", type: "allProducts", visible: true, title: t6("Tous nos produits", "جميع منتجاتنا"), subtitle: t6("Notre catalogue complet", "كتالوجنا الكامل"), showCategoryPills: true, defaultSort: "recent", pageSize: 8, showViewAllLink: true },
    ],
  },
  {
    id: "corporate_showcase",
    name: "Entreprise Pro",
    nameAr: "واجهة الشركات",
    version: "Corporate V3",
    type: "store",
    badge: "Vitrine",
    description: "Vitrine corporate premium : chiffres clés, services, réalisations, équipe et formulaire de devis qui crée des leads dans le dashboard.",
    features: [
      "Formulaire « Demander un devis » intégré",
      "Chiffres clés et bande de confiance",
      "Galerie réalisations avec filtres",
      "Mode vitrine sans panier",
    ],
    primaryColor: "#0B1F3A",
    accentColor: "#F59E0B",
    thumbnail: "/themes/corporate/hero-desktop.webp",
    demoUrl: "https://e-nova-saas.vercel.app/store/demo-corporate",
    bannerHeadline: "Votre partenaire de confiance depuis 2010",
    bannerHeadlineAr: "شريككم الموثوق منذ 2010",
    bannerSubheadline: "Études, réalisation et formation : nous livrons vos projets dans toutes les wilayas",
    bannerSubheadlineAr: "هندسة ودراسات وتنفيذ مشاريع جاهزة في جميع ولايات الوطن",
    bannerImage: "/themes/corporate/hero-desktop.webp",
    bannerImageMobile: "/themes/corporate/hero-mobile.webp",
    bannerCtaAr: "اطلب عرض سعر",
    heroBadge: "Partenaire de confiance depuis 2010",
    heroBadgeAr: "شريك موثوق منذ 2010",
    mode: "showcase",
    whatsappPhone: "213555010204",
    navItems: [
      { id: "nav-home", label: t6("Accueil", "الرئيسية"), anchor: "#hero" },
      { id: "nav-about", label: t6("À propos", "من نحن"), anchor: "#section-about_main" },
      { id: "nav-services", label: t6("Services", "خدماتنا"), anchor: "#section-services_main" },
      { id: "nav-works", label: t6("Réalisations", "إنجازاتنا"), anchor: "#section-realisations_main" },
      { id: "nav-contact", label: t6("Contact", "اتصل بنا"), anchor: "#contact" },
    ],
    categories: [],
    products: [],
    defaultSections: [
      {
        id: "hero_main", type: "hero", visible: true,
        badgeText: t6("Partenaire de confiance depuis 2010", "شريك موثوق منذ 2010"),
        title: t6("Votre partenaire de confiance depuis 2010", "شريككم الموثوق منذ 2010"),
        description: t6(
          "Études, réalisation et formation : nous livrons vos projets dans toutes les wilayas.",
          "هندسة ودراسات وتنفيذ مشاريع جاهزة في جميع ولايات الوطن."
        ),
        primaryButton: { visible: true, text: t6("Demander un devis", "اطلب عرض سعر"), link: "#contact" },
        secondaryButton: { visible: true, text: t6("Nos réalisations", "إنجازاتنا"), link: "#section-realisations_main" },
        desktopImage: "/themes/corporate/hero-desktop.webp",
        mobileImage: "/themes/corporate/hero-mobile.webp",
        overlayOpacity: 55, align: "start", minHeightPx: 560,
      },
      {
        id: "stats_main", type: "stats", visible: true,
        items: [
          { id: "s1", value: "15+", label: t6("années d'expérience", "سنة خبرة") },
          { id: "s2", value: "300+", label: t6("projets livrés", "مشروع منجز") },
          { id: "s3", value: "120", label: t6("clients fidèles", "زبون وفي") },
          { id: "s4", value: "48", label: t6("wilayas couvertes", "ولاية نغطيها") },
        ],
        clients: [t6("SARL Bâtiplus", "شركة باتيبلوس"), t6("Groupe El-Amel", "مجموعة الأمل"), t6("Cabinet MENA", "مكتب مينا"), t6("Coop Agro Sud", "تعاونية أغرو سود")],
      },
      {
        id: "services_main", type: "servicesCards", visible: true,
        title: t6("Nos services", "خدماتنا"),
        subtitle: t6("Une équipe pluridisciplinaire à votre service", "فريق متعدد التخصصات في خدمتك"),
        cards: [
          { id: "sv1", image: "/themes/corporate/svc-etude.webp", title: t6("Études & conseil", "دراسات واستشارات"), text: t6("Études techniques, faisabilité et montage de dossiers.", "دراسات تقنية وجدوى وملفات ملفات المشاريع.") },
          { id: "sv2", image: "/themes/corporate/svc-realisation.webp", title: t6("Réalisation & suivi", "تنفيذ ومتابعة"), text: t6("Exécution des travaux avec contrôle qualité hebdomadaire.", "تنفيذ الأشغال مع مراقبة جودة أسبوعية.") },
          { id: "sv3", image: "/themes/corporate/svc-formation.webp", title: t6("Formation", "تكوين"), text: t6("Programmes certifiants pour vos équipes et apprentis.", "برامج تكوين معتمدة لفرقكم ومتدربيكم.") },
          { id: "sv4", image: "/themes/corporate/svc-logistique.webp", title: t6("Logistique & supply", "لوجستيك وتزويد"), text: t6("Approvisionnement et acheminement sur tout le territoire.", "التزويد والنقل عبر كامل التراب الوطني.") },
        ],
      },
      {
        id: "about_main", type: "textImage", visible: true,
        title: t6("Qui sommes-nous", "من نحن"),
        body: t6(
          "Fondée en 2010, notre entreprise réunit ingénieurs, techniciens et formateurs autour d'une même conviction : un projet réussi est un projet tenu dans les délais.\nNous accompagnons les entreprises et les institutions de l'étude à la réception des travaux.\nNos points forts : réactivité, transparence sur les coûts et garantie décennale.",
          "تأسست شركتنا سنة 2010 وتجمع مهندسين وتقنيين ومكونين حول قناعة واحدة: المشروع الناجح هو المشروع المسلّم في وقته.\nنرافق المؤسسات من الدراسة إلى استلام الأشغال.\nنقاط قوتنا: سرعة الاستجابة، الشفافية في التكاليف، وضمان عشر سنوات."
        ),
        image: "/themes/corporate/about.webp", imagePosition: "end",
        button: { visible: true, text: t6("Demander un devis", "اطلب عرض سعر"), link: "#contact" },
      },
      {
        id: "realisations_main", type: "gallery", visible: true,
        title: t6("Nos réalisations", "إنجازاتنا"),
        subtitle: t6("Un aperçu de projets livrés récemment", "لمحة عن مشاريع سلّمناها مؤخراً"),
        items: [
          { id: "g1", image: "/themes/corporate/real-1.webp", title: t6("Résidence El-Bahia", "إقامة البهية"), text: t6("120 logements — 18 mois", "120 وحدة سكنية — 18 شهراً"), tag: t6("BTP", "بناء") },
          { id: "g2", image: "/themes/corporate/real-2.webp", title: t6("Plateau tertiaire", "مكاتب"), text: t6("2 400 m² aménagés", "2400 م² مهيأة"), tag: t6("Aménagement", "تهيئة") },
          { id: "g3", image: "/themes/corporate/real-3.webp", title: t6("Plateforme logistique", "منصة لوجستية"), text: t6("Entrepôt 6 000 m²", "مستودع 6000 م²"), tag: t6("Logistique", "لوجستيك") },
          { id: "g4", image: "/themes/corporate/real-4.webp", title: t6("Siège administratif", "مقر إداري"), text: t6("Structure R+8", "هيكل R+8"), tag: t6("Institutionnel", "مؤسسات") },
        ],
      },
      {
        id: "team_main", type: "team", visible: true,
        title: t6("Notre équipe", "فريقنا"),
        subtitle: t6("Des experts à votre écoute", "خبراء في خدمتك"),
        image: "/themes/corporate/team.webp",
        members: [
          { id: "m1", initials: "KB", name: t6("K. Boudjema", "خ. بودجمة"), role: t6("Directeur des études", "مدير الدراسات") },
          { id: "m2", initials: "SA", name: t6("S. Amrani", "س. عمراني"), role: t6("Cheffe de projet", "رئيسة مشاريع") },
          { id: "m3", initials: "MT", name: t6("M. Toumi", "م. تويمي"), role: t6("Responsable travaux", "مسؤول الأشغال") },
          { id: "m4", initials: "LH", name: t6("L. Haddad", "ل. حداد"), role: t6("Responsable formation", "مسؤول التكوين") },
        ],
      },
      {
        id: "reviews_main", type: "reviews", visible: true,
        title: t6("Ce que disent nos clients", "ماذا يقول عملاؤنا"),
        subtitle: t6("Des entreprises qui nous font confiance", "مؤسسات تثق بنا"),
        manualReviews: [
          { id: "r1", rating: 5, text: t6("Projet livré avant la date contrat. Une équipe rigoureuse.", "مشروع سُلّم قبل الأجل التعاقدي. فريق منظم."), author: "Dir. Achats", city: "Alger", manual: true },
          { id: "r2", rating: 5, text: t6("Transparence totale sur les coûts, aucun dépassement.", "شفافية كاملة في التكاليف، لا تجاوزات."), author: "مدير عام", city: "قسنطينة", manual: true },
          { id: "r3", rating: 4, text: t6("Bonne maîtrise technique, communication claire.", "إتقان تقني وتواصل واضح."), author: "Bureau ordre", city: "Oran", manual: true },
        ],
        includeProductReviews: false, maxItems: 6,
      },
      {
        id: "cta_main", type: "ctaBanner", visible: true,
        title: t6("Parlons de votre projet", "لنتحدث عن مشروعك"),
        text: t6("Réponse sous 24h ouvrées, visite technique gratuite dans les 48 wilayas.", "رد خلال 24 ساعة عمل، زيارة تقنية مجانية في 48 ولاية."),
        image: "/themes/corporate/banner.webp",
        buttonText: t6("Demander un devis", "اطلب عرض سعر"), buttonLink: "#contact",
        whatsappText: t6("WhatsApp direct", "واتساب مباشر"),
      },
      {
        id: "contact_main", type: "contactForm", visible: true, kind: "quote",
        title: t6("Demander un devis", "اطلب عرض سعر"),
        subtitle: t6("Décrivez votre besoin, nous revenons vers vous sous 24h", "صف لنا حاجتك، نعود إليك خلال 24 ساعة"),
        formTitle: t6("Formulaire de devis", "استمارة عرض السعر"),
        nameLabel: t6("Nom et prénom *", "الاسم واللقب *"),
        phoneLabel: t6("Téléphone *", "الهاتف *"),
        emailLabel: t6("Email (optionnel)", "البريد الإلكتروني (اختياري)"),
        needLabel: t6("Votre besoin", "حاجتك"),
        messageLabel: t6("Décrivez votre projet", "صف مشروعك"),
        submitText: t6("Envoyer la demande", "أرسل الطلب"),
        successText: t6("Demande envoyée ! Notre équipe vous rappelle sous 24h.", "تم إرسال الطلب! سيتصل بك فريقنا خلال 24 ساعة."),
        services: [t6("Étude technique", "دراسة تقنية"), t6("Réalisation de projet", "تنفيذ مشروع"), t6("Formation", "تكوين"), t6("Logistique", "لوجستيك"), t6("Autre", "أخرى")],
        info: {
          address: t6("Cité des Affaires, Bt A, Alger", "حي الأعمال، عمارة A، الجزائر العاصمة"),
          hours: t6("Dimanche — Jeudi : 8h00 - 17h00", "الأحد — الخميس: 8:00 - 17:00"),
          phone: "0555 010 204", email: "contact@entreprise-pro.dz",
        },
        showWhatsApp: true,
      },
    ],
  },
  {
    id: "pro_services",
    name: "Services Pro",
    nameAr: "خدمات احترافية",
    version: "Services V3",
    type: "store",
    badge: "Services",
    description: "Services professionnels à domicile : nettoyage, réparation, rénovation et conseil — processus clair, forfaits et prise de rendez-vous.",
    features: [
      "Prise de rendez-vous en ligne",
      "Forfaits Basic / Pro / Premium",
      "Processus en 4 étapes",
      "Badges de confiance et garanties",
    ],
    primaryColor: "#0F766E",
    accentColor: "#CA8A04",
    thumbnail: "/themes/services/svc-nettoyage.webp",
    demoUrl: "https://e-nova-saas.vercel.app/store/demo-services",
    bannerHeadline: "Des experts à votre service, en 24h",
    bannerHeadlineAr: "خبراء في خدمتك خلال 24 ساعة",
    bannerSubheadline: "Nettoyage, réparation et rénovation — devis gratuit et intervention rapide partout en ville",
    bannerSubheadlineAr: "تنظيف وصيانة وترميم — عرض سعر مجاني وتدخل سريع في كل المدينة",
    bannerImage: "/themes/services/hero-desktop.webp",
    bannerImageMobile: "/themes/services/hero-mobile.webp",
    bannerCtaAr: "احجز موعدك",
    heroBadge: "Intervention rapide sous 24h",
    heroBadgeAr: "استجابة سريعة خلال 24 ساعة",
    mode: "shop",
    whatsappPhone: "213555010205",
    navItems: [
      { id: "nav-home", label: t6("Accueil", "الرئيسية"), anchor: "#hero" },
      { id: "nav-services", label: t6("Services", "الخدمات"), anchor: "#section-services_main" },
      { id: "nav-pricing", label: t6("Tarifs", "الأسعار"), anchor: "#section-pricing_main" },
      { id: "nav-contact", label: t6("Contact", "احصل على عرض"), anchor: "#contact" },
    ],
    categories: [
      { id: "nettoyage", name: "Nettoyage", nameAr: "تنظيف", productCount: 2, image: "/themes/services/svc-nettoyage.webp" },
      { id: "reparation", name: "Réparation", nameAr: "إصلاح", productCount: 2, image: "/themes/services/svc-reparation.webp" },
      { id: "renovation", name: "Rénovation", nameAr: "ترميم", productCount: 2, image: "/themes/services/svc-renovation.webp" },
      { id: "conseil", name: "Conseil", nameAr: "استشارة", productCount: 2, image: "/themes/services/svc-conseil.webp" },
    ],
    products: [
      {
        id: "srv-net-1", name: "Nettoyage vitres & vitrines", nameAr: "تنظيف النوافذ والواجهات",
        price: 2500, isFeatured: true, category: "Nettoyage", categoryAr: "تنظيف",
        image: "/themes/services/svc-nettoyage.webp",
        description: "Intérieur + extérieur accessible, produits pro inclus.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "sr1", author: "صاحب محل", rating: 5, date: "3 أكتوبر 2026", text: "واجهة محل صارت كالجديدة، عمل نظيف وسريع." }],
        variants: [{ name: "المساحة / Surface", options: ["حتى 20 م²", "20-50 م²", "+50 م² (عرض سعر)"] }],
      },
      {
        id: "srv-net-2", name: "Grand ménage après chantier", nameAr: "تنظيف شامل بعد الأشغال",
        price: 8000, originalPrice: 9500, discountBadge: "-16%", isFeatured: true,
        category: "Nettoyage", categoryAr: "تنظيف", image: "/themes/services/svc-nettoyage-2.webp",
        description: "Poussière, peinture, finitions : logement prêt à vivre.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "sr2", author: "Amina D.", rating: 5, date: "21 سبتمبر 2026", text: "دخلوا المنزل بعد الترميم وخرج وكأنه جديد." }],
      },
      {
        id: "srv-rep-1", name: "Dépannage plomberie urgent", nameAr: "إصلاح عاجل للسباكة",
        price: 2000, isFeatured: true, category: "Réparation", categoryAr: "إصلاح",
        image: "/themes/services/svc-reparation.webp",
        description: "Fuite, robinetterie, WC bouché — sous 2h en ville.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "sr3", author: "Hakim", rating: 5, date: "1 نوفمبر 2026", text: "جاؤوا خلال ساعة وأصلحوا التسريب نهائياً." }],
      },
      {
        id: "srv-rep-2", name: "Entretien chaudière annuel", nameAr: "صيانة سنوية للمرجل",
        price: 4500, category: "Réparation", categoryAr: "إصلاح",
        image: "/themes/services/svc-reparation.webp",
        description: "Contrôle complet, nettoyage et attestation.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "sr4", author: "أم فيصل", rating: 4, date: "12 أكتوبر 2026", text: "خدمة منظمة والسعر واضح مسبقاً." }],
      },
      {
        id: "srv-ren-1", name: "Peinture appartement (2 pièces)", nameAr: "دهان شقة (غرفتان)",
        price: 18000, originalPrice: 21000, discountBadge: "-14%",
        category: "Rénovation", categoryAr: "ترميم", image: "/themes/services/svc-renovation.webp",
        description: "Enduit, 2 couches, finitions propres. Matériel inclus.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "sr5", author: "Yasmine", rating: 5, date: "28 سبتمبر 2026", text: "عمل أنيق واحترموا المواعيد." }],
      },
      {
        id: "srv-ren-2", name: "Rénovation salle de bain", nameAr: "ترميم الحمام",
        price: 45000, category: "Rénovation", categoryAr: "ترميم",
        image: "/themes/services/svc-renovation.webp",
        description: "Carrelage, faïence, plomberie — clé en main.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "sr6", author: "عائلة بلحاج", rating: 5, date: "5 أكتوبر 2026", text: "حمام جديد تماماً في أسبوع واحد." }],
      },
      {
        id: "srv-con-1", name: "Audit énergie & isolation", nameAr: "تدقيق الطاقة والعزل",
        price: 6000, category: "Conseil", categoryAr: "استشارة",
        image: "/themes/services/svc-conseil.webp",
        description: "Rapport écrit + plan d'économies personnalisé.",
        rating: 4, reviewsCount: 1,
        reviews: [{ id: "sr7", author: "Sofiane", rating: 4, date: "17 سبتمبر 2026", text: "التقرير وفر عليّ فاتورة غاز هذا الشتاء." }],
      },
      {
        id: "srv-con-2", name: "Visite conseil décoration", nameAr: "زيارة استشارية للديكور",
        price: 3000, category: "Conseil", categoryAr: "استشارة",
        image: "/themes/services/about.webp",
        description: "1h30 à domicile, plan couleurs et aménagement.",
        rating: 5, reviewsCount: 1,
        reviews: [{ id: "sr8", author: "Lina", rating: 5, date: "30 سبتمبر 2026", text: "أفكار بسيطة غيّرت المنزل كلياً." }],
      },
    ],
    defaultSections: [
      {
        id: "hero_main", type: "hero", visible: true,
        badgeText: t6("Intervention rapide sous 24h", "استجابة سريعة خلال 24 ساعة"),
        title: t6("Des experts à votre service, en 24h", "خبراء في خدمتك خلال 24 ساعة"),
        description: t6(
          "Nettoyage, réparation et rénovation — devis gratuit et intervention rapide partout en ville.",
          "تنظيف وصيانة وترميم — عرض سعر مجاني وتدخل سريع في كل المدينة."
        ),
        primaryButton: { visible: true, text: t6("Prendre rendez-vous", "احجز موعدك"), link: "#contact" },
        secondaryButton: { visible: true, text: t6("Voir les tarifs", "شاهد الأسعار"), link: "#section-pricing_main" },
        desktopImage: "/themes/services/hero-desktop.webp",
        mobileImage: "/themes/services/hero-mobile.webp",
        overlayOpacity: 50, align: "start", minHeightPx: 520,
      },
      {
        id: "trust_main", type: "trust", visible: true,
        items: [
          { id: "t1", icon: "clock", title: t6("Réponse sous 24h", "رد خلال 24 ساعة"), subtitle: t6("Devis gratuit le jour même", "عرض سعر مجاني في نفس اليوم") },
          { id: "t2", icon: "shield", title: t6("Travailleurs assurés", "عمال مؤمّنون"), subtitle: t6("Garantie sur chaque intervention", "ضمان على كل تدخل") },
          { id: "t3", icon: "check", title: t6("Prix annoncé = prix payé", "السعر المعلن هو المدفوع"), subtitle: t6("Aucune surprise sur la facture", "لا مفاجآت في الفاتورة") },
        ],
      },
      {
        id: "services_main", type: "servicesCards", visible: true,
        title: t6("Nos services", "خدماتنا"),
        subtitle: t6("Une équipe, tous vos travaux", "فريق واحد لكل أشغالكم"),
        cards: [
          { id: "sv1", image: "/themes/services/svc-nettoyage.webp", title: t6("Nettoyage", "تنظيف"), text: t6("Ménage, vitres, fin de chantier.", "تنظيف عام، نوافذ، نهاية أشغال.") },
          { id: "sv2", image: "/themes/services/svc-reparation.webp", title: t6("Réparation", "إصلاح"), text: t6("Plomberie, électricité, dépannage urgent.", "سباكة، كهرباء، إصلاح عاجل.") },
          { id: "sv3", image: "/themes/services/svc-renovation.webp", title: t6("Rénovation", "ترميم"), text: t6("Peinture, carrelage, salles de bain.", "دهان، بلاط، حمامات.") },
          { id: "sv4", image: "/themes/services/svc-conseil.webp", title: t6("Conseil", "استشارة"), text: t6("Audit énergie et visite déco.", "تدقيق الطاقة وزيارة ديكور.") },
        ],
      },
      {
        id: "process_main", type: "process", visible: true,
        title: t6("Comment ça marche", "كيف نعمل"),
        subtitle: t6("Simple, clair, sans surprise", "بسيط، واضح، بلا مفاجآت"),
        steps: [
          { id: "p1", icon: "phone", title: t6("1. Vous appelez", "1. تتصل"), text: t6("Décrivez votre besoin, devis indicatif immédiat.", "صف حاجتك، عرض سعر مبدئي فوراً.") },
          { id: "p2", icon: "search", title: t6("2. Visite gratuite", "2. زيارة مجانية"), text: t6("Un technicien confirme le devis sur place.", "تقني يؤكد العرض في الموقع.") },
          { id: "p3", icon: "wrench", title: t6("3. Intervention", "3. التدخل"), text: t6("Travaux réalisés aux horaires convenus.", "تنفيذ الأشغال في الأوقات المتفق عليها.") },
          { id: "p4", icon: "thumbsup", title: t6("4. Garantie", "4. الضمان"), text: t6("Contrôle final et garantie écrite.", "مراقبة نهائية وضمان مكتوب.") },
        ],
      },
      {
        id: "pricing_main", type: "pricing", visible: true,
        title: t6("Nos forfaits", "باقاتنا"),
        subtitle: t6("Des prix clairs, adaptés à chaque besoin", "أسعار واضحة تناسب كل حاجة"),
        plans: [
          {
            id: "pl-basic", name: t6("Basic", "أساسية"), price: "2 500 DA", period: t6("/ intervention", "/ للتدخل"),
            features: [t6("1 technicien, 2 heures", "تقني واحد، ساعتان"), t6("Produits de base inclus", "منتجات أساسية مشمولة"), t6("Devis gratuit", "عرض سعر مجاني")],
            buttonText: t6("Réserver", "احجز"),
          },
          {
            id: "pl-pro", name: t6("Pro", "احترافية"), price: "6 500 DA", period: t6("/ intervention", "/ للتدخل"), highlighted: true,
            features: [t6("2 techniciens, 4 heures", "تقنيان، 4 ساعات"), t6("Produits pro inclus", "منتجات احترافية مشمولة"), t6("Petites pièces offertes", "قطع صغيرة مجاناً"), t6("Garantie 30 jours", "ضمان 30 يوماً")],
            buttonText: t6("Réserver", "احجز"),
          },
          {
            id: "pl-premium", name: t6("Premium", "بريميوم"), price: "Sur devis", period: null,
            features: [t6("Équipe dédiée", "فريق مخصص"), t6("Planning récurrent", "برنامج دوري"), t6("Chef de projet", "رئيس مشروع"), t6("Garantie 90 jours", "ضمان 90 يوماً")],
            buttonText: t6("Nous contacter", "اتصل بنا"),
          },
        ],
      },
      {
        id: "about_main", type: "textImage", visible: true,
        title: t6("Une entreprise de confiance", "شركة تستحق الثقة"),
        body: t6(
          "Depuis 2015, nos équipes interviennent chaque jour dans les foyers et les commerces de la ville.\nTechniciens formés, assurés et notés après chaque mission.\nNotre règle d'or : annoncer le vrai prix, tenir l'horaire, laisser le lieu propre.",
          "منذ 2015 تتدخل فرقنا يومياً في المنازل والمحلات التجارية.\nتقنيون مكونون ومؤمّنون ويُقيَّمون بعد كل مهمة.\nقاعدتنا الذهبية: إعلان السعر الحقيقي، احترام الوقت، وترك المكان نظيفاً."
        ),
        image: "/themes/services/about.webp", imagePosition: "start",
        button: { visible: false, text: t6("", ""), link: "" },
      },
      {
        id: "cases_main", type: "gallery", visible: true,
        title: t6("Ils nous ont fait confiance", "ثقوا بنا"),
        subtitle: t6("Quelques missions récentes", "بعض مهامنا الأخيرة"),
        items: [
          { id: "g1", image: "/themes/services/svc-nettoyage-2.webp", title: t6("Appartement 3 pièces", "شقة 3 غرف"), text: t6("Nettoyage complet en 4h", "تنظيف شامل في 4 ساعات"), tag: t6("Nettoyage", "تنظيف") },
          { id: "g2", image: "/themes/services/svc-reparation.webp", title: t6("Dépannage urgent", "إصلاح عاجل"), text: t6("Fuite réparée en 1h", "إصلاح تسريب في ساعة"), tag: t6("Réparation", "إصلاح") },
          { id: "g3", image: "/themes/services/svc-renovation.webp", title: t6("Cuisine rénovée", "مطبخ مرمّم"), text: t6("Peinture + faïence", "دهان + سيراميك"), tag: t6("Rénovation", "ترميم") },
          { id: "g4", image: "/themes/services/hero-mobile.webp", title: t6("Conseil énergie", "استشارة طاقة"), text: t6("Rapport remis en 48h", "تقرير في 48 ساعة"), tag: t6("Conseil", "استشارة") },
        ],
      },
      {
        id: "reviews_main", type: "reviews", visible: true,
        title: t6("Avis clients", "آراء الزبائن"),
        subtitle: t6("Notés après chaque mission", "تقييم بعد كل مهمة"),
        manualReviews: [
          { id: "r1", rating: 5, text: t6("Ponctuels, propres, prix respecté. Je recommande.", "منظمون، نظيفون، والسعر محترم. أنصح بهم."), author: "Sabrina", city: "Alger", manual: true },
          { id: "r2", rating: 5, text: t6("Intervention le jour même pour ma fuite, merci !", "تدخلوا في نفس اليوم لإصلاح التسريب، شكراً!"), author: "مراد", city: "البليدة", manual: true },
          { id: "r3", rating: 4, text: t6("Bon rapport qualité-prix pour le grand ménage.", "جودة جيدة مقابل السعر في التنظيف الشامل."), author: "Farid", city: "Boumerdès", manual: true },
        ],
        includeProductReviews: true, maxItems: 6,
      },
      {
        id: "faq_main", type: "faq", visible: true,
        title: t6("Questions fréquentes", "أسئلة شائعة"),
        subtitle: t6("Avant de réserver", "قبل الحجز"),
        items: [
          { id: "f1", question: t6("Le devis est-il vraiment gratuit ?", "هل عرض السعر مجاني فعلاً؟"), answer: t6("Oui, la visite et le devis sont gratuits et sans engagement.", "نعم، الزيارة وعرض السعر مجانيان وبدون التزام.") },
          { id: "f2", question: t6("Sous quel délai intervenez-vous ?", "خلال كم تتدخلون؟"), answer: t6("En ville : sous 24h, et sous 2h pour les urgences.", "في المدينة: خلال 24 ساعة، وخلال ساعتين للحالات العاجلة.") },
          { id: "f3", question: t6("Comment se passe le paiement ?", "كيف يتم الدفع؟"), answer: t6("À la fin de l'intervention, en espèces ou CCP. Facture fournie.", "في نهاية التدخل، نقداً أو عبر CCP. تُقدَّم فاتورة.") },
          { id: "f4", question: t6("Y a-t-il une garantie ?", "هل هناك ضمان؟"), answer: t6("Oui, écrite : 30 jours (Pro) à 90 jours (Premium).", "نعم، مكتوب: من 30 يوماً (احترافية) إلى 90 يوماً (بريميوم).") },
        ],
      },
      {
        id: "cta_main", type: "ctaBanner", visible: true,
        title: t6("Un problème à régler aujourd'hui ?", "عندك مشكل تحلّه اليوم؟"),
        text: t6("Appelez-nous ou réservez en ligne : un technicien vous répond sous 24h.", "اتصل بنا أو احجز عبر الإنترنت: تقني يجيبك خلال 24 ساعة."),
        image: "/themes/services/banner.webp",
        buttonText: t6("Prendre rendez-vous", "احجز موعدك"), buttonLink: "#contact",
        whatsappText: t6("WhatsApp direct", "واتساب مباشر"),
      },
      {
        id: "contact_main", type: "contactForm", visible: true, kind: "appointment",
        title: t6("Prendre rendez-vous", "حجز موعد"),
        subtitle: t6("Choisissez le service et l'heure qui vous conviennent", "اختر الخدمة والوقت المناسبين لك"),
        formTitle: t6("Formulaire de rendez-vous", "استمارة حجز موعد"),
        nameLabel: t6("Nom et prénom *", "الاسم واللقب *"),
        phoneLabel: t6("Téléphone *", "الهاتف *"),
        emailLabel: t6("Email (optionnel)", "البريد الإلكتروني (اختياري)"),
        needLabel: t6("Service souhaité", "الخدمة المطلوبة"),
        dateLabel: t6("Date et heure souhaitées", "التاريخ والوقت المفضلان"),
        messageLabel: t6("Détails de votre demande", "تفاصيل طلبك"),
        submitText: t6("Confirmer le rendez-vous", "أكّد الموعد"),
        successText: t6("Rendez-vous demandé ! Nous confirmons par téléphone.", "تم طلب الموعد! سنؤكد عبر الهاتف."),
        services: [t6("Nettoyage", "تنظيف"), t6("Réparation", "إصلاح"), t6("Rénovation", "ترميم"), t6("Conseil", "استشارة")],
        info: {
          address: t6("Boulevard des Services, Alger", "شارع الخدمات، الجزائر العاصمة"),
          hours: t6("Samedi — Jeudi : 7h30 - 19h00", "السبت — الخميس: 7:30 - 19:00"),
          phone: "0555 010 205", email: "contact@services-pro.dz",
        },
        showWhatsApp: true,
      },
    ],
  },
];

export const CHECKOUT_DESIGNS: CheckoutDesign[] = [
  {
    id: "classique",
    name: "Classique",
    description: "Design par défaut du fast-checkout — champs clairs et couleurs personnalisables",
    type: "classique",
    iconName: "ShoppingBag",
    features: [
      "Formulaire épuré avec fond personnalisable",
      "Sélecteur Wilaya & Commune 58 wilayas",
      "Calcul dynamique des frais de livraison",
      "Bouton d'achat à fort contraste"
    ]
  },
  {
    id: "commerce",
    name: "Commerce",
    description: "Style e-commerce inspiré de Shopify — champs spacieux, cartes de livraison, bouton vert",
    planBadge: "PRO",
    type: "commerce",
    iconName: "ShoppingBag",
    features: [
      "Disposition moderne inspirée de Shopify",
      "Cartes de livraison Domicile / Stop-Desk interactives",
      "Bouton d'achat vert haute conversion",
      "Badge d'avis clients et sécurité garantie"
    ]
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Esthétique magazine — serif éditorial, lignes fines, fond crème",
    planBadge: "UNLIMITED",
    isLocked: true,
    type: "editorial",
    iconName: "Feather",
    features: [
      "Typographie avec empattements (Serif) haut de gamme",
      "Lignes ultra-fines et fond crème raffiné",
      "Champs de saisie sobres et minimalistes",
      "Idéal pour cosmétiques, bijoux et luxe"
    ]
  },
  {
    id: "stepper",
    name: "Stepper",
    description: "Formulaire guidé en 3 étapes avec barre de progression et coches d'achèvement",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "stepper",
    iconName: "ListOrdered",
    features: [
      "3 étapes claires : Coordonnées ➔ Livraison ➔ Récapitulatif",
      "Barre de progression dynamique",
      "Réduit la friction perçue sur les paniers élevés",
      "Coches de validation en temps réel"
    ]
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense au-dessus de la ligne de flottaison — IBM Plex, coins nets, utilitaire",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "compact",
    iconName: "LayoutGrid",
    features: [
      "Formulaire ultra-compact sans scroll nécessaire",
      "Police technique IBM Plex & angles vifs",
      "Grille 2 colonnes ultra-rapide sur mobile",
      "Compteur de quantité et total instantané"
    ]
  }
];

export const VARIANT_DESIGNS: VariantDesign[] = [
  {
    id: "default",
    name: "Par défaut",
    description: "Look par défaut de la plateforme — aucun style ajouté",
    type: "default",
    iconName: "Square",
    features: [
      "Boutons de sélection standards",
      "Léger et ultra-rapide",
      "Compatible avec tous les types de produits"
    ]
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Boutons sobres, bordures fines, anneau de sélection discret.",
    type: "minimal",
    iconName: "Circle",
    features: [
      "Bordures 1px épurées",
      "Anneau de focus subtil",
      "Aspect épuré et moderne"
    ]
  },
  {
    id: "brutal",
    name: "Brutal",
    description: "Bordures épaisses, ombres dures décalées — style néo-brutaliste.",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "brutal",
    iconName: "SquareDashedBottomCode",
    features: [
      "Bordures noires 2.5px épaisses",
      "Ombres décalées dures style néo-brutalisme",
      "Contraste maximal pour streetwear & mode jeune"
    ]
  },
  {
    id: "softplay",
    name: "Softplay",
    description: "Pastels doux, formes rebondies, micro-bond à la sélection.",
    type: "softplay",
    iconName: "Heart",
    features: [
      "Nuances pastel douces et chaleureuses",
      "Angles très arrondis et toucher doux",
      "Micro-animation élastique à la sélection"
    ]
  },
  {
    id: "luxe",
    name: "Luxe",
    description: "Papier crème, filet doré, sélection en sérif. Élégance discrète.",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "luxe",
    iconName: "Gem",
    features: [
      "Filet doré et papier crème texturé",
      "Typographie Sérif de haute couture",
      "Indicateur de sélection subtil et précieux"
    ]
  },
  {
    id: "glass",
    name: "Glass",
    description: "Verre dépoli, transparence légère, reflet de sélection.",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "glass",
    iconName: "Waves",
    features: [
      "Effet de verre dépoli glassmorphism",
      "Reflet lumineux dynamique",
      "Bordures semi-transparentes translucides"
    ]
  },
  {
    id: "material",
    name: "Material",
    description: "Material 3 — state layers, élévation douce, FAB de sélection.",
    planBadge: "UNLIMITED",
    isLocked: true,
    type: "material",
    iconName: "Layers",
    features: [
      "Conforme aux principes Google Material Design 3",
      "State layers et micro-élévation à l'appui",
      "Transitions fluides et retour tactile"
    ]
  },
  {
    id: "pixel",
    name: "Pixel",
    description: "Vibes années 90 — pixels, monospace, ombre dure.",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "pixel",
    iconName: "Cpu",
    features: [
      "Esthétique rétrogaming 90s pixel-art",
      "Typographie Monospace authentique",
      "Ombres dures carrées sans flou"
    ]
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Esprit magazine de mode. Numérotation sérif, lignes fines.",
    planBadge: "UNLIMITED",
    isLocked: true,
    type: "editorial",
    iconName: "Feather",
    features: [
      "Mise en page éditoriale de magazine",
      "Numérotation sérif discrète (01, 02...)",
      "Lignes ultra-fines géométriques"
    ]
  },
  {
    id: "mashrabiya",
    name: "Mashrabiya",
    description: "Motifs géométriques arabes, filet doré. Touche orientale.",
    planBadge: "ENTERPRISE",
    isLocked: true,
    type: "mashrabiya",
    iconName: "Sparkles",
    features: [
      "Motifs géométriques moucharabieh orientaux",
      "Filets dorés et calligraphie harmonieuse",
      "Idéal pour caftans, abayas et parfums orientaux"
    ]
  },
  {
    id: "clay",
    name: "Clay",
    description: "Formes argileuses 3D, ombres douces, micro-press au click.",
    type: "clay",
    iconName: "CircleDot",
    features: [
      "Claymorphism 3D gonflé et chaleureux",
      "Ombres intérieures et extérieures douces",
      "Effet de compression 'argile' lors du clic"
    ]
  },
  {
    id: "stacked",
    name: "Stacked",
    description: "Chaque option sur sa propre ligne — parfait pour offres et bundles.",
    type: "stacked",
    iconName: "List",
    features: [
      "Disposition en barres horizontales empilées",
      "Grand espace pour détails et prix",
      "Idéal pour packs quantité (1, 2 ou 3 pièces)"
    ]
  },
  {
    id: "offer",
    name: "Offer",
    description: "Lignes d'offres avec radio et surlignage rose au choix. Parfait pour bundles.",
    planBadge: "UNLIMITED",
    isLocked: true,
    type: "offer",
    iconName: "Tag",
    features: [
      "Cartes radio promotionnelles avec badge 'Meilleure Offre'",
      "Surlignage coloré et calcul de l'économie en DA",
      "Déclenche l'achat impulsif des packs supérieurs"
    ]
  }
];
