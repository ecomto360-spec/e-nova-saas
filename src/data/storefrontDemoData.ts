/**
 * T1 — Données de démo de la vitrine (bouton « Charger les données de démo »).
 * ---------------------------------------------------------------------------
 * 100 % originales : illustrations SVG inline (data URI) générées par code —
 * dégradés, formes et pictogrammes. AUCUN lien externe, aucune image
 * tierce, aucune marque. Supprimables en un clic (structure Firestore
 * dédiée sous tenants/{uid}/settings/demoData + produits marqués isDemo).
 */

import type { BilingualText } from "../types/storefront";
import type { StoreReview } from "../types/storefrontSections";

const bi = (fr: string, ar: string): BilingualText => ({ fr, ar });

/* -------------------------------------------------------------------------- */
/* Générateur d'illustrations SVG originales (data URI, cache navigateur)      */
/* -------------------------------------------------------------------------- */

/** Dégradé + motif géométrique doux — illustration de catégorie. */
export function demoCategorySvg(hue: number, glyph: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 70% 62%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 38%)"/>
    </linearGradient>
    <radialGradient id="s" cx="0.8" cy="0.15" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <rect width="640" height="480" fill="url(#s)"/>
  <circle cx="560" cy="80" r="150" fill="#ffffff" opacity="0.08"/>
  <circle cx="80" cy="420" r="190" fill="#000000" opacity="0.10"/>
  <path d="M0 400 L180 300 L340 380 L520 290 L640 350 L640 480 L0 480 Z" fill="#000000" opacity="0.14"/>
  <text x="320" y="235" font-size="120" text-anchor="middle" dominant-baseline="middle">${glyph}</text>
  <text x="320" y="425" font-family="sans-serif" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle" opacity="0.95">${label}</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** Illustration produit : fond dégradé, silhouette de package, badge prix. */
export function demoProductSvg(hue: number, glyph: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 45% 96%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 30) % 360} 40% 86%)"/>
    </linearGradient>
    <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 60% 55%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 25) % 360} 55% 40%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="640" cy="150" r="230" fill="hsl(${hue} 70% 60%)" opacity="0.12"/>
  <rect x="250" y="230" width="300" height="340" rx="28" fill="url(#p)"/>
  <rect x="250" y="230" width="300" height="90" rx="28" fill="#ffffff" opacity="0.22"/>
  <text x="400" y="420" font-size="130" text-anchor="middle" dominant-baseline="middle">${glyph}</text>
  <rect x="120" y="620" width="560" height="10" rx="5" fill="hsl(${hue} 40% 70%)" opacity="0.5"/>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** Hero de démo : large bannière dégradée avec vagues. */
export function demoHeroSvg(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="640" viewBox="0 0 1920 640">
  <defs>
    <linearGradient id="h" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 65% 30%)"/>
      <stop offset="0.6" stop-color="hsl(${(hue + 35) % 360} 60% 45%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 70) % 360} 55% 60%)"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="640" fill="url(#h)"/>
  <circle cx="1600" cy="120" r="260" fill="#ffffff" opacity="0.07"/>
  <circle cx="220" cy="520" r="300" fill="#000000" opacity="0.12"/>
  <path d="M0 480 Q 480 380 960 460 T 1920 420 L1920 640 L0 640 Z" fill="#000000" opacity="0.18"/>
  <path d="M0 540 Q 560 460 1120 530 T 1920 500 L1920 640 L0 640 Z" fill="#ffffff" opacity="0.10"/>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* -------------------------------------------------------------------------- */
/* Catégories de démo                                                         */
/* -------------------------------------------------------------------------- */

export interface DemoCategory {
  name: BilingualText;
  image: string;
}

export const demoCategories: DemoCategory[] = [
  { name: bi("Mode femme", "ملابس نسائية"), image: demoCategorySvg(320, "👗", "Mode femme") },
  { name: bi("Mode homme", "ملابس رجالية"), image: demoCategorySvg(215, "👔", "Mode homme") },
  { name: bi("Chaussures", "أحذية"), image: demoCategorySvg(25, "👟", "Chaussures") },
  { name: bi("Accessoires", "إكسسوارات"), image: demoCategorySvg(265, "👜", "Accessoires") },
  { name: bi("Enfants", "ملابس أطفال"), image: demoCategorySvg(150, "🧒", "Enfants") },
];

/* -------------------------------------------------------------------------- */
/* Produits de démo (variantes couleur/taille, remises)                       */
/* -------------------------------------------------------------------------- */

export interface DemoVariant {
  name: BilingualText;
  options: BilingualText[];
}

export interface DemoProduct {
  name: BilingualText;
  description: BilingualText;
  categoryIndex: number;
  price: number;
  oldPrice: number | null;
  images: string[];
  featured: boolean;
  variants: DemoVariant[];
  stock: number;
}

const colorSwatch = (hue: number) => demoProductSvg(hue, "🎨");

export const demoProducts: DemoProduct[] = [
  {
    name: bi("Robe d'été fleurie", "فستان صيفي منقّط"),
    description: bi(
      "Robe légère en coton respirant, coupe fluide, parfaite pour les journées chaudes. Disponible en plusieurs coloris.",
      "فستان خفيف من القطن الطبيعي بقصة مريحة، مثالي للأيام الحارة. متوفر بعدة ألوان."
    ),
    categoryIndex: 0,
    price: 4200,
    oldPrice: 5500,
    images: [demoProductSvg(330, "👗"), colorSwatch(300), colorSwatch(360)],
    featured: true,
    variants: [
      { name: bi("Couleur", "اللون"), options: [bi("Rouge", "أحمر"), bi("Bleu", "أزرق"), bi("Noir", "أسود")] },
      { name: bi("Taille", "المقاس"), options: [bi("S", "S"), bi("M", "M"), bi("L", "L"), bi("XL", "XL")] },
    ],
    stock: 12,
  },
  {
    name: bi("Chemise classique en coton", "قميص قطني كلاسيكي"),
    description: bi(
      "Chemise élégante 100% coton, col renforcé, coupe droite. Idéale pour le bureau comme pour les sorties.",
      "قميص أنيق من القطن 100% بياقة مقواة وقصة مستقيمة. مناسب للعمل والمناسبات."
    ),
    categoryIndex: 1,
    price: 3500,
    oldPrice: 4500,
    images: [demoProductSvg(210, "👔"), colorSwatch(200)],
    featured: true,
    variants: [
      { name: bi("Couleur", "اللون"), options: [bi("Blanc", "أبيض"), bi("Bleu ciel", "أزرق فاتح")] },
      { name: bi("Taille", "المقاس"), options: [bi("M", "M"), bi("L", "L"), bi("XL", "XL"), bi("XXL", "XXL")] },
    ],
    stock: 20,
  },
  {
    name: bi("Veste en jean délavé", "جاكيت جينز"),
    description: bi(
      "Veste en jean robuste, délavage tendance, deux poches poitrine. Se porte toute l'année.",
      "جاكيت جينز متين بلون عصري وجيبين أماميين. يُلبس في كل الفصول."
    ),
    categoryIndex: 1,
    price: 6500,
    oldPrice: 8200,
    images: [demoProductSvg(200, "🧥")],
    featured: false,
    variants: [{ name: bi("Taille", "المقاس"), options: [bi("M", "M"), bi("L", "L")] }],
    stock: 8,
  },
  {
    name: bi("Sneakers urbaines", "حذاء رياضي للحضر"),
    description: bi(
      "Sneakers légères à semelle amortissante, mesh respirant, fermeture lacets. Confort toute la journée.",
      "حذاء رياضي خفيف بنعل ماص للصدمات وقماش متنفس. راحة طول اليوم."
    ),
    categoryIndex: 2,
    price: 5500,
    oldPrice: 7000,
    images: [demoProductSvg(20, "👟"), colorSwatch(35)],
    featured: true,
    variants: [
      { name: bi("Couleur", "اللون"), options: [bi("Blanc", "أبيض"), bi("Gris", "رمادي")] },
      { name: bi("Taille", "المقاس"), options: [bi("40", "40"), bi("41", "41"), bi("42", "42"), bi("43", "43"), bi("44", "44")] },
    ],
    stock: 15,
  },
  {
    name: bi("Bottines cuir city", "بوت جلدي أنيق"),
    description: bi(
      "Bottines en cuir synthétique de qualité, semelle antidérapante, style chic et intemporel.",
      "بوت بجلد صناعي عالي الجودة ونعل مضاد للانزلاق، بطراز أنيق وخالد."
    ),
    categoryIndex: 2,
    price: 7800,
    oldPrice: 9500,
    images: [demoProductSvg(35, "🥾")],
    featured: false,
    variants: [{ name: bi("Taille", "المقاس"), options: [bi("41", "41"), bi("42", "42"), bi("43", "43")] }],
    stock: 0,
  },
  {
    name: bi("Sac à main élégant", "حقيبة يد أنيقة"),
    description: bi(
      "Sac à main spacieux à bandoulière amovible, finitions soignées, intérieur zippé.",
      "حقيبة يد واسعة بحزام كتف قابل للفصل، بلمسات أنيقة وجيب داخلي بسحّاب."
    ),
    categoryIndex: 3,
    price: 4800,
    oldPrice: 6200,
    images: [demoProductSvg(270, "👜")],
    featured: true,
    variants: [{ name: bi("Couleur", "اللون"), options: [bi("Camel", "جملي"), bi("Noir", "أسود")] }],
    stock: 10,
  },
  {
    name: bi("Lunettes de soleil polarisées", "نظارات شمسية بولارايزد"),
    description: bi(
      "Verres polarisés anti-reflets, protection UV400, monture légère et résistante. Étui inclus.",
      "عدسات مستقطبة مضادة للانعكاس بحماية UV400 وإطار خفيف ومتين. مع علبة حفظ."
    ),
    categoryIndex: 3,
    price: 3200,
    oldPrice: 4500,
    images: [demoProductSvg(250, "🕶️")],
    featured: false,
    variants: [],
    stock: 25,
  },
  {
    name: bi("Ensemble enfant été", "طقم أطفال صيفي"),
    description: bi(
      "Ensemble 2 pièces enfant en coton doux, couleurs joyeuses, lavable en machine.",
      "طقم من قطعتين للأطفال من قطن ناعب بألوان مبهجة، قابل للغسل بالغسالة."
    ),
    categoryIndex: 4,
    price: 2500,
    oldPrice: 3200,
    images: [demoProductSvg(150, "🧒")],
    featured: false,
    variants: [
      { name: bi("Taille", "المقاس"), options: [bi("4 ans", "4 سنوات"), bi("6 ans", "6 سنوات"), bi("8 ans", "8 سنوات")] },
    ],
    stock: 18,
  },
  {
    name: bi("Sac à dos scolaire", "محفظة مدرسية"),
    description: bi(
      "Sac à dos renforcé, compartiment ordinateur, bretelles rembourrées. Résiste à toute l'année scolaire.",
      "محفظة مدرسية متينة بجيب للكمبيوتر وأحزمة مبطنة. تصمد طوال السنة الدراسية."
    ),
    categoryIndex: 4,
    price: 2900,
    oldPrice: null,
    images: [demoProductSvg(120, "🎒")],
    featured: false,
    variants: [{ name: bi("Couleur", "اللون"), options: [bi("Bleu", "أزرق"), bi("Rose", "وردي")] }],
    stock: 30,
  },
  {
    name: bi("Foulard soie et coton", "وشاح حريري"),
    description: bi(
      "Foulard mélange soie et coton, imprimé original, toucher doux. Accessoire cadeau parfait.",
      "وشاح من مزيج الحرير والقطن بطبعة أصلية وملمس ناعم. هدية مثالية."
    ),
    categoryIndex: 0,
    price: 1800,
    oldPrice: 2400,
    images: [demoProductSvg(345, "🧣")],
    featured: false,
    variants: [],
    stock: 22,
  },
];

/* -------------------------------------------------------------------------- */
/* Avis + FAQ de démo                                                         */
/* -------------------------------------------------------------------------- */

export const demoReviews: StoreReview[] = [
  {
    id: "dr1",
    rating: 5,
    text: bi(
      "La commande est arrivée en deux jours et la qualité est encore meilleure que sur les photos. Je recommande vivement.",
      "وصلني الطلب في يومين والجودة أفضل من الصور. أنصح به بشدة."
    ),
    author: "Amina",
    city: "Oran",
    manual: true,
  },
  {
    id: "dr2",
    rating: 5,
    text: bi(
      "Taille parfaitement ajustée et livraison très rapide. Merci pour le sérieux !",
      "المقاس مضبوط والتوصيل كان سريعاً. شكراً على الاحترافية!"
    ),
    author: "Sofiane",
    city: "Alger",
    manual: true,
  },
  {
    id: "dr3",
    rating: 4,
    text: bi(
      "Excellent service client, toutes mes questions ont trouvé réponse avant la commande. Reçu conforme.",
      "خدمة زبائن ممتازة، أجابوني على كل أسئلتي قبل الطلب. المنتج مطابق."
    ),
    author: "Nesrine",
    city: "Constantine",
    manual: true,
  },
  {
    id: "dr4",
    rating: 5,
    text: bi(
      "Paiement à la livraison comme promis, emballage soigné. Je vais recommandander.",
      "الدفع عند الاستلام كما وُعدت، والتغليف مرتب. سأعيد الطلب."
    ),
    author: "Yacine",
    city: "Sétif",
    manual: true,
  },
];

/** Charge la démo complète (catégories + produits + avis) — utilisée par T1. */
export function demoHeroImage(): string {
  return demoHeroSvg(262);
}
