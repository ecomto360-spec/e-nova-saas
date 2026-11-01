import { useCallback, useEffect, useState } from "react";
import { ScrollText, Search, Loader2, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * LOT A — Journal d'audit (admin_audit).
 * Chaque action sensible serveur y est écrite (acteur, action, cible,
 * avant/après SANS secrets, IP, date). Filtrage action/acteur + pagination
 * curseur. Les secrets sont masqués côté serveur avant stockage.
 */

interface AuditEntry {
  id: string;
  at: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  target: string;
  before: unknown;
  after: unknown;
  ip: string;
}

export default function AdminAudit() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [nextBefore, setNextBefore] = useState("");
  const [beforeCursor, setBeforeCursor] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (cursor: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (cursor) params.set("before", cursor);
      if (actionFilter.trim()) params.set("action", actionFilter.trim());
      if (actorFilter.trim()) params.set("actor", actorFilter.trim());
      if (targetFilter.trim()) params.set("target", targetFilter.trim());
      if (fromFilter) params.set("from", fromFilter);
      if (toFilter) params.set("to", toFilter);
      const res = await fetch(`/api/admin/v1/audit?${params}`, { credentials: "include" });
      const j = (await res.json()) as { entries?: AuditEntry[]; nextBefore?: string };
      setEntries(j.entries || []);
      setNextBefore(j.nextBefore || "");
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [actionFilter, actorFilter, targetFilter, fromFilter, toFilter]);

  useEffect(() => { load(""); }, [load]);

  const fmtDate = (iso: string): string => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
    } catch { return iso.slice(0, 19).replace("T", " "); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder={t("admin.audit.filterAction")}
            className="w-full rounded-xl border border-neutral-700 bg-[#111114] py-2.5 ps-9 pe-3 text-xs text-white placeholder-neutral-500 focus:border-red-500/50 focus:outline-none"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder={t("admin.audit.filterActor")}
            className="w-full rounded-xl border border-neutral-700 bg-[#111114] py-2.5 ps-9 pe-3 text-xs text-white placeholder-neutral-500 focus:border-red-500/50 focus:outline-none"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            placeholder={t("admin.audit.filterTarget")}
            className="w-full rounded-xl border border-neutral-700 bg-[#111114] py-2.5 ps-9 pe-3 text-xs text-white placeholder-neutral-500 focus:border-red-500/50 focus:outline-none"
          />
        </div>
        <input type="date" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)} aria-label={t("admin.audit.filterFrom")} className="rounded-xl border border-neutral-700 bg-[#111114] px-3 py-2.5 text-xs text-white focus:border-red-500/50 focus:outline-none" />
        <input type="date" value={toFilter} onChange={(e) => setToFilter(e.target.value)} aria-label={t("admin.audit.filterTo")} className="rounded-xl border border-neutral-700 bg-[#111114] px-3 py-2.5 text-xs text-white focus:border-red-500/50 focus:outline-none" />
        <button
          onClick={() => { setBeforeCursor(""); load(""); }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
        >
          {t("admin.audit.search")}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111114] overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-red-400" /></div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-xs text-neutral-400">{t("admin.audit.empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800 text-xs">
              <thead className="bg-[#16161a]">
                <tr>
                  <th className="px-4 py-3 text-start font-bold text-neutral-400 uppercase tracking-wider">{t("admin.audit.date")}</th>
                  <th className="px-4 py-3 text-start font-bold text-neutral-400 uppercase tracking-wider">{t("admin.audit.actor")}</th>
                  <th className="px-4 py-3 text-start font-bold text-neutral-400 uppercase tracking-wider">{t("admin.audit.action")}</th>
                  <th className="px-4 py-3 text-start font-bold text-neutral-400 uppercase tracking-wider">{t("admin.audit.target")}</th>
                  <th className="px-4 py-3 text-start font-bold text-neutral-400 uppercase tracking-wider">IP</th>
                  <th className="px-4 py-3 text-end font-bold text-neutral-400 uppercase tracking-wider">…</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-800/30">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-neutral-300" dir="ltr">{fmtDate(e.at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-white font-semibold">{e.actorEmail || "—"}</span>
                      <span className="block text-[10px] text-neutral-500">{e.actorRole}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-bold">{e.action}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-neutral-300" dir="auto">{e.target || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-neutral-500" dir="ltr">{e.ip || "—"}</td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        className="text-neutral-400 hover:text-white cursor-pointer p-1"
                        aria-label={t("admin.audit.details")}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {expanded && (
        <div className="rounded-2xl border border-neutral-800 bg-[#111114] p-4">
          <h4 className="text-xs font-bold text-neutral-300 uppercase mb-3">{t("admin.audit.details")}</h4>
          {(() => {
            const e = entries.find((x) => x.id === expanded);
            if (!e) return null;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1.5">{t("admin.audit.before")}</p>
                  <pre className="text-[10px] text-neutral-300 bg-[#16161a] rounded-xl border border-neutral-800 p-3 overflow-x-auto max-h-48" dir="ltr">{JSON.stringify(e.before, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1.5">{t("admin.audit.after")}</p>
                  <pre className="text-[10px] text-neutral-300 bg-[#16161a] rounded-xl border border-neutral-800 p-3 overflow-x-auto max-h-48" dir="ltr">{JSON.stringify(e.after, null, 2)}</pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => { const prev = entries.length ? entries[0].at : ""; setBeforeCursor(""); load(""); }}
          disabled={!beforeCursor && !nextBefore}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white border border-neutral-800 cursor-pointer disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />{t("admin.audit.newest")}
        </button>
        <button
          onClick={() => { setBeforeCursor(nextBefore); load(nextBefore); }}
          disabled={!nextBefore}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white border border-neutral-800 cursor-pointer disabled:opacity-30"
        >
          {t("admin.audit.older")}<ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
