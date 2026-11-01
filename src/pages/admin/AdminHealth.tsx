/**
 * LOT E — Santé système (Super Admin).
 * Version déployée (commit/région), état Firestore/WhatsApp/SMTP/webhook/cron,
 * erreurs récentes, exécution manuelle des jobs (« Relancer »).
 */
import React, { useCallback, useEffect, useState } from "react";
import { HeartPulse, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, fmtDateTime } from "./api";

interface Health {
  ok: boolean;
  version: { bundleId: string; commit: string; region: string; node: string; env: string };
  firestore: { ok: boolean; latencyMs: number; updatedAt: string };
  whatsapp: { mode: string; configured: boolean; webhookVerifiedAt: string; source: string };
  smtp: { configured: boolean };
  cron: { daily: Record<string, unknown>; whatsapp: Record<string, unknown> };
  recentErrors: Array<Record<string, unknown>>;
  serverTime: string;
}

function StatusIcon({ ok }: { ok: boolean }): React.ReactElement {
  return ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />;
}

export default function AdminHealth(): React.ReactElement {
  const { t } = useLanguage();
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<Health>("/health"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const runJobs = async (): Promise<void> => {
    setRunning(true);
    setNotice("");
    try {
      const r = await apiSend<{ jobs: { reminders: number; suspended: number; announcements: number } }>("/jobs/run", "POST");
      setNotice(t("admin.health.jobsRun") + ` : ${r.jobs.reminders} ${t("admin.health.reminders")}, ${r.jobs.suspended} ${t("admin.health.suspensions")}, ${r.jobs.announcements} ${t("admin.notif.notifications")}`);
      await load();
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><HeartPulse className="w-5 h-5 text-red-500" />{t("admin.nav.health")}</h1>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button onClick={runJobs} disabled={running} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">{t("admin.health.runJobs")}</button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}
      {loading && !data && <p className="text-neutral-500 text-sm">…</p>}

      {data && (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white mb-2">{t("admin.health.version")}</h3>
              <div className="text-sm text-neutral-300 flex justify-between"><span>Commit</span><code className="text-white">{data.version.commit ? data.version.commit.slice(0, 8) : "—"}</code></div>
              <div className="text-sm text-neutral-300 flex justify-between"><span>Région</span><span className="text-white">{data.version.region || "—"}</span></div>
              <div className="text-sm text-neutral-300 flex justify-between"><span>Node</span><span className="text-white">{data.version.node}</span></div>
              <div className="text-sm text-neutral-300 flex justify-between"><span>Env</span><span className="text-white">{data.version.env || "—"}</span></div>
            </div>
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white mb-2">{t("admin.health.services")}</h3>
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><StatusIcon ok={data.firestore.ok} />Firestore</span><span className="text-neutral-400">{data.firestore.latencyMs} ms</span></div>
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><StatusIcon ok={data.whatsapp.configured} />WhatsApp</span><span className="text-neutral-400 capitalize">{data.whatsapp.mode} ({data.whatsapp.source})</span></div>
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><StatusIcon ok={!!data.whatsapp.webhookVerifiedAt} />Webhook</span><span className="text-neutral-400">{data.whatsapp.webhookVerifiedAt ? fmtDateTime(data.whatsapp.webhookVerifiedAt) : "—"}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><StatusIcon ok={data.smtp.configured} />SMTP</span><span className="text-neutral-400">{data.smtp.configured ? "OK" : "—"}</span></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">{t("admin.health.cron")}</h3>
              <div className="text-xs text-neutral-500 mb-1">{t("admin.health.lastRun")}</div>
              <div className="text-sm text-white mb-3">{fmtDateTime(String(data.cron.daily.lastRunAt || "")) || "—"}</div>
              <div className="text-xs text-neutral-500 space-y-1">
                <div>{t("admin.health.reminders")} : {String(data.cron.daily.reminders ?? "—")}</div>
                <div>{t("admin.health.suspensions")} : {String(data.cron.daily.suspended ?? "—")}</div>
                <div>{t("admin.notif.notifications")} : {String(data.cron.daily.announcements ?? "—")}</div>
                <div>WhatsApp : {String(data.cron.whatsapp.lastRunAt ? fmtDateTime(String(data.cron.whatsapp.lastRunAt)) : "—")}</div>
              </div>
            </div>
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" />{t("admin.health.recentErrors")}</h3>
              <div className="space-y-1">
                {data.recentErrors.map((e) => (
                  <div key={String(e.id)} className="text-xs bg-[#1a1a1a] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-400">
                    <span className="text-red-400 font-medium">{String(e.scope || "erreur")}</span> · {fmtDateTime(String(e.at || ""))}<br />
                    <span className="text-neutral-500">{String(e.message || "").slice(0, 140)}</span>
                  </div>
                ))}
                {data.recentErrors.length === 0 && <p className="text-neutral-600 text-xs">— {t("admin.health.noErrors")}</p>}
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-600">{t("admin.health.serverTime")} : {fmtDateTime(data.serverTime)}</p>
        </>
      )}
    </div>
  );
}
