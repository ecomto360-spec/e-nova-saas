/**
 * LOT D — Réglages (Super Admin).
 * Général, inscriptions (ouvrir/fermer, essai par défaut), maintenance +
 * bannière globale, slugs réservés, SMTP chiffré (+ envoi test), pages
 * légales fr/ar, limites, scripts globaux, export/import.
 * Application réelle côté public : boutique (maintenance), inscription
 * (fermeture + jours d'essai), création de boutique (slugs réservés).
 */
import React, { useCallback, useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, Download, Upload, Wrench, Send } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend } from "./api";

interface GeneralSettings {
  platformName: string; supportEmail: string; defaultLanguage: string; currency: string; timezone: string;
  registrationsOpen: boolean; manualApproval: boolean; emailVerification: boolean; defaultTrialDays: number;
  maintenance: { on: boolean; message: string }; graceDays: number; reservedSlugs: string[];
  legalFr: string; legalAr: string; globalScripts: string; defaultLimits: { maxProducts: number };
}
interface SmtpCfg { host: string; port: number; user: string; from: string; passwordConfigured: boolean; encryptionAvailable: boolean; }
type Tab = "general" | "registrations" | "maintenance" | "domains" | "email" | "legal" | "advanced";

export default function AdminSettings(): React.ReactElement {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [smtp, setSmtp] = useState<SmtpCfg | null>(null);
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpTestTo, setSmtpTestTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await apiGet<{ settings: GeneralSettings; smtp: SmtpCfg }>("/settings");
      setSettings(j.settings);
      setSmtp(j.smtp);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const save = async (): Promise<void> => {
    if (!settings) return;
    setSaving(true);
    setNotice("");
    try {
      await apiSend("/settings", "PUT", settings);
      setNotice(t("admin.settings.saved"));
      await load();
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setSaving(false);
    }
  };

  const importCfg = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const r = await apiSend<{ imported: number }>("/settings/import", "POST", json);
      setNotice(t("admin.settings.imported") + ` (${r.imported})`);
      await load();
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "general", label: t("admin.settings.tabGeneral") },
    { id: "registrations", label: t("admin.settings.tabReg") },
    { id: "maintenance", label: t("admin.settings.tabMaintenance") },
    { id: "domains", label: t("admin.settings.tabDomains") },
    { id: "email", label: t("admin.settings.tabEmail") },
    { id: "legal", label: t("admin.settings.tabLegal") },
    { id: "advanced", label: t("admin.settings.tabAdvanced") }
  ];

  const inputCls = "w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-red-500" />{t("admin.nav.settings")}</h1>
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}
      {loading && <p className="text-neutral-500 text-sm">…</p>}

      {settings && smtp && !loading && (
        <>
          <div className="flex flex-wrap gap-1 bg-[#111] border border-neutral-800 rounded-xl p-1 w-fit">
            {tabs.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} className={`px-3 py-2 text-sm rounded-lg font-medium ${tab === tb.id ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}>{tb.label}</button>
            ))}
          </div>

          {tab === "general" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-3 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.platformName")}</label><input className={inputCls} value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.supportEmail")}</label><input className={inputCls} value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} dir="ltr" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.language")}</label>
                  <select className={inputCls} value={settings.defaultLanguage} onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}><option value="fr">Français</option><option value="ar">العربية</option></select></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.currency")}</label><input className={inputCls} value={settings.currency} disabled /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.timezone")}</label><input className={inputCls} value={settings.timezone} disabled /></div>
              </div>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
            </div>
          )}

          {tab === "registrations" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-2xl">
              <label className="flex items-center gap-3 text-sm text-neutral-200">
                <input type="checkbox" checked={settings.registrationsOpen} onChange={(e) => setSettings({ ...settings, registrationsOpen: e.target.checked })} className="w-4 h-4" />
                {t("admin.settings.regOpen")}
              </label>
              <p className="text-xs text-neutral-600">{t("admin.settings.regOpenHint")}</p>
              <label className="flex items-center gap-3 text-sm text-neutral-200">
                <input type="checkbox" checked={settings.manualApproval} onChange={(e) => setSettings({ ...settings, manualApproval: e.target.checked })} className="w-4 h-4" />
                {t("admin.settings.manualApproval")}
              </label>
              <label className="flex items-center gap-3 text-sm text-neutral-200">
                <input type="checkbox" checked={settings.emailVerification} onChange={(e) => setSettings({ ...settings, emailVerification: e.target.checked })} className="w-4 h-4" />
                {t("admin.settings.emailVerification")}
              </label>
              <div className="max-w-xs"><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.trialDays")}</label>
                <input type="number" min={0} max={90} className={inputCls} value={settings.defaultTrialDays} onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) || 0 })} /></div>
              <div className="max-w-xs"><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.graceDays")}</label>
                <input type="number" min={0} max={90} className={inputCls} value={settings.graceDays} onChange={(e) => setSettings({ ...settings, graceDays: Number(e.target.value) || 0 })} /></div>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
            </div>
          )}

          {tab === "maintenance" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-2xl">
              <label className="flex items-center gap-3 text-sm text-neutral-200">
                <input type="checkbox" checked={settings.maintenance.on} onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, on: e.target.checked } })} className="w-4 h-4" />
                <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-400" />{t("admin.settings.maintenanceOn")}</span>
              </label>
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.maintenanceMsg")}</label>
                <textarea rows={2} className={inputCls} value={settings.maintenance.message} onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, message: e.target.value } })} /></div>
              <p className="text-xs text-orange-400">{t("admin.settings.maintenanceHint")}</p>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
            </div>
          )}

          {tab === "domains" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-2xl">
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.reservedSlugs")}</label>
                <textarea rows={4} dir="ltr" className={`${inputCls} font-mono`} value={settings.reservedSlugs.join(", ")} onChange={(e) => setSettings({ ...settings, reservedSlugs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
              <p className="text-xs text-neutral-600">{t("admin.settings.reservedHint")}</p>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
            </div>
          )}

          {tab === "email" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-2xl">
              {!smtp.encryptionAvailable && <p className="text-xs text-orange-400">⚠ {t("admin.wa.noEncryptionKey")}</p>}
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-400 block mb-1">Host SMTP</label><input className={inputCls} value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} dir="ltr" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">Port</label><input type="number" className={inputCls} value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) || 587 })} dir="ltr" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.smtpUser")}</label><input className={inputCls} value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} dir="ltr" /></div>
                <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.smtpFrom")}</label><input className={inputCls} value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} dir="ltr" /></div>
                <div className="md:col-span-2"><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.smtpPass")} {smtp.passwordConfigured && <span className="text-emerald-400">✓ {t("admin.wa.configured")}</span>}</label>
                  <input type="password" className={inputCls} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder={smtp.passwordConfigured ? t("admin.wa.replacePh") : "••••"} dir="ltr" autoComplete="off" /></div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={async () => { try { await apiSend("/settings/smtp", "PUT", { host: smtp.host, port: smtp.port, user: smtp.user, from: smtp.from, password: smtpPass }); setSmtpPass(""); setNotice(t("admin.settings.saved")); } catch (e) { setNotice("✗ " + (e instanceof Error ? e.message : "Erreur")); } }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
                <input className={`${inputCls} max-w-xs`} value={smtpTestTo} onChange={(e) => setSmtpTestTo(e.target.value)} placeholder="test@exemple.dz" dir="ltr" />
                <button disabled={!smtpTestTo} onClick={async () => { try { await apiSend("/settings/smtp-test", "POST", { to: smtpTestTo }); setNotice("✓ " + t("admin.settings.smtpTestOk")); } catch (e) { setNotice("✗ " + (e instanceof Error ? e.message : "Erreur")); } }} className="px-4 py-2 text-sm bg-[#1a1a1a] border border-neutral-800 text-neutral-200 rounded-xl hover:border-neutral-600 flex items-center gap-2"><Send className="w-4 h-4" />{t("admin.settings.smtpTest")}</button>
              </div>
            </div>
          )}

          {tab === "legal" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-3xl">
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.legalFr")}</label>
                <textarea rows={8} className={inputCls} value={settings.legalFr} onChange={(e) => setSettings({ ...settings, legalFr: e.target.value })} /></div>
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.legalAr")}</label>
                <textarea rows={8} dir="rtl" className={inputCls} value={settings.legalAr} onChange={(e) => setSettings({ ...settings, legalAr: e.target.value })} /></div>
              <p className="text-xs text-neutral-600">{t("admin.settings.legalHint")}</p>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
            </div>
          )}

          {tab === "advanced" && (
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-3xl">
              <div className="max-w-xs"><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.maxProducts")}</label>
                <input type="number" min={1} className={inputCls} value={settings.defaultLimits.maxProducts} onChange={(e) => setSettings({ ...settings, defaultLimits: { maxProducts: Number(e.target.value) || 50 } })} /></div>
              <div><label className="text-xs text-neutral-400 block mb-1">{t("admin.settings.globalScripts")}</label>
                <textarea rows={5} dir="ltr" className={`${inputCls} font-mono text-xs`} value={settings.globalScripts} onChange={(e) => setSettings({ ...settings, globalScripts: e.target.value })} placeholder="<script>…</script>" /></div>
              <p className="text-xs text-neutral-600">{t("admin.settings.scriptsHint")}</p>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" />{t("admin.actions.save")}</button>
              <div className="border-t border-neutral-800 pt-4 flex flex-wrap gap-2 items-center">
                <a href="/api/admin/v1/settings/export" target="_blank" rel="noreferrer" className="px-4 py-2 text-sm bg-[#1a1a1a] border border-neutral-800 text-neutral-200 rounded-xl hover:border-neutral-600 flex items-center gap-2"><Download className="w-4 h-4" />{t("admin.settings.export")}</a>
                <label className="px-4 py-2 text-sm bg-[#1a1a1a] border border-neutral-800 text-neutral-200 rounded-xl hover:border-neutral-600 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />{t("admin.settings.import")}
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCfg(f); e.target.value = ""; }} />
                </label>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
