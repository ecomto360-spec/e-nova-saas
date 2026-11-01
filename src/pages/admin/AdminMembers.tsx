/**
 * LOT B — Membres (Super Admin).
 * Tableau paginé + fiche membre (infos, abonnement, paiements, activité,
 * notes) + actions : modifier, suspendre/réactiver, réinitialiser mot de passe,
 * changer de plan, offrir un essai, supprimer, vue support (« se connecter en
 * tant que », bandeau visible + audit). Export CSV.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Users, Eye, Ban, RotateCcw, KeyRound, Trash2, Loader2, X, LifeBuoy, Gift, RefreshCw } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, apiDownload, fmtDate, fmtDateTime, fmtDZD } from "./api";
import AdminTable, { StatusBadge, OnlineDot, type AdminColumn } from "./AdminTable";

interface MemberRow {
  id: string; storeName: string; ownerEmail: string; phone: string; slug: string;
  plan: string; status: string; createdAt: string; planExpiresAt: string;
  lastLoginAt: string; lastSeenAt: string; online: boolean; isTest: boolean;
}

interface MemberSheet {
  member: MemberRow;
  store: { slug: string; theme: string };
  counts: { payments: number; orders: number; products: number };
  payments: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
}

interface Plan { id: string; name: string; priceMonthly: number; }

const MODAL_CLASSES = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70";

export default function AdminMembers(): React.ReactElement {
  const { t } = useLanguage();
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<MemberSheet | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [supportView, setSupportView] = useState<{ member: MemberRow; products: Array<{ id: string; name: string; price: number }>; orders: Array<Record<string, unknown>>; settings: Record<string, unknown> } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<MemberRow | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ member: MemberRow; reason: string } | null>(null);
  const [planModal, setPlanModal] = useState<{ member: MemberRow; planId: string; days: number; trial: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20", search, sort: sortKey, status });
      const j = await apiGet<{ total: number; pages: number; rows: MemberRow[] }>(`/members?${qs}`);
      setRows(j.rows);
      setTotal(j.total);
      setPages(j.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortKey, status, t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { apiGet<{ plans: Plan[] }>("/plans").then((j) => setPlans(j.plans)).catch(() => undefined); }, []);

  const onSort = (key: string): void => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
    setPage(1);
  };

  const openSheet = async (m: MemberRow): Promise<void> => {
    setSheetLoading(true);
    setSheet(null);
    try {
      const j = await apiGet<MemberSheet>(`/members/${m.id}`);
      setSheet(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setSheetLoading(false);
    }
  };

  const action = async (fn: () => Promise<void>, okMsg: string): Promise<void> => {
    setBusy(true);
    setNotice("");
    try {
      await fn();
      setNotice(okMsg);
      await load();
      if (sheet) await openSheet(sheet.member);
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setBusy(false);
    }
  };

  const columns: AdminColumn<MemberRow>[] = [
    {
      key: "storeName", label: t("admin.members.store"), sortValue: (r) => r.storeName.toLowerCase(),
      render: (r) => (
        <div>
          <div className="font-medium text-white flex items-center gap-2">
            {r.storeName}
            {r.isTest && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">TEST</span>}
          </div>
          <div className="text-xs text-neutral-500">{r.ownerEmail}</div>
        </div>
      )
    },
    { key: "phone", label: t("admin.members.phone"), render: (r) => r.phone || "—" },
    { key: "plan", label: t("admin.members.plan"), sortValue: (r) => r.plan, render: (r) => <span className="capitalize">{r.plan}</span> },
    { key: "status", label: t("admin.members.status"), sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", label: t("admin.members.since"), sortValue: (r) => r.createdAt, render: (r) => fmtDate(r.createdAt) },
    { key: "planExpiresAt", label: t("admin.members.expires"), sortValue: (r) => r.planExpiresAt, render: (r) => fmtDate(r.planExpiresAt) },
    { key: "lastLoginAt", label: t("admin.members.lastLogin"), sortValue: (r) => r.lastLoginAt, render: (r) => (r.lastLoginAt ? fmtDateTime(r.lastLoginAt) : "—") },
    { key: "online", label: t("admin.members.onlineCol"), render: (r) => <OnlineDot online={r.online} label={r.online ? t("admin.members.online") : ""} /> },
    {
      key: "actions", label: "", className: "text-end",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button title={t("admin.members.view")} onClick={() => openSheet(r)} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-white"><Eye className="w-4 h-4" /></button>
          {r.status === "suspended" ? (
            <button title={t("admin.members.reactivate")} disabled={busy} onClick={() => action(async () => { await apiSend(`/members/${r.id}/reactivate`, "POST"); }, t("admin.members.reactivated"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><RotateCcw className="w-4 h-4" /></button>
          ) : (
            <button title={t("admin.members.suspend")} onClick={() => setSuspendModal({ member: r, reason: "" })} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-orange-400"><Ban className="w-4 h-4" /></button>
          )}
          <button title={t("admin.members.supportView")} onClick={async () => { try { const j = await apiGet<{ member: MemberRow; products: Array<{ id: string; name: string; price: number }>; orders: Array<Record<string, unknown>>; settings: Record<string, unknown> }>(`/members/${r.id}/support-view`); setSupportView(j); } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); } }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-blue-400"><LifeBuoy className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-red-500" />{t("admin.nav.members")}</h1>
      </div>

      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}

      <AdminTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        filters={
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white">
            <option value="">{t("admin.members.allStatus")}</option>
            <option value="active">{t("admin.members.stActive")}</option>
            <option value="suspended">{t("admin.members.stSuspended")}</option>
            <option value="online">{t("admin.members.online")}</option>
          </select>
        }
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        page={page}
        pages={pages}
        total={total}
        onPage={setPage}
        onExport={() => apiDownload(`/members?format=csv&search=${encodeURIComponent(search)}&status=${status}`)}
        rowKey={(r) => r.id}
        onRowClick={(r) => openSheet(r)}
      />

      {sheetLoading && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>}

      {/* Fiche membre */}
      {sheet && (
        <div className={MODAL_CLASSES} onClick={() => setSheet(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-[#111] z-10">
              <div>
                <h2 className="text-lg font-bold text-white">{sheet.member.storeName}</h2>
                <p className="text-xs text-neutral-500">{sheet.member.ownerEmail} · {sheet.member.phone || "—"}</p>
              </div>
              <button onClick={() => setSheet(null)} className="p-2 rounded-lg hover:bg-neutral-700/50 text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t("admin.members.status"), value: <StatusBadge status={sheet.member.status} /> },
                  { label: t("admin.members.plan"), value: <span className="capitalize text-white">{sheet.member.plan}</span> },
                  { label: t("admin.members.expires"), value: <span className="text-white">{fmtDate(sheet.member.planExpiresAt)}</span> },
                  { label: t("admin.members.onlineCol"), value: <OnlineDot online={sheet.member.online} label={sheet.member.online ? t("admin.members.online") : "—"} /> }
                ].map((c) => (
                  <div key={c.label} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3">
                    <div className="text-xs text-neutral-500 mb-1">{c.label}</div>{c.value}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3"><div className="text-2xl font-bold text-white">{sheet.counts.products}</div><div className="text-xs text-neutral-500">{t("admin.members.products")}</div></div>
                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3"><div className="text-2xl font-bold text-white">{sheet.counts.orders}</div><div className="text-xs text-neutral-500">{t("admin.members.orders")}</div></div>
                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3"><div className="text-2xl font-bold text-white">{sheet.counts.payments}</div><div className="text-xs text-neutral-500">{t("admin.members.payments")}</div></div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => setSuspendModal({ member: sheet.member, reason: "" })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/20"><Ban className="w-3.5 h-3.5" />{t("admin.members.suspend")}</button>
                <button disabled={busy} onClick={() => action(async () => { await apiSend(`/members/${sheet.member.id}/reactivate`, "POST"); }, t("admin.members.reactivated"))} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20"><RotateCcw className="w-3.5 h-3.5" />{t("admin.members.reactivate")}</button>
                <button disabled={busy} onClick={() => action(async () => { await apiSend(`/members/${sheet.member.id}/reset-password`, "POST"); }, t("admin.members.resetSent"))} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1a1a1a] border border-neutral-800 text-neutral-300 rounded-xl hover:border-neutral-600"><KeyRound className="w-3.5 h-3.5" />{t("admin.members.resetPwd")}</button>
                <button disabled={busy} onClick={() => setPlanModal({ member: sheet.member, planId: "", days: 30, trial: false })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1a1a1a] border border-neutral-800 text-neutral-300 rounded-xl hover:border-neutral-600"><RefreshCw className="w-3.5 h-3.5" />{t("admin.members.changePlan")}</button>
                <button disabled={busy} onClick={() => setPlanModal({ member: sheet.member, planId: "", days: 14, trial: true })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/20"><Gift className="w-3.5 h-3.5" />{t("admin.members.offerTrial")}</button>
                <button disabled={busy} onClick={() => setConfirmDelete(sheet.member)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 ms-auto"><Trash2 className="w-3.5 h-3.5" />{t("admin.members.delete")}</button>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-2">{t("admin.members.recentPayments")}</h3>
                <div className="space-y-1">
                  {sheet.payments.slice(0, 5).map((p) => (
                    <div key={String(p.id)} className="flex items-center justify-between bg-[#1a1a1a] border border-neutral-800 rounded-lg px-3 py-2">
                      <span className="text-neutral-300">{fmtDate(String(p.createdAt || ""))} · {String(p.paymentMethod || "—")}</span>
                      <span className="flex items-center gap-2">{fmtDZD(Number(p.amountDA) || 0)}<StatusBadge status={String(p.status)} /></span>
                    </div>
                  ))}
                  {sheet.payments.length === 0 && <p className="text-neutral-600 text-xs">—</p>}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-2">{t("admin.members.activity")}</h3>
                <div className="space-y-1">
                  {sheet.activity.slice(0, 6).map((a) => (
                    <div key={String(a.id)} className="bg-[#1a1a1a] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400">
                      <span className="text-neutral-200 font-medium">{String(a.action)}</span> · {String(a.actorEmail || "système")} · {fmtDateTime(String(a.at || ""))}
                    </div>
                  ))}
                  {sheet.activity.length === 0 && <p className="text-neutral-600 text-xs">—</p>}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-2">{t("admin.members.notes")}</h3>
                <textarea
                  defaultValue={sheet.member.admin_notes}
                  onBlur={(e) => { const v = e.target.value; if (v !== sheet.member.admin_notes) action(async () => { await apiSend(`/members/${sheet.member.id}`, "PATCH", { admin_notes: v }); }, t("admin.members.saved")); }}
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                  placeholder={t("admin.members.notesPh")}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspendre (motif) */}
      {suspendModal && (
        <div className={MODAL_CLASSES} onClick={() => setSuspendModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">{t("admin.members.suspendTitle")}</h2>
            <p className="text-xs text-neutral-500 mb-4">{suspendModal.member.storeName} — {t("admin.members.suspendWarn")}</p>
            <textarea value={suspendModal.reason} onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })} rows={2} placeholder={t("admin.members.reasonPh")} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-sm text-white" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSuspendModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300 hover:border-neutral-600">{t("admin.actions.cancel")}</button>
              <button disabled={busy} onClick={() => { const m = suspendModal; setSuspendModal(null); action(async () => { await apiSend(`/members/${m.member.id}/suspend`, "POST", { reason: m.reason }); }, t("admin.members.suspended")); }} className="flex-1 px-4 py-2 text-sm bg-orange-600 text-white rounded-xl hover:bg-orange-700">{t("admin.members.suspendConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Changer plan / essai */}
      {planModal && (
        <div className={MODAL_CLASSES} onClick={() => setPlanModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{planModal.trial ? t("admin.members.offerTrial") : t("admin.members.changePlan")}</h2>
            {!planModal.trial && (
              <select value={planModal.planId} onChange={(e) => setPlanModal({ ...planModal, planId: e.target.value })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-3">
                <option value="">— {t("admin.members.keepPlan")} —</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.priceMonthly.toLocaleString("fr-FR")} DA/{t("admin.plans.month")})</option>)}
              </select>
            )}
            <label className="text-xs text-neutral-400 block mb-1">{planModal.trial ? t("admin.members.trialDays") : t("admin.members.extendDays")}</label>
            <input type="number" min={1} max={365} value={planModal.days} onChange={(e) => setPlanModal({ ...planModal, days: Number(e.target.value) || 1 })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setPlanModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy || (!planModal.trial && !planModal.planId)} onClick={() => { const m = planModal; setPlanModal(null); action(async () => { if (m.trial) { await apiSend(`/members/${m.member.id}/extend`, "POST", { days: m.days }); } else { await apiSend(`/members/${m.member.id}/extend`, "POST", { days: m.days }); await apiSend(`/members/${m.member.id}/plan`, "POST", { planId: m.planId }); } }, t("admin.members.saved")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Supprimer (double confirmation) */}
      {confirmDelete && (
        <div className={MODAL_CLASSES} onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#111] border border-red-500/30 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-red-400 mb-2">{t("admin.members.deleteTitle")}</h2>
            <p className="text-sm text-neutral-400 mb-4">{t("admin.members.deleteWarn")} <strong className="text-white">{confirmDelete.storeName}</strong> ({confirmDelete.ownerEmail}). {t("admin.members.deleteIrreversible")}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy} onClick={() => { const m = confirmDelete; setConfirmDelete(null); setSheet(null); action(async () => { await apiSend(`/members/${m.id}`, "DELETE"); }, t("admin.members.deleted")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.members.deleteConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Vue support (impersonation lecture, bandeau visible) */}
      {supportView && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between sticky top-0 z-10">
            <span>🔍 {t("admin.members.supportBanner")} — <strong>{supportView.member.storeName}</strong> ({supportView.member.ownerEmail})</span>
            <button onClick={() => setSupportView(null)} className="p-1.5 rounded-lg hover:bg-blue-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="max-w-4xl mx-auto p-5 space-y-5">
            <h2 className="text-lg font-bold text-white">{t("admin.members.supportProducts")}</h2>
            <div className="grid gap-2">
              {supportView.products.map((p) => (
                <div key={p.id} className="bg-[#111] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 flex justify-between">
                  <span>{p.name || "—"}</span><span className="text-white">{fmtDZD(p.price)}</span>
                </div>
              ))}
              {supportView.products.length === 0 && <p className="text-neutral-600 text-sm">—</p>}
            </div>
            <h2 className="text-lg font-bold text-white">{t("admin.members.supportOrders")}</h2>
            <div className="grid gap-2">
              {supportView.orders.slice(0, 10).map((o) => (
                <div key={String(o.id)} className="bg-[#111] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 flex justify-between">
                  <span>{fmtDate(String(o.createdAt || ""))} · {String(o.customerName || o.customer?.name || "—")}</span>
                  <span className="text-white">{fmtDZD(Number(o.total) || 0)} · {String(o.status || "")}</span>
                </div>
              ))}
              {supportView.orders.length === 0 && <p className="text-neutral-600 text-sm">—</p>}
            </div>
            <p className="text-xs text-neutral-600">{t("admin.members.supportNote")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
