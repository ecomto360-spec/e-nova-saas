/**
 * LOT D — Statistiques (Super Admin).
 * Croissance, rétention, répartition par plan, top boutiques, wilayas,
 * conversion paniers abandonnés, performance WhatsApp. Filtres de période.
 */
import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, TrendingUp, MapPin, ShoppingCart, MessageCircle } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, fmtNum, fmtDZD } from "./api";

interface Insights {
  days: number;
  planDistribution: Array<{ plan: string; count: number }>;
  topStores: Array<{ name: string; orders: number; gmv: number }>;
  topWilayas: Array<{ wilaya: string; orders: number }>;
  carts: { total: number; recovered: number; conversionPercent: number };
  waSeries: Array<{ date: string; value: number }>;
  retention: { activeStores: number; totalStores: number; percent: number };
}
interface OverviewSeries {
  series: { daily: Array<Record<string, number | string>> };
}

const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminStats(): React.ReactElement {
  const { t } = useLanguage();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<Insights | null>(null);
  const [signups, setSignups] = useState<Array<{ date: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [insights, overview] = await Promise.all([
        apiGet<Insights>(`/stats/insights?days=${days}`),
        apiGet<OverviewSeries>(`/overview?days=${days}`)
      ]);
      setData(insights);
      setSignups(overview.series.daily.map((d) => ({ date: String(d.date).slice(5), value: Number(d.signups) || 0 })));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [days, t]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-red-500" />{t("admin.nav.stats")}</h1>
        <div className="flex gap-1 bg-[#111] border border-neutral-800 rounded-xl p-1">
          {([7, 30, 90] as const).map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${days === d ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}>{d} j</button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
      {loading && <p className="text-neutral-500 text-sm">…</p>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("admin.stats.storesActive"), value: `${data.retention.activeStores} / ${data.retention.totalStores}` },
              { label: t("admin.stats.retention"), value: `${data.retention.percent}%` },
              { label: t("admin.stats.cartConversion"), value: `${data.carts.conversionPercent}%` },
              { label: t("admin.stats.waMessages"), value: fmtNum(data.waSeries.reduce((s, w) => s + w.value, 0)) }
            ].map((c) => (
              <div key={c.label} className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
                <div className="text-xs text-neutral-500 mb-1">{c.label}</div>
                <div className="text-xl font-bold text-white">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-red-500" />{t("admin.stats.growth")}</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} interval={Math.floor(signups.length / 8)} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} name={t("admin.chart.signups")} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{t("admin.stats.planDist")}</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.planDistribution} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={80} label={(e: { name?: string; value?: number }) => `${e.name || ""} (${e.value || 0})`}>
                      {data.planDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-red-500" />{t("admin.stats.topStores")}</h3>
              <div className="space-y-1.5">
                {data.topStores.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm bg-[#1a1a1a] border border-neutral-800 rounded-lg px-3 py-2">
                    <span className="text-neutral-200"><span className="text-neutral-500 me-2">#{i + 1}</span>{s.name}</span>
                    <span className="text-white">{s.orders} 🛒 · {fmtDZD(s.gmv)}</span>
                  </div>
                ))}
                {data.topStores.length === 0 && <p className="text-neutral-600 text-sm">—</p>}
              </div>
            </div>

            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" />{t("admin.stats.topWilayas")}</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topWilayas} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="wilaya" tick={{ fill: "#888", fontSize: 10 }} width={110} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
                    <Bar dataKey="orders" fill="#f59e0b" radius={[0, 4, 4, 0]} name={t("admin.stats.orders")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-500" />{t("admin.stats.waPerf")}</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.waSeries.map((w) => ({ ...w, date: w.date.slice(5) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} interval={Math.max(0, Math.floor(data.waSeries.length / 8) - 1)} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} name={t("admin.kpi.wa")} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
