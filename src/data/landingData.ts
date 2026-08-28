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
        badge: "🔥 Offre Spéciale Limitée - Stock Restant Réduit",
        headline: `Découvrez ${product.name}`,
        subheadline: product.description || "Commandez aujourd'hui et profitez de notre réduction exclusive et de la livraison express partout en Algérie !",
        price: product.price,
        originalPrice: product.originalPrice || Math.round(product.price * 1.4),
        rating: 4.9,
        reviewsCount: 148,
        image: product.image,
        ctaText: "COMMANDER MAINTENANT - PAIEMENT À LA LIVRAISON",
        guaranteeText: "✅ Garantie 100% Satisfait ou Échangé • 🚚 Livraison 58 Wilayas"
      }
    },
    {
      id: "sec-countdown",
      type: "countdown",
      enabled: true,
      title: "Compte à Rebours d'Urgence",
      data: {
        title: "⚡ Dépêchez-vous ! L'offre promotionnelle expire dans :",
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
      title: "Avantages Clés & Points Forts",
      data: {
        heading: "Pourquoi choisir ce produit ?",
        items: [
          {
            icon: "ShieldCheck",
            title: "Qualité Supérieure Certifiée",
            desc: "Fabriqué avec des matériaux haut de gamme testés pour durer dans le temps."
          },
          {
            icon: "Truck",
            title: "Livraison Rapide 58 Wilayas",
            desc: "Recevez votre colis à domicile ou au bureau en 24h à 48h partout en Algérie."
          },
          {
            icon: "Banknote",
            title: "Paiement à la Livraison (COD)",
            desc: "Ne payez rien à l'avance. Inspectez votre colis avant de régler le livreur."
          },
          {
            icon: "RotateCcw",
            title: "Échange Facile & Rapide",
            desc: "Service après-vente réactif en cas de souci de taille ou de conformité."
          }
        ]
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
            name: "1 Pièce (Découverte)",
            quantity: 1,
            price: product.price,
            badge: "Standard",
            shippingNote: "Livraison standard"
          },
          {
            id: "b2",
            name: "Pack de 2 Pièces",
            quantity: 2,
            price: Math.round(product.price * 1.8),
            badge: "⭐ Le plus populaire (-15%)",
            isPopular: true,
            shippingNote: "Frais de port réduits"
          },
          {
            id: "b3",
            name: "Pack Famille (3 Pièces)",
            quantity: 3,
            price: Math.round(product.price * 2.5),
            badge: "🔥 Super Économie (-25%)",
            shippingNote: "🎉 Livraison GRATUITE !"
          }
        ]
      }
    },
    {
      id: "sec-reviews",
      type: "reviews",
      enabled: true,
      title: "Avis Clients Vérifiés",
      data: {
        heading: "Ce que disent nos clients en Algérie",
        averageRating: 4.9,
        reviews: [
          {
            name: "Karim B. (Alger)",
            rating: 5,
            date: "Il y a 2 jours",
            comment: "Franchement la qualité est au top, exactement comme sur les photos. Le livreur est venu en 24h à Kouba. Je recommande à 100% !",
            verified: true
          },
          {
            name: "Sarah M. (Oran)",
            rating: 5,
            date: "Il y a 4 jours",
            comment: "Service client très courtois et produit impeccable. J'ai commandé le pack de 2, très satisfaite du rapport qualité/prix.",
            verified: true
          },
          {
            name: "Amine T. (Constantine)",
            rating: 5,
            date: "La semaine dernière",
            comment: "Paiement à la livraison sans aucun souci. Produit conforme et bien emballé.",
            verified: true
          }
        ]
      }
    },
    {
      id: "sec-faq",
      type: "faq",
      enabled: true,
      title: "Foire Aux Questions (FAQ)",
      data: {
        heading: "Questions Fréquentes",
        faqs: [
          {
            q: "Combien de temps prend la livraison ?",
            a: "La livraison prend généralement 24h pour Alger et ses environs, et 48h à 72h pour les autres wilayas d'Algérie."
          },
          {
            q: "Comment s'effectue le paiement ?",
            a: "Le paiement se fait en espèces directement au livreur au moment de la réception de votre commande."
          },
          {
            q: "Puis-je vérifier le colis avant de payer ?",
            a: "Oui, vous avez le droit de vérifier le colis en présence du livreur avant de procéder au règlement."
          },
          {
            q: "Que faire en cas de problème ou de mauvaise taille ?",
            a: "Notre service client est disponible 7j/7 pour effectuer un échange sans frais supplémentaires dans un délai de 7 jours."
          }
        ]
      }
    },
    {
      id: "sec-order_form",
      type: "order_form",
      enabled: true,
      title: "Formulaire de Commande Express COD",
      data: {
        heading: "Remplissez vos informations pour commander",
        subheading: "Paiement à la réception du colis",
        btnText: "CONFIRMER MA COMMANDE",
        successTitle: "Merci ! Votre commande a été enregistrée avec succès.",
        successMsg: "Notre équipe vous appellera dans les plus brefs délais pour confirmer l'expédition de votre colis."
      }
    }
  ];
};
