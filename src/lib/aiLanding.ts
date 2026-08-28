import { LandingProduct, LandingSection } from "../types/landing";
import { getDefaultSectionsForProduct } from "../data/landingData";

export async function generateAILandingContent(
  productName: string,
  productPrice: number,
  targetAudience?: string,
  extraNotes?: string
): Promise<{
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  sections: LandingSection[];
}> {
  // Clean product name and create a standard product object
  const cleanName = productName.trim() || "Produit Tendance";
  const slug = cleanName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const tempProduct: LandingProduct = {
    id: `ai-prod-${Date.now()}`,
    name: cleanName,
    price: productPrice > 0 ? productPrice : 2500,
    originalPrice: Math.round((productPrice > 0 ? productPrice : 2500) * 1.45),
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    description: `Offre exclusive sur ${cleanName}. Qualité supérieure garantie et livraison express 58 Wilayas en Algérie avec paiement à la livraison.`
  };

  const defaultSections = getDefaultSectionsForProduct(tempProduct);

  // Customize sections with tailored copywriting
  if (defaultSections[0]) {
    defaultSections[0].data.headline = `L'Offre Exclusive : ${cleanName}`;
    defaultSections[0].data.subheadline = extraNotes 
      ? `${extraNotes} — Profitez de notre promotion spéciale avec livraison sécurisée à domicile.`
      : `Ne manquez pas notre offre spéciale sur ${cleanName}. Quantités très limitées, commandez avant épuisement du stock !`;
  }

  return {
    title: `Offre Spéciale - ${cleanName}`,
    slug: slug || `offre-${Date.now().toString().slice(-4)}`,
    seoTitle: `${cleanName} au Meilleur Prix en Algérie | Livraison 58 Wilayas`,
    seoDescription: `Achetez ${cleanName} authentique avec paiement à la livraison partout en Algérie. Service client 7j/7 et garantie satisfait ou remboursé.`,
    sections: defaultSections
  };
}
