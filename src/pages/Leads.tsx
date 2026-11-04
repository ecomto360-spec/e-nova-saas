/**
 * T6 — Page dashboard « Leads & Devis ».
 * Les demandes envoyées depuis les formulaires des thèmes riches (Vitrine
 * Entreprise = devis, Services Professionnels = rendez-vous) arrivent ici.
 * Suivi simple : nouveau → contacté → converti / clôturé, + actions WhatsApp
 * et appel direct.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target, Loader2, RefreshCw, Phone, Mail, MessageCircle, CalendarClock,
  FileText, CheckCircle2, XCircle, Clock, User, ChevronRight, Inbox, StickyNote,
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { LeadRecord, LeadStatus, listLeads, updateLeadStatus } from "../lib/leadService";
import { formatDateTime } from "../lib/date";

const STATUS_META: Record<LeadStatus, { label: string; cls: string; dot: string }> = {
  new: { label: "Nouveau", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  contacted: { label: "Contacté", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  converted: { label: "Converti", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  closed: { label: "Clôturé", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
};

type Filter = "all" | LeadStatus;

export default function Leads() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null | undefined>(undefined); // undefined = auth en cours
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user ? user.uid : null));
    return () => unsub();
  }, []);

  const load = useCallback(async (tenantId: string) => {
    setLoading(true);
    try {
      setLeads(await listLeads(tenantId));
    } catch (err) {
      console.error("Leads load error:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) load(uid);
    else if (uid === null) setLoading(false);
  }, [uid, load]);

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, contacted: 0, converted: 0, closed: 0 } as Record<Filter, number>;
    leads.forEach((l) => { c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [leads]);

  const filtered = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  const setStatus = async (lead: LeadRecord, status: LeadStatus) => {
    setBusyId(lead.id || null);
    try {
      await updateLeadStatus(lead, status);
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    } catch (err) {
      console.error("Lead status update error:", err);
    } finally {
      setBusyId(null);
    }
  };

  const waLink = (l: LeadRecord) =>
    `https://wa.me/${l.phone.replace(/[^0-9]/g, "").replace(/^0/, "213")}?text=${encodeURIComponent(
      `Bonjour ${l.name}, merci pour votre demande — nous revenons vers vous rapidement.`
    )}`;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black text-gray-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Target className="h-5 w-5" />
            </span>
            Leads &amp; Devis
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Demandes de devis et de rendez-vous envoyées depuis votre vitrine (formulaires « Contact »).
          </p>
        </div>
        <button
          onClick={() => uid && load(uid)}
          disabled={loading || !uid}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          { key: "all", label: "Total", icon: Inbox, cls: "bg-gray-100 text-gray-600" },
          { key: "new", label: "Nouveaux", icon: Clock, cls: "bg-blue-100 text-blue-600" },
          { key: "contacted", label: "Contactés", icon: MessageCircle, cls: "bg-amber-100 text-amber-600" },
          { key: "converted", label: "Convertis", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-600" },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key as Filter)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${
              filter === s.key ? "border-amber-300 ring-2 ring-amber-100 bg-white" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.cls}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-black text-gray-900">{counts[s.key] ?? 0}</span>
              <span className="block text-xs font-medium text-gray-500">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "converted", "closed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              filter === f ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? `Tous (${counts.all})` : `${STATUS_META[f].label} (${counts[f] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-16 text-gray-500">
          <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Chargement des demandes…</p>
        </div>
      ) : !uid ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
          Connectez-vous pour voir vos demandes.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Target className="h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Aucune demande pour l'instant</p>
          <p className="max-w-md text-xs text-gray-500">
            Les demandes envoyées via le formulaire « Demander un devis » ou « Prendre rendez-vous » de votre vitrine
            apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const meta = STATUS_META[l.status] || STATUS_META.new;
            const isOpen = expanded === l.id;
            return (
              <div key={l.id || l.phone + l.createdAt} className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                <button
                  onClick={() => setExpanded(isOpen ? null : l.id || null)}
                  className="flex w-full flex-wrap items-center gap-3 p-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-gray-600">
                    {l.name?.trim()?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-gray-900">{l.name}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                        {l.kind === "appointment" ? <CalendarClock className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {l.kind === "appointment" ? "Rendez-vous" : "Devis"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {l.phone} · {formatDateTime(l.createdAt)}
                      {l.need ? ` · ${l.need}` : ""}
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-700">
                          <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                          <span dir="ltr" className="font-semibold">{l.phone}</span>
                        </p>
                        {l.email ? (
                          <p className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                            <span dir="ltr">{l.email}</span>
                          </p>
                        ) : null}
                        {l.need ? (
                          <p className="flex items-center gap-2 text-gray-700">
                            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                            {l.need}
                          </p>
                        ) : null}
                        {l.preferredDate ? (
                          <p className="flex items-center gap-2 text-gray-700">
                            <CalendarClock className="h-4 w-4 shrink-0 text-gray-400" />
                            {l.preferredDate}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          <StickyNote className="h-3.5 w-3.5" /> Message
                        </p>
                        <p className="whitespace-pre-wrap">{l.message || "—"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${l.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Phone className="h-3.5 w-3.5" /> Appeler
                      </a>
                      <a
                        href={waLink(l)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <span className="mx-1 hidden h-5 w-px bg-gray-200 sm:block" />
                      {l.status === "new" && (
                        <button
                          onClick={() => setStatus(l, "contacted")}
                          disabled={busyId === l.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                        >
                          {busyId === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                          Marquer contacté
                        </button>
                      )}
                      {(l.status === "new" || l.status === "contacted") && (
                        <button
                          onClick={() => setStatus(l, "converted")}
                          disabled={busyId === l.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Converti
                        </button>
                      )}
                      {l.status !== "closed" && (
                        <button
                          onClick={() => setStatus(l, "closed")}
                          disabled={busyId === l.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Clôturer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
