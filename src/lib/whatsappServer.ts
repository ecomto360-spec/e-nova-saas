// ============================================================================
// MOTEUR WHATSAPP « Order Automation » — Côté serveur (bundle server.cjs)
// ----------------------------------------------------------------------------
// Paniers abandonnés + confirmations de commande :
//   • Envoi via Meta Cloud API si WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID
//     sont configurés, SINON mode simulation (message marqué simulé) pour
//     que toute la chaîne (délais, boutons, conversion, compteurs) soit
//     testable sans compte Meta.
//   • Ordonnanceur sans état : /api/whatsapp/process scanne les paniers dus
//     (délai configurable, heures calmes, anti-doublon, STOP, commande déjà
//     passée) + les commandes à confirmer + les changements de statut.
//   • Conversion par WhatsApp : « Confirmer ma commande » crée une COMMANDE
//     réelle (vérifs produit actif / prix / stock, idempotence par panier).
//   • Webhook /api/webhooks/whatsapp : vérification GET + signature
//     X-Hub-Signature-256 + idempotence par identifiant de message.
// Sécurité : les secrets (token, app secret) ne vivent QUE côté serveur.
// ============================================================================
import express from "express";
import crypto from "crypto";
import { db } from "./firebase-backend.js";
import {
  doc, getDoc, setDoc, getDocs, query, where, collection, serverTimestamp
} from "firebase/firestore";
import { ALGERIAN_WILAYAS } from "../data/landingData.js";
import {
  WA_DEFAULT_MESSAGE_AR, WA_DEFAULT_MESSAGE_FR,
  WA_ORDER_CONFIRM_AR, WA_ORDER_CONFIRM_FR,
  WA_ORDER_STATUS_AR, WA_ORDER_STATUS_FR
} from "./whatsappDefaults.js";

// ---------------------------------------------------------------------------
// Types & constantes
// ---------------------------------------------------------------------------

export interface WaAbandonedCartsSettings {
  enabled: boolean;
  delayMinutes: 5 | 10 | 30 | 60;
  reminderEnabled: boolean; // rappel unique après 4 h sans réponse
  messageAr: string;
  messageFr: string;
}

export interface WaQuietHoursSettings {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface WaOrderConfirmSettings {
  enabled: boolean;
}

export interface WaSettings {
  enabled: boolean;
  orderConfirmations: WaOrderConfirmSettings;
  abandonedCarts: WaAbandonedCartsSettings;
  quietHours: WaQuietHoursSettings;
  language: "ar" | "fr" | "store";
  scope: { mode: "all" | "selected"; productIds: string[] };
  consentCheckbox: boolean;
  connectionStatus: "connected" | "disconnected" | "pending";
}


const WA_REMINDER_MINUTES = 240; // rappel unique après 4 h
const DZ_TZ = "Africa/Algiers";

// Statuts de commande qui déclenchent une notification client
const WA_NOTIFIABLE_STATUSES = [
  "Confirmée", "Expédiée", "En livraison", "Au bureau de livraison", "Livrée", "Échec", "Retour"
];

function isCloudApiConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function waBaseUrl(): string {
  return String(process.env.APP_URL || "https://e-nova-saas.vercel.app").replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Réglages (avec cache court)
// ---------------------------------------------------------------------------

const settingsCache = new Map<string, { at: number; data: WaSettings }>();

export function waDefaultSettings(): WaSettings {
  return {
    enabled: false,
    orderConfirmations: { enabled: true },
    abandonedCarts: {
      enabled: false,
      delayMinutes: 10,
      reminderEnabled: false,
      messageAr: WA_DEFAULT_MESSAGE_AR,
      messageFr: WA_DEFAULT_MESSAGE_FR
    },
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
    language: "store",
    scope: { mode: "all", productIds: [] },
    consentCheckbox: false,
    connectionStatus: "disconnected"
  };
}

export async function getWaSettings(tenantId: string): Promise<WaSettings> {
  const cached = settingsCache.get(tenantId);
  if (cached && Date.now() - cached.at < 10000) return cached.data;
  let data = waDefaultSettings();
  try {
    const snap = await getDoc(doc(db, "whatsapp_settings", tenantId));
    if (snap.exists()) {
      const raw = snap.data() || {};
      const d = waDefaultSettings();
      data = {
        enabled: raw.enabled === true,
        orderConfirmations: { enabled: raw.orderConfirmations?.enabled !== false },
        abandonedCarts: {
          enabled: raw.abandonedCarts?.enabled === true,
          delayMinutes: ([5, 10, 30, 60] as const).includes(raw.abandonedCarts?.delayMinutes)
            ? raw.abandonedCarts.delayMinutes : 10,
          reminderEnabled: raw.abandonedCarts?.reminderEnabled === true,
          messageAr: String(raw.abandonedCarts?.messageAr || WA_DEFAULT_MESSAGE_AR).slice(0, 1500),
          messageFr: String(raw.abandonedCarts?.messageFr || WA_DEFAULT_MESSAGE_FR).slice(0, 1500)
        },
        quietHours: {
          enabled: raw.quietHours?.enabled === true,
          start: String(raw.quietHours?.start || "22:00").slice(0, 5),
          end: String(raw.quietHours?.end || "08:00").slice(0, 5)
        },
        language: raw.language === "ar" || raw.language === "fr" ? raw.language : "store",
        scope: {
          mode: raw.scope?.mode === "selected" ? "selected" : "all",
          productIds: Array.isArray(raw.scope?.productIds) ? raw.scope.productIds.map((p: unknown) => String(p).slice(0, 60)) : []
        },
        consentCheckbox: raw.consentCheckbox === true,
        connectionStatus: raw.connectionStatus === "connected" || raw.connectionStatus === "pending" ? raw.connectionStatus : "disconnected"
      };
    }
  } catch (e) {
    console.warn("getWaSettings: read failed:", e);
  }
  settingsCache.set(tenantId, { at: Date.now(), data });
  return data;
}

// ---------------------------------------------------------------------------
// Heures calmes (fuseau Algérie)
// ---------------------------------------------------------------------------

function dzHourMinute(): { h: number; m: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DZ_TZ, hour: "numeric", minute: "numeric", hour12: false
    }).format(new Date()).split(":").map(Number);
    return { h: parts[0] % 24, m: parts[1] || 0 };
  } catch {
    const d = new Date();
    return { h: d.getUTCHours() + 1, m: d.getUTCMinutes() };
  }
}

function parseHM(v: string): number {
  const [h, m] = String(v || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** true si l'heure locale DZ actuelle tombe dans les heures calmes. */
export function inQuietHours(s: WaSettings): boolean {
  if (!s.quietHours.enabled || !s.quietHours.start || !s.quietHours.end) return false;
  const now = dzHourMinute();
  const cur = now.h * 60 + now.m;
  const start = parseHM(s.quietHours.start);
  const end = parseHM(s.quietHours.end);
  if (start === end) return false;
  return start > end ? (cur >= start || cur < end) : (cur >= start && cur < end);
}

// ---------------------------------------------------------------------------
// Envoi (Cloud API ou simulation)
// ---------------------------------------------------------------------------

interface WaSendResult {
  ok: boolean;
  simulated: boolean;
  waMessageId: string;
  error?: string;
}

async function waSendText(toDigits: string, body: string): Promise<WaSendResult> {
  const to = toDigits.replace(/^0/, "213");
  if (!isCloudApiConfigured()) {
    // Mode simulation : la chaîne complète reste testable sans compte Meta.
    return { ok: true, simulated: true, waMessageId: `sim_${crypto.randomUUID()}` };
  }
  try {
    const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: body.slice(0, 4096) }
      })
    });
    const j = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      const errObj = (j as { error?: { message?: string; code?: number; error_subcode?: number } }).error;
      const detail = errObj?.message
        ? `Meta ${errObj.code ?? ""}${errObj.error_subcode ? "/" + errObj.error_subcode : ""} ${errObj.message}`.trim()
        : `HTTP ${res.status} ${JSON.stringify(j).slice(0, 160)}`;
      return { ok: false, simulated: false, waMessageId: "", error: detail };
    }
    const mid = (j as { messages?: Array<{ id?: string }> }).messages?.[0]?.id || `wa_${Date.now()}`;
    return { ok: true, simulated: false, waMessageId: mid };
  } catch (e) {
    return { ok: false, simulated: false, waMessageId: "", error: waErrText(e) };
  }
}

/** Sérialise une erreur en texte lisible (jamais « [object Object] »). */
export function waErrText(e: unknown): string {
  if (e instanceof Error) return e.message || e.name;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e).slice(0, 200); } catch { return String(e); }
}

// ---------------------------------------------------------------------------
// Journal des messages
// ---------------------------------------------------------------------------

interface WaMessageLog {
  tenantId: string;
  kind: "cart" | "cart_reminder" | "order_confirm" | "order_status" | "incoming" | "merchant_todo";
  direction: "out" | "in";
  cartId?: string;
  orderId?: string;
  phone: string;
  lang: "ar" | "fr";
  body: string;
  status: "sent" | "delivered" | "read" | "replied" | "failed" | "received";
  simulated?: boolean;
  waMessageId?: string;
  error?: string;
  sentAt?: string;
}

async function logWaMessage(msg: WaMessageLog): Promise<string> {
  const id = `wa_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  // Firestore refuse les valeurs `undefined` : on ne copie que les champs définis
  const clean: Record<string, unknown> = {
    sentAt: msg.sentAt || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  for (const [k, v] of Object.entries(msg)) {
    if (v !== undefined) clean[k] = v;
  }
  await setDoc(doc(db, "whatsapp_messages", id), clean);
  return id;
}

async function findMessagesByCart(cartId: string, kinds: string[]): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const out: Array<{ id: string; data: Record<string, unknown> }> = [];
  // lecture par la sous-collection du tenant n'est pas possible sans tenantId :
  // on interroge la collection globale par cartId (index single-field).
  const snap = await getDocs(query(collection(db, "whatsapp_messages"), where("cartId", "==", cartId)));
  snap.forEach((d) => {
    const data = d.data() || {};
    if (kinds.includes(String(data.kind))) out.push({ id: d.id, data });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Désinscription (STOP)
// ---------------------------------------------------------------------------

async function isUnsubscribed(tenantId: string, phoneDigits: string): Promise<boolean> {
  try {
    // Désinscription globale (STOP sur le numéro WhatsApp partagé) ou par vendeur
    const globalSnap = await getDoc(doc(db, "whatsapp_unsubscribes", `global_${phoneDigits}`));
    if (globalSnap.exists()) return true;
    const snap = await getDoc(doc(db, "whatsapp_unsubscribes", `${tenantId}_${phoneDigits}`));
    return snap.exists();
  } catch {
    return false;
  }
}

async function markUnsubscribed(tenantId: string, phoneDigits: string, source: string): Promise<void> {
  await setDoc(doc(db, "whatsapp_unsubscribes", `${tenantId}_${phoneDigits}`), {
    tenantId,
    phoneDigits,
    source,
    stoppedAt: new Date().toISOString()
  }, { merge: true });
}

const STOP_KEYWORDS = ["stop", "STOP", "Stop", "إيقاف", "الغاء الاشتراك", "إلغاء الاشتراك", "unsubscribe", "DÉSISTER"];

// ---------------------------------------------------------------------------
// Rendu des messages
// ---------------------------------------------------------------------------

function renderWaTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

function cartItemsSummary(items: Array<Record<string, unknown>>): string {
  const list = Array.isArray(items) ? items.slice(0, 5) : [];
  const parts = list.map((it) => {
    const name = String(it.name || "منتج");
    const qty = Number(it.quantity ?? it.qty) || 1;
    return `${name} x${qty}`;
  });
  return parts.join("، ") || "—";
}

function resolveLang(settings: WaSettings, cartLang: unknown): "ar" | "fr" {
  if (settings.language === "ar" || settings.language === "fr") return settings.language;
  return cartLang === "fr" ? "fr" : "ar";
}

function resolveTenantName(tenantData: Record<string, unknown>): string {
  return String(tenantData.storeName || tenantData.name || "المتجر") .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Ordonnanceur : paniers dus + confirmations + statuts
// ---------------------------------------------------------------------------

function toMs(v: unknown): number {
  try {
    if (!v) return 0;
    if (typeof v === "object" && typeof (v as { toMillis?: () => number }).toMillis === "function") {
      return (v as { toMillis: () => number }).toMillis();
    }
    const t = new Date(String(v)).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

export interface WaProcessSummary {
  cartsSent: number;
  remindersSent: number;
  orderConfirmsSent: number;
  statusNotificationsSent: number;
  skippedQuietHours: number;
  errors: string[];
  cloudApi: boolean;
}

let lastProcessAt = 0;
const PROCESS_MIN_INTERVAL_MS = 60 * 1000; // garde-fou global

export async function processWhatsAppQueue(force: boolean): Promise<WaProcessSummary> {
  const summary: WaProcessSummary = {
    cartsSent: 0, remindersSent: 0, orderConfirmsSent: 0, statusNotificationsSent: 0,
    skippedQuietHours: 0, errors: [], cloudApi: isCloudApiConfigured()
  };
  if (!force && Date.now() - lastProcessAt < PROCESS_MIN_INTERVAL_MS) return summary;
  lastProcessAt = Date.now();

  // ---- Phase A : paniers abandonnés dus -------------------------------------
  try {
    const snap = await getDocs(query(collection(db, "abandoned_carts"), where("status", "==", "abandoned")));
    for (const d of snap.docs) {
      try {
        const cart = d.data() || {};
        const tenantId = String(cart.tenantId || "");
        if (!tenantId) continue;
        const settings = await getWaSettings(tenantId);
        if (!settings.enabled || !settings.abandonedCarts.enabled) continue;

        const digits = String(cart.phoneDigits || "");
        if (!/^0[567]\d{8}$/.test(digits)) continue;

        // STOP
        if (await isUnsubscribed(tenantId, digits)) continue;

        // Consentement : case obligatoire non cochée → pas d'envoi
        if (settings.consentCheckbox && cart.consentChecked !== true) continue;

        // Portée produits
        const firstProductId = String(cart.items?.[0]?.productId || "");
        if (settings.scope.mode === "selected" && !settings.scope.productIds.includes(firstProductId)) continue;

        // Commande déjà passée avec ce téléphone → rien à envoyer
        try {
          const ordersSnap = await getDocs(query(collection(db, "orders"), where("phone", "==", digits)));
          let hasOrder = false;
          ordersSnap.forEach((o) => {
            if ((o.data() || {}).userId === tenantId) hasOrder = true;
          });
          if (hasOrder) continue;
        } catch { /* lecture impossible → on tente l'envoi */ }

        const updatedAtMs = toMs(cart.updatedAt) || toMs(cart.createdAt);
        if (!updatedAtMs) continue;
        const dueMs = updatedAtMs + settings.abandonedCarts.delayMinutes * 60000;

        // Déjà un envoi pour ce panier ?
        const sent = await findMessagesByCart(d.id, ["cart"]);
        const reminders = await findMessagesByCart(d.id, ["cart_reminder"]);

        if (sent.length === 0) {
          if (Date.now() < dueMs) continue; // pas encore dû
          if (inQuietHours(settings)) { summary.skippedQuietHours++; continue; }
          const r = await sendCartMessage(d.id, cart, tenantId, settings, "cart");
          if (r) summary.cartsSent++; else summary.errors.push(`cart ${d.id}`);
        } else if (reminders.length === 0 && settings.abandonedCarts.reminderEnabled) {
          const sentAt = toMs(sent[0].data.sentAt);
          if (Date.now() < sentAt + WA_REMINDER_MINUTES * 60000) continue;
          if (toMs(cart.waRepliedAt) > 0) continue; // réponse reçue → pas de rappel
          if (inQuietHours(settings)) { summary.skippedQuietHours++; continue; }
          const r = await sendCartMessage(d.id, cart, tenantId, settings, "cart_reminder");
          if (r) summary.remindersSent++; else summary.errors.push(`reminder ${d.id}`);
        }
      } catch (e) {
        summary.errors.push(String((e as Error).message || e).slice(0, 120));
      }
    }
  } catch (e) {
    summary.errors.push(`phaseA: ${String((e as Error).message || e).slice(0, 120)}`);
  }

  // ---- Phase B : confirmations de commande ---------------------------------
  try {
    const snap = await getDocs(query(collection(db, "orders"), where("status", "==", "En attente")));
    const cutoff = Date.now() - 48 * 3600 * 1000;
    for (const d of snap.docs) {
      try {
        const order = d.data() || {};
        if (order.waConfirmSent === true) continue;
        const tenantId = String(order.userId || "");
        if (!tenantId) continue;
        const digits = String(order.phone || "").replace(/\D/g, "");
        if (!/^0[567]\d{8}$/.test(digits) && !/^213[567]\d{8}$/.test(digits)) continue;
        if (toMs(order.createdAt) < cutoff) continue;
        const settings = await getWaSettings(tenantId);
        if (!settings.enabled || !settings.orderConfirmations.enabled) continue;
        if (await isUnsubscribed(tenantId, digits.replace(/^213/, "0"))) continue;
        if (inQuietHours(settings)) { summary.skippedQuietHours++; continue; }

        const ok = await sendOrderConfirmMessage(d.id, order, tenantId, settings);
        if (ok) summary.orderConfirmsSent++; else summary.errors.push(`order ${d.id}`);
      } catch (e) {
        summary.errors.push(String((e as Error).message || e).slice(0, 120));
      }
    }
  } catch (e) {
    summary.errors.push(`phaseB: ${String((e as Error).message || e).slice(0, 120)}`);
  }

  // ---- Phase C : notifications de changement de statut ----------------------
  try {
    for (const status of WA_NOTIFIABLE_STATUSES) {
      const snap = await getDocs(query(collection(db, "orders"), where("status", "==", status)));
      const cutoff = Date.now() - 24 * 3600 * 1000;
      for (const d of snap.docs) {
        try {
          const order = d.data() || {};
          // Uniquement les commandes liées à WhatsApp (message de confirmation
          // envoyé OU commande convertie depuis un panier abandonné)
          if (order.waConfirmSent !== true && order.whatsappConfirmed !== true) continue;
          if (order.waLastStatusSent === status) continue;
          if (toMs(order.updatedAt || order.createdAt) < cutoff) continue;
          const tenantId = String(order.userId || "");
          if (!tenantId) continue;
          const settings = await getWaSettings(tenantId);
          if (!settings.enabled) continue;
          const digits = String(order.phone || "").replace(/\D/g, "");
          if (await isUnsubscribed(tenantId, digits.replace(/^213/, "0"))) continue;
          if (inQuietHours(settings)) { summary.skippedQuietHours++; continue; }

          const lang = settings.language === "store" ? "ar" : settings.language;
          const tplMap = lang === "fr" ? WA_ORDER_STATUS_FR : WA_ORDER_STATUS_AR;
          const line = tplMap[status];
          if (!line) continue;
          const tenantSnap = await getDoc(doc(db, "tenants", tenantId)).catch(() => null);
          const tenantData = (tenantSnap?.data() || {}) as Record<string, unknown>;
          const trackUrl = `${waBaseUrl()}/track/${encodeURIComponent(String(order.reference || order.id || ""))}`;
          const body = `${line}\n\n📦 ${cartItemsSummary(order.items as Array<Record<string, unknown>>)}\n🔗 ${trackUrl}`;
          const r = await waSendText(digits, body);
          await logWaMessage({
            tenantId, kind: "order_status", direction: "out", orderId: d.id,
            phone: digits, lang, body, status: r.ok ? "sent" : "failed",
            simulated: r.simulated, waMessageId: r.waMessageId, error: r.error
          });
          await setDoc(doc(db, "orders", d.id), {
            waLastStatusSent: status,
            waLastStatusAt: new Date().toISOString(),
            ...(r.ok ? {} : { waLastError: r.error || "" })
          }, { merge: true });
          await setDoc(doc(db, "tenants", tenantId, "orders", d.id), {
            waLastStatusSent: status, waLastStatusAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
          if (r.ok) summary.statusNotificationsSent++; else summary.errors.push(`status ${d.id}`);
        } catch (e) {
          summary.errors.push(String((e as Error).message || e).slice(0, 120));
        }
      }
    }
  } catch (e) {
    summary.errors.push(`phaseC: ${String((e as Error).message || e).slice(0, 120)}`);
  }

  return summary;
}

async function ensureCartToken(cartId: string, cart: Record<string, unknown>): Promise<string> {
  const existing = String(cart.waToken || "");
  if (existing) return existing;
  const token = crypto.randomBytes(12).toString("hex");
  await setDoc(doc(db, "abandoned_carts", cartId), { waToken: token }, { merge: true });
  const tenantId = String(cart.tenantId || "");
  if (tenantId) {
    await setDoc(doc(db, "tenants", tenantId, "abandoned_carts", cartId), { waToken: token }, { merge: true }).catch(() => {});
  }
  return token;
}

async function sendCartMessage(
  cartId: string,
  cart: Record<string, unknown>,
  tenantId: string,
  settings: WaSettings,
  kind: "cart" | "cart_reminder"
): Promise<boolean> {
  const digits = String(cart.phoneDigits || "");
  const lang = resolveLang(settings, cart.lang);
  const tenantSnap = await getDoc(doc(db, "tenants", tenantId)).catch(() => null);
  const tenantData = (tenantSnap?.data() || {}) as Record<string, unknown>;
  const token = await ensureCartToken(cartId, cart);
  const link = `${waBaseUrl()}/wa/${cartId}?t=${token}`;
  const reminderPrefix = kind === "cart_reminder" ? (lang === "fr" ? "⏰ Petit rappel — " : "⏰ تذكير — ") : "";
  const tpl = lang === "fr" ? settings.abandonedCarts.messageFr : settings.abandonedCarts.messageAr;
  const total = Number(cart.total) || 0;
  const body = reminderPrefix + renderWaTemplate(tpl, {
    nom: String(cart.client || "").split(" ")[0] || (lang === "fr" ? "cher client" : "عميلنا"),
    boutique: resolveTenantName(tenantData),
    produits: cartItemsSummary(cart.items as Array<Record<string, unknown>>),
    total: total.toLocaleString("fr-FR"),
    wilaya: String(cart.wilaya || ""),
    lien: link
  });
  const r = await waSendText(digits, body);
  const nowIso = new Date().toISOString();
  await logWaMessage({
    tenantId, kind, direction: "out", cartId, phone: digits, lang, body,
    status: r.ok ? "sent" : "failed", simulated: r.simulated, waMessageId: r.waMessageId, error: r.error, sentAt: nowIso
  });
  const patch: Record<string, unknown> = {
    waStatus: r.ok ? "sent" : "failed",
    waSimulated: r.simulated,
    waSentAt: nowIso,
    ...(kind === "cart_reminder" ? { waReminderSentAt: nowIso } : {}),
    ...(r.ok ? {} : { waError: r.error || "" })
  };
  await setDoc(doc(db, "abandoned_carts", cartId), patch, { merge: true });
  await setDoc(doc(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {});
  return r.ok;
}

async function sendOrderConfirmMessage(
  orderId: string,
  order: Record<string, unknown>,
  tenantId: string,
  settings: WaSettings
): Promise<boolean> {
  const digits = String(order.phone || "").replace(/\D/g, "").replace(/^213/, "0");
  const lang = settings.language === "store" ? (order.lang === "fr" ? "fr" : "ar") : settings.language;
  const tenantSnap = await getDoc(doc(db, "tenants", tenantId)).catch(() => null);
  const tenantData = (tenantSnap?.data() || {}) as Record<string, unknown>;
  const token = crypto.randomBytes(12).toString("hex");
  const link = `${waBaseUrl()}/wa/order/${orderId}?t=${token}`;
  const tpl = lang === "fr" ? WA_ORDER_CONFIRM_FR : WA_ORDER_CONFIRM_AR;
  const body = renderWaTemplate(tpl, {
    nom: String(order.client || "").split(" ")[0] || (lang === "fr" ? "cher client" : "عميلنا"),
    boutique: resolveTenantName(tenantData),
    produits: cartItemsSummary(order.items as Array<Record<string, unknown>>),
    total: (Number(order.total) || 0).toLocaleString("fr-FR"),
    wilaya: String(order.wilaya || ""),
    lien: link
  });
  const r = await waSendText(digits, body);
  const nowIso = new Date().toISOString();
  await logWaMessage({
    tenantId, kind: "order_confirm", direction: "out", orderId, phone: digits, lang, body,
    status: r.ok ? "sent" : "failed", simulated: r.simulated, waMessageId: r.waMessageId, error: r.error, sentAt: nowIso
  });
  const patch = {
    waConfirmSent: r.ok === true,
    waConfirmSimulated: r.simulated,
    waConfirmSentAt: nowIso,
    waToken: token,
    ...(r.ok ? {} : { waLastError: r.error || "" })
  };
  await setDoc(doc(db, "orders", orderId), patch, { merge: true });
  await setDoc(doc(db, "tenants", tenantId, "orders", orderId), patch, { merge: true }).catch(() => {});
  return r.ok;
}

// ---------------------------------------------------------------------------
// Conversion : panier → commande réelle
// ---------------------------------------------------------------------------

export interface WaConvertResult {
  ok: boolean;
  reason?: "invalid" | "already" | "price_changed" | "product_unavailable" | "out_of_stock" | "failed";
  orderId?: string;
  trackingCode?: string;
  currentTotal?: number;
  currentPrice?: number;
  currentShipping?: number;
  message?: string;
}

async function getProductDoc(tenantId: string, productId: string): Promise<Record<string, unknown> | null> {
  const tries = [doc(db, "products", productId), doc(db, "tenants", tenantId, "products", productId)];
  for (const ref of tries) {
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() || {};
    } catch { /* essai suivant */ }
  }
  return null;
}

export async function convertCartViaWhatsApp(
  cartId: string,
  acceptNewPrice: boolean
): Promise<WaConvertResult> {
  const cartSnap = await getDoc(doc(db, "abandoned_carts", cartId)).catch(() => null);
  if (!cartSnap || !cartSnap.exists()) return { ok: false, reason: "invalid" };
  const cart = cartSnap.data() || {};
  const tenantId = String(cart.tenantId || "");
  if (!tenantId) return { ok: false, reason: "invalid" };

  // Idempotence : déjà converti ?
  if (cart.status === "recovered" && cart.orderId) {
    return { ok: true, reason: "already", orderId: String(cart.orderId), trackingCode: String(cart.orderId) };
  }

  const items = (Array.isArray(cart.items) ? cart.items : []) as Array<Record<string, unknown>>;
  const first = items[0] || {};
  const productId = String(first.productId || "");

  // Vérifier le produit : actif, stock, prix actuels
  const product = productId ? await getProductDoc(tenantId, productId) : null;
  if (productId && !product) return { ok: false, reason: "product_unavailable" };
  if (product && String(product.status || "active") !== "active") {
    return { ok: false, reason: "product_unavailable" };
  }
  const stock = product ? Number(product.stock) : NaN;
  if (product && Number.isFinite(stock) && stock <= 0) {
    return { ok: false, reason: "out_of_stock" };
  }
  const currentPrice = product ? Number(product.price) : Number(first.price) || 0;
  const qty = Number(first.quantity ?? first.qty) || 1;

  // Frais de livraison actuels (wilaya + type) si calculables
  const wilayaStr = String(cart.wilaya || "");
  const codeMatch = wilayaStr.match(/(\d{1,2})\s*[-–]/);
  const wilaya = codeMatch
    ? ALGERIAN_WILAYAS.find((w) => w.code === Number(codeMatch[1]))
    : undefined;
  const deliveryType = String(cart.deliveryType || "home") === "desk" ? "desk" : "home";
  const currentShipping = wilaya
    ? (deliveryType === "home" ? wilaya.homeDeliveryPrice : wilaya.deskDeliveryPrice)
    : Number(cart.shipping) || 0;
  const currentTotal = currentPrice * qty + currentShipping;

  const oldTotal = Number(cart.total) || 0;
  if (!acceptNewPrice && (currentPrice !== (Number(first.price) || 0) || currentTotal !== oldTotal)) {
    return { ok: false, reason: "price_changed", currentPrice, currentShipping, currentTotal };
  }

  // Créer la commande (miroir du formulaire boutique)
  const generatedOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const nowIso = new Date().toISOString();
  const productImage = String((product && (product.image || (product.images || [])[0])) || first.image || "");
  const productName = String((product && (product.nameAr || product.name)) || first.name || "Produit");
  const orderPayload = {
    orderNumber: generatedOrderId.substring(4, 10),
    reference: generatedOrderId,
    trackingCode: generatedOrderId,
    userId: tenantId,
    client: String(cart.client || "Client WhatsApp"),
    phone: String(cart.phone || ""),
    wilaya: wilayaStr,
    commune: String(cart.commune || ""),
    address: String(cart.address || ""),
    itemsSummary: cartItemsSummary(items),
    total: currentTotal,
    status: "Confirmée",
    paymentStatus: "Non payé",
    paymentMethod: "COD (الدفع عند الاستلام)",
    deliveryType: deliveryType === "home" ? "Livraison à domicile" : "Point de relais / Stop Desk",
    shippingMethod: deliveryType === "home" ? "Livraison à domicile" : "Point de relais / Stop Desk",
    shippingCost: currentShipping,
    source: "WhatsApp – panier abandonné",
    whatsappConfirmed: true,
    confirmedAt: nowIso,
    date: nowIso,
    image: productImage,
    items: [{
      productId,
      name: productName,
      price: currentPrice,
      quantity: qty,
      variants: (first.variants || {}) as Record<string, string>,
      image: productImage
    }]
  };
  await setDoc(doc(db, "orders", generatedOrderId), {
    ...orderPayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  await setDoc(doc(db, "tenants", tenantId, "orders", generatedOrderId), {
    ...orderPayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Panier → récupéré (lien commande, montant sauvé)
  const patch = {
    status: "recovered",
    recovered: true,
    orderId: generatedOrderId,
    recoveredAt: nowIso,
    updatedAt: nowIso,
    waStatus: "replied",
    waRepliedAt: nowIso,
    total: currentTotal
  };
  await setDoc(doc(db, "abandoned_carts", cartId), patch, { merge: true });
  await setDoc(doc(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {});
  await logWaMessage({
    tenantId, kind: "incoming", direction: "in", cartId, orderId: generatedOrderId,
    phone: String(cart.phoneDigits || ""), lang: cart.lang === "fr" ? "fr" : "ar",
    body: "✅ Confirmer ma commande (bouton)", status: "received", sentAt: nowIso
  });

  return { ok: true, orderId: generatedOrderId, trackingCode: generatedOrderId, currentTotal };
}

// ---------------------------------------------------------------------------
// Actions publiques (page /wa/:cartId et webhook)
// ---------------------------------------------------------------------------

export async function waCartAction(cartId: string, token: string, action: "confirm" | "modify" | "decline", acceptNewPrice: boolean): Promise<WaConvertResult | { ok: boolean; error: string }> {
  const cartSnap = await getDoc(doc(db, "abandoned_carts", cartId)).catch(() => null);
  if (!cartSnap || !cartSnap.exists()) return { ok: false, error: "Panier introuvable." };
  const cart = cartSnap.data() || {};
  if (String(cart.waToken || "") !== token) return { ok: false, error: "Lien invalide ou expiré." };
  const tenantId = String(cart.tenantId || "");
  const nowIso = new Date().toISOString();

  if (action === "confirm") {
    return convertCartViaWhatsApp(cartId, acceptNewPrice);
  }

  if (action === "modify") {
    // Statut « Contacté » + notification marchand (badge + tâche)
    const patch = { status: "contacted", waStatus: "replied", waRepliedAt: nowIso, waMerchantTodo: true, updatedAt: nowIso };
    await setDoc(doc(db, "abandoned_carts", cartId), patch, { merge: true });
    await setDoc(doc(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {});
    await logWaMessage({
      tenantId, kind: "incoming", direction: "in", cartId, phone: String(cart.phoneDigits || ""),
      lang: cart.lang === "fr" ? "fr" : "ar", body: "✏️ Modifier / Appeler (bouton)", status: "received", sentAt: nowIso
    });
    return { ok: true };
  }

  // decline
  const patch = { status: "refused", waStatus: "replied", waRepliedAt: nowIso, refusedAt: nowIso, updatedAt: nowIso };
  await setDoc(doc(db, "abandoned_carts", cartId), patch, { merge: true });
  await setDoc(doc(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {});
  await logWaMessage({
    tenantId, kind: "incoming", direction: "in", cartId, phone: String(cart.phoneDigits || ""),
    lang: cart.lang === "fr" ? "fr" : "ar", body: "❌ Non merci (bouton)", status: "received", sentAt: nowIso
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Routes Express
// ---------------------------------------------------------------------------

function clientText(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

export function registerWhatsAppRoutes(app: express.Express): void {
  // État public (aucun secret) : Cloud API configurée ou simulation.
  app.get("/api/whatsapp/status", (_req, res) => {
    res.json({ cloudApi: isCloudApiConfigured(), baseUrl: waBaseUrl() });
  });

  // Ordonnanceur — appelé par le cron Vercel (GET), par la capture storefront
  // (piggyback) et manuellement depuis le dashboard (POST force).
  const handleProcess = async (req: express.Request, res: express.Response) => {
    try {
      const force = req.method === "POST" && clientText(req.query.force, 5) === "1";
      const summary = await processWhatsAppQueue(force);
      res.json({ ok: true, ...summary });
    } catch (e) {
      res.status(500).json({ ok: false, error: String((e as Error).message || e) });
    }
  };
  app.get("/api/whatsapp/process", handleProcess);
  app.post("/api/whatsapp/process", handleProcess);

  // Action depuis la page publique /wa/:cartId (boutons) — protégée par token.
  app.post("/api/whatsapp/action", async (req, res) => {
    try {
      const b = (req.body || {}) as Record<string, unknown>;
      const cartId = clientText(b.cartId, 120);
      const token = clientText(b.token, 60);
      const action = clientText(b.action, 20);
      const acceptNewPrice = b.acceptNewPrice === true;
      if (!cartId || !token || !["confirm", "modify", "decline"].includes(action)) {
        res.status(400).json({ ok: false, error: "invalid_request" });
        return;
      }
      const r = await waCartAction(cartId, token, action as "confirm" | "modify" | "decline", acceptNewPrice);
      res.json(r);
    } catch (e) {
      res.status(500).json({ ok: false, error: "action_failed", detail: String((e as Error).message || e) });
    }
  });

  // Renvoi manuel depuis le dashboard (protégé par le token du panier).
  app.post("/api/whatsapp/resend", async (req, res) => {
    try {
      const b = (req.body || {}) as Record<string, unknown>;
      const cartId = clientText(b.cartId, 120);
      const token = clientText(b.token, 60);
      if (!cartId || !token) { res.status(400).json({ ok: false, error: "invalid_request" }); return; }
      const snap = await getDoc(doc(db, "abandoned_carts", cartId));
      if (!snap.exists()) { res.status(404).json({ ok: false, error: "not_found" }); return; }
      const cart = snap.data() || {};
      if (String(cart.waToken || "") !== token) { res.status(403).json({ ok: false, error: "forbidden" }); return; }
      const tenantId = String(cart.tenantId || "");
      const settings = await getWaSettings(tenantId);
      if (!settings.enabled || !settings.abandonedCarts.enabled) {
        res.status(409).json({ ok: false, error: "extension_disabled" });
        return;
      }
      if (["recovered", "refused"].includes(String(cart.status))) {
        res.status(409).json({ ok: false, error: "cart_closed" });
        return;
      }
      if (await isUnsubscribed(tenantId, String(cart.phoneDigits || ""))) {
        res.status(409).json({ ok: false, error: "unsubscribed" });
        return;
      }
      const ok = await sendCartMessage(cartId, cart, tenantId, settings, "cart");
      res.json({ ok });
    } catch (e) {
      res.status(500).json({ ok: false, error: "resend_failed" });
    }
  });

  // Action depuis la page publique /wa/order/:orderId (commande validée).
  app.post("/api/whatsapp/order-action", async (req, res) => {
    try {
      const b = (req.body || {}) as Record<string, unknown>;
      const orderId = clientText(b.orderId, 120);
      const token = clientText(b.token, 60);
      const action = clientText(b.action, 20);
      if (!orderId || !token || !["confirm", "decline"].includes(action)) {
        res.status(400).json({ ok: false, error: "invalid_request" });
        return;
      }
      let orderSnap = await getDoc(doc(db, "orders", orderId)).catch(() => null);
      let orderData = orderSnap?.exists() ? orderSnap.data() || {} : null;
      let docId = orderId;
      if (!orderData) {
        const byRef = await getDocs(query(collection(db, "orders"), where("reference", "==", orderId))).catch(() => null);
        if (byRef && !byRef.empty) {
          docId = byRef.docs[0].id;
          orderData = byRef.docs[0].data() || {};
        }
      }
      if (!orderData) { res.status(404).json({ ok: false, error: "not_found" }); return; }
      if (String(orderData.waToken || "") !== token) { res.status(403).json({ ok: false, error: "forbidden" }); return; }
      const tenantId = String(orderData.userId || "");
      const nowIso = new Date().toISOString();
      const newStatus = action === "confirm" ? "Confirmée" : "Annulée";
      const patch: Record<string, unknown> = {
        status: newStatus,
        updatedAt: nowIso,
        ...(action === "confirm" ? { whatsappConfirmed: true, confirmedAt: nowIso } : { refusedAt: nowIso })
      };
      await setDoc(doc(db, "orders", docId), patch, { merge: true });
      if (tenantId) {
        await setDoc(doc(db, "tenants", tenantId, "orders", docId), patch, { merge: true }).catch(() => {});
      }
      await logWaMessage({
        tenantId, kind: "incoming", direction: "in", orderId: docId,
        phone: String(orderData.phone || "").replace(/\D/g, ""),
        lang: "ar",
        body: action === "confirm" ? "✅ Confirmer ma commande (bouton)" : "❌ Refuser (bouton)",
        status: "received", sentAt: nowIso
      });
      res.json({ ok: true, status: newStatus, trackingCode: String(orderData.trackingCode || orderData.reference || docId) });
    } catch (e) {
      res.status(500).json({ ok: false, error: "order_action_failed" });
    }
  });

  // ---- Webhook Meta Cloud API ----------------------------------------------
  // Vérification (abonnement du webhook dans Meta App Dashboard)
  app.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = clientText(req.query["hub.mode"], 20);
    const token = clientText(req.query["hub.verify_token"], 100);
    const challenge = clientText(req.query["hub.challenge"], 200);
    if (mode === "subscribe" && token && token === String(process.env.WHATSAPP_VERIFY_TOKEN || "")) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  });

  // Événements : statuts (sent/delivered/read/failed) + messages entrants.
  // Signature X-Hub-Signature-256 = HMAC-SHA256(app secret, raw body).
  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const rawBody = (req as { rawBody?: Buffer }).rawBody;
      const appSecret = String(process.env.WHATSAPP_APP_SECRET || "");
      if (appSecret) {
        const sig = String(req.headers["x-hub-signature-256"] || "");
        if (!sig) { res.sendStatus(401); return; }
        const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody || Buffer.from(JSON.stringify(req.body || {}))).digest("hex");
        if (sig !== expected) { res.sendStatus(401); return; }
      }

      const payload = (req.body || {}) as Record<string, unknown>;
      const entries = (payload.entry as Array<Record<string, unknown>> | undefined) || [];
      for (const entry of entries) {
        const changes = (entry.changes as Array<Record<string, unknown>> | undefined) || [];
        for (const change of changes) {
          const value = (change.value as Record<string, unknown> | undefined) || {};
          const tenantId = String((value.metadata as { phone_number_id?: string } | undefined)?.phone_number_id || "");

          // --- Statuts de nos messages sortants ---
          const statuses = (value.statuses as Array<Record<string, unknown>> | undefined) || [];
          for (const st of statuses) {
            const waMessageId = String(st.id || "");
            const status = String(st.status || ""); // sent|delivered|read|failed
            if (!waMessageId || !["sent", "delivered", "read", "failed"].includes(status)) continue;
            try {
              const msgsSnap = await getDocs(query(collection(db, "whatsapp_messages"), where("waMessageId", "==", waMessageId)));
              for (const m of msgsSnap.docs) {
                const data = m.data() || {};
                const patch: Record<string, unknown> = { status };
                const tsField = status === "delivered" ? "waDeliveredAt" : status === "read" ? "waReadAt" : status === "failed" ? "waFailedAt" : null;
                if (tsField) patch[tsField] = new Date().toISOString();
                const errors = (st.errors as Array<{ title?: string; message?: string }> | undefined) || [];
                if (errors.length) patch.error = errors[0]?.title || errors[0]?.message || "failed";
                await setDoc(doc(db, "whatsapp_messages", m.id), patch, { merge: true });
                // Dénormaliser sur le panier
                if (data.cartId) {
                  const cPatch: Record<string, unknown> = { waStatus: status };
                  if (tsField) cPatch[tsField] = patch[tsField];
                  if (errors.length) cPatch.waError = patch.error;
                  const tenantOfCart = String(data.tenantId || "");
                  await setDoc(doc(db, "abandoned_carts", String(data.cartId)), cPatch, { merge: true });
                  if (tenantOfCart) {
                    await setDoc(doc(db, "tenants", tenantOfCart, "abandoned_carts", String(data.cartId)), cPatch, { merge: true }).catch(() => {});
                  }
                }
              }
            } catch (e) {
              console.warn("webhook status update failed:", e);
            }
          }

          // --- Messages entrants (boutons, STOP, texte libre) ---
          const messages = (value.messages as Array<Record<string, unknown>> | undefined) || [];
          for (const msg of messages) {
            const waMessageId = String(msg.id || "");
            const from = String(msg.from || ""); // format 213XXXXXXXXX
            if (!waMessageId || !from) continue;
            const digits = from.replace(/\D/g, "").replace(/^213/, "0");

            // Idempotence par identifiant de message
            try {
              const seen = await getDocs(query(collection(db, "whatsapp_messages"), where("waMessageId", "==", waMessageId)));
              if (!seen.empty) continue;
            } catch { /* on continue */ }

            const type = String(msg.type || "text");
            let body = "";
            let buttonAction: "confirm" | "modify" | "decline" | null = null;

            if (type === "text") {
              body = String((msg.text as { body?: string } | undefined)?.body || "");
              const low = body.trim().toLowerCase();
              if (STOP_KEYWORDS.some((k) => low === k.toLowerCase() || low.startsWith(k.toLowerCase()))) {
                await markUnsubscribed("global", digits, "webhook_stop");
                await logWaMessage({
                  tenantId: tenantId || "global", kind: "incoming", direction: "in", phone: digits,
                  lang: "ar", body: `🚫 STOP : ${body}`, status: "received", waMessageId
                });
                continue;
              }
            } else if (type === "button") {
              body = String((msg.button as { text?: string; payload?: string } | undefined)?.text || "");
              const payload = String((msg.button as { payload?: string } | undefined)?.payload || "");
              if (payload.includes("confirm") || /confirmer|تأكيد/i.test(body)) buttonAction = "confirm";
              else if (payload.includes("modify") || /modifier|appeler|تعديل|اتصال/i.test(body)) buttonAction = "modify";
              else if (payload.includes("decline") || /non merci|لا شكرا/i.test(body)) buttonAction = "decline";
            } else if (type === "interactive") {
              const reply = (msg.interactive as { button_reply?: { title?: string; id?: string }; list_reply?: { title?: string; id?: string } } | undefined);
              body = String(reply?.button_reply?.title || reply?.list_reply?.title || "");
              const id = String(reply?.button_reply?.id || reply?.list_reply?.id || "");
              if (id.includes("confirm") || /confirmer|تأكيد/i.test(body)) buttonAction = "confirm";
              else if (id.includes("modify") || /modifier|appeler|تعديل/i.test(body)) buttonAction = "modify";
              else if (id.includes("decline") || /non merci|لا شكرا/i.test(body)) buttonAction = "decline";
            }

            // Retrouver le panier le plus récent de ce téléphone avec token connu
            let targetCartId = "";
            let targetToken = "";
            let targetTenantId = "";
            try {
              const cartsSnap = await getDocs(query(collection(db, "abandoned_carts"), where("phoneDigits", "==", digits)));
              let bestAt = 0;
              cartsSnap.forEach((c) => {
                const data = c.data() || {};
                if (["recovered", "refused"].includes(String(data.status))) return;
                const at = toMs(data.waSentAt) || toMs(data.updatedAt);
                if (at > bestAt && data.waToken) {
                  bestAt = at;
                  targetCartId = c.id;
                  targetToken = String(data.waToken);
                  targetTenantId = String(data.tenantId || "");
                }
              });
            } catch { /* ignorer */ }

            await logWaMessage({
              tenantId: targetTenantId || tenantId || "global",
              kind: "incoming", direction: "in", cartId: targetCartId || undefined, phone: digits,
              lang: "ar", body: body || `[${type}]`, status: "received", waMessageId
            });

            if (buttonAction && targetCartId && targetToken) {
              await waCartAction(targetCartId, targetToken, buttonAction, false);
            } else {
              // Texte libre → tâche marchand
              if (targetCartId) {
                const patch = { waStatus: "replied", waRepliedAt: new Date().toISOString(), waMerchantTodo: true };
                await setDoc(doc(db, "abandoned_carts", targetCartId), patch, { merge: true }).catch(() => {});
              }
            }
          }
        }
      }
      res.sendStatus(200);
    } catch (e) {
      console.warn("webhook error:", e);
      res.sendStatus(200); // Meta exige un 200 pour ne pas rejouer indéfiniment
    }
  });
}
