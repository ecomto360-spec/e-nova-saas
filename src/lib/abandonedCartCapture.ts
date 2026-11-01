// ============================================================================
// CAPTURE DES PANIERS ABANDONNÉS — côté boutique publique (sans authentification)
// ----------------------------------------------------------------------------
// Ce module tourne dans la page /store/:slug du visiteur. Il envoie l'état du
// formulaire de commande vers l'endpoint serverless /api/abandoned-carts/track
// UNIQUEMENT si le téléphone est un numéro algérien valide (05/06/07 ou +213).
// Sécurité : le client n'écrit jamais directement dans Firestore — tout passe
// par l'API qui valide, applique un rate-limit IP et un honeypot.
// La commande validée appelle /api/abandoned-carts/recover pour marquer toutes
// les fiches du téléphone comme "recovered".
// ============================================================================

export interface CartCaptureItem {
  productId: string;
  name: string;
  image: string;
  variants: Record<string, string>;
  qty: number;
  price: number;
}

export interface CartCaptureInput {
  tenantId: string;
  slug: string;
  phone: string;
  client?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  deliveryType?: "home" | "desk";
  items: CartCaptureItem[];
  subtotal: number;
  shipping: number;
  total: number;
  lang: "ar" | "fr";
  source?: string;
  /** Consentement WhatsApp : texte affiché + case cochée (si requise). */
  consentText?: string;
  consentChecked?: boolean;
}

interface CartCapturePayload extends CartCaptureInput {
  sessionId: string;
  pageUrl: string;
  utm: { source: string; medium: string; campaign: string };
  website: string; // honeypot : doit rester vide
  consentAt: string;
}

const VISITOR_KEY = "enova_store_visitor_id";
const DEBOUNCE_MS = 1500;

/** Numéro algérien valide : 0 5/6/7 + 8 chiffres, ou +213 / 213 5/6/7 + 8 chiffres. */
export function isValidDzPhone(phone: string): boolean {
  const digits = String(phone || "").replace(/\D/g, "");
  return /^0[567]\d{8}$/.test(digits) || /^213[567]\d{8}$/.test(digits);
}

/** Identifiant visiteur persistant (localStorage) pour regrouper les sessions. */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "v_unknown";
  }
}

function getUtm(): { source: string; medium: string; campaign: string } {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      source: (p.get("utm_source") || "").slice(0, 60),
      medium: (p.get("utm_medium") || "").slice(0, 60),
      campaign: (p.get("utm_campaign") || "").slice(0, 60)
    };
  } catch {
    return { source: "", medium: "", campaign: "" };
  }
}

function buildPayload(input: CartCaptureInput): CartCapturePayload {
  return {
    ...input,
    consentText: String(input.consentText || "").slice(0, 300),
    consentChecked: input.consentChecked === true,
    consentAt: input.consentChecked === true ? new Date().toISOString() : "",
    sessionId: getVisitorId(),
    pageUrl: String(window.location.href || "").slice(0, 300),
    utm: getUtm(),
    website: "" // honeypot anti-bot
  };
}

function post(url: string, payload: CartCapturePayload, keepalive: boolean): void {
  const body = JSON.stringify(payload);
  const doFetch = () => {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive
    }).catch(() => {});
  };
  if (keepalive && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    } catch {
      /* fallback fetch */
    }
  }
  doFetch();
}

// ---- Debounce : un seul envoi par pause de saisie (~1,5 s) -----------------
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPayload: CartCapturePayload | null = null;

/** Enregistre l'état courant du formulaire (débouncé ~1,5 s). */
export function trackAbandonedCart(input: CartCaptureInput): void {
  if (!input.tenantId || !input.items || input.items.length === 0) return;
  if (!isValidDzPhone(input.phone)) {
    cancelPendingAbandonedCartTracking();
    return;
  }
  pendingPayload = buildPayload(input);
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (pendingPayload) {
      post("/api/abandoned-carts/track", pendingPayload, false);
      pendingPayload = null;
    }
  }, DEBOUNCE_MS);
}

/** Envoi immédiat (blur d'un champ du formulaire). */
export function trackAbandonedCartNow(input: CartCaptureInput): void {
  if (!input.tenantId || !input.items || input.items.length === 0) return;
  if (!isValidDzPhone(input.phone)) return;
  cancelPendingAbandonedCartTracking();
  post("/api/abandoned-carts/track", buildPayload(input), false);
}

/** Dernier état connu : envoi immédiat garanti (sendBeacon, fermeture d'onglet). */
export function flushAbandonedCart(input: CartCaptureInput): void {
  if (!input.tenantId || !input.items || input.items.length === 0) return;
  if (!isValidDzPhone(input.phone)) return;
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  post("/api/abandoned-carts/track", buildPayload(input), true);
  pendingPayload = null;
}

/** Annule l'envoi débouncé en attente (commande validée, téléphone invalide…). */
export function cancelPendingAbandonedCartTracking(): void {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  pendingPayload = null;
}

/**
 * Commande validée depuis la boutique : marque comme "recovered" toutes les
 * fiches actives de ce téléphone chez ce vendeur (best-effort, sans blocage).
 */
export function notifyCartRecovered(tenantId: string, phone: string, orderId?: string): void {
  if (!tenantId || !isValidDzPhone(phone)) return;
  cancelPendingAbandonedCartTracking();
  fetch("/api/abandoned-carts/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, phone, orderId: orderId || "" }),
    keepalive: true
  }).catch(() => {});
}
