/**
 * LOT C — Abonnements & Plans (Super Admin).
 * Liste des abonnements (états actif/expiré/suspendu/annulé) + actions
 * (activer, prolonger, changer de plan, annuler) + éditeur de plans
 * (prix, essai, limites, thèmes/extensions autorisés, quota WhatsApp).
 */
import React, { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, Pencil, Trash2, RotateCcw, Ban, CalendarPlus } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, apiDownload, fmtDate, fmtDZD } from "./api";
import AdminTable, { StatusBadge, type AdminColumn } from "./AdminTable";

interface SubRow {
  id: string; storeName: string; ownerEmail: string; plan: string; planLabel: string;
  planExpiresAt: string; state: string; status: string; isTest: boolean; daysLeft: number | null;
}
interface Plan {
  id: string; name: string; priceMonthly: number; trialDays: number; maxProducts: number;
  allowedThemes: string[]; allowedExtensions: string[]; waQuota: number; active: boolean; sortOrder: number;
}

const MODAL_CLASSES = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70";
const emptyPlan: Omit<Plan, "id"> = { name: "", priceMonthly: 2500, trialDays: 7, maxProducts: 50, allowedThemes: ["starter_v2"], allowedExtensions: [], waQuota: 100, active: true, sortOrder: 5 };

export default function AdminSubscriptions(): React.ReactElement {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"subs" | "plans">("subs");
  const [rows, setRows] = useState<SubRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [extendModal, setExtendModal] = useState<SubRow | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [planModal, setPlanModal] = useState<SubRow | null>(null);
  const [planSel, setPlanSel] = useState("");
  const [editPlan, setEditPlan] = useState<{ id: string; data: Omit<Plan, "id"> } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, pl] = await Promise.all([
        apiGet<{ rows: SubRow[] }>(`/subscriptions?search=${encodeURIComponent(search)}&state=${state}&plan=${planFilter}`),
        apiGet<{ plans: Plan[] }>("/plans")
      ]);
      setRows(subs.rows);
      setPlans(pl.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [search, state, planFilter, t]);

  useEffect(() => { load(); }, [load]);

  const action = async (fn: () => Promise<void>, okMsg: string): Promise<void> => {
    setBusy(true);
    setNotice("");
    try { await fn(); setNotice(okMsg); await load(); }
    catch (e) { setNotice("✗ " + (e instanceof Error ? e.message : "Erreur")); }
    finally { setBusy(false); }
  };

  const columns: AdminColumn<SubRow>[] = [
    {
      key: "storeName", label: t("admin.members.store"),
      render: (r) => (
        <div>
          <div className="font-medium text-white">{r.storeName}</div>
          <div className="text-xs text-neutral-500">{r.ownerEmail}</div>
        </div>
      )
    },
    { key: "planLabel", label: t("admin.members.plan"), render: (r) => r.planLabel },
    { key: "planExpiresAt", label: t("admin.members.expires"), render: (r) => fmtDate(r.planExpiresAt) },
    { key: "daysLeft", label: t("admin.subs.daysLeft"), render: (r) => (r.daysLeft === null ? "—" : r.daysLeft > 0 ? `${r.daysLeft} j` : t("admin.subs.expired")) },
    { key: "state", label: t("admin.members.status"), render: (r) => <StatusBadge status={r.state} /> },
    {
      key: "actions", label: "", className: "text-end",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button title={t("admin.subs.extend")} onClick={() => { setExtendModal(r); setExtendDays(30); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><CalendarPlus className="w-4 h-4" /></button>
          <button title={t("admin.members.changePlan")} onClick={() => { setPlanModal(r); setPlanSel(r.plan); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-blue-400"><Pencil className="w-4 h-4" /></button>
          {r.status === "cancelled" || r.state === "expiré" ? (
            <button title={t("admin.subs.activate")} disabled={busy} onClick={() => action(async () => { await apiSend(`/members/${r.id}/reactivate`, "POST"); await apiSend(`/subscriptions/${r.id}/extend`, "POST", { days: 30 }); }, t("admin.subs.activated"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><RotateCcw className="w-4 h-4" /></button>
          ) : (
            <button title={t("admin.subs.cancel")} disabled={busy} onClick={() => action(async () => { await apiSend(`/subscriptions/${r.id}/cancel`, "POST"); }, t("admin.subs.cancelled"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400"><Ban className="w-4 h-4" /></button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-red-500" />{t("admin.nav.subscriptions")}</h1>
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}

      <div className="flex gap-1 bg-[#111] border border-neutral-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("subs")} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === "subs" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}>{t("admin.subs.tabSubs")}</button>
        <button onClick={() => setTab("plans")} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === "plans" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}>{t("admin.subs.tabPlans")}</button>
      </div>

      {tab === "subs" && (
        <AdminTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          search={search}
          onSearch={setSearch}
          filters={
            <>
              <select value={state} onChange={(e) => setState(e.target.value)} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white">
                <option value="">{t("admin.members.allStatus")}</option>
                <option value="actif">{t("admin.subs.stActive")}</option>
                <option value="expiré">{t("admin.subs.stExpired")}</option>
                <option value="suspendu">{t("admin.members.stSuspended")}</option>
                <option value="annulé">{t("admin.subs.stCancelled")}</option>
              </select>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white">
                <option value="">{t("admin.subs.allPlans")}</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </>
          }
          sortKey="planExpiresAt"
          sortDir={-1}
          onSort={() => undefined}
          page={1}
          pages={1}
          total={rows.length}
          onPage={() => undefined}
          onExport={() => apiDownload(`/subscriptions?format=csv&search=${encodeURIComponent(search)}&state=${state}`)}
          rowKey={(r) => r.id}
        />
      )}

      {tab === "plans" && (
        <div className="space-y-3">
          {loading && <p className="text-neutral-500 text-sm">…</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={() => setEditPlan({ id: "", data: { ...emptyPlan } })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-600 text-white rounded-xl hover:bg-red-700"><Plus className="w-4 h-4" />{t("admin.plans.new")}</button>
          <div className="grid gap-3 md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.id} className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{p.name} {!p.active && <span className="text-xs text-neutral-500">({t("admin.plans.inactive")})</span>}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setEditPlan({ id: p.id, data: { name: p.name, priceMonthly: p.priceMonthly, trialDays: p.trialDays, maxProducts: p.maxProducts, allowedThemes: p.allowedThemes || [], allowedExtensions: p.allowedExtensions || [], waQuota: p.waQuota, active: p.active, sortOrder: p.sortOrder } })} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-blue-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => action(async () => { await apiSend(`/plans/${p.id}`, "DELETE"); }, t("admin.plans.deleted"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-neutral-500">{t("admin.plans.price")} :</span> <span className="text-white">{fmtDZD(p.priceMonthly)}</span></div>
                  <div><span className="text-neutral-500">{t("admin.plans.trial")} :</span> <span className="text-white">{p.trialDays} j</span></div>
                  <div><span className="text-neutral-500">{t("admin.plans.maxProducts")} :</span> <span className="text-white">{p.maxProducts}</span></div>
                  <div><span className="text-neutral-500">{t("admin.plans.waQuota")} :</span> <span className="text-white">{p.waQuota}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {extendModal && (
        <div className={MODAL_CLASSES} onClick={() => setExtendModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">{t("admin.subs.extend")}</h2>
            <p className="text-xs text-neutral-500 mb-4">{extendModal.storeName} — {fmtDate(extendModal.planExpiresAt)}</p>
            <input type="number" min={1} max={3650} value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value) || 1)} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setExtendModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy} onClick={() => { const m = extendModal; setExtendModal(null); action(async () => { await apiSend(`/subscriptions/${m.id}/extend`, "POST", { days: extendDays }); }, t("admin.subs.extended")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {planModal && (
        <div className={MODAL_CLASSES} onClick={() => setPlanModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{t("admin.members.changePlan")} — {planModal.storeName}</h2>
            <select value={planSel} onChange={(e) => setPlanSel(e.target.value)} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-4">
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({fmtDZD(p.priceMonthly)})</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setPlanModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy || !planSel} onClick={() => { const m = planModal; setPlanModal(null); action(async () => { await apiSend(`/subscriptions/${m.id}/plan`, "POST", { planId: planSel }); }, t("admin.members.saved")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {editPlan && (
        <div className={MODAL_CLASSES} onClick={() => setEditPlan(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editPlan.id ? t("admin.plans.edit") : t("admin.plans.new")}</h2>
            <div className="space-y-3 text-sm">
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.plans.name")}</label>
                <input value={editPlan.data.name} onChange={(e) => setEditPlan({ ...editPlan, data: { ...editPlan.data, name: e.target.value } })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.plans.price")} (DZD)</label>
                  <input type="number" min={0} value={editPlan.data.priceMonthly} onChange={(e) => setEditPlan({ ...editPlan, data: { ...editPlan.data, priceMonthly: Number(e.target.value) || 0 } })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.plans.trial")} (j)</label>
                  <input type="number" min={0} max={90} value={editPlan.data.trialDays} onChange={(e) => setEditPlan({ ...editPlan, data: { ...editPlan.data, trialDays: Number(e.target.value) || 0 } })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.plans.maxProducts")}</label>
                  <input type="number" min={1} value={editPlan.data.maxProducts} onChange={(e) => setEditPlan({ ...editPlan, data: { ...editPlan.data, maxProducts: Number(e.target.value) || 1 } })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.plans.waQuota")}</label>
                  <input type="number" min={0} value={editPlan.data.waQuota} onChange={(e) => setEditPlan({ ...editPlan, data: { ...editPlan.data, waQuota: Number(e.target.value) || 0 } })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
              </div>
              <label className="flex items-center gap-2 text-neutral-300">
                <input type="checkbox" checked={editPlan.data.active} onChange={(e) => setEditPlan({ ...editPlan, data: { ...editPlan.data, active: e.target.checked } })} />
                {t("admin.plans.active")}
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditPlan(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy || !editPlan.data.name.trim()} onClick={() => { const p = editPlan; setEditPlan(null); action(async () => { if (p.id) await apiSend(`/plans/${p.id}`, "PATCH", p.data); else await apiSend("/plans", "POST", p.data); }, t("admin.members.saved")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
