export type PriceMode = "fixed" | "percent" | "amount";

export interface ProductOffer {
  id: string;
  product_id: string;
  boutique_id?: string;
  title: string;
  quantity: number; // int >= 1
  price_mode: PriceMode;
  final_price: number;
  original_price?: number | null;
  discount_value?: number | null;
  badge_text?: string;
  badge_color?: string; // hex, default #10B981
  free_shipping?: boolean;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Computes the final price of an offer based on the product unit price and chosen mode.
 */
export function calculateOfferFinalPrice(
  mode: PriceMode,
  discountValue: number | undefined | null,
  quantity: number,
  baseUnitPrice: number,
  fixedPrice?: number | null
): number {
  const baseTotal = Math.max(0, baseUnitPrice * Math.max(1, quantity));
  if (mode === "fixed") {
    return Math.max(0, Number(fixedPrice) || 0);
  }
  if (mode === "percent") {
    const pct = Math.min(99, Math.max(1, Number(discountValue) || 0));
    return Math.max(0, Math.round(baseTotal * (1 - pct / 100)));
  }
  if (mode === "amount") {
    const da = Math.max(0, Number(discountValue) || 0);
    return Math.max(0, Math.round(baseTotal - da));
  }
  return baseTotal;
}

/**
 * Calculates default original price: base price * quantity if not explicitly provided
 */
export function calculateOfferOriginalPrice(
  quantity: number,
  baseUnitPrice: number,
  explicitOriginalPrice?: number | null
): number {
  if (explicitOriginalPrice && Number(explicitOriginalPrice) > 0) {
    return Number(explicitOriginalPrice);
  }
  return Math.max(0, baseUnitPrice * Math.max(1, quantity));
}
