/**
 * LOT E — Notifications / Annonces (Super Admin).
 * Envoi à tous / un plan / un membre (dashboard + email optionnel),
 * planification, historique. Les annonces planifiées partent au cron quotidien.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Bell, Send, Trash2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend, fmtDateTime } from "./api";

interface Announcement {
  id: string; audience: string; title: string; body: string; planId: string; memberEmail: string;
  sendAt: string; sentAt: string; createdAt: string; createdBy: string; recipients: number; channels: string[];
}
interface Plan { id: string; name: string; }
interface MemberRow { id: string; storeName: string; ownerEmail: string; }

export default function AdminNotifications(): React.ReactElement {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Announcement[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ title: "", body: "", audience: "all", planId: "", memberId: "", email: false, sendAt: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, p, m] = await Promise.all([
        apiGet<{ rows: Announcement[] }>("/notifications"),
        apiGet<{ plans: Plan[] }>("/plans"),
        apiGet<{ rows: MemberRow[] }>("/members?pageSize=100")
      ]);
      setRows(n.rows);
      setPlans(p.plans);
      setMembers(m.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const send = async (): Promise<void> => {
    setSending(true);
    setNotice("");
    try {
      const r = await apiSend<{ recipients: number; emailSent: number; scheduled: boolean }>("/notifications/send", "POST", form);
      setNotice(`${r.scheduled ? t("admin.notif.scheduledOk") : t("admin.notif.sentOk")} — ${r.recipients} ${t("admin.notif.recipients")}${r.emailSent ? ` · ${r.emailSent} email(s)` : ""}`);
      setForm({ title: "", body: "", audience: "all", planId: "", memberId: "", email: false, sendAt: "" });
      await load();
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-red-500" />{t("admin.nav.notifications")}</h1>
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}

      <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 space-y-3 max-w-2xl">
        <h2 className="text-sm font-semibold text-white">{t("admin.notif.compose")}</h2>
        <input className={inputCls} placeholder={t("admin.notif.titlePh")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea rows={3} className={inputCls} placeholder={t("admin.notif.bodyPh")} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="grid md:grid-cols-3 gap-3">
          <select className={inputCls} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
            <option value="all">{t("admin.notif.audienceAll")}</option>
            <option value="plan">{t("admin.notif.audiencePlan")}</option>
            <option value="member">{t("admin.notif.audienceMember")}</option>
          </select>
          {form.audience === "plan" && (
            <select className={inputCls} value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
              <option value="">— {t("admin.subs.allPlans")} —</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {form.audience === "member" && (
            <select className={inputCls} value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
              <option value="">—</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.storeName} ({m.ownerEmail})</option>)}
            </select>
          )}
          <input type="datetime-local" className={inputCls} value={form.sendAt} onChange={(e) => setForm({ ...form, sendAt: e.target.value })} title={t("admin.notif.schedule")} />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={form.email} onChange={(e) => setForm({ ...form, email: e.target.checked })} />
          {t("admin.notif.alsoEmail")}
        </label>
        <button onClick={send} disabled={sending || !form.title.trim() || !form.body.trim() || (form.audience === "plan" && !form.planId) || (form.audience === "member" && !form.memberId)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" />{form.sendAt ? t("admin.notif.scheduleBtn") : t("admin.notif.sendBtn")}</button>
      </div>

      <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-800 text-xs text-neutral-400 uppercase">
              <th className="px-4 py-3 text-start">{t("admin.notif.title")}</th>
              <th className="px-4 py-3 text-start">{t("admin.notif.audience")}</th>
              <th className="px-4 py-3 text-start">{t("admin.notif.when")}</th>
              <th className="px-4 py-3 text-end">{t("admin.notif.recipients")}</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">…</td></tr>}
              {!loading && rows.map((n) => (
                <tr key={n.id} className="border-b border-neutral-800/50">
                  <td className="px-4 py-3"><div className="text-white font-medium">{n.title}</div><div className="text-xs text-neutral-500 line-clamp-1">{n.body}</div></td>
                  <td className="px-4 py-3 text-neutral-300 capitalize">{n.audience}{n.planId ? ` (${n.planId})` : ""}{n.memberEmail ? ` (${n.memberEmail})` : ""}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{n.sentAt ? `✓ ${fmtDateTime(n.sentAt)}` : `⏳ ${fmtDateTime(n.sendAt)}`}</td>
                  <td className="px-4 py-3 text-end text-white">{n.recipients}</td>
                  <td className="px-4 py-3 text-end">
                    <button onClick={async () => { await apiSend(`/notifications/${n.id}`, "DELETE"); await load(); }} className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-600">—</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
