/**
 * Backend WhatsApp Notification Dispatcher for Store Owners (Tenants)
 * Supports:
 * 1. Official Meta WhatsApp Business Cloud API (Automatic background dispatch)
 * 2. Free CallMeBot WhatsApp API (with owner's personal API key)
 */

export interface OwnerWhatsAppPayload {
  ownerPhone: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  wilaya: string;
  total: number;
  itemsSummary: string;
  storeName?: string;
  callmebotApiKey?: string;
}

export interface OwnerWhatsAppResult {
  success: boolean;
  method: "meta_cloud_api" | "callmebot" | "none";
  messageId?: string;
  error?: string;
}

/**
 * Normalizes phone number to international format without + (e.g. 213550252565)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00213")) return digits.slice(2);
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return `213${digits.slice(1)}`;
  return digits.length === 9 ? `213${digits}` : digits;
}

/**
 * Dispatches an automatic WhatsApp message to the store owner
 */
export async function sendOwnerWhatsAppNotification(payload: OwnerWhatsAppPayload): Promise<OwnerWhatsAppResult> {
  const { ownerPhone, orderNumber, clientName, clientPhone, wilaya, total, itemsSummary, storeName, callmebotApiKey } = payload;
  const formattedOwnerPhone = formatPhoneForWhatsApp(ownerPhone);

  if (!formattedOwnerPhone) {
    return {
      success: false,
      method: "none",
      error: "Numéro de téléphone du propriétaire manquant ou invalide.",
    };
  }

  const storeLabel = storeName || "Votre boutique Enova";
  const textMessage = 
    `🛒 *NOUVELLE COMMANDE REÇUE !*\n` +
    `🏪 *Boutique :* ${storeLabel}\n` +
    `🔢 *N° Commande :* #${orderNumber}\n` +
    `👤 *Client :* ${clientName} (${clientPhone})\n` +
    `📍 *Wilaya :* ${wilaya}\n` +
    `📦 *Articles :* ${itemsSummary}\n` +
    `💰 *Montant Total :* ${Number(total || 0).toLocaleString()} DZD\n\n` +
    `Connectez-vous à votre tableau de bord pour traiter la commande.`;

  // 1. Try Meta WhatsApp Business Cloud API if configured in environment
  const metaToken = process.env.WHATSAPP_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "new_order_owner";

  if (metaToken && metaPhoneId) {
    try {
      console.log(`[WHATSAPP OWNER] Attempting Meta Cloud API dispatch to ${formattedOwnerPhone}...`);
      
      // Try template message first, or text message
      const metaUrl = `https://graph.facebook.com/v21.0/${metaPhoneId}/messages`;
      
      // Attempt 1: Text message
      let res = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedOwnerPhone,
          type: "text",
          text: { body: textMessage }
        }),
      });

      let data = await res.json() as any;

      // If text failed due to 24h conversation window, try template
      if (!res.ok && data?.error?.code === 131047) {
        console.log(`[WHATSAPP OWNER] 24h window closed, falling back to template: ${templateName}`);
        res = await fetch(metaUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${metaToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: formattedOwnerPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "fr" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: orderNumber },
                    { type: "text", text: clientName },
                    { type: "text", text: clientPhone },
                    { type: "text", text: wilaya },
                    { type: "text", text: `${total} DZD` }
                  ]
                }
              ]
            }
          }),
        });
        data = await res.json();
      }

      if (res.ok && data?.messages?.[0]?.id) {
        console.log(`[WHATSAPP OWNER] Meta API success! Message ID: ${data.messages[0].id}`);
        return {
          success: true,
          method: "meta_cloud_api",
          messageId: data.messages[0].id
        };
      } else {
        console.warn(`[WHATSAPP OWNER] Meta API response error:`, data);
      }
    } catch (metaErr: any) {
      console.error(`[WHATSAPP OWNER] Meta API exception:`, metaErr);
    }
  }

  // 2. Try CallMeBot Free API if owner provided an API key
  if (callmebotApiKey && callmebotApiKey.trim()) {
    try {
      console.log(`[WHATSAPP OWNER] Attempting CallMeBot dispatch to ${formattedOwnerPhone}...`);
      const encodedMsg = encodeURIComponent(textMessage);
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=+${formattedOwnerPhone}&text=${encodedMsg}&apikey=${encodeURIComponent(callmebotApiKey.trim())}`;
      
      const res = await fetch(callmebotUrl);
      const respText = await res.text();

      if (res.ok && (respText.includes("Message Queued") || respText.includes("OK") || respText.includes("success") || respText.includes("200"))) {
        console.log(`[WHATSAPP OWNER] CallMeBot success!`);
        return {
          success: true,
          method: "callmebot"
        };
      } else {
        console.warn(`[WHATSAPP OWNER] CallMeBot response:`, respText);
        return {
          success: false,
          method: "callmebot",
          error: `CallMeBot error: ${respText.slice(0, 100)}`
        };
      }
    } catch (cmbErr: any) {
      console.error(`[WHATSAPP OWNER] CallMeBot exception:`, cmbErr);
      return {
        success: false,
        method: "callmebot",
        error: cmbErr.message || "Erreur réseau CallMeBot"
      };
    }
  }

  // 3. Neither Meta API nor CallMeBot is configured
  console.log(`[WHATSAPP OWNER] WhatsApp not configured for automatic dispatch.`);
  return {
    success: false,
    method: "none",
    error: "WhatsApp automatique non configuré (variables Meta Cloud API ou clé CallMeBot requise dans les paramètres)."
  };
}
