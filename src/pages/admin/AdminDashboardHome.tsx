import { useCallback, useEffect, useState } from "react";
import {
  Users, UserCheck, Wifi, UserPlus, Store, Banknote, CreditCard, ShoppingCart,
  Ghost, CheckCircle2, MessageCircle, AlertTriangle, RefreshCw, Loader2, TrendingUp, Trash2
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * LOT A — Tableau de bord Super Admin.
 * Données : GET /api/admin/v1/overview?days=7|30|90 (documents agrégés
 * platform_counters + platform_stats/daily|monthly — jamais de lecture
 * complète des collections). Bouton « Recalculer » (POST stats/recompute,
 * super_admin, journalisé dans l'audit).
 */

interface Overview {
  ok: boolean;
  periodDays: number;
  kpis: Record<string, number>;
  series: {
    daily: Array<Record<string, number | string>>;
    monthly: Array<Record<string, number | string>>;
  };
  latestSignups: Array<{ id: string; storeName: string; ownerEmail: string; createdAt: string; plan: string }>;
  latestPayments: Array<{ id: string; storeName: string; amountDA: number; status: string; method: string; createdAt: string }>;
  alerts: Array<{ type: string; label: string; detail: string }>;
  statsUpdatedAt: string;
  includeTest?: boolean;
  hasTestData?: boolean;
}

const fmtNum = (n: number): string => (Number(n) || 0).toLocaleString("fr-FR");
const fmtDZD = (n: number): string => (Number(n) || 0).toLocaleString("fr-FR") + " DZD";

export default function AdminDashboardHome() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [includeTest, setIncludeTest] = useState(false);
  const [purging, setPurging] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [noticeData, setNoticeData] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/v1/overview?days=${days}&includeTest=${includeTest ? 1 : 0}`, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as Overview);
    } catch {
      setError(t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [days, includeTest, t]);

  useEffect(() => { load(); }, [load]);

  const recompute = async () => {
    setRecomputing(true);
    try {
      await fetch("/api/admin/v1/stats/recompute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 90 })
      });
      await load();
    } catch { /* ignore */ } finally {
      setRecomputing(false);
    }
  };

  const k = data?.kpis || {};

  const kpiCards: Array<{ icon: typeof Users; label: string; value: string; sub?: string; tone: string }> = [
    { icon: Users, label: t("admin.kpi.members"), value: fmtNum(k.membersTotal), sub: `${fmtNum(k.membersActive30d)} ${t("admin.kpi.active30")}`, tone: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { icon: Wifi, label: t("admin.kpi.online"), value: fmtNum(k.onlineNow), sub: t("admin.kpi.onlineSub"), tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { icon: UserPlus, label: t("admin.kpi.signups"), value: fmtNum(k.signupsToday), sub: `${t("admin.kpi.week")}: ${fmtNum(k.signupsWeek)} · ${days} ${t("admin.kpi.days")}: ${fmtNum(k.signupsPeriod)}`, tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { icon: Store, label: t("admin.kpi.stores"), value: fmtNum(k.storesActive), tone: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { icon: Banknote, label: t("admin.kpi.mrr"), value: fmtDZD(k.revenueMonth), sub: t("admin.kpi.mrrSub"), tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { icon: CreditCard, label: t("admin.kpi.subs"), value: `${fmtNum(k.activeSubscriptions)} / ${fmtNum(k.expiredSubscriptions)}`, sub: t("admin.kpi.subsSub"), tone: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { icon: ShoppingCart, label: t("admin.kpi.orders"), value: fmtNum(k.ordersTotal), sub: `${t("admin.kpi.period")}: ${fmtNum(k.ordersPeriod)} · GMV ${fmtNum(k.gmvPeriod)}`, tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { icon: Ghost, label: t("admin.kpi.carts"), value: `${fmtNum(k.cartsAbandonedTotal)} / ${fmtNum(k.cartsRecoveredTotal)}`, sub: t("admin.kpi.cartsSub"), tone: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    { icon: MessageCircle, label: t("admin.kpi.wa"), value: fmtNum(k.waMessagesTotal), sub: t("admin.kpi.waSub"), tone: "text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20" }
  ];

  const dailyChart = (data?.series.daily || []).map((d) => ({
    date: String(d.date).slice(5),
    signups: Number(d.signups) || 0,
    orders: Number(d.orders) || 0
  }));
  const fmtMonthLabel = (m: string): string => {
    if (!/^\d{4}-\d{2}$/.test(m)) return m;
    try { return new Date(m + "-01").toLocaleDateString("fr-FR", { month: "short", year: "numeric" }); } catch { return m; }
  };
  const monthlyChart = (data?.series.monthly || [])
    .filter((m) => Number(m.revenue) > 0 || Number(m.signups) > 0)
    .map((m) => ({
      month: fmtMonthLabel(String(m.month)),
      revenue: Number(m.revenue) || 0
    }));

  const fmtDate = (iso: string): string => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
    } catch { return iso.slice(0, 16).replace("T", " "); }
  };

  return (
    <div className="space-y-5">
      {/* Barre période + recalcul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#111114] rounded-xl border border-neutral-800 w-fit">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                days === d ? "bg-red-500/15 text-red-400 border border-red-500/30" : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              {d} {t("admin.kpi.days")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {data?.statsUpdatedAt && (
            <span className="text-[10px] text-neutral-500">{t("admin.statsUpTo")} {fmtDate(data.statsUpdatedAt)}</span>
          )}
          {data?.hasTestData && (
            <label className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer select-none">
              <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} className="w-3.5 h-3.5 accent-red-500" />
              {t("admin.testdata.include")}
            </label>
          )}
          {data?.hasTestData && (
            <button
              onClick={() => setConfirmPurge(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30"
            >
              <Trash2 className="w-3.5 h-3.5" />{t("admin.testdata.purge")}
            </button>
          )}
          <button
            onClick={recompute}
            disabled={recomputing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer disabled:opacity-50"
          >
            {recomputing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{t("admin.recompute")}</span>
          </button>
        </div>
      </div>

      {confirmPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setConfirmPurge(false)}>
          <div className="bg-[#111] border border-orange-500/30 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">{t("admin.testdata.purgeTitle")}</h2>
            <p className="text-sm text-neutral-400 mb-4">{t("admin.testdata.purgeWarn")}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmPurge(false)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button
                disabled={purging}
                onClick={async () => {
                  setConfirmPurge(false);
                  setPurging(true);
                  try {
                    const res = await fetch("/api/admin/v1/test-data/purge", {
                      method: "POST", credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ confirm: true })
                    });
                    const j = (await res.json()) as { tenantsDeleted?: number; paymentsDeleted?: number };
                    setNoticeData(`${t("admin.testdata.purged")} : ${j.tenantsDeleted || 0} ${t("admin.members.store").toLowerCase()}(s), ${j.paymentsDeleted || 0} ${t("admin.nav.payments").toLowerCase()}`);
                    await load();
                  } catch { setNoticeData("✗ " + t("admin.loadError")); }
                  finally { setPurging(false); }
                }}
                className="flex-1 px-4 py-2 text-sm bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50"
              >
                {purging ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t("admin.testdata.purgeConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {noticeData && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{noticeData}</div>}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {kpiCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-neutral-800 bg-[#111114] p-4.5 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">{c.label}</p>
                <p className="mt-1.5 text-2xl font-black text-white truncate" dir="ltr">{c.value}</p>
                {c.sub && <p className="mt-1 text-[10px] text-neutral-500 truncate">{c.sub}</p>}
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c.tone}`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="rounded-2xl border border-neutral-800 bg-[#111114] p-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wide mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />{t("admin.chart.signups")}
          </h3>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#26262b" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#26262b" }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#16161a", border: "1px solid #333", borderRadius: 12, fontSize: 11 }} labelStyle={{ color: "#a3a3a3" }} />
                <Line type="monotone" dataKey="signups" stroke="#f59e0b" strokeWidth={2} dot={false} name={t("admin.chart.signups")} />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name={t("admin.chart.orders")} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-[#111114] p-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-400" />{t("admin.chart.revenue")}
          </h3>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#26262b" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#26262b" }} />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#16161a", border: "1px solid #333", borderRadius: 12, fontSize: 11 }} labelStyle={{ color: "#a3a3a3" }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name={t("admin.chart.revenue")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Listes + alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Derniers inscrits */}
        <div className="rounded-2xl border border-neutral-800 bg-[#111114] p-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400" />{t("admin.latest.signups")}
          </h3>
          <div className="space-y-2">
            {(data?.latestSignups || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#16161a] border border-neutral-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate" dir="auto">{s.storeName || s.ownerEmail || s.id}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{s.ownerEmail}</p>
                </div>
                <span className="text-[10px] text-neutral-500 shrink-0" dir="ltr">{fmtDate(s.createdAt)}</span>
              </div>
            ))}
            {(data?.latestSignups || []).length === 0 && <p className="text-xs text-neutral-500 py-2">—</p>}
          </div>
        </div>

        {/* Derniers paiements */}
        <div className="rounded-2xl border border-neutral-800 bg-[#111114] p-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-400" />{t("admin.latest.payments")}
          </h3>
          <div className="space-y-2">
            {(data?.latestPayments || []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#16161a] border border-neutral-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate" dir="auto">{p.storeName || "—"}</p>
                  <p className="text-[10px] text-neutral-500">{p.method || "—"}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-black text-white" dir="ltr">{fmtDZD(p.amountDA)}</p>
                  <p className={`text-[10px] font-bold ${p.status === "pending" ? "text-amber-400" : "text-emerald-400"}`}>
                    {p.status === "pending" ? t("admin.pay.pending") : t("admin.pay.ok")}
                  </p>
                </div>
              </div>
            ))}
            {(data?.latestPayments || []).length === 0 && <p className="text-xs text-neutral-500 py-2">—</p>}
          </div>
        </div>

        {/* Alertes */}
        <div className="rounded-2xl border border-neutral-800 bg-[#111114] p-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />{t("admin.alerts")}
          </h3>
          <div className="space-y-2">
            {(data?.alerts || []).map((a, i) => (
              <div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                <p className="text-xs font-bold text-amber-300 truncate" dir="auto">{a.label}</p>
                <p className="text-[10px] text-neutral-400" dir="auto">{a.detail}</p>
              </div>
            ))}
            {(data?.alerts || []).length === 0 && (
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-emerald-300">{t("admin.noAlerts")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
