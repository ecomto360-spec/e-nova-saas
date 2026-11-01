/**
 * LOT C — Paiements (Super Admin).
 * Transactions (filtres, recherche, export), file « À valider » (CCP /
 * BaridiMob / virement : valider = abonnement activé + facture numérotée,
 * refuser = motif), factures PDF, coupons d'abonnement, rapports MRR/churn.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Wallet, Check, X, FileText, Tag, BarChart3, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, apiDownload, fmtDate, fmtDateTime, fmtDZD, fmtMonth } from "./api";
import AdminTable, { StatusBadge, type AdminColumn } from "./AdminTable";

interface PayRow {
  id: string; tenantId: string; storeName: string; email: string; amountDA: number;
  paymentMethod: string; status: string; createdAt: string; note: string; proofUrl: string;
}
interface Invoice { id: string; number: string; storeName: string; amountDA: number; date: string; plan: string; }
interface Coupon { id: string; code: string; percentOff: number; amountOff: number; expiresAt: string; maxRedemptions: number; redemptions: number; active: boolean; }
interface Reports {
  revenueTotal: number; paymentsCount: number; mrr: number; activeSubs: number; expired30: number; churnPercent: number;
  byMonth: Array<{ month: string; amount: number }>;
  byMethod: Array<{ method: string; amount: number }>;
  byPlan: Array<{ plan: string; subscribers: number; mrr: number }>;
}
interface Plan { id: string; name: string; }

const MODAL_CLASSES = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70";
type Tab = "transactions" | "pending" | "invoices" | "coupons" | "reports";

export default function AdminPayments(): React.ReactElement {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("transactions");
  const [rows, setRows] = useState<PayRow[]>([]);
  const [pending, setPending] = useState<PayRow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reports, setReports] = useState<Reports | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [validateModal, setValidateModal] = useState<PayRow | null>(null);
  const [valPlan, setValPlan] = useState("");
  const [valDays, setValDays] = useState(30);
  const [rejectModal, setRejectModal] = useState<PayRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [couponModal, setCouponModal] = useState<{ code: string; percentOff: number; amountOff: number; maxRedemptions: number; note: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "transactions" || tab === "pending") {
        const qs = new URLSearchParams({ page: String(page), pageSize: "20", search, status: tab === "pending" ? "pending" : status, method });
        const j = await apiGet<{ total: number; pages: number; rows: PayRow[]; pendingManual: number }>(`/payments?${qs}`);
        setRows(j.rows);
        setTotal(j.total);
        setPages(j.pages);
        if (tab === "pending") setPending(j.rows.filter((r) => /ccp|baridi|virement|manual/i.test(r.paymentMethod)));
      } else if (tab === "invoices") {
        const j = await apiGet<{ rows: Invoice[] }>("/payments/invoices");
        setInvoices(j.rows);
      } else if (tab === "coupons") {
        const j = await apiGet<{ rows: Coupon[] }>("/coupons");
        setCoupons(j.rows);
      } else if (tab === "reports") {
        const j = await apiGet<Reports>("/payments/reports?days=90");
        setReports(j);
      }
      if (plans.length === 0) {
        const pl = await apiGet<{ plans: Plan[] }>("/plans");
        setPlans(pl.plans);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, status, method, plans.length, t]);

  useEffect(() => { load(); }, [load]);

  const action = async (fn: () => Promise<void>, okMsg: string): Promise<void> => {
    setBusy(true);
    setNotice("");
    try { await fn(); setNotice(okMsg); await load(); }
    catch (e) { setNotice("✗ " + (e instanceof Error ? e.message : "Erreur")); }
    finally { setBusy(false); }
  };

  const columns: AdminColumn<PayRow>[] = [
    { key: "createdAt", label: t("admin.pay.date"), render: (r) => fmtDateTime(r.createdAt) },
    {
      key: "storeName", label: t("admin.pay.store"),
      render: (r) => (<div><div className="text-white">{r.storeName || "—"}</div><div className="text-xs text-neutral-500">{r.email || r.tenantId}</div></div>)
    },
    { key: "amountDA", label: t("admin.pay.amount"), render: (r) => <span className="font-semibold text-white">{fmtDZD(r.amountDA)}</span> },
    { key: "paymentMethod", label: t("admin.pay.method"), render: (r) => <span className="capitalize">{r.paymentMethod || "—"}</span> },
    { key: "status", label: t("admin.pay.status"), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", label: "", className: "text-end",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.proofUrl && <a href={r.proofUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-blue-400" title={t("admin.pay.receipt")}><FileText className="w-4 h-4" /></a>}
          {r.status === "pending" && (
            <>
              <button title={t("admin.pay.validate")} onClick={() => { setValidateModal(r); setValPlan(""); setValDays(30); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><Check className="w-4 h-4" /></button>
              <button title={t("admin.pay.reject")} onClick={() => { setRejectModal(r); setRejectReason(""); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-red-400"><X className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )
    }
  ];

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "transactions", label: t("admin.pay.tabTransactions"), icon: <Wallet className="w-4 h-4" /> },
    { id: "pending", label: t("admin.pay.tabPending"), icon: <RefreshCw className="w-4 h-4" /> },
    { id: "invoices", label: t("admin.pay.tabInvoices"), icon: <FileText className="w-4 h-4" /> },
    { id: "coupons", label: t("admin.pay.tabCoupons"), icon: <Tag className="w-4 h-4" /> },
    { id: "reports", label: t("admin.pay.tabReports"), icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Wallet className="w-5 h-5 text-red-500" />{t("admin.nav.payments")}</h1>
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}

      <div className="flex flex-wrap gap-1 bg-[#111] border border-neutral-800 rounded-xl p-1 w-fit">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => { setTab(tb.id); setPage(1); }} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium ${tab === tb.id ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}>{tb.icon}{tb.label}</button>
        ))}
      </div>

      {(tab === "transactions" || tab === "pending") && (
        <AdminTable
          columns={columns}
          rows={tab === "pending" ? pending : rows}
          loading={loading}
          error={error}
          onRetry={load}
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={
            tab === "transactions" ? (
              <>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">{t("admin.members.allStatus")}</option>
                  <option value="pending">{t("admin.pay.stPending")}</option>
                  <option value="completed">{t("admin.pay.stCompleted")}</option>
                  <option value="rejected">{t("admin.pay.stRejected")}</option>
                </select>
                <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">{t("admin.pay.allMethods")}</option>
                  <option value="ccp">CCP</option>
                  <option value="baridi">BaridiMob</option>
                  <option value="virement">Virement</option>
                  <option value="chargily">Chargily</option>
                </select>
              </>
            ) : undefined
          }
          sortKey="createdAt"
          sortDir={-1}
          onSort={() => undefined}
          page={page}
          pages={pages}
          total={tab === "pending" ? pending.length : total}
          onPage={setPage}
          onExport={tab === "transactions" ? () => apiDownload(`/payments?format=csv&search=${encodeURIComponent(search)}&status=${status}&method=${method}`) : undefined}
          rowKey={(r) => r.id}
        />
      )}

      {tab === "invoices" && (
        <AdminTable
          columns={[
            { key: "number", label: "N°", render: (r: Invoice) => <span className="font-mono text-white">{r.number}</span> },
            { key: "storeName", label: t("admin.pay.store"), render: (r: Invoice) => r.storeName },
            { key: "amountDA", label: t("admin.pay.amount"), render: (r: Invoice) => <span className="font-semibold text-white">{fmtDZD(r.amountDA)}</span> },
            { key: "plan", label: t("admin.members.plan"), render: (r: Invoice) => r.plan || "—" },
            { key: "date", label: t("admin.pay.date"), render: (r: Invoice) => fmtDateTime(r.date) },
            { key: "pdf", label: "", className: "text-end", render: (r: Invoice) => <a href={`/api/admin/v1/payments/invoices/${encodeURIComponent(r.id)}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] border border-neutral-800 rounded-lg text-neutral-300 hover:text-white"><FileText className="w-3.5 h-3.5" />PDF</a> }
          ] as AdminColumn<Invoice>[]}
          rows={invoices}
          loading={loading}
          error={error}
          onRetry={load}
          search=""
          onSearch={() => undefined}
          sortKey="date"
          sortDir={-1}
          onSort={() => undefined}
          page={1}
          pages={1}
          total={invoices.length}
          onPage={() => undefined}
          rowKey={(r: Invoice) => r.id}
        />
      )}

      {tab === "coupons" && (
        <div className="space-y-3">
          <button onClick={() => setCouponModal({ code: "", percentOff: 10, amountOff: 0, maxRedemptions: 0, note: "" })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-600 text-white rounded-xl hover:bg-red-700"><Tag className="w-4 h-4" />{t("admin.pay.newCoupon")}</button>
          <AdminTable
            columns={[
              { key: "code", label: t("admin.pay.code"), render: (r: Coupon) => <span className="font-mono text-white">{r.code}</span> },
              { key: "discount", label: t("admin.pay.discount"), render: (r: Coupon) => (r.percentOff ? `${r.percentOff}%` : fmtDZD(r.amountOff)) },
              { key: "redemptions", label: t("admin.pay.redemptions"), render: (r: Coupon) => `${r.redemptions}${r.maxRedemptions ? " / " + r.maxRedemptions : ""}` },
              { key: "active", label: t("admin.members.status"), render: (r: Coupon) => <StatusBadge status={r.active ? "active" : "annulé"} /> },
              { key: "actions", label: "", className: "text-end", render: (r: Coupon) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => action(async () => { await apiSend(`/coupons/${r.id}/toggle`, "POST"); }, t("admin.members.saved"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400"><RefreshCw className="w-4 h-4" /></button>
                  <button onClick={() => action(async () => { await apiSend(`/coupons/${r.id}`, "DELETE"); }, t("admin.plans.deleted"))} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ) }
            ] as AdminColumn<Coupon>[]}
            rows={coupons}
            loading={loading}
            error={error}
            onRetry={load}
            search=""
            onSearch={() => undefined}
            sortKey="code"
            sortDir={1}
            onSort={() => undefined}
            page={1}
            pages={1}
            total={coupons.length}
            onPage={() => undefined}
            rowKey={(r: Coupon) => r.id}
          />
        </div>
      )}

      {tab === "reports" && reports && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("admin.pay.revenue90"), value: fmtDZD(reports.revenueTotal) },
              { label: "MRR", value: fmtDZD(reports.mrr) },
              { label: t("admin.pay.activeSubs"), value: String(reports.activeSubs) },
              { label: `${t("admin.pay.churn")} (${t("admin.pay.month30")})`, value: `${reports.churnPercent}%` }
            ].map((c) => (
              <div key={c.label} className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
                <div className="text-xs text-neutral-500 mb-1">{c.label}</div>
                <div className="text-xl font-bold text-white">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">{t("admin.pay.byMonth")}</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.byMonth.map((m) => ({ ...m, label: fmtMonth(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} formatter={(v: number) => [v.toLocaleString("fr-FR") + " DA", t("admin.pay.revenue")]} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">{t("admin.pay.byMethod")}</h3>
              {reports.byMethod.map((m) => (
                <div key={m.method} className="flex justify-between text-sm py-1 border-b border-neutral-800/50"><span className="capitalize text-neutral-300">{m.method}</span><span className="text-white">{fmtDZD(m.amount)}</span></div>
              ))}
            </div>
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">{t("admin.pay.byPlan")}</h3>
              {reports.byPlan.map((p) => (
                <div key={p.plan} className="flex justify-between text-sm py-1 border-b border-neutral-800/50"><span className="text-neutral-300">{p.plan} ({p.subscribers})</span><span className="text-white">{fmtDZD(p.mrr)}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {validateModal && (
        <div className={MODAL_CLASSES} onClick={() => setValidateModal(null)}>
          <div className="bg-[#111] border border-emerald-500/30 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">{t("admin.pay.validateTitle")}</h2>
            <p className="text-sm text-neutral-400 mb-4">{validateModal.storeName} — <strong className="text-white">{fmtDZD(validateModal.amountDA)}</strong> ({validateModal.paymentMethod}) · {fmtDate(validateModal.createdAt)}</p>
            <label className="text-xs text-neutral-400 block mb-1">{t("admin.pay.planToActivate")}</label>
            <select value={valPlan} onChange={(e) => setValPlan(e.target.value)} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-3">
              <option value="">— {t("admin.members.keepPlan")} —</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="text-xs text-neutral-400 block mb-1">{t("admin.members.extendDays")}</label>
            <input type="number" min={1} max={365} value={valDays} onChange={(e) => setValDays(Number(e.target.value) || 30)} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white mb-4" />
            <p className="text-xs text-neutral-600 mb-4">{t("admin.pay.validateHint")}</p>
            <div className="flex gap-2">
              <button onClick={() => setValidateModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy} onClick={() => { const m = validateModal; setValidateModal(null); action(async () => { const r = await apiSend<{ invoice: { number: string } }>(`/payments/${m.id}/validate`, "POST", { extendDays: valDays, planId: valPlan }); setNotice(t("admin.pay.validated") + " — " + t("admin.pay.invoice") + " " + r.invoice.number); }, ""); }} className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">{t("admin.pay.validateConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className={MODAL_CLASSES} onClick={() => setRejectModal(null)}>
          <div className="bg-[#111] border border-red-500/30 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">{t("admin.pay.rejectTitle")}</h2>
            <p className="text-sm text-neutral-400 mb-4">{rejectModal.storeName} — {fmtDZD(rejectModal.amountDA)}</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder={t("admin.pay.rejectReasonPh")} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-sm text-white mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy || !rejectReason.trim()} onClick={() => { const m = rejectModal; setRejectModal(null); action(async () => { await apiSend(`/payments/${m.id}/reject`, "POST", { reason: rejectReason }); }, t("admin.pay.rejected")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.pay.rejectConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {couponModal && (
        <div className={MODAL_CLASSES} onClick={() => setCouponModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{t("admin.pay.newCoupon")}</h2>
            <div className="space-y-3 text-sm">
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.pay.code")}</label>
                <input value={couponModal.code} onChange={(e) => setCouponModal({ ...couponModal, code: e.target.value.toUpperCase() })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono" dir="ltr" placeholder="BIENVENUE10" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.pay.percentOff")} (%)</label>
                  <input type="number" min={0} max={100} value={couponModal.percentOff} onChange={(e) => setCouponModal({ ...couponModal, percentOff: Number(e.target.value) || 0 })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.pay.amountOff")} (DA)</label>
                  <input type="number" min={0} value={couponModal.amountOff} onChange={(e) => setCouponModal({ ...couponModal, amountOff: Number(e.target.value) || 0 })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
              </div>
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.pay.maxRedemptions")} (0 = ∞)</label>
                <input type="number" min={0} value={couponModal.maxRedemptions} onChange={(e) => setCouponModal({ ...couponModal, maxRedemptions: Number(e.target.value) || 0 })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setCouponModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={busy || !couponModal.code.trim()} onClick={() => { const c = couponModal; setCouponModal(null); action(async () => { await apiSend("/coupons", "POST", c); }, t("admin.members.saved")); }} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
