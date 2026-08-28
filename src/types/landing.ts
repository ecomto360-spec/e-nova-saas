export interface LandingProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  category?: string;
  stock?: number;
  variants?: {
    name: string;
    options: string[];
  }[];
}

export type SectionType = 
  | "hero" 
  | "countdown" 
  | "features" 
  | "gallery" 
  | "bundles" 
  | "order_form" 
  | "reviews" 
  | "faq" 
  | "sticky_bar";

export interface LandingSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  title: string;
  subtitle?: string;
  data: Record<string, any>;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: "active" | "draft";
  productId?: string;
  product?: LandingProduct;
  seoTitle?: string;
  seoDescription?: string;
  pixelFacebook?: string;
  pixelTiktok?: string;
  pixelSnapchat?: string;
  viewsCount: number;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
  sections: LandingSection[];
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
}

export interface AlgerianWilaya {
  code: number;
  name: string;
  arName: string;
  homeDeliveryPrice: number;
  deskDeliveryPrice: number;
}
