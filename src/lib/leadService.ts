/**
 * T6 — Service des leads (demandes de devis / rendez-vous) créés depuis la
 * boutique publique (thèmes Vitrine Entreprise et Services Professionnels).
 *
 * Double écriture identique aux commandes : racine `leads` (recherche globale)
 * + `tenants/{uid}/leads` (dashboard marchand). Le statut permet un suivi
 * simple (nouveau / contacté / converti).
 */

import { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export type LeadKind = "quote" | "appointment";
export type LeadStatus = "new" | "contacted" | "converted" | "closed";

export interface LeadRecord {
  id?: string;
  tenantId: string;
  slug?: string;
  kind: LeadKind;
  /** Thème d'origine (corporate_showcase, pro_services…). */
  themeId?: string;
  name: string;
  phone: string;
  email?: string;
  /** Besoin / service souhaité (valeur du select). */
  need?: string;
  /** Date/heure souhaitée (rendez-vous uniquement). */
  preferredDate?: string;
  message?: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
}

export interface CreateLeadInput {
  tenantId: string;
  slug?: string;
  kind: LeadKind;
  themeId?: string;
  name: string;
  phone: string;
  email?: string;
  need?: string;
  preferredDate?: string;
  message?: string;
}

/** Crée le lead (double écriture). Renvoie l'id du document racine. */
export async function createLead(input: CreateLeadInput): Promise<string> {
  const now = new Date().toISOString();
  const record: Omit<LeadRecord, "id"> = {
    tenantId: input.tenantId,
    slug: input.slug || "",
    kind: input.kind,
    themeId: input.themeId || "",
    name: input.name.trim().slice(0, 120),
    phone: input.phone.trim().slice(0, 40),
    email: (input.email || "").trim().slice(0, 160),
    need: (input.need || "").trim().slice(0, 160),
    preferredDate: (input.preferredDate || "").trim().slice(0, 60),
    message: (input.message || "").trim().slice(0, 2000),
    status: "new",
    source: "storefront",
    createdAt: now,
  };
  const rootRef = await addDoc(collection(db, "leads"), record);
  try {
    await addDoc(collection(db, "tenants", input.tenantId, "leads"), { ...record, rootId: rootRef.id });
  } catch {
    /* la copie tenant est best-effort : la racine reste la source de vérité */
  }
  return rootRef.id;
}

/** Leads d'un marchand (dashboard) — collection tenant d'abord, racine en secours. */
export async function listLeads(tenantId: string, max = 100): Promise<LeadRecord[]> {
  try {
    const snap = await getDocs(query(collection(db, "tenants", tenantId, "leads"), orderBy("createdAt", "desc"), limit(max)));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...(d.data() as LeadRecord), id: d.id }));
    }
  } catch {
    /* essaie la racine */
  }
  const root = await getDocs(query(collection(db, "leads"), where("tenantId", "==", tenantId), limit(max)));
  return root.docs
    .map((d) => ({ ...(d.data() as LeadRecord), id: d.id }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Met à jour le statut d'un lead (racine + copie tenant, best-effort). */
export async function updateLeadStatus(lead: LeadRecord, status: LeadStatus): Promise<void> {
  const rootId = (lead as LeadRecord & { rootId?: string }).rootId;
  const ops: Array<Promise<void>> = [];
  if (rootId) {
    ops.push(updateDoc(doc(db, "leads", rootId), { status }).catch(() => undefined as unknown as void));
  } else if (lead.id) {
    ops.push(updateDoc(doc(db, "leads", lead.id), { status }).catch(() => undefined as unknown as void));
  }
  if (lead.tenantId && lead.id) {
    ops.push(updateDoc(doc(db, "tenants", lead.tenantId, "leads", lead.id), { status }).catch(() => undefined as unknown as void));
  }
  await Promise.all(ops);
}
