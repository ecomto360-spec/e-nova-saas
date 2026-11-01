/**
 * LOT B + C — Modules SUPER ADMIN (serveur).
 * Membres, Boutiques, Plans, Abonnements, Paiements (validation manuelle),
 * Factures PDF numérotées, Coupons, Rapports MRR/churn, Statistiques,
 * Gestion des données de test, Jobs quotidiens (relances + grâce).
 *
 * Sécurité : toutes les routes passent par adminApiGuard (identité + permission
 * module, vérifiées côté serveur). Chaque action sensible est journalisée dans
 * admin_audit via logAdminAudit (sans secrets). Aucune donnée n'est lue
 * directement par le client admin : tout transite par ces endpoints.
 */
import express from "express";
import crypto from "crypto";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, runTransaction
} from "firebase/firestore";
import { db, firebaseConfig } from "../lib/firebase-backend.js";
import { adminApiGuard, logAdminAudit, isoOf, type AdminIdentity } from "./adminApi.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RequestWithAdmin extends express.Request { admin?: AdminIdentity; }
const adminOf = (req: express.Request): AdminIdentity => (req as RequestWithAdmin).admin as AdminIdentity;
const nowIso = (): string => new Date().toISOString();
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);
const SYSTEM_IDENTITY: AdminIdentity = { id: "system", email: "system@e-nova", role: "super_admin", via: "admin_session" };

/** Un tenant est-il une donnée de test ? (flag explicite ou domaine de test) */
export function isTestTenant(data: Record<string, unknown>): boolean {
  if (data.isTest === true) return true;
  const email = str(data.ownerEmail).toLowerCase();
  return email.endsWith("@dztest.com") || email.endsWith("@test.com") || email.endsWith("@example.com");
}

interface TenantRow {
  id: string; storeName: string; ownerEmail: string; phone: string; slug: string;
  plan: string; status: string; createdAt: string; planExpiresAt: string;
  lastLoginAt: string; lastSeenAt: string; online: boolean; isTest: boolean;
  admin_notes: string;
}

async function loadTenantsBounded(max = 400): Promise<{ id: string; data: Record<string, unknown> }[]> {
  const snap = await getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc"), fsLimit(max)));
  return snap.docs.map((d) => ({ id: d.id, data: (d.data() || {}) as Record<string, unknown> }));
}

async function presenceOf(uid: string): Promise<{ lastSeenAt: string; lastLoginAt: string; online: boolean; device?: string; country?: string }> {
  try {
    const snap = await getDoc(doc(db, "user_presence", uid));
    if (!snap.exists()) return { lastSeenAt: "", lastLoginAt: "", online: false };
    const d = snap.data() as Record<string, unknown>;
    const seen = isoOf(d.lastSeenAt);
    return {
      lastSeenAt: seen,
      lastLoginAt: isoOf(d.lastLoginAt),
      online: !!seen && Date.now() - Date.parse(seen) < 120_000,
      device: str(d.device) || undefined, country: str(d.country) || undefined
    };
  } catch { return { lastSeenAt: "", lastLoginAt: "", online: false }; }
}

function tenantRow(t: { id: string; data: Record<string, unknown> }, presence: { lastSeenAt: string; lastLoginAt: string; online: boolean }): TenantRow {
  return {
    id: t.id,
    storeName: str(t.data.storeName) || str(t.data.name) || "—",
    ownerEmail: str(t.data.ownerEmail).toLowerCase(),
    phone: str(t.data.phone || t.data.ownerPhone || ""),
    slug: str(t.data.slug),
    plan: str(t.data.plan || "—"),
    status: str(t.data.status || "active"),
    createdAt: isoOf(t.data.createdAt),
    planExpiresAt: isoOf(t.data.planExpiresAt),
    lastLoginAt: presence.lastLoginAt,
    lastSeenAt: presence.lastSeenAt,
    online: presence.online,
    isTest: isTestTenant(t.data),
    admin_notes: str(t.data.admin_notes)
  };
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return /[";\n]/.test(s) ? `"${s}"` : s;
  };
  return "\uFEFF" + [headers.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n");
}

const csvResponse = (res: express.Response, filename: string, csv: string): void => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
};

// ---------------------------------------------------------------------------
// LOT B — MEMBRES
// ---------------------------------------------------------------------------

router.get("/members", adminApiGuard("members"), async (req, res) => {
  try {
    const { search = "", status = "", plan = "", sort = "createdAt", includeTest = "1" } = req.query as Record<string, string>;
    const tenants = await loadTenantsBounded();
    const withPresence = await Promise.all(tenants.map(async (t) => tenantRow(t, await presenceOf(t.id))));
    let rows = includeTest === "0" ? withPresence.filter((r) => !r.isTest) : withPresence;
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.storeName.toLowerCase().includes(q) || r.ownerEmail.includes(q) || r.phone.includes(q) || r.slug.toLowerCase().includes(q));
    if (status) rows = rows.filter((r) => (status === "online" ? r.online : r.status === status));
    if (plan) rows = rows.filter((r) => r.plan === plan);
    const sorters: Record<string, (a: TenantRow, b: TenantRow) => number> = {
      createdAt: (a, b) => b.createdAt.localeCompare(a.createdAt),
      storeName: (a, b) => a.storeName.localeCompare(b.storeName),
      planExpiresAt: (a, b) => a.planExpiresAt.localeCompare(b.planExpiresAt),
      lastLoginAt: (a, b) => b.lastLoginAt.localeCompare(a.lastLoginAt)
    };
    rows.sort(sorters[sort] || sorters.createdAt);
    if (req.query.format === "csv") {
      return csvResponse(res, "membres-e-nova.csv", toCsv(
        ["Nom boutique", "Email", "Telephone", "Slug", "Plan", "Statut", "Inscription", "Expiration", "Derniere connexion", "En ligne", "Test"],
        rows.map((r) => [r.storeName, r.ownerEmail, r.phone, r.slug, r.plan, r.status, r.createdAt, r.planExpiresAt, r.lastLoginAt, r.online ? "oui" : "non", r.isTest ? "oui" : "non"])
      ));
    }
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(String(req.query.pageSize || "20"), 10) || 20));
    res.json({ total: rows.length, page, pageSize, pages: Math.max(1, Math.ceil(rows.length / pageSize)), rows: rows.slice((page - 1) * pageSize, page * pageSize) });
  } catch (e) {
    console.error("GET /members", e);
    res.status(500).json({ error: "Erreur lors du chargement des membres." });
  }
});

/** Fiche membre complète : infos + présence + paiements + activité + notes. */
router.get("/members/:id", adminApiGuard("members"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "tenants", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Membre introuvable." });
    const data = snap.data() as Record<string, unknown>;
    const presence = await presenceOf(req.params.id);
    const [paySnap, ordSnap, prodSnap, auditSnap] = await Promise.all([
      getDocs(query(collection(db, "payments"), where("tenantId", "==", req.params.id), fsLimit(100))).catch(() => null),
      getDocs(query(collection(db, "tenants", req.params.id, "orders"), fsLimit(500))).catch(() => null),
      getDocs(query(collection(db, "tenants", req.params.id, "products"), fsLimit(500))).catch(() => null),
      getDocs(query(collection(db, "admin_audit"), orderBy("at", "desc"), fsLimit(200))).catch(() => null)
    ]);
    const payments = (paySnap ? paySnap.docs : []).map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .sort((a, b) => str(b.createdAt).localeCompare(str(a.createdAt)));
    const activity = (auditSnap ? auditSnap.docs : [])
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter((a) => str(a.target).includes(req.params.id))
      .slice(0, 15);
    res.json({
      member: tenantRow({ id: req.params.id, data }, presence),
      store: { slug: str(data.slug), theme: str(data.theme || ""), settings: str(data.settings ? "configuré" : "") },
      counts: { payments: payments.length, orders: ordSnap ? ordSnap.size : 0, products: prodSnap ? prodSnap.size : 0 },
      payments,
      activity,
      presence
    });
  } catch (e) {
    console.error("GET /members/:id", e);
    res.status(500).json({ error: "Erreur lors du chargement de la fiche membre." });
  }
});

/** Mise à jour d'un membre (téléphone, nom, notes admin…). */
router.patch("/members/:id", adminApiGuard("members"), async (req, res) => {
  try {
    const allowed = ["storeName", "phone", "admin_notes", "ownerEmail"];
    const patch: Record<string, unknown> = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = str(req.body[k]).slice(0, k === "admin_notes" ? 2000 : 200);
    if (!Object.keys(patch).length) return res.status(400).json({ error: "Aucun champ modifiable fourni." });
    const before = await getDoc(doc(db, "tenants", req.params.id));
    if (!before.exists()) return res.status(404).json({ error: "Membre introuvable." });
    await updateDoc(doc(db, "tenants", req.params.id), patch);
    await logAdminAudit({ actor: adminOf(req), action: "member.update", target: req.params.id, before: before.data(), after: patch, req });
    res.json({ ok: true });
  } catch (e) {
    console.error("PATCH /members/:id", e);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

/** Suspendre un membre : statut + déconnexion forcée (présence supprimée, heartbeat refusé). */
router.post("/members/:id/suspend", adminApiGuard("members"), async (req, res) => {
  try {
    const reason = str(req.body?.reason).slice(0, 300);
    const before = await getDoc(doc(db, "tenants", req.params.id));
    if (!before.exists()) return res.status(404).json({ error: "Membre introuvable." });
    const patch = { status: "suspended", suspendedAt: nowIso(), suspendReason: reason };
    await updateDoc(doc(db, "tenants", req.params.id), patch);
    await deleteDoc(doc(db, "user_presence", req.params.id)).catch(() => undefined);
    await logAdminAudit({ actor: adminOf(req), action: "member.suspend", target: req.params.id, before: { status: str((before.data() as Record<string, unknown>).status) }, after: patch, req });
    res.json({ ok: true });
  } catch (e) {
    console.error("POST suspend", e);
    res.status(500).json({ error: "Erreur lors de la suspension." });
  }
});

router.post("/members/:id/reactivate", adminApiGuard("members"), async (req, res) => {
  try {
    const before = await getDoc(doc(db, "tenants", req.params.id));
    if (!before.exists()) return res.status(404).json({ error: "Membre introuvable." });
    const patch = { status: "active", suspendedAt: null, suspendReason: null };
    await updateDoc(doc(db, "tenants", req.params.id), patch);
    await logAdminAudit({ actor: adminOf(req), action: "member.reactivate", target: req.params.id, before: { status: str((before.data() as Record<string, unknown>).status) }, after: patch, req });
    res.json({ ok: true });
  } catch (e) {
    console.error("POST reactivate", e);
    res.status(500).json({ error: "Erreur lors de la réactivation." });
  }
});

/** Réinitialisation du mot de passe : envoie l'email officiel Firebase au membre. */
router.post("/members/:id/reset-password", adminApiGuard("members"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "tenants", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Membre introuvable." });
    const email = str((snap.data() as Record<string, unknown>).ownerEmail).toLowerCase();
    const apiKey = String(firebaseConfig.apiKey || "");
    if (!apiKey) return res.status(500).json({ error: "Clé API Firebase indisponible côté serveur." });
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email })
    });
    if (!r.ok) return res.status(502).json({ error: "Firebase a refusé l'envoi de l'email de réinitialisation." });
    await logAdminAudit({ actor: adminOf(req), action: "member.reset_password_email", target: req.params.id, req });
    res.json({ ok: true });
  } catch (e) {
    console.error("POST reset-password", e);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email de réinitialisation." });
  }
});

/** Suppression d'un membre (confirmation côté client) + best-effort sous-collections. */
router.delete("/members/:id", adminApiGuard("members"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "tenants", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Membre introuvable." });
    const data = snap.data() as Record<string, unknown>;
    const del = async (col: string, doc0: string, sub: string, max = 200): Promise<number> => {
      try {
        const s = await getDocs(query(collection(db, col, doc0, sub), fsLimit(max)));
        await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
        return s.size;
      } catch { return 0; }
    };
    const counts = {
      orders: await del("tenants", req.params.id, "orders"),
      products: await del("tenants", req.params.id, "products"),
      carts: await del("tenants", req.params.id, "abandoned_carts"),
      settings: await del("tenants", req.params.id, "settings", 20)
    };
    let payDeleted = 0;
    try {
      const pays = await getDocs(query(collection(db, "payments"), where("tenantId", "==", req.params.id), fsLimit(200)));
      await Promise.all(pays.docs.map((d) => deleteDoc(d.ref)));
      payDeleted = pays.size;
    } catch { /* collection payments absente */ }
    await deleteDoc(doc(db, "user_presence", req.params.id)).catch(() => undefined);
    await deleteDoc(doc(db, "tenants", req.params.id));
    await logAdminAudit({ actor: adminOf(req), action: "member.delete", target: req.params.id, before: { storeName: str(data.storeName), ownerEmail: str(data.ownerEmail) }, after: { ...counts, payments: payDeleted }, req });
    res.json({ ok: true, deleted: { ...counts, payments: payDeleted } });
  } catch (e) {
    console.error("DELETE /members/:id", e);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

/**
 * « Se connecter en tant que » — vue support : renvoie les données de la
 * boutique du membre (réglages, produits, commandes récentes) pour les
 * afficher DANS le panneau admin avec bandeau visible. L'action est tracée.
 * (Une session Firebase complète nécessiterait le SDK Admin — roadmap.)
 */
router.get("/members/:id/support-view", adminApiGuard("members"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "tenants", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Membre introuvable." });
    const data = snap.data() as Record<string, unknown>;
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (/pass|secret|token|key/i.test(k)) continue;
      safe[k] = v;
    }
    const [prods, ords] = await Promise.all([
      getDocs(query(collection(db, "tenants", req.params.id, "products"), fsLimit(50))).catch(() => null),
      getDocs(query(collection(db, "tenants", req.params.id, "orders"), orderBy("createdAt", "desc"), fsLimit(20))).catch(() => null)
    ]);
    await logAdminAudit({ actor: adminOf(req), action: "member.support_view", target: req.params.id, req });
    res.json({
      member: tenantRow({ id: req.params.id, data }, await presenceOf(req.params.id)),
      settings: safe,
      products: prods ? prods.docs.map((d) => ({ id: d.id, name: str((d.data() as Record<string, unknown>).name), price: num((d.data() as Record<string, unknown>).price) })) : [],
      orders: ords ? ords.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) : []
    });
  } catch (e) {
    console.error("support-view", e);
    res.status(500).json({ error: "Erreur lors de l'ouverture de la vue support." });
  }
});

// ---------------------------------------------------------------------------
// LOT B — BOUTIQUES
// ---------------------------------------------------------------------------

router.get("/stores", adminApiGuard("stores"), async (req, res) => {
  try {
    const { search = "", status = "" } = req.query as Record<string, string>;
    const tenants = await loadTenantsBounded();
    const rows = tenants.map((t) => {
      const d = t.data;
      return {
        id: t.id, name: str(d.storeName) || "—", slug: str(d.slug), owner: str(d.ownerEmail).toLowerCase(),
        plan: str(d.plan || "—"), status: str(d.status || "active"), theme: str(d.theme || "défaut"),
        createdAt: isoOf(d.createdAt), isTest: isTestTenant(d)
      };
    });
    let list = rows;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.slug.includes(q) || r.owner.includes(q));
    if (status) list = list.filter((r) => r.status === status);
    if (req.query.format === "csv") {
      return csvResponse(res, "boutiques-e-nova.csv", toCsv(["Boutique", "Slug", "Proprietaire", "Plan", "Theme", "Statut", "Creee le"], list.map((r) => [r.name, r.slug, r.owner, r.plan, r.theme, r.status, r.createdAt])));
    }
    res.json({ total: list.length, rows: list });
  } catch (e) {
    console.error("GET /stores", e);
    res.status(500).json({ error: "Erreur lors du chargement des boutiques." });
  }
});

/** Changement de slug : unicité + slugs réservés vérifiés. */
router.post("/stores/:id/slug", adminApiGuard("stores"), async (req, res) => {
  try {
    const slug = str(req.body?.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
    if (!slug || slug.length < 3) return res.status(400).json({ error: "Slug invalide (3 caractères minimum)." });
    const reserved = await reservedSlugs();
    if (reserved.includes(slug)) return res.status(400).json({ error: "Ce slug est réservé par la plateforme." });
    const dup = await getDocs(query(collection(db, "tenants"), where("slug", "==", slug), fsLimit(2)));
    if (dup.size > 0 && dup.docs[0].id !== req.params.id) return res.status(400).json({ error: "Ce slug est déjà utilisé par une autre boutique." });
    const before = await getDoc(doc(db, "tenants", req.params.id));
    if (!before.exists()) return res.status(404).json({ error: "Boutique introuvable." });
    await updateDoc(doc(db, "tenants", req.params.id), { slug });
    await logAdminAudit({ actor: adminOf(req), action: "store.slug_change", target: req.params.id, before: { slug: str((before.data() as Record<string, unknown>).slug) }, after: { slug }, req });
    res.json({ ok: true, slug });
  } catch (e) {
    console.error("POST slug", e);
    res.status(500).json({ error: "Erreur lors du changement de slug." });
  }
});

async function reservedSlugs(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "general"));
    const d = snap.data() as { reservedSlugs?: unknown } | undefined;
    return Array.isArray(d?.reservedSlugs) ? d.reservedSlugs.map(String) : ["admin", "api", "login", "register", "store", "dashboard", "legal"];
  } catch { return ["admin", "api", "login", "register", "store", "dashboard", "legal"]; }
}

// ---------------------------------------------------------------------------
// LOT C — PLANS
// ---------------------------------------------------------------------------

export interface PlanDoc {
  id: string; name: string; priceMonthly: number; currency: string; trialDays: number;
  maxProducts: number; allowedThemes: string[]; allowedExtensions: string[]; waQuota: number;
  active: boolean; sortOrder: number;
}

const DEFAULT_PLANS: Omit<PlanDoc, "id">[] = [
  { name: "Gratuit", priceMonthly: 0, currency: "DZD", trialDays: 0, maxProducts: 10, allowedThemes: ["classique"], allowedExtensions: [], waQuota: 0, active: true, sortOrder: 0 },
  { name: "Starter", priceMonthly: 2500, currency: "DZD", trialDays: 7, maxProducts: 50, allowedThemes: ["classique", "moderne"], allowedExtensions: ["whatsapp"], waQuota: 100, active: true, sortOrder: 1 },
  { name: "Business", priceMonthly: 4500, currency: "DZD", trialDays: 14, maxProducts: 200, allowedThemes: ["classique", "moderne", "luxe"], allowedExtensions: ["whatsapp", "pixels"], waQuota: 500, active: true, sortOrder: 2 },
  { name: "Pro", priceMonthly: 7500, currency: "DZD", trialDays: 14, maxProducts: 1000, allowedThemes: ["*"], allowedExtensions: ["*"], waQuota: 2000, active: true, sortOrder: 3 }
];

const slugify = (s: string): string => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export async function listPlans(): Promise<PlanDoc[]> {
  const snap = await getDocs(query(collection(db, "plans"), orderBy("sortOrder", "asc"), fsLimit(50)));
  if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlanDoc, "id">) }));
  // Amorçage automatique au premier accès
  await Promise.all(DEFAULT_PLANS.map((p) => setDoc(doc(db, "plans", slugify(p.name)), { ...p }, { merge: true })));
  return DEFAULT_PLANS.map((p) => ({ id: slugify(p.name), ...p }));
}

router.get("/plans", adminApiGuard("billing"), async (_req, res) => {
  try { res.json({ plans: await listPlans() }); } catch (e) { console.error("GET /plans", e); res.status(500).json({ error: "Erreur plans." }); }
});

router.post("/plans", adminApiGuard("billing"), async (req, res) => {
  try {
    const b = req.body || {};
    const name = str(b.name).trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: "Nom du plan requis." });
    const plan = {
      name, priceMonthly: Math.max(0, num(b.priceMonthly)), currency: "DZD",
      trialDays: Math.max(0, Math.min(90, num(b.trialDays))), maxProducts: Math.max(1, num(b.maxProducts) || 50),
      allowedThemes: Array.isArray(b.allowedThemes) ? b.allowedThemes.map(String) : ["classique"],
      allowedExtensions: Array.isArray(b.allowedExtensions) ? b.allowedExtensions.map(String) : [],
      waQuota: Math.max(0, num(b.waQuota)), active: b.active !== false, sortOrder: num(b.sortOrder)
    };
    const id = slugify(name);
    await setDoc(doc(db, "plans", id), plan, { merge: true });
    await logAdminAudit({ actor: adminOf(req), action: "plan.create", target: id, after: plan, req });
    res.json({ ok: true, id });
  } catch (e) { console.error("POST /plans", e); res.status(500).json({ error: "Erreur création plan." }); }
});

router.patch("/plans/:id", adminApiGuard("billing"), async (req, res) => {
  try {
    const before = await getDoc(doc(db, "plans", req.params.id));
    if (!before.exists()) return res.status(404).json({ error: "Plan introuvable." });
    const b = req.body || {};
    const patch: Record<string, unknown> = {};
    if ("name" in b) patch.name = str(b.name).slice(0, 60);
    if ("priceMonthly" in b) patch.priceMonthly = Math.max(0, num(b.priceMonthly));
    if ("trialDays" in b) patch.trialDays = Math.max(0, Math.min(90, num(b.trialDays)));
    if ("maxProducts" in b) patch.maxProducts = Math.max(1, num(b.maxProducts) || 50);
    if ("allowedThemes" in b) patch.allowedThemes = Array.isArray(b.allowedThemes) ? b.allowedThemes.map(String) : [];
    if ("allowedExtensions" in b) patch.allowedExtensions = Array.isArray(b.allowedExtensions) ? b.allowedExtensions.map(String) : [];
    if ("waQuota" in b) patch.waQuota = Math.max(0, num(b.waQuota));
    if ("active" in b) patch.active = b.active === true;
    if ("sortOrder" in b) patch.sortOrder = num(b.sortOrder);
    await updateDoc(doc(db, "plans", req.params.id), patch);
    await logAdminAudit({ actor: adminOf(req), action: "plan.update", target: req.params.id, before: before.data(), after: patch, req });
    res.json({ ok: true });
  } catch (e) { console.error("PATCH /plans", e); res.status(500).json({ error: "Erreur mise à jour plan." }); }
});

router.delete("/plans/:id", adminApiGuard("billing"), async (req, res) => {
  try {
    const inUse = await getDocs(query(collection(db, "tenants"), where("plan", "==", req.params.id), fsLimit(1)));
    if (inUse.size > 0) return res.status(400).json({ error: "Plan utilisé par des boutiques : désactivez-le plutôt que le supprimer." });
    await deleteDoc(doc(db, "plans", req.params.id));
    await logAdminAudit({ actor: adminOf(req), action: "plan.delete", target: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { console.error("DELETE /plans", e); res.status(500).json({ error: "Erreur suppression plan." }); }
});

// ---------------------------------------------------------------------------
// LOT C — ABONNEMENTS
// ---------------------------------------------------------------------------

router.get("/subscriptions", adminApiGuard("billing"), async (req, res) => {
  try {
    const { state = "", plan = "", search = "" } = req.query as Record<string, string>;
    const [tenants, plans] = await Promise.all([loadTenantsBounded(), listPlans()]);
    const planName = (p: string): string => plans.find((x) => x.id === p || x.name.toLowerCase() === p.toLowerCase())?.name || p;
    const now = Date.now();
    let rows = tenants.map((t) => {
      const d = t.data;
      const exp = isoOf(d.planExpiresAt);
      const status = str(d.status || "active");
      const state = status === "suspended" ? "suspendu" : status === "cancelled" ? "annulé" : exp && Date.parse(exp) < now ? "expiré" : "actif";
      return {
        id: t.id, storeName: str(d.storeName) || "—", ownerEmail: str(d.ownerEmail).toLowerCase(),
        plan: str(d.plan || "—"), planLabel: planName(str(d.plan || "")), planExpiresAt: exp,
        state, status, isTest: isTestTenant(d), daysLeft: exp ? Math.ceil((Date.parse(exp) - now) / 86400000) : null
      };
    });
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.storeName.toLowerCase().includes(q) || r.ownerEmail.includes(q));
    if (plan) rows = rows.filter((r) => r.plan === plan);
    if (state) rows = rows.filter((r) => r.state === state);
    if (req.query.format === "csv") {
      return csvResponse(res, "abonnements-e-nova.csv", toCsv(["Boutique", "Email", "Plan", "Expiration", "Jours restants", "Etat"], rows.map((r) => [r.storeName, r.ownerEmail, r.planLabel, r.planExpiresAt, r.daysLeft ?? "", r.state])));
    }
    res.json({ total: rows.length, rows: rows.sort((a, b) => (b.planExpiresAt || "").localeCompare(a.planExpiresAt || "")) });
  } catch (e) { console.error("GET /subscriptions", e); res.status(500).json({ error: "Erreur abonnements." }); }
});

router.post("/subscriptions/:id/extend", adminApiGuard("billing"), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(3650, num(req.body?.days) || 30));
    const snap = await getDoc(doc(db, "tenants", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Abonnement introuvable." });
    const d = snap.data() as Record<string, unknown>;
    const current = isoOf(d.planExpiresAt);
    const base = current && Date.parse(current) > Date.now() ? Date.parse(current) : Date.now();
    const planExpiresAt = new Date(base + days * 86400000).toISOString();
    const patch = { planExpiresAt, status: "active", suspendedAt: null, suspendReason: null };
    await updateDoc(doc(db, "tenants", req.params.id), patch);
    await logAdminAudit({ actor: adminOf(req), action: "subscription.extend", target: req.params.id, before: { planExpiresAt: current }, after: { planExpiresAt: planExpiresAt, days }, req });
    res.json({ ok: true, planExpiresAt });
  } catch (e) { console.error("extend", e); res.status(500).json({ error: "Erreur prolongation." }); }
});

router.post("/subscriptions/:id/plan", adminApiGuard("billing"), async (req, res) => {
  try {
    const planId = str(req.body?.planId);
    const plans = await listPlans();
    if (!plans.find((p) => p.id === planId)) return res.status(400).json({ error: "Plan inconnu." });
    const snap = await getDoc(doc(db, "tenants", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Abonnement introuvable." });
    const d = snap.data() as Record<string, unknown>;
    const before = { plan: str(d.plan), planExpiresAt: isoOf(d.planExpiresAt) };
    const patch: Record<string, unknown> = { plan: planId };
    if (req.body?.resetExpiry === true) patch.planExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    await updateDoc(doc(db, "tenants", req.params.id), patch);
    await logAdminAudit({ actor: adminOf(req), action: "subscription.plan_change", target: req.params.id, before, after: patch, req });
    res.json({ ok: true });
  } catch (e) { console.error("plan change", e); res.status(500).json({ error: "Erreur changement de plan." }); }
});

router.post("/subscriptions/:id/cancel", adminApiGuard("billing"), async (req, res) => {
  try {
    const before = await getDoc(doc(db, "tenants", req.params.id));
    if (!before.exists()) return res.status(404).json({ error: "Abonnement introuvable." });
    const patch = { status: "cancelled", cancelledAt: nowIso() };
    await updateDoc(doc(db, "tenants", req.params.id), patch);
    await logAdminAudit({ actor: adminOf(req), action: "subscription.cancel", target: req.params.id, before: { status: str((before.data() as Record<string, unknown>).status) }, after: patch, req });
    res.json({ ok: true });
  } catch (e) { console.error("cancel", e); res.status(500).json({ error: "Erreur annulation." }); }
});

// ---------------------------------------------------------------------------
// LOT C — PAIEMENTS
// ---------------------------------------------------------------------------

interface PaymentDoc { id: string; tenantId: string; storeName: string; email: string; amountDA: number; paymentMethod: string; status: string; createdAt: string; note: string; proofUrl: string; }

async function loadPaymentsBounded(max = 500): Promise<PaymentDoc[]> {
  const snap = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc"), fsLimit(max)));
  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    return {
      id: d.id, tenantId: str(x.tenantId), storeName: str(x.storeName),
      email: str(x.email || x.ownerEmail).toLowerCase(), amountDA: num(x.amountDA),
      paymentMethod: str(x.paymentMethod || x.method), status: str(x.status),
      createdAt: isoOf(x.createdAt), note: str(x.note || x.notes), proofUrl: str(x.proofUrl || x.receiptUrl || x.url)
    };
  });
}

router.get("/payments", adminApiGuard("payments"), async (req, res) => {
  try {
    const { status = "", method = "", search = "" } = req.query as Record<string, string>;
    let rows = await loadPaymentsBounded();
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((p) => p.storeName.toLowerCase().includes(q) || p.email.includes(q) || p.id.toLowerCase().includes(q));
    if (status) rows = rows.filter((p) => p.status === status);
    if (method) rows = rows.filter((p) => p.paymentMethod.toLowerCase().includes(method.toLowerCase()));
    if (req.query.format === "csv") {
      return csvResponse(res, "paiements-e-nova.csv", toCsv(["Date", "Boutique", "Email", "Montant DA", "Methode", "Statut", "Note"], rows.map((p) => [p.createdAt, p.storeName, p.email, p.amountDA, p.paymentMethod, p.status, p.note])));
    }
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(String(req.query.pageSize || "20"), 10) || 20));
    const manual = rows.filter((p) => p.status === "pending" && /ccp|baridi|virement|manual/i.test(p.paymentMethod)).length;
    res.json({ total: rows.length, pendingManual: manual, page, pageSize, pages: Math.max(1, Math.ceil(rows.length / pageSize)), rows: rows.slice((page - 1) * pageSize, page * pageSize) });
  } catch (e) { console.error("GET /payments", e); res.status(500).json({ error: "Erreur paiements." }); }
});

/** Numéro de facture séquentiel INV-<année>-<0000> (transaction). */
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const ref = doc(db, "platform_counters", "invoice_seq");
  let value = 1;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() ? num((snap.data() as Record<string, unknown>)[String(year)]) : 0;
    value = cur + 1;
    tx.set(ref, { [String(year)]: value }, { merge: true });
  });
  return `INV-${year}-${String(value).padStart(4, "0")}`;
}

const PAYMENT_VALIDATED = ["completed", "validated", "validé", "valide"];

router.post("/payments/:id/validate", adminApiGuard("payments"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "payments", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Paiement introuvable." });
    const pay = snap.data() as Record<string, unknown>;
    if (PAYMENT_VALIDATED.includes(str(pay.status))) return res.status(400).json({ error: "Ce paiement est déjà validé." });
    const extendDays = Math.max(1, Math.min(365, num(req.body?.extendDays) || 30));
    const planId = str(req.body?.planId || pay.plan || "");
    const note = str(req.body?.note).slice(0, 300);
    const now = nowIso();
    // 1. Paiement validé
    await updateDoc(doc(db, "payments", req.params.id), { status: "completed", validatedAt: now, validatedBy: adminOf(req).email, validationNote: note });
    // 2. Abonnement activé/prolongé
    let planExpiresAt = "";
    if (pay.tenantId) {
      const tRef = doc(db, "tenants", str(pay.tenantId));
      const tSnap = await getDoc(tRef);
      if (tSnap.exists()) {
        const d = tSnap.data() as Record<string, unknown>;
        const current = isoOf(d.planExpiresAt);
        const base = current && Date.parse(current) > Date.now() ? Date.parse(current) : Date.now();
        planExpiresAt = new Date(base + extendDays * 86400000).toISOString();
        const patch: Record<string, unknown> = { planExpiresAt, status: "active", suspendedAt: null, suspendReason: null };
        if (planId) patch.plan = planId;
        await updateDoc(tRef, patch);
      }
    }
    // 3. Facture numérotée
    const number = await nextInvoiceNumber();
    const invoice = {
      number, paymentId: req.params.id, tenantId: str(pay.tenantId), storeName: str(pay.storeName),
      email: str(pay.email || ""), amountDA: num(pay.amountDA), plan: planId, durationDays: extendDays,
      date: now, createdBy: adminOf(req).email
    };
    await setDoc(doc(db, "invoices", number), invoice);
    await logAdminAudit({ actor: adminOf(req), action: "payment.validate", target: `payments/${req.params.id}`, before: { status: str(pay.status) }, after: { status: "completed", invoice: number, planExpiresAt, extendDays }, req });
    res.json({ ok: true, planExpiresAt, invoice });
  } catch (e) { console.error("validate", e); res.status(500).json({ error: "Erreur validation paiement." }); }
});

router.post("/payments/:id/reject", adminApiGuard("payments"), async (req, res) => {
  try {
    const reason = str(req.body?.reason).slice(0, 500);
    if (!reason) return res.status(400).json({ error: "Un motif est requis pour refuser un paiement." });
    const snap = await getDoc(doc(db, "payments", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Paiement introuvable." });
    const before = { status: str((snap.data() as Record<string, unknown>).status) };
    await updateDoc(doc(db, "payments", req.params.id), { status: "rejected", rejectedAt: nowIso(), rejectedBy: adminOf(req).email, rejectionReason: reason });
    await logAdminAudit({ actor: adminOf(req), action: "payment.reject", target: `payments/${req.params.id}`, before, after: { status: "rejected", reason }, req });
    res.json({ ok: true });
  } catch (e) { console.error("reject", e); res.status(500).json({ error: "Erreur refus paiement." }); }
});

router.get("/payments/invoices", adminApiGuard("payments"), async (_req, res) => {
  try {
    const snap = await getDocs(query(collection(db, "invoices"), orderBy("date", "desc"), fsLimit(200)));
    res.json({ total: snap.size, rows: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) });
  } catch (e) { console.error("invoices", e); res.status(500).json({ error: "Erreur factures." }); }
});

// --- Facture PDF (générée à la volée, sans dépendance) ---
function pdfEscape(s: string): string { return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function latin1(s: string): string { return s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?"); }

function buildInvoicePdf(inv: Record<string, unknown>): Buffer {
  const money = (n: number): string => n.toLocaleString("fr-FR").replace(/\u202F|\u00A0/g, " ") + " DA";
  const lines: [string, number][] = [
    ["E-NOVA - Facture d'abonnement", 22], ["", 8],
    [`Facture : ${str(inv.number)}`, 12], [`Date : ${str(inv.date).slice(0, 10)}`, 12], ["", 10],
    [`Client : ${str(inv.storeName)}`, 12], [`Email : ${str(inv.email) || "-"}`, 12], ["", 10],
    ["Detail", 13], [`Abonnement ${str(inv.plan) || "standard"} - ${num(inv.durationDays)} jour(s)`, 11],
    ["", 8], [`TOTAL : ${money(num(inv.amountDA))}`, 16], ["", 12],
    ["Merci de votre confiance.", 10], ["E-nova - plateforme e-commerce Algerie", 9]
  ];
  let y = 780; let content = "";
  for (const [text, size] of lines) {
    if (text) content += `BT /F1 ${size} Tf 60 ${y} Td (${pdfEscape(latin1(text))}) Tj ET\n`;
    y -= size + 10;
  }
  const objs = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>",
    `<</Length ${Buffer.byteLength(content)}>>\nstream\n${content}endstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

router.get("/payments/invoices/:id/pdf", adminApiGuard("payments"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "invoices", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Facture introuvable." });
    const pdf = buildInvoicePdf(snap.data() as Record<string, unknown>);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (e) { console.error("pdf", e); res.status(500).json({ error: "Erreur génération PDF." }); }
});

// --- Coupons d'abonnement ---
router.get("/coupons", adminApiGuard("billing"), async (_req, res) => {
  try {
    const snap = await getDocs(query(collection(db, "coupons"), fsLimit(100)));
    res.json({ total: snap.size, rows: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) });
  } catch (e) { console.error("coupons", e); res.status(500).json({ error: "Erreur coupons." }); }
});

router.post("/coupons", adminApiGuard("billing"), async (req, res) => {
  try {
    const b = req.body || {};
    const code = str(b.code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
    if (!code) return res.status(400).json({ error: "Code requis." });
    const coupon = {
      code, percentOff: Math.min(100, Math.max(0, num(b.percentOff))), amountOff: Math.max(0, num(b.amountOff)),
      planId: str(b.planId || ""), expiresAt: str(b.expiresAt || ""), maxRedemptions: Math.max(0, num(b.maxRedemptions)),
      redemptions: 0, active: true, note: str(b.note).slice(0, 200), createdAt: nowIso()
    };
    if (!coupon.percentOff && !coupon.amountOff) return res.status(400).json({ error: "Remise requise (% ou montant)." });
    await setDoc(doc(db, "coupons", code), coupon);
    await logAdminAudit({ actor: adminOf(req), action: "coupon.create", target: code, after: coupon, req });
    res.json({ ok: true, id: code });
  } catch (e) { console.error("POST coupons", e); res.status(500).json({ error: "Erreur création coupon." }); }
});

router.post("/coupons/:id/toggle", adminApiGuard("billing"), async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "coupons", req.params.id));
    if (!snap.exists()) return res.status(404).json({ error: "Coupon introuvable." });
    const active = (snap.data() as Record<string, unknown>).active !== false;
    await updateDoc(doc(db, "coupons", req.params.id), { active: !active });
    await logAdminAudit({ actor: adminOf(req), action: "coupon.toggle", target: req.params.id, before: { active }, after: { active: !active }, req });
    res.json({ ok: true, active: !active });
  } catch (e) { console.error("toggle coupon", e); res.status(500).json({ error: "Erreur coupon." }); }
});

router.delete("/coupons/:id", adminApiGuard("billing"), async (req, res) => {
  try {
    await deleteDoc(doc(db, "coupons", req.params.id));
    await logAdminAudit({ actor: adminOf(req), action: "coupon.delete", target: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { console.error("DELETE coupon", e); res.status(500).json({ error: "Erreur suppression coupon." }); }
});

// --- Rapports (revenus / MRR / churn) ---
router.get("/payments/reports", adminApiGuard("payments"), async (req, res) => {
  try {
    const days = Math.max(7, Math.min(365, num(req.query.days) || 90));
    const fromIso = new Date(Date.now() - days * 86400000).toISOString();
    const [payments, plans, tenants] = await Promise.all([loadPaymentsBounded(500), listPlans(), loadTenantsBounded()]);
    const inRange = payments.filter((p) => PAYMENT_VALIDATED.includes(p.status) && p.createdAt >= fromIso);
    const byMonth = new Map<string, number>();
    const byMethod = new Map<string, number>();
    for (const p of inRange) {
      const m = p.createdAt.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) || 0) + p.amountDA);
      byMethod.set(p.paymentMethod || "inconnu", (byMethod.get(p.paymentMethod || "inconnu") || 0) + p.amountDA);
    }
    const now = Date.now();
    const activeSubs = tenants.filter((t) => {
      const exp = isoOf(t.data.planExpiresAt);
      return str(t.data.status) === "active" && exp && Date.parse(exp) > now && !isTestTenant(t.data);
    });
    const planPrice = (p: string): number => plans.find((x) => x.id === p || x.name.toLowerCase() === p.toLowerCase())?.priceMonthly ?? 0;
    const mrr = activeSubs.reduce((sum, t) => sum + planPrice(str(t.data.plan)), 0);
    const expired30 = tenants.filter((t) => {
      const exp = isoOf(t.data.planExpiresAt);
      return exp && Date.parse(exp) < now && Date.parse(exp) > now - 30 * 86400000 && !isTestTenant(t.data);
    }).length;
    const churn = activeSubs.length + expired30 > 0 ? (expired30 / (activeSubs.length + expired30)) * 100 : 0;
    res.json({
      rangeDays: days,
      revenueTotal: inRange.reduce((s, p) => s + p.amountDA, 0),
      paymentsCount: inRange.length,
      byMonth: [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, amount]) => ({ month, amount })),
      byMethod: [...byMethod.entries()].map(([method, amount]) => ({ method, amount })),
      byPlan: plans.map((p) => ({ plan: p.name, subscribers: activeSubs.filter((t) => str(t.data.plan) === p.id || str(t.data.plan).toLowerCase() === p.name.toLowerCase()).length, mrr: planPrice(p.id) * activeSubs.filter((t) => str(t.data.plan) === p.id || str(t.data.plan).toLowerCase() === p.name.toLowerCase()).length })),
      mrr, activeSubs: activeSubs.length, expired30, churnPercent: Math.round(churn * 10) / 10
    });
  } catch (e) { console.error("reports", e); res.status(500).json({ error: "Erreur rapports." }); }
});

// ---------------------------------------------------------------------------
// STATISTIQUES (module dédié)
// ---------------------------------------------------------------------------

router.get("/stats/insights", adminApiGuard("stats"), async (req, res) => {
  try {
    const days = Math.max(7, Math.min(90, num(req.query.days) || 30));
    const fromIso = new Date(Date.now() - days * 86400000).toISOString();
    const [tenants, plans, carts, statsSnap] = await Promise.all([
      loadTenantsBounded(), listPlans(),
      getDocs(query(collection(db, "abandoned_carts"), fsLimit(1000))).catch(() => null),
      getDocs(query(collection(db, "platform_stats"), fsLimit(120)))
    ]);
    // Répartition par plan
    const clean = tenants.filter((t) => !isTestTenant(t.data));
    const planDistribution = plans.map((p) => ({
      plan: p.name,
      count: clean.filter((t) => str(t.data.plan) === p.id || str(t.data.plan).toLowerCase() === p.name.toLowerCase()).length
    }));
    // Top boutiques + wilayas : parcours des commandes (borné)
    const topStores: { name: string; orders: number; gmv: number }[] = [];
    const wilayas = new Map<string, number>();
    for (const t of clean.slice(0, 40)) {
      try {
        const snap = await getDocs(query(collection(db, "tenants", t.id, "orders"), fsLimit(500)));
        if (!snap.size) continue;
        let gmv = 0;
        for (const o of snap.docs) {
          const od = o.data() as Record<string, unknown>;
          const iso = isoOf(od.createdAt);
          if (!iso || iso < fromIso) continue;
          gmv += num(od.total);
          const w = str(od.wilaya);
          if (w) wilayas.set(w, (wilayas.get(w) || 0) + 1);
        }
        topStores.push({ name: str(t.data.storeName) || t.id, orders: snap.size, gmv });
      } catch { /* sous-collection absente */ }
    }
    topStores.sort((a, b) => b.orders - a.orders);
    // Conversion paniers
    const cartsList = carts ? carts.docs.map((d) => d.data() as Record<string, unknown>) : [];
    const cartsInRange = cartsList.filter((c) => { const iso = isoOf(c.createdAt); return iso && iso >= fromIso; });
    const recovered = cartsInRange.filter((c) => c.status === "recovered" || c.recovered === true).length;
    // Série WhatsApp (documents agrégés quotidiens)
    const waSeries: { date: string; value: number }[] = [];
    for (const d of statsSnap.docs) {
      if (!d.id.startsWith("daily_")) continue;
      const data = d.data() as Record<string, unknown>;
      if (str(data.date) >= fromIso.slice(0, 10)) waSeries.push({ date: str(data.date), value: num(data.waMessages) });
    }
    waSeries.sort((a, b) => a.date.localeCompare(b.date));
    // Rétention approximative : boutiques actives / créées il y a 30 j+
    const active30 = clean.filter((t) => {
      const seen = isoOf((t.data as Record<string, unknown>).lastOrderAt || t.data.createdAt);
      return seen && Date.now() - Date.parse(seen) < 30 * 86400000;
    }).length;
    res.json({
      days,
      planDistribution,
      topStores: topStores.slice(0, 10),
      topWilayas: [...wilayas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, c]) => ({ wilaya: w, orders: c })),
      carts: { total: cartsInRange.length, recovered, conversionPercent: cartsInRange.length ? Math.round((recovered / cartsInRange.length) * 1000) / 10 : 0 },
      waSeries,
      retention: { activeStores: active30, totalStores: clean.length, percent: clean.length ? Math.round((active30 / clean.length) * 1000) / 10 : 0 }
    });
  } catch (e) { console.error("insights", e); res.status(500).json({ error: "Erreur statistiques." }); }
});

// ---------------------------------------------------------------------------
// DONNÉES DE TEST (correctif Lot A)
// ---------------------------------------------------------------------------

router.post("/test-data/purge", adminApiGuard("settings"), async (req, res) => {
  try {
    if (req.body?.confirm !== true) return res.status(400).json({ error: "Confirmation requise." });
    const tenants = await loadTenantsBounded();
    const testTenants = tenants.filter((t) => isTestTenant(t.data));
    let paymentsDeleted = 0;
    for (const t of testTenants) {
      try {
        const pays = await getDocs(query(collection(db, "payments"), where("tenantId", "==", t.id), fsLimit(200)));
        await Promise.all(pays.docs.map((d) => deleteDoc(d.ref)));
        paymentsDeleted += pays.size;
      } catch { /* payments absent */ }
      for (const sub of ["orders", "products", "abandoned_carts", "settings"]) {
        try {
          const s = await getDocs(query(collection(db, "tenants", t.id, sub), fsLimit(200)));
          await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
        } catch { /* sous-collection absente */ }
      }
      await deleteDoc(doc(db, "user_presence", t.id)).catch(() => undefined);
      await deleteDoc(doc(db, "tenants", t.id));
    }
    // Statistiques recalculées SANS les données de test
    const { recomputeStatsExcludingTest } = await import("./adminApi.js");
    const stats = await recomputeStatsExcludingTest(120, 24);
    await logAdminAudit({ actor: adminOf(req), action: "test_data.purge", target: "platform", after: { tenantsDeleted: testTenants.length, paymentsDeleted, ...stats }, req });
    res.json({ ok: true, tenantsDeleted: testTenants.length, paymentsDeleted, stats });
  } catch (e) { console.error("purge", e); res.status(500).json({ error: "Erreur purge données de test." }); }
});

// ---------------------------------------------------------------------------
// JOBS QUOTIDIENS — relances expiration + suspension après grâce + annonces planifiées
// ---------------------------------------------------------------------------

export async function runDailyJobs(): Promise<{ reminders: number; suspended: number; announcements: number }> {
  const now = nowIso();
  const nowMs = Date.now();
  let reminders = 0, suspended = 0, announcements = 0;
  try {
    const generalSnap = await getDoc(doc(db, "platform_settings", "general"));
    const general = (generalSnap.data() || {}) as Record<string, unknown>;
    const graceDays = Math.max(0, Math.min(90, num(general.graceDays) || 7));
    const tenants = await loadTenantsBounded();
    for (const t of tenants) {
      if (isTestTenant(t.data)) continue;
      const d = t.data;
      const exp = isoOf(d.planExpiresAt);
      if (!exp) continue;
      const daysLeft = Math.ceil((Date.parse(exp) - nowMs) / 86400000);
      const stage = daysLeft <= 1 ? "1j" : daysLeft <= 3 ? "3j" : daysLeft <= 7 ? "7j" : "";
      const tRef = doc(db, "tenants", t.id);
      if (stage && str(d.status) === "active" && str((d as Record<string, unknown>).reminderStage) !== stage) {
        await setDoc(doc(db, "announcements"), {
          audience: "member", memberId: t.id, memberEmail: str(d.ownerEmail).toLowerCase(),
          title: "Votre abonnement expire bientôt",
          body: `Votre abonnement e-nova expire dans ${daysLeft} jour(s) (${exp.slice(0, 10)}). Renouvelez-le pour garder votre boutique en ligne.`,
          createdAt: now, createdBy: "system", source: "subscription_reminder", sendAt: now, sentAt: now, channels: ["dashboard"]
        }).catch(() => undefined);
        await updateDoc(tRef, { reminderStage: stage, remindedAt: now }).catch(() => undefined);
        reminders += 1;
      }
      if (Date.parse(exp) < nowMs - graceDays * 86400000 && str(d.status) === "active") {
        await updateDoc(tRef, { status: "suspended", suspendedAt: now, suspendReason: "expired_grace" }).catch(() => undefined);
        await deleteDoc(doc(db, "user_presence", t.id)).catch(() => undefined);
        await logAdminAudit({ actor: SYSTEM_IDENTITY, action: "subscription.auto_suspend", target: t.id, before: { planExpiresAt: exp }, after: { status: "suspended", reason: "expired_grace", graceDays } });
        suspended += 1;
      }
    }
    // Annonces planifiées arrivées à échéance
    try {
      const ann = await getDocs(query(collection(db, "announcements"), where("sentAt", "==", ""), fsLimit(50)));
      for (const a of ann.docs) {
        const data = a.data() as Record<string, unknown>;
        if (str(data.sendAt) && str(data.sendAt) <= now) {
          await updateDoc(a.ref, { sentAt: now }).catch(() => undefined);
          announcements += 1;
        }
      }
    } catch { /* annonces absentes */ }
    await setDoc(doc(db, "platform_settings", "cron_daily"), { lastRunAt: now, reminders, suspended, announcements }, { merge: true }).catch(() => undefined);
  } catch (e) {
    console.error("runDailyJobs", e);
  }
  return { reminders, suspended, announcements };
}

export default router;
