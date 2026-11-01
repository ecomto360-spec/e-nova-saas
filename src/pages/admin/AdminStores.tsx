/**
 * LOT B — Boutiques (Super Admin).
 * Liste, voir la boutique (lien public), désactiver/réactiver, changer le slug
 * (unicité + slugs réservés vérifiés côté serveur), supprimer.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Store, ExternalLink, Ban, RotateCcw, Trash2, Link2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, fmtDate } from "./api";
import AdminTable, { StatusBadge, type AdminColumn } from "./AdminTable";

interface StoreRow {
  id: string; name: string; slug: string; owner: string; plan: string;
  status: string; theme: string; createdAt: string; isTest: boolean;
}

const MODAL_CLASSES = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70";

export default function AdminStores(): React.ReactElement {
  const { t } = useLanguage();
  const [rows, setRows] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [slugModal, setSlugModal] = useState<StoreRow | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StoreRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await apiGet<{ rows: StoreRow[] }>(`/stores?search=${encodeURIComponent(search)}&status=${status}`);
      setRows(j.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => { load(); }, [load]);

  const action = async (fn: () => Promise<void>, okMsg: string): Promise<void> => {
    setBusy(true);
    setNotice("");
    try { await fn(); setNotice(okMsg); await load(); }
    catch (e) { setNotice("✗ " + (e instanceof Error ? e.message : "Erreur")); }
    finally { setBusy(false); }
  };

  const columns: AdminColumn<StoreRow>[] = [
    {
      key: "name", label: t("admin.stores.name"),
      render: (r) => (
        <div>
          <div className="font-medium text-white flex items-center gap-2">
            {r.name}
            {r.isTest && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">TEST</span>}
          </div>
          <div className="text-xs text-neutral-500">/{r.slug || "—"}</div>
        </div>
      )
    },
    { key: "owner", label: t("admin.stores.owner"), render: (r) => r.owner },
    { key: "plan", label: t("admin.stores.plan"), render: (r) => <span className="capitalize">{r.plan}</span> },
    { key: "theme", label: t("admin.stores.theme"), render: (r) => r.theme },
    { key: "status", label: t("admin.stores.status"), render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", label: t("admin.stores.created"), render: (r) => fmtDate(r.createdAt) },
    {
      key: "actions", label: "", className: "text-end",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.slug && (
            <a href={`/store/${r.slug}`} target="_blank" rel="noreferrer" title={t("admin.stores.view")} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-white"><ExternalLink className="w-4 h-4" /></a>
          )}
          <button title={t("admin.stores.changeSlug")} onClick={() => { setSlugModal(r); setNewSlug(r.slug); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-blue-400"><Link2 className="w-4 h-4" /></button>
          {r.status === "suspended" ? (
            <button title={t("admin.stores.reactivate")} disabled={busy} onClick={() => action(async () => { await apiSend(`/members/${r.id}/reactivate`, "POST"); }, t("admin.members.reactivated"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><RotateCcw className="w-4 h-4" /></button>
          ) : (
            <button title={t("admin.stores.suspend")} disabled={busy} onClick={() => action(async () => { await apiSend(`/members/${r.id}/suspend`, "POST", { reason: "admin_stores" }); }, t("admin.members.suspended"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-orange-400"><Ban className="w-4 h-4" /></button>
          )}
          <button title={t("admin.stores.delete")} onClick={() => setConfirmDelete(r)} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Store className="w-5 h-5 text-red-500" />{t("admin.nav.stores")}</h1>
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}
      <AdminTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        search={search}
        onSearch={setSearch}
        filters={
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white">
            <option value="">{t("admin.members.allStatus")}</option>
            <option value="active">{t("admin.members.stActive")}</option>
            <option value="suspended">{t("admin.members.stSuspended")}</option>
          </select>
        }
        sortKey="name"
        sortDir={1}
        onSort={() => undefined}
        page={1}
        pages={1}
        total={rows.length}
        onPage={() => undefined}
        rowKey={(r) => r.id}
      />

      {slugModal && (
        <div className={MODAL_CLASSES} onClick={() => setSlugModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">{t("admin.stores.changeSlug")}</h2>
            <p className="text-xs text-neutral-500 mb-4">{slugModal.name}</p>
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-4" dir="ltr" />
            <div className="flex gap-2">
              <button onClick={() => setSlugModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy || !newSlug.trim()} onClick={() => { const s = slugModal; setSlugModal(null); action(async () => { await apiSend(`/stores/${s.id}/slug`, "POST", { slug: newSlug }); }, t("admin.stores.slugChanged")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={MODAL_CLASSES} onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#111] border border-red-500/30 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-red-400 mb-2">{t("admin.stores.deleteTitle")}</h2>
            <p className="text-sm text-neutral-400 mb-4">{t("admin.members.deleteWarn")} <strong className="text-white">{confirmDelete.name}</strong>. {t("admin.members.deleteIrreversible")}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy} onClick={() => { const s = confirmDelete; setConfirmDelete(null); action(async () => { await apiSend(`/members/${s.id}`, "DELETE"); }, t("admin.members.deleted")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.members.deleteConfirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
