/**
 * LOT D — Intégration WhatsApp (Super Admin).
 * Formulaire Cloud API (secrets chiffrés AES-256-GCM, jamais renvoyés :
 * « Configuré ✓ » + Remplacer/Supprimer), test de connexion, URL du webhook +
 * verify token à copier, indicateur webhook vérifié, envoi message test
 * (réponse Meta brute), templates (soumission + statuts), consommation/quotas.
 * Ordre de résolution côté serveur : config super admin → env → simulation.
 */
import React, { useCallback, useEffect, useState } from "react";
import { MessageCircle, Copy, Check, Send, RefreshCw, Trash2, Plus, ShieldCheck, Loader2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, fmtNum } from "./api";
import { StatusBadge } from "./AdminTable";

interface WaCfg {
  mode: string; phoneNumberId: string; wabaId: string; appId: string; graphVersion: string; appUrl: string;
  verifyToken: string; tokenConfigured: boolean; appSecretConfigured: boolean; source: string;
  encryptionAvailable: boolean; webhookVerifiedAt: string; webhookUrl: string;
}
interface Template { id: string; name: string; category: string; language: string; status: string; body?: string; source?: string; }
interface Usage { totalSent30d: number; rows: Array<{ id: string; storeName: string; plan: string; sent30d: number; quota: number }>; }

const MODAL_CLASSES = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70";
type Tab = "config" | "templates" | "usage";

export default function AdminWhatsApp(): React.ReactElement {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("config");
  const [cfg, setCfg] = useState<WaCfg | null>(null);
  const [form, setForm] = useState({ mode: "simulation", phoneNumberId: "", wabaId: "", appId: "", graphVersion: "v21.0", appUrl: "", verifyToken: "", token: "", appSecret: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendMsg, setSendMsg] = useState("Message test e-nova ✅");
  const [copied, setCopied] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [tplModal, setTplModal] = useState<{ name: string; category: string; language: string; body: string; submit: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await apiGet<WaCfg>("/whatsapp/config");
      setCfg(c);
      setForm((f) => ({ ...f, mode: c.mode, phoneNumberId: c.phoneNumberId, wabaId: c.wabaId, appId: c.appId, graphVersion: c.graphVersion, appUrl: c.appUrl, verifyToken: c.verifyToken }));
      if (tab === "templates") setTemplates((await apiGet<{ rows: Template[] }>("/whatsapp/templates?refresh=1")).rows);
      if (tab === "usage") setUsage(await apiGet<Usage>("/whatsapp/usage"));
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const copy = (label: string, value: string): void => {
    navigator.clipboard.writeText(value).then(() => { setCopied(label); window.setTimeout(() => setCopied(""), 1500); }).catch(() => undefined);
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setNotice("");
    try {
      await apiSend("/whatsapp/config", "PUT", form);
      setNotice(t("admin.wa.saved"));
      setForm((f) => ({ ...f, token: "", appSecret: "" }));
      await load();
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (): Promise<void> => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await apiSend<{ ok: boolean; httpStatus: number; response: string }>("/whatsapp/test-connection", "POST");
      setTestResult(`HTTP ${r.httpStatus} — ${r.response}`);
    } catch (e) {
      setTestResult("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setTesting(false);
    }
  };

  const sendTest = async (): Promise<void> => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await apiSend<{ ok: boolean; httpStatus: number; response: string }>("/whatsapp/send-test", "POST", { to: sendTo, message: sendMsg });
      setTestResult(`HTTP ${r.httpStatus} — ${r.response}`);
    } catch (e) {
      setTestResult("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-green-500" />{t("admin.nav.integrations")}</h1>
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}

      <div className="flex flex-wrap gap-1 bg-[#111] border border-neutral-800 rounded-xl p-1 w-fit">
        {([["config", t("admin.wa.tabConfig")], ["templates", t("admin.wa.tabTemplates")], ["usage", t("admin.wa.tabUsage")]] as Array<[Tab, string]>).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 text-sm rounded-lg font-medium ${tab === id ? "bg-green-600 text-white" : "text-neutral-400 hover:text-white"}`}>{label}</button>
        ))}
      </div>

      {loading && <p className="text-neutral-500 text-sm">…</p>}

      {tab === "config" && cfg && !loading && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex gap-1 bg-[#1a1a1a] border border-neutral-800 rounded-xl p-1">
                <button onClick={() => setForm({ ...form, mode: "simulation" })} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${form.mode === "simulation" ? "bg-yellow-600 text-white" : "text-neutral-400"}`}>{t("admin.wa.modeSim")}</button>
                <button onClick={() => setForm({ ...form, mode: "real" })} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${form.mode === "real" ? "bg-green-600 text-white" : "text-neutral-400"}`}>{t("admin.wa.modeReal")}</button>
              </div>
              <span className="text-xs text-neutral-500">{t("admin.wa.source")} : <strong className="text-neutral-300">{cfg.source}</strong></span>
              {cfg.webhookVerifiedAt && <span className="flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck className="w-4 h-4" />{t("admin.wa.webhookVerified")}</span>}
              {!cfg.encryptionAvailable && <span className="text-xs text-orange-400">⚠ {t("admin.wa.noEncryptionKey")}</span>}
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {([
                ["phoneNumberId", t("admin.wa.phoneNumberId")],
                ["wabaId", "WhatsApp Business Account ID"],
                ["appId", "Meta App ID"],
                ["graphVersion", t("admin.wa.graphVersion")],
                ["appUrl", t("admin.wa.appUrl")],
                ["verifyToken", "Verify Token (webhook)"]
              ] as Array<[keyof typeof form, string]>).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-neutral-400 block mb-1">{label}</label>
                  <input value={String(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" dir="ltr" />
                </div>
              ))}
              <div>
                <label className="text-xs text-neutral-400 block mb-1">{t("admin.wa.token")} {cfg.tokenConfigured && <span className="text-emerald-400">✓ {t("admin.wa.configured")}</span>}</label>
                <input type="password" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder={cfg.tokenConfigured ? t("admin.wa.replacePh") : "EAAG…"} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" dir="ltr" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">App Secret {cfg.appSecretConfigured && <span className="text-emerald-400">✓ {t("admin.wa.configured")}</span>}</label>
                <input type="password" value={form.appSecret} onChange={(e) => setForm({ ...form, appSecret: e.target.value })} placeholder={cfg.appSecretConfigured ? t("admin.wa.replacePh") : "••••"} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white" dir="ltr" autoComplete="off" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button disabled={saving} onClick={save} className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{t("admin.actions.save")}</button>
              <button disabled={testing} onClick={testConnection} className="px-4 py-2 text-sm bg-[#1a1a1a] border border-neutral-800 text-neutral-200 rounded-xl hover:border-neutral-600 flex items-center gap-2"><RefreshCw className="w-4 h-4" />{t("admin.wa.testConnection")}</button>
              {(cfg.tokenConfigured || cfg.appSecretConfigured) && (
                <button onClick={async () => { await apiSend("/whatsapp/config", "PUT", { clearToken: true, clearAppSecret: true }); await load(); setNotice(t("admin.wa.secretsCleared")); }} className="px-4 py-2 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 flex items-center gap-2"><Trash2 className="w-4 h-4" />{t("admin.wa.clearSecrets")}</button>
              )}
            </div>
          </div>

          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Webhook</h3>
            <div className="flex items-center gap-2 text-sm">
              <code className="flex-1 bg-[#1a1a1a] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 font-mono text-xs overflow-x-auto" dir="ltr">{cfg.webhookUrl}</code>
              <button onClick={() => copy("url", cfg.webhookUrl)} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white">{copied === "url" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="flex-1 bg-[#1a1a1a] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 font-mono text-xs" dir="ltr">{cfg.verifyToken || "—"}</code>
              <button onClick={() => copy("vt", cfg.verifyToken)} className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white">{copied === "vt" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            <p className="text-xs text-neutral-600">{t("admin.wa.webhookHint")}</p>
          </div>

          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">{t("admin.wa.sendTest")}</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder={t("admin.wa.sendToPh")} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white" dir="ltr" />
              <input value={sendMsg} onChange={(e) => setSendMsg(e.target.value)} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white md:col-span-1" />
              <button disabled={testing || !sendTo} onClick={sendTest} className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"><Send className="w-4 h-4" />{t("admin.wa.send")}</button>
            </div>
          </div>

          {testResult && (
            <pre className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 overflow-x-auto max-h-48" dir="ltr">{testResult}</pre>
          )}
        </div>
      )}

      {tab === "templates" && !loading && (
        <div className="space-y-3">
          <button onClick={() => setTplModal({ name: "", category: "UTILITY", language: "fr", body: "", submit: true })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-xl hover:bg-green-700"><Plus className="w-4 h-4" />{t("admin.wa.newTemplate")}</button>
          <div className="grid gap-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-[#111] border border-neutral-800 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-white text-sm">{tpl.name}</span>
                    <StatusBadge status={tpl.status} />
                    <span className="text-xs text-neutral-500">{tpl.category} · {tpl.language}</span>
                  </div>
                  {tpl.body && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{tpl.body}</p>}
                </div>
                <button onClick={async () => { await apiSend(`/whatsapp/templates/${encodeURIComponent(tpl.id)}`, "DELETE"); await load(); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {templates.length === 0 && <p className="text-neutral-600 text-sm">—</p>}
          </div>
        </div>
      )}

      {tab === "usage" && usage && !loading && (
        <div className="space-y-3">
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-4">
            <div className="text-xs text-neutral-500 mb-1">{t("admin.wa.sent30d")}</div>
            <div className="text-2xl font-bold text-white">{fmtNum(usage.totalSent30d)}</div>
          </div>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-800 text-xs text-neutral-400 uppercase"><th className="px-4 py-3 text-start">{t("admin.members.store")}</th><th className="px-4 py-3 text-start">{t("admin.members.plan")}</th><th className="px-4 py-3 text-end">{t("admin.wa.sent30d")}</th><th className="px-4 py-3 text-end">{t("admin.plans.waQuota")}</th></tr></thead>
              <tbody>
                {usage.rows.filter((r) => r.sent30d > 0).map((r) => (
                  <tr key={r.id} className="border-b border-neutral-800/50">
                    <td className="px-4 py-2.5 text-white">{r.storeName}</td>
                    <td className="px-4 py-2.5 capitalize text-neutral-300">{r.plan || "—"}</td>
                    <td className="px-4 py-2.5 text-end text-white">{r.sent30d}</td>
                    <td className="px-4 py-2.5 text-end text-neutral-400">{r.quota || "∞"}</td>
                  </tr>
                ))}
                {usage.rows.filter((r) => r.sent30d > 0).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-600">—</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tplModal && (
        <div className={MODAL_CLASSES} onClick={() => setTplModal(null)}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{t("admin.wa.newTemplate")}</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.wa.tplName")}</label>
                  <input value={tplModal.name} onChange={(e) => setTplModal({ ...tplModal, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono" dir="ltr" placeholder="commande_confirmee" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.wa.tplCategory")}</label>
                  <select value={tplModal.category} onChange={(e) => setTplModal({ ...tplModal, category: e.target.value })} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-white">
                    <option value="UTILITY">UTILITY</option><option value="MARKETING">MARKETING</option><option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select></div>
              </div>
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.wa.tplBody")}</label>
                <textarea value={tplModal.body} onChange={(e) => setTplModal({ ...tplModal, body: e.target.value })} rows={4} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white" placeholder={t("admin.wa.tplBodyPh")} /></div>
              <label className="flex items-center gap-2 text-neutral-300 text-sm">
                <input type="checkbox" checked={tplModal.submit} onChange={(e) => setTplModal({ ...tplModal, submit: e.target.checked })} />
                {t("admin.wa.tplSubmit")}
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setTplModal(null)} className="flex-1 px-4 py-2 text-sm border border-neutral-800 rounded-xl text-neutral-300">{t("admin.actions.cancel")}</button>
              <button disabled={!tplModal.name.trim() || !tplModal.body.trim()} onClick={async () => { const m = tplModal; setTplModal(null); try { const r = await apiSend<{ metaResult: { httpStatus: number; response: string } | null }>("/whatsapp/templates", "POST", { ...m, submit: m.submit }); setNotice(t("admin.members.saved") + (r.metaResult ? ` (Meta HTTP ${r.metaResult.httpStatus})` : "")); await load(); } catch (e) { setNotice("✗ " + (e instanceof Error ? e.message : "Erreur")); } }} className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700">{t("admin.actions.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
