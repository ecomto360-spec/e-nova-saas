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
    options: string[];
  }[];
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
    demoUrl: "https://demo-starter.dzbuild.app",
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
    demoUrl: "https://demo-digital.dzbuild.app",
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
    demoUrl: "https://demo-brico.dzbuild.app",
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
    demoUrl: "https://demo-fashion.dzbuild.app",
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
    demoUrl: "https://demo-glow.dzbuild.app",
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
    demoUrl: "https://demo-electro.dzbuild.app",
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
    demoUrl: "https://demo-turbo.dzbuild.app",
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
  }
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
