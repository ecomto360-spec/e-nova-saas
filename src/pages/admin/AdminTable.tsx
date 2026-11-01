/**
 * Tableau générique Super Admin — recherche, tri, pagination, export,
 * états chargement/vide/erreur. Utilisé par tous les modules liste.
 */
import React, { useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Inbox, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export interface AdminColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  search: string;
  onSearch: (v: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  sortKey: string;
  sortDir: 1 | -1;
  onSort: (key: string) => void;
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
  onExport?: () => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function AdminTable<T>(props: AdminTableProps<T>): React.ReactElement {
  const { t } = useLanguage();
  const { columns, rows, loading, error, search, onSearch, filters, actions, sortKey, sortDir, onSort, page, pages, total, onPage, onExport, rowKey, onRowClick } = props;
  const [dirLabel] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute inset-y-0 start-0 ps-3 h-full w-4 text-neutral-500 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("admin.table.search")}
            className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl ps-9 pe-4 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-500/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
        <div className="flex items-center gap-2 sm:ms-auto">
          {actions}
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1a1a1a] border border-neutral-800 rounded-xl text-neutral-300 hover:text-white hover:border-neutral-700">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</span>
          {props.onRetry && <button onClick={props.onRetry} className="underline">{t("admin.table.retry")}</button>}
        </div>
      )}

      <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-start">
                {columns.map((c) => (
                  <th key={c.key} className={`px-4 py-3 text-start text-xs font-semibold text-neutral-400 uppercase tracking-wide ${c.className || ""}`}>
                    {c.sortValue ? (
                      <button onClick={() => onSort(c.key)} className="flex items-center gap-1 hover:text-white">
                        {c.label}
                        <ArrowUpDown className={`w-3 h-3 ${sortKey === c.key ? "text-red-400" : ""}`} />
                        {sortKey === c.key && dirLabel && <span className="text-red-400">{sortDir === 1 ? "↑" : "↓"}</span>}
                      </button>
                    ) : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500">
                  <Loader2 className="w-6 h-6 animate-spin inline me-2" />{t("admin.table.loading")}
                </td></tr>
              )}
              {!loading && rows.length === 0 && !error && (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500">
                  <Inbox className="w-6 h-6 inline me-2" />{t("admin.table.empty")}
                </td></tr>
              )}
              {!loading && rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 text-neutral-200 ${c.className || ""}`}>
                      {c.render ? c.render(row) : String((row as unknown as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800 text-xs text-neutral-500">
          <span>{t("admin.table.total")} : {total.toLocaleString("fr-FR")}</span>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <span>{page} / {pages}</span>
              <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages} className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 disabled:opacity-30">
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Badge de statut coloré. */
export function StatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    validated: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "actif": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    "suspendu": "bg-red-500/10 text-red-400 border-red-500/20",
    "annulé": "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    cancelled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    "expiré": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    expired: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  const cls = map[status] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
  return <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>{status}</span>;
}

/** Point vert « en ligne ». */
export function OnlineDot({ online, label }: { online: boolean; label: string }): React.ReactElement {
  return online ? (
    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{label}</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-neutral-600 text-xs"><span className="w-2 h-2 rounded-full bg-neutral-700" /></span>
  );
}
