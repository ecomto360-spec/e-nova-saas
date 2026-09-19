import { AlgerianWilaya, LandingProduct, LandingSection } from "../types/landing";

export const ALGERIAN_WILAYAS: AlgerianWilaya[] = [
  { code: 1, name: "01 - Adrar", arName: "أدرار", homeDeliveryPrice: 900, deskDeliveryPrice: 600 },
  { code: 2, name: "02 - Chlef", arName: "الشلف", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 3, name: "03 - Laghouat", arName: "الأغواط", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
  { code: 4, name: "04 - Oum El Bouaghi", arName: "أم البواقي", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 5, name: "05 - Batna", arName: "باتنة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 6, name: "06 - Béjaïa", arName: "بجاية", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 7, name: "07 - Biskra", arName: "بسكرة", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
  { code: 8, name: "08 - Béchar", arName: "بشار", homeDeliveryPrice: 900, deskDeliveryPrice: 600 },
  { code: 9, name: "09 - Blida", arName: "البليدة", homeDeliveryPrice: 500, deskDeliveryPrice: 350 },
  { code: 10, name: "10 - Bouira", arName: "البويرة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 11, name: "11 - Tamanrasset", arName: "تمنراست", homeDeliveryPrice: 1200, deskDeliveryPrice: 800 },
  { code: 12, name: "12 - Tébessa", arName: "تبسة", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 13, name: "13 - Tlemcen", arName: "تلمسان", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 14, name: "14 - Tiaret", arName: "تيارت", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 15, name: "15 - Tizi Ouzou", arName: "تيزي وزو", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 16, name: "16 - Alger", arName: "الجزائر العاصمة", homeDeliveryPrice: 400, deskDeliveryPrice: 300 },
  { code: 17, name: "17 - Djelfa", arName: "الجلفة", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
  { code: 18, name: "18 - Jijel", arName: "جيجل", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 19, name: "19 - Sétif", arName: "سطيف", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 20, name: "20 - Saïda", arName: "سعيدة", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 21, name: "21 - Skikda", arName: "سكيكدة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 22, name: "22 - Sidi Bel Abbès", arName: "سيدي بلعباس", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 23, name: "23 - Annaba", arName: "عنابة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 24, name: "24 - Guelma", arName: "قالمة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 25, name: "25 - Constantine", arName: "قسنطينة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 26, name: "26 - Médéa", arName: "المدية", homeDeliveryPrice: 550, deskDeliveryPrice: 350 },
  { code: 27, name: "27 - Mostaganem", arName: "مستغانم", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 28, name: "28 - M'Sila", arName: "المسيلة", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 29, name: "29 - Mascara", arName: "معسكر", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 30, name: "30 - Ouargla", arName: "ورقلة", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: 31, name: "31 - Oran", arName: "وهران", homeDeliveryPrice: 500, deskDeliveryPrice: 350 },
  { code: 32, name: "32 - El Bayadh", arName: "البيض", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: 33, name: "33 - Illizi", arName: "إليزي", homeDeliveryPrice: 1200, deskDeliveryPrice: 800 },
  { code: 34, name: "34 - Bordj Bou Arreridj", arName: "برج بوعريريج", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 35, name: "35 - Boumerdès", arName: "بومرداس", homeDeliveryPrice: 450, deskDeliveryPrice: 300 },
  { code: 36, name: "36 - El Tarf", arName: "الطارف", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 37, name: "37 - Tindouf", arName: "تندوف", homeDeliveryPrice: 1200, deskDeliveryPrice: 800 },
  { code: 38, name: "38 - Tissemsilt", arName: "تيسمسيلت", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 39, name: "39 - El Oued", arName: "الوادي", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: 40, name: "40 - Khenchela", arName: "خنشلة", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 41, name: "41 - Souk Ahras", arName: "سوق أهراس", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
  { code: 42, name: "42 - Tipaza", arName: "تيبازة", homeDeliveryPrice: 450, deskDeliveryPrice: 300 },
  { code: 43, name: "43 - Mila", arName: "ميلة", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 44, name: "44 - Aïn Defla", arName: "عين الدفلى", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 45, name: "45 - Naâma", arName: "النعامة", homeDeliveryPrice: 800, deskDeliveryPrice: 550 },
  { code: 46, name: "46 - Aïn Témouchent", arName: "عين تموشنت", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 47, name: "47 - Ghardaïa", arName: "غرداية", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: 48, name: "48 - Relizane", arName: "غليزان", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
  { code: 49, name: "49 - Timimoun", arName: "تيميمون", homeDeliveryPrice: 950, deskDeliveryPrice: 650 },
  { code: 50, name: "50 - Bordj Badji Mokhtar", arName: "برج باجي مختار", homeDeliveryPrice: 1300, deskDeliveryPrice: 900 },
  { code: 51, name: "51 - Ouled Djellal", arName: "أولاد جلال", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
  { code: 52, name: "52 - Béni Abbès", arName: "بني عباس", homeDeliveryPrice: 950, deskDeliveryPrice: 650 },
  { code: 53, name: "53 - In Salah", arName: "عين صالح", homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: 54, name: "54 - In Guezzam", arName: "عين قزام", homeDeliveryPrice: 1300, deskDeliveryPrice: 900 },
  { code: 55, name: "55 - Touggourt", arName: "تقرت", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: 56, name: "56 - Djanet", arName: "جانت", homeDeliveryPrice: 1300, deskDeliveryPrice: 900 },
  { code: 57, name: "57 - El M'Ghair", arName: "المغير", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: 58, name: "58 - El Meniaa", arName: "المنيعة", homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
];

export const SAMPLE_PRODUCTS: LandingProduct[] = [
  {
    id: "prod-sample-tshirt",
    name: "T-shirt — exemple",
    price: 1500,
    originalPrice: 2200,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    description: "T-shirt en coton premium 100% respirant, coupe moderne et finitions haut de gamme.",
    category: "Vêtements",
    stock: 25,
    variants: [
      { name: "Taille", options: ["M", "L", "XL", "XXL"] },
      { name: "Couleur", options: ["Noir", "Blanc", "Beige", "Bleu Marine"] }
    ]
  },
  {
    id: "prod-sample-watch",
    name: "Montre de Luxe Chronographe",
    price: 3800,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    description: "Montre étanche avec boîtier en acier inoxydable et cadran saphir anti-rayures.",
    category: "Accessoires",
    stock: 14,
    variants: [
      { name: "Couleur Cadran", options: ["Noir Ébène", "Argent Brossé", "Bleu Nuit"] }
    ]
  },
  {
    id: "prod-sample-shoes",
    name: "Baskets Sport Confort Air",
    price: 4200,
    originalPrice: 6000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    description: "Semelle amortissante à mémoire de forme pour un confort absolu toute la journée.",
    category: "Chaussures",
    stock: 18,
    variants: [
      { name: "Pointure", options: ["40", "41", "42", "43", "44", "45"] }
    ]
  },
  {
    id: "prod-sample-cosmetic",
    name: "Sérum Anti-Âge & Éclat Naturel",
    price: 2900,
    originalPrice: 4200,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
    description: "Formule enrichie en Acide Hyaluronique et Vitamine C pour un teint éclatant et rajeuni.",
    category: "Beauté & Soins",
    stock: 40,
    variants: [
      { name: "Format", options: ["Flacon 30ml", "Pack Duo 2x30ml (-20%)"] }
    ]
  }
];

export const getDefaultSectionsForProduct = (product: LandingProduct): LandingSection[] => {
  return [
    {
      id: "sec-hero",
      type: "hero",
      enabled: true,
      title: "En-tête & Bannière Principale",
      data: {
        topBanner: "⚡ OFFRE LIMITÉE • PAIEMENT À RÉCEPTION (58 WILAYAS)",
        badge: "🔥 Offre Spéciale Limitée - Stock Restant Réduit",
        headline: product.name,
        subheadline: product.description || "Commandez aujourd'hui et profitez de notre réduction exclusive et de la livraison express partout en Algérie !",
        price: product.price,
        originalPrice: product.originalPrice || Math.round(product.price * 1.4),
        rating: 4.9,
        ratingText: "(4.9/5 • 148 avis)",
        reviewsCount: 148,
        savingsBadge: "🔥 Économisez aujourd'hui",
        image: product.image,
        ctaText: "COMMANDER MAINTENANT",
        guaranteeText: "✅ Garantie 100% Satisfait ou Échangé • 🚚 Livraison 58 Wilayas"
      }
    },
    {
      id: "sec-countdown",
      type: "countdown",
      enabled: true,
      title: "Compte à Rebours d'Urgence",
      data: {
        title: "LA PROMOTION SE TERMINE DANS :",
        hours: 2,
        minutes: 47,
        seconds: 35,
        remainingStock: 7
      }
    },
    {
      id: "sec-features",
      type: "features",
      enabled: true,
      title: "Détails & Arguments du Produit",
      data: {
        heading: "Détails du produit",
        description: product.description || "Achetez authentique avec paiement à la livraison partout en Algérie. Service client 7j/7 et garantie satisfait ou remboursé.",
        badges: [
          { id: "b1", text: "PAIEMENT À RÉCEPTION", icon: "Banknote" },
          { id: "b2", text: "LIVRAISON 58 WILAYAS", icon: "Truck" },
          { id: "b3", text: "ÉCHANGE FACILE (7J)", icon: "RotateCcw" },
          { id: "b4", text: "GARANTIE QUALITÉ", icon: "ShieldCheck" }
        ],
        bullets: [
          "Qualité supérieure et durable",
          "Utilisation simple et pratique",
          "Design moderne et ergonomique",
          "Approuvé par des milliers de clients"
        ],
        ctaText: "JE VEUX MON PACK"
      }
    },
    {
      id: "sec-gallery",
      type: "gallery",
      enabled: true,
      title: "Galerie Photos & Détails",
      data: {
        heading: "Aperçu sous tous les angles",
        images: [
          product.image,
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=80"
        ]
      }
    },
    {
      id: "sec-bundles",
      type: "bundles",
      enabled: true,
      title: "Offres en Lot (Packs Économiques)",
      data: {
        heading: "Choisissez votre pack promotionnel",
        subheading: "Plus vous commandez, plus vous économisez !",
        bundles: [
          {
            id: "b1",
            name: "Pack 1 Pièce",
            quantity: 1,
            price: product.price,
            badge: "Standard",
            shippingNote: "Livraison standard"
          },
          {
            id: "b2",
            name: "Pack 2 Pièces",
            quantity: 2,
            price: Math.round(product.price * 1.8),
            badge: "LE PLUS VENDU",
            discountNote: "-15% de réduction",
            isPopular: true,
            shippingNote: "Frais de port réduits"
          },
          {
            id: "b3",
            name: "Pack Famille (3)",
            quantity: 3,
            price: Math.round(product.price * 2.5),
            badge: "LIVRAISON OFFERTE",
            discountNote: "Livraison 0 DZD",
            shippingNote: "🎉 Livraison GRATUITE !"
          }
        ]
      }
    },
    {
      id: "sec-reviews",
      type: "reviews",
      enabled: true,
      title: "Avis & Témoignages Clients",
      data: {
        heading: "Ce que nos clients disent",
        reviews: [
          {
            id: "r1",
            name: "Amine K.",
            wilaya: "Alger",
            rating: 5,
            comment: "Livraison super rapide en 24h, le produit est conforme à la description. Je recommande vivement !",
            verified: true
          },
          {
            id: "r2",
            name: "Samira B.",
            wilaya: "Oran",
            rating: 5,
            comment: "Très satisfaite de mon achat. Le service client est au top et le fait de payer à la livraison m'a vraiment rassurée.",
            verified: true
          },
          {
            id: "r3",
            name: "Yacine M.",
            wilaya: "Sétif",
            rating: 5,
            comment: "Qualité excellente pour le prix. C'est exactement ce que je cherchais. Merci !",
            verified: true
          }
        ]
      }
    },
    {
      id: "sec-faq",
      type: "faq",
      enabled: true,
      title: "Questions Fréquentes (FAQ)",
      data: {
        heading: "Questions fréquentes",
        faqs: [
          {
            id: "f1",
            q: "Comment se passe la livraison ?",
            a: "Nous livrons dans les 58 wilayas. Le délai est généralement de 24h à 72h selon votre région (jusqu'à 5 jours pour le Grand Sud)."
          },
          {
            id: "f2",
            q: "Puis-je payer à la réception ?",
            a: "Absolument ! Vous ne payez que lorsque le livreur vous remet le colis en main propre, après vérification."
          },
          {
            id: "f3",
            q: "Et si le produit a un défaut ?",
            a: "Vous bénéficiez d'une garantie d'échange de 7 jours. Contactez-nous et nous remplacerons le produit gratuitement."
          }
        ]
      }
    },
    {
      id: "sec-order_form",
      type: "order_form",
      enabled: true,
      title: "Formulaire de Commande",
      data: {
        heading: "Finaliser la commande",
        subheading: "Remplissez ce formulaire et payez à la réception",
        btnText: "COMMANDER MAINTENANT",
        guaranteeText: "PAIEMENT 100% SÉCURISÉ À LA LIVRAISON",
        successTitle: "Félicitations !",
        successMsg: "Votre commande a été enregistrée avec succès."
      }
    }
  ];
};
