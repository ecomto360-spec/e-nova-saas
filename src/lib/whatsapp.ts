/**
 * Utility helper to generate reliable WhatsApp deep-links and Web URLs
 * Uses api.whatsapp.com instead of wa.me to prevent DNS_PROBE_FINISHED_NXDOMAIN errors.
 */
export function getWhatsAppUrl(phone: string, text?: string): string {
  if (!phone) return "#";
  let cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.startsWith("00213")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("213")) {
    // already country code 213
  } else if (cleaned.startsWith("0")) {
    cleaned = "213" + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = "213" + cleaned;
  }

  const textParam = text ? `&text=${encodeURIComponent(text)}` : "";
  return `https://api.whatsapp.com/send?phone=${cleaned}${textParam}`;
}

export function openWhatsApp(phone: string, text?: string) {
  const url = getWhatsAppUrl(phone, text);
  if (url && url !== "#") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
