/**
 * LOT D + E — Plateforme SUPER ADMIN (serveur).
 * Thèmes, Extensions, Intégration WhatsApp (secrets chiffrés AES-256-GCM),
 * Réglages (maintenance, inscriptions, SMTP, slugs réservés, pages légales…),
 * Notifications/annonces, Santé système, exécution des jobs.
 */
import express from "express";
import nodemailer from "nodemailer";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit
} from "firebase/firestore";
import { db } from "../lib/firebase-backend.js";
import { adminApiGuard, logAdminAudit, isoOf, type AdminIdentity } from "./adminApi.js";
import { encryptSecret, decryptSecret, hasEncryptionKey } from "../lib/secretBox.js";
import { runDailyJobs } from "./adminModules.js";
import { getWaAdminConfig, invalidateWaRuntimeConfig } from "../lib/whatsappServer.js";

const router = express.Router();

interface RequestWithAdmin extends express.Request { admin?: AdminIdentity; }
const adminOf = (req: express.Request): AdminIdentity => (req as RequestWithAdmin).admin as AdminIdentity;
const nowIso = (): string => new Date().toISOString();
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

// ---------------------------------------------------------------------------
// THÈMES — disponibilité globale, par plan, mise en avant
// ---------------------------------------------------------------------------

router.get("/themes", adminApiGuard("themes"), async (_req, res) => {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "themes"));
    const cfg = (snap.data() || {}) as Record<string, unknown>;
    res.json({
      disabled: strList(cfg.disabled),
      featured: strList(cfg.featured),
      perPlan: (cfg.perPlan && typeof cfg.perPlan === "object" ? cfg.perPlan : {}) as Record<string, string[]>,
      updatedAt: str(cfg.updatedAt)
    });
  } catch (e) { console.error("GET /themes", e); res.status(500).json({ error: "Erreur thèmes." }); }
});

router.put("/themes", adminApiGuard("themes"), async (req, res) => {
  try {
    const b = req.body || {};
    const cfg = {
      disabled: strList(b.disabled),
      featured: strList(b.featured),
      perPlan: (b.perPlan && typeof b.perPlan === "object" ? b.perPlan : {}) as Record<string, string[]>,
      updatedAt: nowIso()
    };
    const before = await getDoc(doc(db, "platform_settings", "themes"));
    await setDoc(doc(db, "platform_settings", "themes"), cfg, { merge: true });
    await logAdminAudit({ actor: adminOf(req), action: "themes.update", target: "platform_settings/themes", before: before.data() || {}, after: cfg, req });
    res.json({ ok: true });
  } catch (e) { console.error("PUT /themes", e); res.status(500).json({ error: "Erreur mise à jour thèmes." }); }
});

// ---------------------------------------------------------------------------
// EXTENSIONS — activation globale, accès par plan, quotas
// ---------------------------------------------------------------------------

router.get("/extensions", adminApiGuard("extensions"), async (_req, res) => {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "extensions"));
    const cfg = (snap.data() || {}) as Record<string, unknown>;
    res.json({
      disabled: strList(cfg.disabled),
      perPlan: (cfg.perPlan && typeof cfg.perPlan === "object" ? cfg.perPlan : {}) as Record<string, string[]>,
      quotas: (cfg.quotas && typeof cfg.quotas === "object" ? cfg.quotas : {}) as Record<string, number>,
      updatedAt: str(cfg.updatedAt)
    });
  } catch (e) { console.error("GET /extensions", e); res.status(500).json({ error: "Erreur extensions." }); }
});

router.put("/extensions", adminApiGuard("extensions"), async (req, res) => {
  try {
    const b = req.body || {};
    const cfg = {
      disabled: strList(b.disabled),
      perPlan: (b.perPlan && typeof b.perPlan === "object" ? b.perPlan : {}) as Record<string, string[]>,
      quotas: (b.quotas && typeof b.quotas === "object" ? b.quotas : {}) as Record<string, number>,
      updatedAt: nowIso()
    };
    const before = await getDoc(doc(db, "platform_settings", "extensions"));
    await setDoc(doc(db, "platform_settings", "extensions"), cfg, { merge: true });
    await logAdminAudit({ actor: adminOf(req), action: "extensions.update", target: "platform_settings/extensions", before: before.data() || {}, after: cfg, req });
    res.json({ ok: true });
  } catch (e) { console.error("PUT /extensions", e); res.status(500).json({ error: "Erreur mise à jour extensions." }); }
});

// ---------------------------------------------------------------------------
// INTÉGRATION WHATSAPP — config chiffrée, tests, webhook, templates, usage
// ---------------------------------------------------------------------------

interface WaConfigBody {
  mode?: string; phoneNumberId?: string; wabaId?: string; appId?: string;
  appSecret?: string; token?: string; verifyToken?: string; graphVersion?: string; appUrl?: string;
  clearToken?: boolean; clearAppSecret?: boolean;
}

router.get("/whatsapp/config", adminApiGuard("integrations"), async (_req, res) => {
  try {
    const cfg = await getWaAdminConfig();
    // JAMAIS de secret en clair dans la réponse : seulement « configuré »
    res.json({
      mode: cfg.mode,
      phoneNumberId: cfg.phoneNumberId,
      wabaId: cfg.wabaId,
      appId: cfg.appId,
      graphVersion: cfg.graphVersion,
      appUrl: cfg.appUrl,
      verifyToken: cfg.verifyToken, // nécessaire pour copier l'URL du webhook (demande explicite)
      tokenConfigured: cfg.hasToken,
      appSecretConfigured: cfg.hasAppSecret,
      source: cfg.source,
      encryptionAvailable: hasEncryptionKey(),
      webhookVerifiedAt: cfg.webhookVerifiedAt || "",
      webhookUrl: `${cfg.appUrl || ""}/api/whatsapp/webhook`
    });
  } catch (e) { console.error("GET /whatsapp/config", e); res.status(500).json({ error: "Erreur configuration WhatsApp." }); }
});

router.put("/whatsapp/config", adminApiGuard("integrations"), async (req, res) => {
  try {
    const b = (req.body || {}) as WaConfigBody;
    const mode = b.mode === "real" ? "real" : "simulation";
    if (mode === "real" && !hasEncryptionKey()) {
      return res.status(400).json({ error: "ENCRYPTION_KEY non définie : impossible de stocker les secrets chiffrés." });
    }
    const current = await getDoc(doc(db, "platform_settings", "whatsapp"));
    const cur = (current.data() || {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      mode,
      phoneNumberId: str(b.phoneNumberId).trim().slice(0, 60),
      wabaId: str(b.wabaId).trim().slice(0, 60),
      appId: str(b.appId).trim().slice(0, 60),
      graphVersion: str(b.graphVersion).trim().slice(0, 8) || "v21.0",
      appUrl: str(b.appUrl).trim().replace(/\/+$/, "").slice(0, 120),
      verifyToken: str(b.verifyToken).trim().slice(0, 120),
      updatedAt: nowIso()
    };
    if (typeof b.token === "string" && b.token.trim()) patch.tokenEnc = encryptSecret(b.token.trim());
    if (typeof b.appSecret === "string" && b.appSecret.trim()) patch.appSecretEnc = encryptSecret(b.appSecret.trim());
    if (b.clearToken === true) patch.tokenEnc = "";
    if (b.clearAppSecret === true) patch.appSecretEnc = "";
    await setDoc(doc(db, "platform_settings", "whatsapp"), patch, { merge: true });
    invalidateWaRuntimeConfig();
    await logAdminAudit({
      actor: adminOf(req), action: "whatsapp.config_update", target: "platform_settings/whatsapp",
      before: { mode: str(cur.mode), hadToken: Boolean(str(cur.tokenEnc)) },
      after: { mode, tokenChanged: typeof b.token === "string" && !!b.token.trim() }, req
    });
    res.json({ ok: true });
  } catch (e) { console.error("PUT /whatsapp/config", e); res.status(500).json({ error: "Erreur enregistrement configuration WhatsApp." }); }
});

router.post("/whatsapp/test-connection", adminApiGuard("integrations"), async (req, res) => {
  try {
    const cfg = await getWaAdminConfig();
    if (!cfg.hasToken || !cfg.phoneNumberId) {
      return res.status(400).json({ error: "Token ou Phone Number ID manquant : configurez l'intégration d'abord.", mode: cfg.mode });
    }
    const url = `https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}?access_token=${encodeURIComponent(cfg.token)}`;
    const r = await fetch(url, { method: "GET" });
    const raw = await r.text();
    await logAdminAudit({ actor: adminOf(req), action: "whatsapp.test_connection", target: "meta", after: { httpStatus: r.status }, req });
    res.json({ ok: r.ok, httpStatus: r.status, response: raw.slice(0, 600) });
  } catch (e) {
    console.error("test-connection", e);
    res.status(502).json({ error: "Impossible de joindre l'API Meta." });
  }
});

router.post("/whatsapp/send-test", adminApiGuard("integrations"), async (req, res) => {
  try {
    const to = str(req.body?.to).replace(/[^\d+]/g, "").slice(0, 20);
    const message = str(req.body?.message).slice(0, 500) || "Message test e-nova.";
    const cfg = await getWaAdminConfig();
    if (!to) return res.status(400).json({ error: "Numéro de destination requis." });
    if (cfg.mode !== "real" || !cfg.hasToken || !cfg.phoneNumberId) {
      return res.status(400).json({ error: "Mode réel non configuré (simulation active) : enregistrez un token valide." });
    }
    const url = `https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } })
    });
    const raw = await r.text();
    await logAdminAudit({ actor: adminOf(req), action: "whatsapp.send_test", target: to, after: { httpStatus: r.status }, req });
    res.json({ ok: r.ok, httpStatus: r.status, response: raw.slice(0, 600) });
  } catch (e) {
    console.error("send-test", e);
    res.status(502).json({ error: "Erreur lors de l'envoi du message test." });
  }
});

/** Templates : liste locale + rafraîchissement du statut depuis Meta. */
router.get("/whatsapp/templates", adminApiGuard("integrations"), async (req, res) => {
  try {
    const snap = await getDocs(query(collection(db, "wa_templates"), orderBy("createdAt", "desc"), fsLimit(100)));
    let rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    if (req.query.refresh === "1") {
      const cfg = await getWaAdminConfig();
      if (cfg.mode === "real" && cfg.hasToken && cfg.wabaId) {
        const r = await fetch(`https://graph.facebook.com/${cfg.graphVersion}/${cfg.wabaId}/message_templates?access_token=${encodeURIComponent(cfg.token)}`, { method: "GET" }).catch(() => null);
        if (r && r.ok) {
          const j = (await r.json()) as { data?: Array<Record<string, unknown>> };
          for (const t of j.data || []) {
            const name = str(t.name);
            if (!name) continue;
            await setDoc(doc(db, "wa_templates", name), {
              name, category: str(t.category), language: str(t.language),
              status: str(t.status) || "UNKNOWN", components: t.components || [],
              source: "meta", updatedAt: nowIso()
            }, { merge: true }).catch(() => undefined);
          }
          const fresh = await getDocs(query(collection(db, "wa_templates"), orderBy("createdAt", "desc"), fsLimit(100)));
          rows = fresh.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
        }
      }
    }
    res.json({ total: rows.length, rows });
  } catch (e) { console.error("templates", e); res.status(500).json({ error: "Erreur templates." }); }
});

router.post("/whatsapp/templates", adminApiGuard("integrations"), async (req, res) => {
  try {
    const b = req.body || {};
    const name = str(b.name).trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 60);
    const body = str(b.body).slice(0, 1024);
    if (!name || !body) return res.status(400).json({ error: "Nom et corps du message requis." });
    const category = ["MARKETING", "UTILITY", "AUTHENTICATION"].includes(str(b.category)) ? str(b.category) : "UTILITY";
    const language = /^[\w]{2,5}$/.test(str(b.language)) ? str(b.language) : "fr";
    const entry = { name, category, language, body, status: "LOCAL", source: "local", createdAt: nowIso() };
    const cfg = await getWaAdminConfig();
    let metaResult = null;
    if (b.submit === true && cfg.mode === "real" && cfg.hasToken && cfg.wabaId) {
      const r = await fetch(`https://graph.facebook.com/${cfg.graphVersion}/${cfg.wabaId}/message_templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
        body: JSON.stringify({ name, category, language, components: [{ type: "BODY", text: body }] })
      }).catch(() => null);
      if (r) {
        const raw = await r.text();
        metaResult = { httpStatus: r.status, response: raw.slice(0, 400) };
        entry.status = r.ok ? "PENDING" : "SUBMISSION_FAILED";
      }
    }
    await setDoc(doc(db, "wa_templates", name), entry, { merge: true });
    await logAdminAudit({ actor: adminOf(req), action: "whatsapp.template_create", target: name, after: { category, language, submitted: b.submit === true }, req });
    res.json({ ok: true, id: name, metaResult });
  } catch (e) { console.error("POST templates", e); res.status(500).json({ error: "Erreur création template." }); }
});

router.delete("/whatsapp/templates/:id", adminApiGuard("integrations"), async (req, res) => {
  try {
    await deleteDoc(doc(db, "wa_templates", req.params.id));
    await logAdminAudit({ actor: adminOf(req), action: "whatsapp.template_delete", target: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { console.error("DELETE template", e); res.status(500).json({ error: "Erreur suppression template." }); }
});

/** Consommation WhatsApp par boutique (30 derniers jours) + quota du plan. */
router.get("/whatsapp/usage", adminApiGuard("integrations"), async (_req, res) => {
  try {
    const from = new Date(Date.now() - 30 * 86400000).toISOString();
    const [tenants, plansSnap, msgs] = await Promise.all([
      getDocs(query(collection(db, "tenants"), fsLimit(300))),
      getDocs(query(collection(db, "plans"), fsLimit(50))).catch(() => null),
      getDocs(query(collection(db, "whatsapp_messages"), where("sentAt", ">", from), fsLimit(1000))).catch(() => null)
    ]);
    const quotas = new Map<string, number>();
    (plansSnap ? plansSnap.docs : []).forEach((p) => quotas.set(p.id, num((p.data() as Record<string, unknown>).waQuota)));
    const perTenant = new Map<string, number>();
    (msgs ? msgs.docs : []).forEach((m) => {
      const t = str((m.data() as Record<string, unknown>).tenantId);
      if (t) perTenant.set(t, (perTenant.get(t) || 0) + 1);
    });
    const rows = tenants.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id, storeName: str(data.storeName) || d.id, plan: str(data.plan || ""),
        sent30d: perTenant.get(d.id) || 0, quota: quotas.get(str(data.plan || "")) ?? 0
      };
    }).sort((a, b) => b.sent30d - a.sent30d);
    res.json({ totalSent30d: [...perTenant.values()].reduce((a, b) => a + b, 0), rows });
  } catch (e) { console.error("usage", e); res.status(500).json({ error: "Erreur usage WhatsApp." }); }
});

// ---------------------------------------------------------------------------
// RÉGLAGES — général / inscriptions / maintenance / SMTP / légal / export
// ---------------------------------------------------------------------------

const SETTINGS_DEFAULTS: Record<string, unknown> = {
  platformName: "E-nova",
  supportEmail: "",
  defaultLanguage: "fr",
  currency: "DZD",
  timezone: "Africa/Algiers",
  registrationsOpen: true,
  manualApproval: false,
  emailVerification: false,
  defaultTrialDays: 14,
  maintenance: { on: false, message: "Maintenance en cours — revenez bientôt." },
  graceDays: 7,
  reservedSlugs: ["admin", "api", "login", "register", "store", "dashboard", "legal", "settings"],
  legalFr: "",
  legalAr: "",
  globalScripts: "",
  defaultLimits: { maxProducts: 50, maxOrders: 0 }
};

router.get("/settings", adminApiGuard("settings"), async (_req, res) => {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "general"));
    const stored = (snap.data() || {}) as Record<string, unknown>;
    const settings = { ...SETTINGS_DEFAULTS, ...stored };
    // Les données sensibles ne sont jamais renvoyées en clair
    const smtpSnap = await getDoc(doc(db, "platform_settings", "smtp"));
    const smtpData = (smtpSnap.data() || {}) as Record<string, unknown>;
    res.json({
      settings,
      smtp: {
        host: str(smtpData.host), port: num(smtpData.port) || 587, user: str(smtpData.user),
        from: str(smtpData.from), passwordConfigured: Boolean(str(smtpData.passwordEnc)),
        encryptionAvailable: hasEncryptionKey()
      },
      updatedAt: str(stored.updatedAt)
    });
  } catch (e) { console.error("GET /settings", e); res.status(500).json({ error: "Erreur réglages." }); }
});

router.put("/settings", adminApiGuard("settings"), async (req, res) => {
  try {
    const b = (req.body || {}) as Record<string, unknown>;
    const before = await getDoc(doc(db, "platform_settings", "general"));
    const patch: Record<string, unknown> = { updatedAt: nowIso() };
    if (typeof b.platformName === "string") patch.platformName = b.platformName.slice(0, 60);
    if (typeof b.supportEmail === "string") patch.supportEmail = b.supportEmail.slice(0, 120);
    if (b.defaultLanguage === "fr" || b.defaultLanguage === "ar") patch.defaultLanguage = b.defaultLanguage;
    if (typeof b.registrationsOpen === "boolean") patch.registrationsOpen = b.registrationsOpen;
    if (typeof b.manualApproval === "boolean") patch.manualApproval = b.manualApproval;
    if (typeof b.emailVerification === "boolean") patch.emailVerification = b.emailVerification;
    if (b.defaultTrialDays !== undefined) patch.defaultTrialDays = Math.max(0, Math.min(90, num(b.defaultTrialDays)));
    if (b.graceDays !== undefined) patch.graceDays = Math.max(0, Math.min(90, num(b.graceDays)));
    if (b.maintenance && typeof b.maintenance === "object") {
      const m = b.maintenance as { on?: unknown; message?: unknown };
      patch.maintenance = { on: m.on === true, message: str(m.message).slice(0, 300) };
    }
    if (Array.isArray(b.reservedSlugs)) patch.reservedSlugs = b.reservedSlugs.map((s) => str(s).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40)).filter(Boolean).slice(0, 100);
    if (typeof b.legalFr === "string") patch.legalFr = b.legalFr.slice(0, 20000);
    if (typeof b.legalAr === "string") patch.legalAr = b.legalAr.slice(0, 20000);
    if (typeof b.globalScripts === "string") patch.globalScripts = b.globalScripts.slice(0, 5000);
    if (b.defaultLimits && typeof b.defaultLimits === "object") {
      const dl = b.defaultLimits as { maxProducts?: unknown };
      patch.defaultLimits = { maxProducts: Math.max(1, num(dl.maxProducts) || 50) };
    }
    await setDoc(doc(db, "platform_settings", "general"), patch, { merge: true });
    await logAdminAudit({ actor: adminOf(req), action: "settings.update", target: "platform_settings/general", before: before.data() || {}, after: patch, req });
    res.json({ ok: true });
  } catch (e) { console.error("PUT /settings", e); res.status(500).json({ error: "Erreur mise à jour réglages." }); }
});

router.put("/settings/smtp", adminApiGuard("settings"), async (req, res) => {
  try {
    if (!hasEncryptionKey()) return res.status(400).json({ error: "ENCRYPTION_KEY non définie : le mot de passe SMTP ne peut pas être chiffré." });
    const b = (req.body || {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      host: str(b.host).slice(0, 120), port: Math.max(1, Math.min(65535, num(b.port) || 587)),
      user: str(b.user).slice(0, 120), from: str(b.from).slice(0, 120), updatedAt: nowIso()
    };
    if (typeof b.password === "string" && b.password) patch.passwordEnc = encryptSecret(b.password);
    await setDoc(doc(db, "platform_settings", "smtp"), patch, { merge: true });
    await logAdminAudit({ actor: adminOf(req), action: "settings.smtp_update", target: "platform_settings/smtp", after: { host: patch.host, port: patch.port } });
    res.json({ ok: true });
  } catch (e) { console.error("PUT smtp", e); res.status(500).json({ error: "Erreur SMTP." }); }
});

export async function getSmtpTransportConfig(): Promise<{ host: string; port: number; user: string; pass: string; from: string } | null> {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "smtp"));
    const d = (snap.data() || {}) as Record<string, unknown>;
    const host = str(d.host);
    const passEnc = str(d.passwordEnc);
    if (!host || !passEnc) return null;
    return { host, port: num(d.port) || 587, user: str(d.user), pass: decryptSecret(passEnc), from: str(d.from) || str(d.user) };
  } catch { return null; }
}

router.post("/settings/smtp-test", adminApiGuard("settings"), async (req, res) => {
  try {
    const to = str(req.body?.to).slice(0, 120);
    if (!to) return res.status(400).json({ error: "Destinataire requis." });
    const cfg = await getSmtpTransportConfig();
    if (!cfg) return res.status(400).json({ error: "SMTP non configuré." });
    const transport = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.port === 465, auth: { user: cfg.user, pass: cfg.pass } });
    const info = await transport.sendMail({ from: cfg.from, to, subject: "E-nova — email de test", text: "Ceci est un email de test envoyé depuis le panneau super admin." });
    await logAdminAudit({ actor: adminOf(req), action: "settings.smtp_test", target: to, after: { messageId: info.messageId } });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    console.error("smtp-test", e);
    res.status(502).json({ error: "Échec de l'envoi : " + String((e as Error).message || e).slice(0, 200) });
  }
});

router.get("/settings/export", adminApiGuard("settings"), async (_req, res) => {
  try {
    const docs: Record<string, unknown> = {};
    for (const id of ["general", "themes", "extensions", "whatsapp", "smtp"]) {
      const snap = await getDoc(doc(db, "platform_settings", id));
      if (snap.exists()) docs[id] = snap.data();
    }
    const plans = await getDocs(query(collection(db, "plans"), fsLimit(50)));
    docs.plans = plans.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.setHeader("Content-Disposition", "attachment; filename=e-nova-configuration.json");
    res.json({ exportedAt: nowIso(), version: 1, platform_settings: docs });
  } catch (e) { console.error("export", e); res.status(500).json({ error: "Erreur export." }); }
});

router.post("/settings/import", adminApiGuard("settings"), async (req, res) => {
  try {
    const data = (req.body || {}) as { platform_settings?: Record<string, Record<string, unknown>> };
    const ps = data.platform_settings;
    if (!ps || typeof ps !== "object") return res.status(400).json({ error: "Fichier de configuration invalide." });
    let imported = 0;
    for (const [id, content] of Object.entries(ps)) {
      if (!/^[a-z_]+$/.test(id)) continue;
      await setDoc(doc(db, "platform_settings", id), content, { merge: true });
      imported += 1;
    }
    await logAdminAudit({ actor: adminOf(req), action: "settings.import", target: "platform_settings", after: { imported } });
    res.json({ ok: true, imported });
  } catch (e) { console.error("import", e); res.status(500).json({ error: "Erreur import." }); }
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS / ANNONCES
// ---------------------------------------------------------------------------

router.get("/notifications", adminApiGuard("notifications"), async (_req, res) => {
  try {
    const snap = await getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc"), fsLimit(100)));
    res.json({ total: snap.size, rows: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) });
  } catch (e) { console.error("GET /notifications", e); res.status(500).json({ error: "Erreur notifications." }); }
});

router.post("/notifications/send", adminApiGuard("notifications"), async (req, res) => {
  try {
    const b = req.body || {};
    const title = str(b.title).slice(0, 120);
    const body = str(b.body).slice(0, 2000);
    const audience = ["all", "plan", "member"].includes(str(b.audience)) ? str(b.audience) : "all";
    const sendEmail = b.email === true;
    if (!title || !body) return res.status(400).json({ error: "Titre et message requis." });
    let recipients = 0;
    let planId = "";
    let memberId = "";
    let memberEmail = "";
    if (audience === "plan") {
      planId = str(b.planId);
      if (!planId) return res.status(400).json({ error: "Plan requis pour cette audience." });
      const snap = await getDocs(query(collection(db, "tenants"), where("plan", "==", planId), fsLimit(500)));
      recipients = snap.size;
    } else if (audience === "member") {
      memberId = str(b.memberId);
      if (!memberId) return res.status(400).json({ error: "Membre requis pour cette audience." });
      const snap = await getDoc(doc(db, "tenants", memberId));
      if (!snap.exists()) return res.status(404).json({ error: "Membre introuvable." });
      memberEmail = str((snap.data() as Record<string, unknown>).ownerEmail).toLowerCase();
      recipients = 1;
    } else {
      const snap = await getDocs(query(collection(db, "tenants"), fsLimit(500)));
      recipients = snap.size;
    }
    const scheduled = !!str(b.sendAt);
    const announcement = {
      audience, planId, memberId, memberEmail, title, body,
      channels: sendEmail ? ["dashboard", "email"] : ["dashboard"],
      sendAt: str(b.sendAt) || nowIso(), sentAt: scheduled ? "" : nowIso(),
      createdAt: nowIso(), createdBy: adminOf(req).email, recipients
    };
    await setDoc(doc(collection(db, "announcements")), announcement);
    // Envoi email immédiat (si demandé, non planifié, SMTP prêt)
    let emailSent = 0;
    if (sendEmail && !scheduled) {
      const smtp = await getSmtpTransportConfig();
      if (smtp) {
        const emails: string[] = [];
        if (audience === "member" && memberEmail) emails.push(memberEmail);
        else {
          const snap = await getDocs(query(collection(db, "tenants"), audience === "plan" ? where("plan", "==", planId) : where("status", "==", "active"), fsLimit(300)));
          snap.forEach((d) => { const e = str((d.data() as Record<string, unknown>).ownerEmail).toLowerCase(); if (e) emails.push(e); });
        }
        const transport = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.port === 465, auth: { user: smtp.user, pass: smtp.pass } });
        for (const email of emails.slice(0, 100)) {
          try { await transport.sendMail({ from: smtp.from, to: email, subject: title, text: body }); emailSent += 1; } catch { /* envoi individuel échoué */ }
        }
      }
    }
    await logAdminAudit({ actor: adminOf(req), action: "notification.send", target: `audience=${audience}${planId ? ":" + planId : ""}${memberId ? ":" + memberId : ""}`, after: { title, recipients, scheduled, emailSent } });
    res.json({ ok: true, recipients, emailSent, scheduled });
  } catch (e) { console.error("send notification", e); res.status(500).json({ error: "Erreur envoi notification." }); }
});

router.delete("/notifications/:id", adminApiGuard("notifications"), async (req, res) => {
  try {
    await deleteDoc(doc(db, "announcements", req.params.id));
    await logAdminAudit({ actor: adminOf(req), action: "notification.delete", target: req.params.id });
    res.json({ ok: true });
  } catch (e) { console.error("DELETE notification", e); res.status(500).json({ error: "Erreur suppression." }); }
});

// ---------------------------------------------------------------------------
// SANTÉ SYSTÈME
// ---------------------------------------------------------------------------

router.get("/health", adminApiGuard("health"), async (_req, res) => {
  try {
    const started = Date.now();
    const [counters, cronDaily, cronWa, errors] = await Promise.all([
      getDoc(doc(db, "platform_counters", "global")).catch(() => null),
      getDoc(doc(db, "platform_settings", "cron_daily")).catch(() => null),
      getDoc(doc(db, "platform_settings", "cron_last")).catch(() => null),
      getDocs(query(collection(db, "platform_errors"), orderBy("at", "desc"), fsLimit(10))).catch(() => null)
    ]);
    const waCfg = await getWaAdminConfig();
    const smtp = await getSmtpTransportConfig();
    res.json({
      ok: true,
      version: {
        bundleId: process.env.ENOVA_BUNDLE_ID || "",
        commit: process.env.VERCEL_GIT_COMMIT_SHA || "",
        region: process.env.VERCEL_REGION || "",
        node: process.version,
        env: process.env.NODE_ENV || ""
      },
      firestore: { ok: !!counters, latencyMs: Date.now() - started, updatedAt: str((counters?.data() as Record<string, unknown> | undefined)?.updatedAt || "") },
      whatsapp: { mode: waCfg.mode, configured: waCfg.hasToken, webhookVerifiedAt: waCfg.webhookVerifiedAt || "", source: waCfg.source },
      smtp: { configured: !!smtp },
      cron: {
        daily: (cronDaily?.data() || {}) as Record<string, unknown>,
        whatsapp: (cronWa?.data() || {}) as Record<string, unknown>
      },
      recentErrors: (errors ? errors.docs : []).map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })),
      serverTime: nowIso()
    });
  } catch (e) { console.error("health", e); res.status(500).json({ error: "Erreur santé système." }); }
});

router.post("/jobs/run", adminApiGuard("health"), async (req, res) => {
  try {
    const jobs = await runDailyJobs();
    await logAdminAudit({ actor: adminOf(req), action: "jobs.run_daily", target: "cron", after: jobs });
    res.json({ ok: true, jobs });
  } catch (e) { console.error("jobs/run", e); res.status(500).json({ error: "Erreur exécution jobs." }); }
});

export default router;
