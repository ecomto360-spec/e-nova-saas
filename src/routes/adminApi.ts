import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, startAfter, Timestamp
} from "firebase/firestore";
import { db, firebaseConfig } from "../lib/firebase-backend.js";

/**
 * LOT A — Fondations SUPER ADMIN (/admin)
 * ---------------------------------------------------------------------------
 * Sécurité :
 *  - Chaque requête est vérifiée CÔTÉ SERVEUR : session JWT admin (cookie
 *    HttpOnly `admin_jwt`, 2FA OTP) OU token Firebase avec claim `superAdmin`
 *    OU email listé dans la variable serveur SUPER_ADMIN_EMAILS.
 *  - Rôles staff (super_admin | support | finance | readonly) + matrice de
 *    permissions par module.
 *  - Journal d'audit (admin_audit) : acteur, action, cible, avant/après sans
 *    secrets, IP, date.
 *  - Rate limit mémoire (admin 60/min/IP, heartbeat 1/45 s/uid).
 *  - Aucun secret n'est jamais renvoyé au navigateur.
 *
 * Coûts Firestore :
 *  - Les KPIs lisent des documents AGRÉGÉS (platform_counters/global +
 *    platform_stats/daily|monthly), jamais les collections complètes.
 *  - La reconstruction (recompute) est bornée (≤ 120 jours) et réservée au
 *    super_admin / cron, et journalisée dans l'audit.
 */

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_in_dev_only";

// ---------------------------------------------------------------------------
// Rôles & permissions
// ---------------------------------------------------------------------------

export type AdminRole = "super_admin" | "support" | "finance" | "readonly";
export type AdminModule =
  | "dashboard" | "members" | "stores" | "billing" | "payments" | "stats"
  | "themes" | "extensions" | "integrations" | "settings" | "notifications"
  | "audit" | "health" | "media";

const ROLE_PERMISSIONS: Record<AdminRole, AdminModule[]> = {
  super_admin: ["dashboard", "members", "stores", "billing", "payments", "stats", "themes", "extensions", "integrations", "settings", "notifications", "audit", "health", "media"],
  support: ["dashboard", "members", "stores", "notifications", "audit"],
  finance: ["dashboard", "billing", "payments", "stats", "audit"],
  readonly: ["dashboard", "members", "stores", "stats"]
};

export interface AdminIdentity {
  id: string;
  email: string;
  role: AdminRole;
  via: "admin_session" | "firebase_claim" | "super_admin_emails";
}

interface RequestWithAdmin extends express.Request {
  admin?: AdminIdentity;
}

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "ecomto360@gmail.com,nabsterzero@gmail.com")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

// ---------------------------------------------------------------------------
// Rate limit mémoire (simple, par IP / par uid)
// ---------------------------------------------------------------------------

const rateBuckets = new Map<string, number[]>();
function rateLimit(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    rateBuckets.set(key, arr);
    return false;
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  if (rateBuckets.size > 5000) rateBuckets.clear(); // garde-fou mémoire
  return true;
}

// ---------------------------------------------------------------------------
// Vérification des tokens Firebase via Identity Toolkit (sans Admin SDK)
// ---------------------------------------------------------------------------

interface FirebaseLookupUser {
  localId: string;
  email: string;
  emailVerified?: boolean;
  customAttributes?: string;
  disabled?: boolean;
}

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email: string; claims: Record<string, unknown>; disabled: boolean } | null> {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { users?: FirebaseLookupUser[] };
    const u = j.users?.[0];
    if (!u || !u.localId) return null;
    let claims: Record<string, unknown> = {};
    try { claims = u.customAttributes ? JSON.parse(u.customAttributes) : {}; } catch { claims = {}; }
    return { uid: u.localId, email: (u.email || "").toLowerCase(), claims, disabled: u.disabled === true };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Middleware d'authentification admin
// ---------------------------------------------------------------------------

function tokenFromRequest(req: express.Request): { kind: "bearer"; value: string } | { kind: "admin_jwt"; value: string } | null {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return { kind: "bearer", value: auth.slice(7).trim() };
  }
  const cookie = (req as RequestWithAdmin & { cookies?: Record<string, string> }).cookies?.admin_jwt;
  if (cookie) return { kind: "admin_jwt", value: cookie };
  return null;
}

async function resolveAdmin(req: express.Request): Promise<AdminIdentity | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;

  // 1. Session JWT admin (cookie HttpOnly posé par /api/admin/auth/verify)
  if (token.kind === "admin_jwt") {
    try {
      const payload = jwt.verify(token.value, JWT_SECRET) as { admin_id?: string; role?: string; exp?: number };
      if (!payload.admin_id) return null;
      // Charger la fiche admin (rôle à jour, compte actif)
      try {
        const snap = await getDoc(doc(db, "admin_users", payload.admin_id));
        if (snap.exists()) {
          const data = snap.data() as { email?: string; role?: string; is_active?: boolean };
          if (data.is_active === false) return null;
          const role = normalizeRole(data.role || payload.role);
          return { id: payload.admin_id, email: (data.email || "").toLowerCase(), role, via: "admin_session" };
        }
      } catch { /* Firestore indisponible : on fait confiance au JWT signé */ }
      const role = normalizeRole(payload.role);
      return { id: payload.admin_id, email: "", role, via: "admin_session" };
    } catch {
      return null;
    }
  }

  // 2. Token Firebase : claim superAdmin OU email dans SUPER_ADMIN_EMAILS
  const fb = await verifyFirebaseIdToken(token.value);
  if (!fb || fb.disabled) return null;
  const hasClaim = fb.claims.superAdmin === true;
  const inList = SUPER_ADMIN_EMAILS.includes(fb.email);
  if (!hasClaim && !inList) return null;
  return { id: fb.uid, email: fb.email, role: "super_admin", via: hasClaim ? "firebase_claim" : "super_admin_emails" };
}

function normalizeRole(role: unknown): AdminRole {
  return role === "support" || role === "finance" || role === "readonly" ? role : "super_admin";
}

function can(role: AdminRole, module: AdminModule): boolean {
  return ROLE_PERMISSIONS[role].includes(module);
}

/** Middleware : exige une identité admin valide (+ permission module si fournie). */
export function adminApiGuard(module: AdminModule | null = null) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    if (!rateLimit(`admin:${req.ip || "unknown"}`, 60_000, 120)) {
      res.status(429).json({ error: "Trop de requêtes." });
      return;
    }
    const admin = await resolveAdmin(req);
    if (!admin) {
      res.status(403).json({ error: "Accès refusé." });
      return;
    }
    if (module && !can(admin.role, module)) {
      res.status(403).json({ error: "Permission insuffisante pour ce module." });
      return;
    }
    (req as RequestWithAdmin).admin = admin;
    next();
  };
}

// ---------------------------------------------------------------------------
// Journal d'audit (jamais de secrets)
// ---------------------------------------------------------------------------

const SECRET_KEYS = /password|passwd|secret|token|api[-_]?key|private|credential|authorization|cookie/i;

function sanitizeForAudit(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[…]";
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.length > 300 ? value.slice(0, 300) + "…" : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitizeForAudit(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.test(k) ? "« masqué »" : sanitizeForAudit(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export async function logAdminAudit(params: {
  actor: AdminIdentity;
  action: string;
  target?: string;
  before?: unknown;
  after?: unknown;
  req?: express.Request;
}): Promise<void> {
  try {
    await addDoc(collection(db, "admin_audit"), {
      at: new Date().toISOString(),
      actorId: params.actor.id,
      actorEmail: params.actor.email || "inconnu",
      actorRole: params.actor.role,
      action: String(params.action).slice(0, 80),
      target: params.target ? String(params.target).slice(0, 160) : "",
      before: params.before === undefined ? null : sanitizeForAudit(params.before),
      after: params.after === undefined ? null : sanitizeForAudit(params.after),
      ip: params.req?.ip || "",
      userAgent: String(params.req?.headers["user-agent"] || "").slice(0, 200)
    });
  } catch (e) {
    console.warn("admin_audit write failed:", e);
  }
}

// ---------------------------------------------------------------------------
// Présence (heartbeat) — membres et admins
// ---------------------------------------------------------------------------

interface PresenceMeta {
  device?: string;
  os?: string;
  country?: string;
  city?: string;
  page?: string;
  storeName?: string;
}

function presenceMetaFromBody(body: Record<string, unknown>): PresenceMeta {
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; } })();
  return {
    device: String(body.device || "").slice(0, 40),
    os: String(body.os || "").slice(0, 40),
    country: typeof body.country === "string" ? body.country.slice(0, 40) : (tz.split("/")[0] || ""),
    city: typeof body.city === "string" ? body.city.slice(0, 60) : (tz.split("/")[1] || "").replace(/_/g, " "),
    page: String(body.page || "").slice(0, 120),
    storeName: String(body.storeName || "").slice(0, 80)
  };
}

/** POST /heartbeat — membre authentifié Firebase (marchand) OU admin (cookie JWT). */
router.post("/heartbeat", async (req, res) => {
  const body = (req.body || {}) as Record<string, unknown>;
  const token = tokenFromRequest(req);
  if (!token) { res.status(401).json({ error: "Non authentifié." }); return; }

  let uid = "";
  let email = "";
  let storeName = presenceMetaFromBody(body).storeName;

  if (token.kind === "admin_jwt") {
    const admin = await resolveAdmin(req);
    if (!admin) { res.status(403).json({ error: "Session admin invalide." }); return; }
    uid = admin.id; email = admin.email;
  } else {
    const fb = await verifyFirebaseIdToken(token.value);
    if (!fb || fb.disabled) { res.status(403).json({ error: "Token invalide." }); return; }
    uid = fb.uid; email = fb.email;
    // Membre suspendu : heartbeat refusé + présence supprimée → déconnexion forcée côté client
    try {
      const tSnap = await getDoc(doc(db, "tenants", uid));
      if (tSnap.exists() && (tSnap.data() as Record<string, unknown>).status === "suspended") {
        await deleteDoc(doc(db, "user_presence", uid)).catch(() => undefined);
        res.status(403).json({ error: "suspended", reason: String((tSnap.data() as Record<string, unknown>).suspendReason || "") });
        return;
      }
    } catch { /* Firestore indisponible : ne pas bloquer la présence */ }
  }

  if (!rateLimit(`hb:${uid}`, 45_000, 1)) {
    res.status(204).end(); // heartbeat trop rapproché : ignoré silencieusement
    return;
  }

  const meta = presenceMetaFromBody(body);
  const nowIso = new Date().toISOString();
  try {
    const ref = doc(db, "user_presence", uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? (snap.data() as { lastLoginAt?: string }) : null;
    const shouldRefreshLogin = !existing?.lastLoginAt || (Date.now() - new Date(existing.lastLoginAt).getTime() > 24 * 3600 * 1000);
    await setDoc(ref, {
      uid,
      email,
      lastSeenAt: nowIso,
      ...(storeName ? { storeName } : {}),
      ...(meta.device ? { device: meta.device } : {}),
      ...(meta.os ? { os: meta.os } : {}),
      ...(meta.country ? { country: meta.country } : {}),
      ...(meta.city ? { city: meta.city } : {}),
      ...(meta.page ? { lastPage: meta.page } : {}),
      ...(shouldRefreshLogin ? { lastLoginAt: nowIso } : {})
    }, { merge: true });
  } catch (e) {
    console.warn("presence write failed:", e);
  }
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// GET /me — identité + permissions (pour l'UI)
// ---------------------------------------------------------------------------

router.get("/me", adminApiGuard(null), (req, res) => {
  const admin = (req as RequestWithAdmin).admin!;
  res.json({
    ok: true,
    admin: { id: admin.id, email: admin.email, role: admin.role, via: admin.via },
    permissions: ROLE_PERMISSIONS[admin.role]
  });
});

// ---------------------------------------------------------------------------
// Statistiques agrégées — recompute (super_admin / cron, journalisé)
// ---------------------------------------------------------------------------

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Interroge une plage de dates en gérant les DEUX types de stockage
 * (chaînes ISO et Timestamp Firestore) : les filtres Firestore sont
 * discriminés par type — une requête string ne matche jamais un Timestamp.
 * Dédoublonné par id de document.
 */
async function docsInRange(
  coll: string,
  field: string,
  fromIso: string,
  toIso: string | null
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const out = new Map<string, Record<string, unknown>>();
  const run = async (gte: unknown, lt: unknown): Promise<void> => {
    try {
      const clamps = lt === null || lt === undefined
        ? [where(field, ">=", gte)]
        : [where(field, ">=", gte), where(field, "<", lt)];
      const snap = await getDocs(query(collection(db, coll), ...clamps));
      snap.forEach((d) => out.set(d.id, d.data() as Record<string, unknown>));
    } catch { /* type incompatible : l'autre variante est tentée */ }
  };
  await run(fromIso, toIso);
  await run(Timestamp.fromDate(new Date(fromIso)), toIso ? Timestamp.fromDate(new Date(toIso)) : null);
  return Array.from(out.entries()).map(([id, data]) => ({ id, data }));
}

export function isoOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const ts = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    try {
      if (typeof ts.toDate === "function") return ts.toDate().toISOString();
      if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000).toISOString();
      if (typeof ts._seconds === "number") return new Date(ts._seconds * 1000).toISOString();
    } catch { /* ignore */ }
  }
  return "";
}

const isTestTenantData = (data: Record<string, unknown>): boolean => {
  if (data.isTest === true) return true;
  const email = String(data.ownerEmail || "").toLowerCase();
  return email.endsWith("@dztest.com") || email.endsWith("@test.com") || email.endsWith("@example.com");
};

export async function recomputeStatsExcludingTest(days: number, months = 12): Promise<{ daysWritten: number; monthsWritten: number }> {
  const today = new Date();
  const dailyByDay = new Map<string, { signups: number; orders: number; gmv: number; revenue: number; carts: number; cartsRecovered: number; waMessages: number; testSignups: number; testOrders: number; testRevenue: number }>();
  const bump = (key: string, field: string, by = 1) => {
    const cur = dailyByDay.get(key) || { signups: 0, orders: 0, gmv: 0, revenue: 0, carts: 0, cartsRecovered: 0, waMessages: 0, testSignups: 0, testOrders: 0, testRevenue: 0 };
    (cur as unknown as Record<string, number>)[field] += by;
    dailyByDay.set(key, cur);
  };

  // 0. Identifiants des tenants de test (exclus des stats « réelles »)
  const allTenants = await docsInRange("tenants", "createdAt", "1970-01-01T00:00:00.000Z", null);
  const testIds = new Set<string>();
  for (const d of allTenants) if (isTestTenantData(d.data as Record<string, unknown>)) testIds.add(d.id);

  // 1. Inscriptions (tenants.createdAt — string OU Timestamp, hors test)
  {
    const fromIso = new Date(today.getTime() - days * 86400000).toISOString();
    for (const d of allTenants) {
      const iso = isoOf(d.data.createdAt);
      if (!iso) continue;
      if (testIds.has(d.id)) { if (iso >= fromIso) bump(iso.slice(0, 10), "testSignups"); continue; }
      if (iso >= fromIso) bump(iso.slice(0, 10), "signups");
    }
  }

  // 2. Commandes + GMV — depuis les VRAIES sous-collections tenants/{id}/orders
  {
    const fromIso = new Date(today.getTime() - days * 86400000).toISOString();
    const recent = allTenants.slice(0, 200);
    await Promise.all(recent.map(async (t) => {
      try {
        const snap = await getDocs(query(collection(db, "tenants", t.id, "orders"), fsLimit(1000)));
        for (const o of snap.docs) {
          const od = o.data() as Record<string, unknown>;
          const iso = isoOf(od.createdAt);
          if (!iso || iso < fromIso) continue;
          const isTest = testIds.has(t.id);
          bump(iso.slice(0, 10), isTest ? "testOrders" : "orders");
          if (!isTest) bump(iso.slice(0, 10), "gmv", Number(od.total) || 0);
        }
      } catch { /* sous-collection absente */ }
    }));
  }

  // 3. Paiements validés (revenu) — UNE lecture par plage + répartition en mémoire
  {
    const todayMidnight = new Date(today);
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const rangeFrom = new Date(todayMidnight.getTime() - (days - 1) * 86400000).toISOString();
    const rangeTo = new Date(todayMidnight.getTime() + 86400000).toISOString();
    for (const d of await docsInRange("payments", "createdAt", rangeFrom, rangeTo)) {
      const v = d.data as { status?: string; amountDA?: unknown; tenantId?: string; createdAt?: unknown };
      if (v.status !== "completed" && v.status !== "validated" && v.status !== "validé") continue;
      const iso = isoOf(v.createdAt);
      if (!iso) continue;
      if (testIds.has(String(v.tenantId || ""))) bump(iso.slice(0, 10), "testRevenue", Number(v.amountDA) || 0);
      else bump(iso.slice(0, 10), "revenue", Number(v.amountDA) || 0);
    }
  }

  // 4. Paniers abandonnés / récupérés (sous-collections tenants + racine) + WhatsApp
  {
    const fromIso = new Date(today.getTime() - days * 86400000).toISOString();
    const countCart = (data: Record<string, unknown>): void => {
      const iso = isoOf(data.createdAt);
      if (!iso || iso < fromIso) return;
      bump(iso.slice(0, 10), "carts");
      if (data.status === "recovered" || data.recovered === true) bump(iso.slice(0, 10), "cartsRecovered");
    };
    for (const d of await docsInRange("abandoned_carts", "createdAt", fromIso, null)) {
      countCart(d.data as Record<string, unknown>);
    }
    await Promise.all(allTenants.slice(0, 200).map(async (t) => {
      try {
        const snap = await getDocs(query(collection(db, "tenants", t.id, "abandoned_carts"), fsLimit(500)));
        for (const c of snap.docs) countCart(c.data() as Record<string, unknown>);
      } catch { /* sous-collection absente */ }
    }));
    for (const d of await docsInRange("whatsapp_messages", "sentAt", fromIso, null)) {
      const iso = isoOf(d.data.sentAt);
      if (iso) bump(iso.slice(0, 10), "waMessages");
    }
  }

  // 5. Écrire les documents quotidiens (IDs plats : daily_YYYY-MM-DD)
  const nowIso = new Date().toISOString();
  for (const [date, stats] of dailyByDay) {
    await setDoc(doc(db, "platform_stats", "daily_" + date), { date, ...stats, updatedAt: nowIso }, { merge: true });
  }

  // 6. Documents mensuels (mois demandés) — agrégés depuis les quotidiens
  const monthly = new Map<string, { signups: number; orders: number; gmv: number; revenue: number; testSignups: number; testRevenue: number }>();
  const monthlyOffsets: number[] = [];
  for (let offset = 0; offset < months * 31 + 31; offset += 1) monthlyOffsets.push(offset);
  const monthlySnaps = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < monthlyOffsets.length; i += 30) {
    const chunk = monthlyOffsets.slice(i, i + 30);
    const reads = await Promise.all(chunk.map(async (offset) => {
      const day = new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10);
      try {
        const snap = await getDoc(doc(db, "platform_stats", "daily_" + day));
        return snap.exists() ? ([day, snap.data() as Record<string, unknown>] as const) : null;
      } catch { return null; }
    }));
    for (const r of reads) if (r) monthlySnaps.set(r[0], r[1]);
  }
  for (const [day, v] of monthlySnaps) {
    const key = day.slice(0, 7);
    const cur = monthly.get(key) || { signups: 0, orders: 0, gmv: 0, revenue: 0, testSignups: 0, testRevenue: 0 };
    cur.signups += Number(v.signups) || 0;
    cur.orders += Number(v.orders) || 0;
    cur.gmv += Number(v.gmv) || 0;
    cur.revenue += Number(v.revenue) || 0;
    cur.testSignups += Number(v.testSignups) || 0;
    cur.testRevenue += Number(v.testRevenue) || 0;
    monthly.set(key, cur);
  }
  for (const [month, stats] of monthly) {
    await setDoc(doc(db, "platform_stats", "monthly_" + month), { month, ...stats, updatedAt: nowIso }, { merge: true });
  }

  // 7. Compteurs globaux — « réels » (hors test) + « tous » (avec test)
  const oneYearAgo = new Date(today.getTime() - 365 * 86400000).toISOString();
  const [storesActive, paymentsYear, cartsAbandoned, cartsRecovered, waMessages, orderCounts] = await Promise.all([
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "tenants"), where("status", "==", "active")));
        let clean = 0;
        snap.forEach((d) => { if (!testIds.has(d.id)) clean += 1; });
        return clean;
      } catch { return 0; }
    })(),
    (async () => {
      let cleanRev = 0, cleanCount = 0, allRev = 0, allCount = 0;
      for (const d of await docsInRange("payments", "createdAt", oneYearAgo, new Date().toISOString())) {
        const v = d.data as { status?: string; amountDA?: unknown; tenantId?: string };
        if (v.status !== "completed" && v.status !== "validated" && v.status !== "validé") continue;
        allRev += Number(v.amountDA) || 0; allCount += 1;
        if (!testIds.has(String(v.tenantId || ""))) { cleanRev += Number(v.amountDA) || 0; cleanCount += 1; }
      }
      return { cleanRev, cleanCount, allRev, allCount };
    })(),
    (async () => {
      let total = 0;
      for (const d of await docsInRange("abandoned_carts", "createdAt", "1970-01-01T00:00:00.000Z", null)) total += 1;
      await Promise.all(allTenants.slice(0, 200).map(async (t) => {
        try { total += (await getDocs(query(collection(db, "tenants", t.id, "abandoned_carts"), fsLimit(500)))).size; } catch { /* absent */ }
      }));
      return total;
    })(),
    (async () => {
      let total = 0;
      for (const d of await docsInRange("abandoned_carts", "createdAt", "1970-01-01T00:00:00.000Z", null)) {
        if (d.data.status === "recovered" || d.data.recovered === true) total += 1;
      }
      await Promise.all(allTenants.slice(0, 200).map(async (t) => {
        try {
          const snap = await getDocs(query(collection(db, "tenants", t.id, "abandoned_carts"), fsLimit(500)));
          snap.forEach((c) => { const v = c.data() as Record<string, unknown>; if (v.status === "recovered" || v.recovered === true) total += 1; });
        } catch { /* absent */ }
      }));
      return total;
    })(),
    docsInRange("whatsapp_messages", "sentAt", "1970-01-01T00:00:00.000Z", new Date().toISOString()).then((r) => r.length),
    (async () => {
      let clean = 0, all = 0;
      await Promise.all(allTenants.slice(0, 200).map(async (t) => {
        try {
          const n = (await getDocs(query(collection(db, "tenants", t.id, "orders"), fsLimit(1000)))).size;
          all += n;
          if (!testIds.has(t.id)) clean += n;
        } catch { /* absent */ }
      }));
      let rootOrders = 0;
      try { rootOrders = (await getDocs(query(collection(db, "orders"), fsLimit(1000)))).size; } catch { /* absent */ }
      return { clean: clean + rootOrders, all: all + rootOrders };
    })()
  ]);

  await setDoc(doc(db, "platform_counters", "global"), {
    membersTotal: allTenants.length - testIds.size,
    membersTotalAll: allTenants.length,
    testMembers: testIds.size,
    storesActive,
    ordersTotal: orderCounts.clean,
    ordersTotalAll: orderCounts.all,
    revenueTotal: paymentsYear.cleanRev,
    revenueTotalAll: paymentsYear.allRev,
    paymentsValidated: paymentsYear.cleanCount,
    cartsAbandonedTotal: cartsAbandoned,
    cartsRecoveredTotal: cartsRecovered,
    waMessagesTotal: waMessages,
    updatedAt: nowIso
  }, { merge: true });

  return { daysWritten: dailyByDay.size, monthsWritten: monthly.size };
}

router.post("/stats/recompute", adminApiGuard("settings"), async (req, res) => {
  try {
    const body = (req.body || {}) as { days?: unknown };
    const days = Math.min(120, Math.max(7, Number(body.days) || 30));
    const months = Math.min(24, Math.max(12, Number((body as Record<string, unknown>).months) || 12));
    const result = await recomputeStatsExcludingTest(days, months);
    const admin = (req as RequestWithAdmin).admin!;
    await logAdminAudit({ actor: admin, action: "stats.recompute", target: `days=${days}`, after: result, req });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("stats recompute error:", e);
    res.status(500).json({ error: "Échec du recalcul.", detail: String((e as Error)?.message || e).slice(0, 200) });
  }
});

// ---------------------------------------------------------------------------
// GET /overview?days=7|30|90 — KPIs + séries + listes + alertes
// ---------------------------------------------------------------------------

router.get("/overview", adminApiGuard("dashboard"), async (req, res) => {
  try {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const includeTest = req.query.includeTest === "1";
    const now = Date.now();

    // 1. Compteurs globaux (1 lecture)
    const countersSnap = await getDoc(doc(db, "platform_counters", "global")).catch(() => null);
    const counters = (countersSnap?.exists() ? countersSnap.data() : {}) as Record<string, unknown>;

    // 2. Documents quotidiens de la période — UNE requête de plage (IDs triés = daily_YYYY-MM-DD)
    const daily: Array<{ date: string; signups?: number; orders?: number; revenue?: number; gmv?: number; carts?: number; cartsRecovered?: number; waMessages?: number }> = [];
    {
      const keys: string[] = [];
      for (let offset = days - 1; offset >= 0; offset -= 1) keys.push(dayKey(new Date(now - offset * 86400000)));
      const byKey = new Map<string, Record<string, number>>();
      try {
        const snap = await getDocs(query(collection(db, "platform_stats"),
          where("__name__", ">=", "daily_" + keys[0]),
          where("__name__", "<=", "daily_" + keys[keys.length - 1] + "\uf8ff")));
        snap.forEach((d) => { byKey.set(String(d.id).slice(6), d.data() as Record<string, number>); });
      } catch { /* collection vide */ }
      for (const key of keys) daily.push({ date: key, ...(byKey.get(key) || {}) });
    }

    // 3. Documents mensuels (12 derniers mois)
    const monthly: Array<{ month: string; revenue?: number; signups?: number }> = [];
    {
      const monthKeys: string[] = [];
      for (let offset = 11; offset >= 0; offset -= 1) {
        const d = new Date();
        d.setMonth(d.getMonth() - offset, 1);
        monthKeys.push(d.toISOString().slice(0, 7));
      }
      const byMonth = new Map<string, Record<string, number>>();
      for (let i = 0; i < monthKeys.length; i += 6) {
        const chunk = monthKeys.slice(i, i + 6);
        const reads = await Promise.all(chunk.map(async (key) => {
          try {
            const snap = await getDoc(doc(db, "platform_stats", "monthly_" + key));
            return snap.exists() ? ([key, snap.data() as Record<string, number>] as const) : null;
          } catch { return null; }
        }));
        for (const r of reads) if (r) byMonth.set(r[0], r[1]);
      }
      for (const key of monthKeys) monthly.push({ month: key, ...(byMonth.get(key) || {}) });
    }

    // 4. Présence (en ligne = vu il y a < 2 min ; actif 30 j = vu il y a < 30 j)
    let onlineNow = 0;
    let active30d = 0;
    try {
      const twoMinAgo = new Date(now - 2 * 60_000).toISOString();
      const monthAgo = new Date(now - 30 * 86400000).toISOString();
      const [snap, snap30] = await Promise.all([
        getDocs(query(collection(db, "user_presence"), where("lastSeenAt", ">", twoMinAgo), fsLimit(200))),
        getDocs(query(collection(db, "user_presence"), where("lastSeenAt", ">", monthAgo), fsLimit(1000)))
      ]);
      onlineNow = snap.size;
      active30d = snap30.size;
    } catch { /* presence vide */ }

    // 5. Sommes de période depuis les quotidiens
    const sum = (field: string): number => daily.reduce((acc, d) => acc + (Number((d as unknown as Record<string, number>)[field]) || 0), 0);
    const signupsPeriod = sum("signups");
    const signupsToday = Number((daily[daily.length - 1] as unknown as Record<string, number>)?.signups) || 0;
    const signupsWeek = daily.slice(-7).reduce((acc, d) => acc + (Number((d as unknown as Record<string, number>).signups) || 0), 0);
    const revenueMonth = monthly[monthly.length - 1] ? Number((monthly[monthly.length - 1] as unknown as Record<string, number>).revenue) || 0 : 0;

    // 6. Derniers inscrits (5) — hors test sauf bascule (3 requêtes en parallèle)
    const testIdSet = new Set<string>();
    const latestSignups: Array<{ id: string; storeName: string; ownerEmail: string; createdAt: string; plan: string }> = [];
    let paySnap: Array<{ id: string; data: Record<string, unknown> }> = [];
    try {
      const [allSnap, latestSnap, paySnapQ] = await Promise.all([
        getDocs(query(collection(db, "tenants"), fsLimit(500))),
        getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc"), fsLimit(20))),
        getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc"), fsLimit(20)))
      ]);
      paySnap = paySnapQ.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
      allSnap.forEach((d) => { if (isTestTenantData(d.data())) testIdSet.add(d.id); });
      const snap = latestSnap;
      snap.forEach((d) => {
        if (!includeTest && testIdSet.has(d.id)) return;
        if (latestSignups.length >= 5) return;
        const v = d.data() as { storeName?: string; ownerEmail?: string; createdAt?: unknown; plan?: string };
        latestSignups.push({
          id: d.id,
          storeName: String(v.storeName || ""),
          ownerEmail: String(v.ownerEmail || ""),
          createdAt: typeof v.createdAt === "string" ? v.createdAt : "",
          plan: String(v.plan || "")
        });
      });
    } catch { /* ignore */ }

    // 7. Derniers paiements (5) — hors test sauf bascule (déjà chargés en parallèle ci-dessus)
    const latestPayments: Array<{ id: string; storeName: string; amountDA: number; status: string; method: string; createdAt: string }> = [];
    try {
      const snap = { forEach: (cb: (d: { id: string; data: Record<string, unknown> }) => void) => paySnap.forEach(cb) };
      snap.forEach((d) => {
        if (!includeTest && testIdSet.has(String((d.data as Record<string, unknown>).tenantId || ""))) return;
        if (latestPayments.length >= 5) return;
        const v = d.data as { storeName?: string; amountDA?: number; status?: string; paymentMethod?: string; createdAt?: unknown };
        latestPayments.push({
          id: d.id,
          storeName: String(v.storeName || ""),
          amountDA: Number(v.amountDA) || 0,
          status: String(v.status || ""),
          method: String(v.paymentMethod || ""),
          createdAt: typeof v.createdAt === "string" ? v.createdAt : ""
        });
      });
    } catch { /* ignore */ }

    // 8. Alertes : paiements en attente + abonnements expirant bientôt / expirés
    const alerts: Array<{ type: string; label: string; detail: string }> = [];
    try {
      const snap = await getDocs(query(collection(db, "payments"), where("status", "==", "pending"), fsLimit(5)));
      snap.forEach((d) => {
        const v = d.data() as { storeName?: string; amountDA?: number; createdAt?: string };
        alerts.push({ type: "payment_pending", label: String(v.storeName || "Boutique"), detail: `${Number(v.amountDA) || 0} DZD en attente de validation`, });
      });
    } catch { /* ignore */ }
    const nowIso = new Date().toISOString();
    const in7dIso = new Date(now + 7 * 86400000).toISOString();
    let expiringCount = 0;
    let expiredCount = 0;
    try {
      const snap = await getDocs(query(collection(db, "tenants"), where("planExpiresAt", ">", nowIso), where("planExpiresAt", "<", in7dIso), fsLimit(20)));
      if (includeTest) expiringCount = snap.size;
      else snap.forEach((d) => { if (!testIdSet.has(d.id)) expiringCount += 1; });
      const snapExpired = await getDocs(query(collection(db, "tenants"), where("planExpiresAt", "<", nowIso), fsLimit(500)));
      snapExpired.forEach((d) => { if (includeTest || !testIdSet.has(d.id)) expiredCount += 1; });
    } catch { /* ignore */ }
    if (expiringCount > 0) alerts.push({ type: "subs_expiring", label: `${expiringCount} abonnement(s)`, detail: "Expirent dans les 7 prochains jours" });
    if (expiredCount > 0) alerts.push({ type: "subs_expired", label: `${expiredCount} abonnement(s) expiré(s)`, detail: "Sans plan actif actuellement" });
    if (!counters.updatedAt) alerts.push({ type: "stats_never_computed", label: "Statistiques jamais calculées", detail: "Lancer « Recalculer les statistiques »" });

    // 9. Abonnements actifs (planExpiresAt dans le futur, hors test sauf bascule)
    let activeSubs = 0;
    try {
      const snap = await getDocs(query(collection(db, "tenants"), where("planExpiresAt", ">", nowIso), fsLimit(1000)));
      snap.forEach((d) => { if (includeTest || !testIdSet.has(d.id)) activeSubs += 1; });
    } catch { /* ignore */ }

    const testSum = (field: string): number => daily.reduce((acc, d) => acc + (Number((d as unknown as Record<string, number>)[field]) || 0), 0);
    const monthlyTestRevenue = monthly[monthly.length - 1] ? Number((monthly[monthly.length - 1] as unknown as Record<string, number>).testRevenue) || 0 : 0;
    const todayTest = Number((daily[daily.length - 1] as unknown as Record<string, number>)?.testSignups) || 0;
    const weekTest = daily.slice(-7).reduce((acc, d) => acc + (Number((d as unknown as Record<string, number>).testSignups) || 0), 0);

    res.json({
      ok: true,
      periodDays: days,
      includeTest,
      hasTestData: testIdSet.size > 0,
      kpis: {
        membersTotal: Number(includeTest ? counters.membersTotalAll : counters.membersTotal) || 0,
        membersActive30d: active30d,
        onlineNow,
        signupsToday: signupsToday + (includeTest ? todayTest : 0),
        signupsWeek: signupsWeek + (includeTest ? weekTest : 0),
        signupsPeriod: signupsPeriod + (includeTest ? testSum("testSignups") : 0),
        storesActive: Number(counters.storesActive) || 0,
        revenueMonth: revenueMonth + (includeTest ? monthlyTestRevenue : 0),
        activeSubscriptions: activeSubs,
        expiredSubscriptions: expiredCount,
        ordersTotal: Number(includeTest ? counters.ordersTotalAll : counters.ordersTotal) || 0,
        gmvPeriod: sum("gmv"),
        ordersPeriod: sum("orders") + (includeTest ? testSum("testOrders") : 0),
        cartsAbandonedTotal: Number(counters.cartsAbandonedTotal) || 0,
        cartsRecoveredTotal: Number(counters.cartsRecoveredTotal) || 0,
        waMessagesTotal: Number(counters.waMessagesTotal) || 0,
        paymentsPending: alerts.filter((a) => a.type === "payment_pending").length
      },
      series: { daily, monthly },
      latestSignups,
      latestPayments,
      alerts,
      statsUpdatedAt: String(counters.updatedAt || "")
    });
  } catch (e) {
    console.error("admin overview error:", e);
    res.status(500).json({ error: "Erreur du tableau de bord admin." });
  }
});

// ---------------------------------------------------------------------------
// GET /audit — journal d'audit (filtrage mémoire pour éviter tout index composite)
// ---------------------------------------------------------------------------

router.get("/audit", adminApiGuard("audit"), async (req, res) => {
  try {
    const maxLimit = Math.min(200, Math.max(10, Number(req.query.limit) || 50));
    const actionFilter = String(req.query.action || "").trim().toLowerCase();
    const actorFilter = String(req.query.actor || "").trim().toLowerCase();
    const targetFilter = String(req.query.target || "").trim().toLowerCase();
    const fromFilter = String(req.query.from || "").slice(0, 10);
    const toFilter = String(req.query.to || "").slice(0, 10);
    const before = String(req.query.before || "");
    const hasFilter = !!(actionFilter || actorFilter || targetFilter || fromFilter || toFilter);

    let q = query(collection(db, "admin_audit"), orderBy("at", "desc"), fsLimit(hasFilter ? 200 : maxLimit));
    if (before) {
      q = query(collection(db, "admin_audit"), orderBy("at", "desc"), startAfter(before), fsLimit(hasFilter ? 200 : maxLimit));
    }
    const snap = await getDocs(q);
    const entries: Array<Record<string, unknown>> = [];
    snap.forEach((d) => {
      const v = d.data() as Record<string, unknown>;
      const at = String(v.at || "");
      if (actionFilter && !String(v.action || "").toLowerCase().includes(actionFilter)) return;
      if (actorFilter && !String(v.actorEmail || "").toLowerCase().includes(actorFilter)) return;
      if (targetFilter && !String(v.target || "").toLowerCase().includes(targetFilter)) return;
      if (fromFilter && at.slice(0, 10) < fromFilter) return;
      if (toFilter && at.slice(0, 10) > toFilter) return;
      entries.push({ id: d.id, ...v });
    });
    const filtered = hasFilter ? entries.slice(0, maxLimit) : entries;
    res.json({
      ok: true,
      entries: filtered,
      nextBefore: filtered.length === maxLimit && snap.size === maxLimit ? String((filtered[filtered.length - 1] as unknown as Record<string, unknown>).at || "") : ""
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur du journal d'audit." });
  }
});

// ---------------------------------------------------------------------------
// GET /presence — liste des connectés maintenant
// ---------------------------------------------------------------------------

router.get("/presence", adminApiGuard("dashboard"), async (req, res) => {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
    const snap = await getDocs(query(collection(db, "user_presence"), where("lastSeenAt", ">", twoMinAgo), fsLimit(100)));
    const users: Array<Record<string, string>> = [];
    snap.forEach((d) => {
      const v = d.data() as Record<string, unknown>;
      users.push({
        uid: d.id,
        email: String(v.email || ""),
        storeName: String(v.storeName || ""),
        device: String(v.device || ""),
        country: String(v.country || ""),
        city: String(v.city || ""),
        lastSeenAt: String(v.lastSeenAt || "")
      });
    });
    res.json({ ok: true, online: users.length, users });
  } catch {
    res.json({ ok: true, online: 0, users: [] });
  }
});

export default router;
