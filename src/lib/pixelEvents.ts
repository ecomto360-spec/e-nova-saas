declare global {
  interface Window {
    fbq?: any;
    ttq?: any;
  }
}

export interface PixelPurchasePayload {
  orderId: string;
  total: number;
  currency?: string;
  quantity: number;
  productName: string;
  offerId?: string | null;
  offerTitle?: string | null;
}

export function trackPurchasePixelEvent(payload: PixelPurchasePayload) {
  try {
    const value = Number(payload.total) || 0;
    const currency = payload.currency || "DZD";
    const qty = payload.quantity || 1;

    // Meta Pixel (Facebook)
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        content_name: payload.productName,
        content_type: "product",
        value: value,
        currency: currency,
        num_items: qty,
        order_id: payload.orderId,
        offer_id: payload.offerId || undefined,
        offer_title: payload.offerTitle || undefined
      });
    }

    // TikTok Pixel
    if (typeof window !== "undefined" && window.ttq && typeof window.ttq.track === "function") {
      window.ttq.track("CompletePayment", {
        content_name: payload.productName,
        content_type: "product",
        value: value,
        currency: currency,
        quantity: qty,
        order_id: payload.orderId
      });
    }
  } catch (err) {
    console.warn("Pixel tracking error:", err);
  }
}
