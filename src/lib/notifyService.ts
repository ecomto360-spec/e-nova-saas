/**
 * Unified Real-time Order Notification Service (Email & WhatsApp)
 */

export interface OrderNotificationPayload {
  reference: string;
  orderNumber?: string;
  orderId?: string;
  tenantId?: string;
  client: string;
  phone: string;
  email: string;
  wilaya: string;
  commune?: string;
  address?: string;
  itemsSummary?: string;
  total: number;
  shippingCost?: number;
  storeName?: string;
  merchantEmail?: string;
  date?: string;
  items?: any[];
}

export interface NotificationResult {
  success: boolean;
  emailSent?: boolean;
  emailPreviewUrl?: string;
  whatsappUrl: string;
  error?: string;
}

/**
 * Builds standard WhatsApp direct message link
 */
export function buildWhatsAppUrl(phone: string, clientName: string, reference: string, total: number, itemsSummary: string, wilaya: string, commune?: string, email?: string): string {
  const clean = (phone || "").replace(/\D/g, "");
  const phoneFormatted = clean.startsWith("0") ? `213${clean.slice(1)}` : (clean.startsWith("213") ? clean : `213${clean}`);
  
  const text = 
    `👋 Bonjour ${clientName},\n\n` +
    `✅ Votre commande *#${reference}* a bien été enregistrée avec succès !\n\n` +
    `📦 *Articles :* ${itemsSummary || "Commande Enova"}\n` +
    `💰 *Montant Total :* ${Number(total || 0).toLocaleString()} DZD (Paiement à la livraison)\n` +
    `📍 *Adresse de livraison :* ${wilaya || "Algérie"}${commune ? ` - ${commune}` : ""}\n` +
    (email ? `📬 *Confirmation email :* Envoyée à ${email}\n\n` : `\n`) +
    `Un conseiller va vous contacter pour confirmer l'expédition. Merci pour votre confiance ! 🇩🇿`;

  return `https://api.whatsapp.com/send?phone=${phoneFormatted}&text=${encodeURIComponent(text)}`;
}

/**
 * Dispatches real-time order notification to backend (Email & WhatsApp)
 */
export async function sendOrderNotifications(order: OrderNotificationPayload): Promise<NotificationResult> {
  const whatsappUrl = buildWhatsAppUrl(
    order.phone,
    order.client,
    order.reference || order.orderNumber || "CMD",
    order.total,
    order.itemsSummary || "Produit commandé",
    order.wilaya,
    order.commune,
    order.email
  );

  try {
    const response = await fetch("/api/notify/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...order,
        whatsappUrl,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        emailSent: data.emailSent ?? true,
        emailPreviewUrl: data.previewUrl,
        whatsappUrl: data.whatsappUrl || whatsappUrl,
      };
    }
  } catch (err) {
    console.warn("Could not reach /api/notify/order:", err);
  }

  return {
    success: true,
    emailSent: false,
    whatsappUrl,
  };
}

/**
 * Automatically opens WhatsApp notification in a popup or new tab if supported
 */
export function triggerWhatsAppNotification(whatsappUrl: string) {
  if (!whatsappUrl) return;
  try {
    const win = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      // If popup blocked, window.location can be used if appropriate or user clicks manual button
      console.log("WhatsApp popup was blocked by browser. User will use interactive button.");
    }
  } catch (e) {
    console.warn("Could not automatically open WhatsApp window:", e);
  }
}
