import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, getDocs, query, where, collection, serverTimestamp } from "firebase/firestore";
import {
  ChevronLeft, ChevronRight, Info, Save, Loader2, Bell, BellOff, ShoppingCart,
  Clock, MoonStar, Languages, Package, ShieldCheck, Eye, Zap, CheckCircle2, AlertTriangle
} from "lucide-react";
import { WhatsAppIcon } from "../../components/common/WhatsAppIcon";
import {
  WA_DEFAULT_MESSAGE_AR, WA_DEFAULT_MESSAGE_FR
} from "../../lib/whatsappDefaults";

/**
 * Réglages « Order Automation (WhatsApp) » — complète.
 * Toggle global + confirmations de commande + paniers abandonnés (délai,
 * rappel 4 h, messages ar/fr éditables + aperçu) + heures calmes + langue +
 * portée produits + consentement + état de la connexion Cloud API.
 * Les secrets (token Meta…) restent uniquement dans les variables serveur.
 */
interface WaProductOption { id: string; name: string }

export default function WhatsAppSettings() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cloudApi, setCloudApi] = useState<boolean | null>(null);
  const [processMsg, setProcessMsg] = useState("");
  const [storeName, setStoreName] = useState("");

  const [enabled, setEnabled] = useState(false);
  const [orderConfirmations, setOrderConfirmations] = useState(true);
  const [cartRelaunch, setCartRelaunch] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState<5 | 10 | 30 | 60>(10);
  const [reminder, setReminder] = useState(false);
  const [messageAr, setMessageAr] = useState(WA_DEFAULT_MESSAGE_AR);
  const [messageFr, setMessageFr] = useState(WA_DEFAULT_MESSAGE_FR);
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [language, setLanguage] = useState<"ar" | "fr" | "store">("store");
  const [scopeMode, setScopeMode] = useState<"all" | "selected">("all");
  const [scopeProducts, setScopeProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<WaProductOption[]>([]);
  const [consentCheckbox, setConsentCheckbox] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "whatsapp_settings", user.uid));
        if (snap.exists()) {
          const d = snap.data() || {};
          if (mounted) {
            setEnabled(d.enabled === true);
            setOrderConfirmations(d.orderConfirmations?.enabled !== false);
            setCartRelaunch(d.abandonedCarts?.enabled === true);
            const dm = d.abandonedCarts?.delayMinutes;
            if ([5, 10, 30, 60].includes(dm)) setDelayMinutes(dm);
            setReminder(d.abandonedCarts?.reminderEnabled === true);
            setMessageAr(String(d.abandonedCarts?.messageAr || WA_DEFAULT_MESSAGE_AR));
            setMessageFr(String(d.abandonedCarts?.messageFr || WA_DEFAULT_MESSAGE_FR));
            setQuietEnabled(d.quietHours?.enabled === true);
            setQuietStart(String(d.quietHours?.start || "22:00"));
            setQuietEnd(String(d.quietHours?.end || "08:00"));
            setLanguage(d.language === "ar" || d.language === "fr" ? d.language : "store");
            setScopeMode(d.scope?.mode === "selected" ? "selected" : "all");
            setScopeProducts(Array.isArray(d.scope?.productIds) ? d.scope.productIds : []);
            setConsentCheckbox(d.consentCheckbox === true);
          }
        }
        const tenantSnap = await getDoc(doc(db, "tenants", user.uid)).catch(() => null);
        if (mounted && tenantSnap?.exists()) {
          setStoreName(String(tenantSnap.data()?.storeName || ""));
        }
        const prodSnap = await getDocs(query(collection(db, "products"), where("userId", "==", user.uid))).catch(() => null);
        if (mounted && prodSnap) {
          const list: WaProductOption[] = [];
          prodSnap.forEach((p) => list.push({ id: p.id, name: String(p.data()?.nameAr || p.data()?.name || p.id) }));
          setProducts(list);
        }
        const st = await fetch("/api/whatsapp/status").then((r) => r.json()).catch(() => null);
        if (mounted && st) setCloudApi(Boolean(st.cloudApi));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "whatsapp_settings", user.uid), {
        enabled,
        orderConfirmations: { enabled: orderConfirmations },
        abandonedCarts: {
          enabled: cartRelaunch,
          delayMinutes,
          reminderEnabled: reminder,
          messageAr,
          messageFr
        },
        quietHours: { enabled: quietEnabled, start: quietStart, end: quietEnd },
        language,
        scope: { mode: scopeMode, productIds: scopeProducts },
        consentCheckbox,
        connectionStatus: cloudApi ? "connected" : "disconnected",
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setProcessMsg("…");
    try {
      const r = await fetch("/api/whatsapp/process?force=1", { method: "POST" }).then((x) => x.json());
      setProcessMsg(
        `${t("extensions.whatsapp.process.result")}: ${r.cartsSent || 0} + ${r.remindersSent || 0} / ${r.orderConfirmsSent || 0} / ${r.statusNotificationsSent || 0}`
      );
    } catch {
      setProcessMsg(t("extensions.whatsapp.process.error"));
    }
  };

  const preview = useMemo(() => {
    const tpl = dir === "rtl" ? messageAr : messageFr;
    return tpl
      .replace(/\{nom\}/g, dir === "rtl" ? "أحمد" : "Karim")
      .replace(/\{boutique\}/g, storeName || (dir === "rtl" ? "متجر ي" : "Ma Boutique"))
      .replace(/\{produits\}/g, dir === "rtl" ? "ساعة ذكية x1" : "Montre x1")
      .replace(/\{total\}/g, "5,000")
      .replace(/\{wilaya\}/g, dir === "rtl" ? "09 - البليدة" : "09 - Blida")
      .replace(/\{lien\}/g, "https://…/wa/…");
  }, [messageAr, messageFr, dir, storeName]);

  const Toggle = ({ value, onChange, label, desc, icon: Icon }: {
    value: boolean; onChange: (v: boolean) => void; label: string; desc?: string; icon: typeof Bell;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-start gap-3 text-right cursor-pointer group"
      type="button"
    >
      <span className={`mt-0.5 w-10 h-6 rounded-full relative transition-all shrink-0 ${value ? "bg-amber-500" : "bg-neutral-700"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${dir === "rtl" ? "right-0.5" : "left-0.5"} ${value ? (dir === "rtl" ? "-translate-x-4" : "translate-x-4") : ""}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
          {Icon && <Icon className={`w-4 h-4 ${value ? "text-amber-500" : "text-neutral-400"}`} />}
          {label}
        </span>
        {desc && <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{desc}</span>}
      </span>
    </button>
  );

  const section = "bg-white dark:bg-[#1e1e24] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4";
  const label = "text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2";
  const sub = "text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed";
  const inputCls = "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#16161a] px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all";

  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard/extensions" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-amber-400 transition-colors mb-4">
        <BackIcon className="w-4 h-4" />
        {t("extensions.backToApps")}
      </Link>

      {/* En-tête */}
      <div className="flex items-start gap-4 mb-6">
        <span className="w-14 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center shrink-0">
          <WhatsAppIcon className="w-7 h-7 text-[#25D366]" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("extensions.whatsapp.name")}</h1>
          <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
            enabled ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-neutral-500/10 text-neutral-400 border-neutral-700"
          }`}>
            {enabled ? t("extensions.badge.active") : t("extensions.badge.inactive")}
          </span>
        </div>
      </div>

      {/* Bandeau info + état Cloud API */}
      <div className="bg-amber-500/5 dark:bg-amber-500/[0.06] border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">{t("extensions.whatsapp.infoBanner")}</p>
          <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${cloudApi ? "text-emerald-500" : "text-amber-500"}`}>
            {cloudApi ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {cloudApi ? t("extensions.whatsapp.cloud.connected") : t("extensions.whatsapp.cloud.simulation")}
          </p>
        </div>
      </div>

      {/* A — Activation */}
      <div className={section}>
        <Toggle
          value={enabled}
          onChange={setEnabled}
          label={t("extensions.whatsapp.toggleMain")}
          desc={t("extensions.whatsapp.toggleMainDesc")}
          icon={enabled ? Bell : BellOff}
        />
      </div>

      {/* B — Confirmations de commande */}
      <div className={section}>
        <Toggle
          value={orderConfirmations}
          onChange={setOrderConfirmations}
          label={t("extensions.whatsapp.orders.toggle")}
          desc={t("extensions.whatsapp.orders.desc")}
          icon={Zap}
        />
      </div>

      {/* C — Paniers abandonnés */}
      <div className={section}>
        <Toggle
          value={cartRelaunch}
          onChange={setCartRelaunch}
          label={t("extensions.whatsapp.carts.toggle")}
          desc={t("extensions.whatsapp.carts.desc")}
          icon={ShoppingCart}
        />
        {cartRelaunch && (
          <div className="space-y-4 pt-1">
            <div>
              <p className={label}><Clock className="w-4 h-4 text-amber-400" />{t("extensions.whatsapp.carts.delay")}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {([5, 10, 30, 60] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDelayMinutes(m)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      delayMinutes === m
                        ? "bg-amber-500 text-black shadow-md"
                        : "bg-neutral-100 dark:bg-[#16161a] text-neutral-500 dark:text-neutral-400 hover:text-amber-500 border border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <p className={`${sub} mt-1.5`}>{t("extensions.whatsapp.carts.delayDesc")}</p>
            </div>

            <Toggle
              value={reminder}
              onChange={setReminder}
              label={t("extensions.whatsapp.carts.reminder")}
              desc={t("extensions.whatsapp.carts.reminderDesc")}
              icon={Clock}
            />

            <div>
              <p className={label}>✏️ {t("extensions.whatsapp.carts.messageAr")}</p>
              <textarea
                value={messageAr}
                onChange={(e) => setMessageAr(e.target.value)}
                dir="rtl"
                rows={7}
                className={`${inputCls} font-medium leading-relaxed resize-y`}
              />
              <p className={`${sub} mt-1`}>{t("extensions.whatsapp.carts.vars")}</p>
            </div>

            <div>
              <p className={label}>✏️ {t("extensions.whatsapp.carts.messageFr")}</p>
              <textarea
                value={messageFr}
                onChange={(e) => setMessageFr(e.target.value)}
                dir="ltr"
                rows={7}
                className={`${inputCls} font-medium leading-relaxed resize-y`}
              />
            </div>

            <div>
              <p className={label}><Eye className="w-4 h-4 text-amber-400" />{t("extensions.whatsapp.carts.preview")}</p>
              <div className="mt-2 bg-[#25D366]/5 dark:bg-[#25D366]/[0.06] border border-[#25D366]/20 rounded-2xl p-4">
                <div className="bg-white dark:bg-[#16161a] rounded-xl p-3 text-[13px] text-gray-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed shadow-sm" dir={dir === "rtl" ? "rtl" : "ltr"}>
                  {preview}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* D — Heures calmes */}
      <div className={section}>
        <Toggle
          value={quietEnabled}
          onChange={setQuietEnabled}
          label={t("extensions.whatsapp.quiet.toggle")}
          desc={t("extensions.whatsapp.quiet.desc")}
          icon={MoonStar}
        />
        {quietEnabled && (
          <div className="flex items-center gap-3 pt-1">
            <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className={`${inputCls} text-center`} dir="ltr" />
            <span className="text-neutral-400 text-sm font-bold">→</span>
            <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className={`${inputCls} text-center`} dir="ltr" />
          </div>
        )}
      </div>

      {/* E — Langue */}
      <div className={section}>
        <p className={label}><Languages className="w-4 h-4 text-amber-400" />{t("extensions.whatsapp.language")}</p>
        <div className="flex flex-wrap gap-2">
          {([
            { k: "store", l: t("extensions.whatsapp.lang.store") },
            { k: "ar", l: t("extensions.whatsapp.lang.ar") },
            { k: "fr", l: t("extensions.whatsapp.lang.fr") }
          ] as const).map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => setLanguage(o.k)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                language === o.k
                  ? "bg-amber-500 text-black shadow-md"
                  : "bg-neutral-100 dark:bg-[#16161a] text-neutral-500 dark:text-neutral-400 hover:text-amber-500 border border-neutral-200 dark:border-neutral-700"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* F — Portée */}
      <div className={section}>
        <p className={label}><Package className="w-4 h-4 text-amber-400" />{t("extensions.whatsapp.scope.title")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScopeMode("all")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              scopeMode === "all" ? "bg-amber-500 text-black shadow-md" : "bg-neutral-100 dark:bg-[#16161a] text-neutral-500 border border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {t("extensions.whatsapp.scope.all")}
          </button>
          <button
            type="button"
            onClick={() => setScopeMode("selected")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              scopeMode === "selected" ? "bg-amber-500 text-black shadow-md" : "bg-neutral-100 dark:bg-[#16161a] text-neutral-500 border border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {t("extensions.whatsapp.scope.selected")}
          </button>
        </div>
        {scopeMode === "selected" && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800">
            {products.length === 0 && <p className={`p-3 ${sub}`}>{t("extensions.whatsapp.scope.noProducts")}</p>}
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <input
                  type="checkbox"
                  checked={scopeProducts.includes(p.id)}
                  onChange={(e) => setScopeProducts((prev) => e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id))}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-sm text-gray-800 dark:text-neutral-200 truncate">{p.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* G — Consentement */}
      <div className={section}>
        <Toggle
          value={consentCheckbox}
          onChange={setConsentCheckbox}
          label={t("extensions.whatsapp.consent.toggle")}
          desc={t("extensions.whatsapp.consent.desc")}
          icon={ShieldCheck}
        />
        <p className={`${sub} bg-neutral-50 dark:bg-[#16161a] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800`}>
          {t("extensions.whatsapp.consent.preview")}
        </p>
      </div>

      {/* H — Outils serveur */}
      <div className={section}>
        <p className={label}><Zap className="w-4 h-4 text-amber-400" />{t("extensions.whatsapp.process.title")}</p>
        <p className={sub}>{t("extensions.whatsapp.process.desc")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runNow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            {t("extensions.whatsapp.process.run")}
          </button>
          {processMsg && <span className="text-xs text-neutral-500 font-mono">{processMsg}</span>}
        </div>
      </div>

      {/* Sauvegarde */}
      <div className="sticky bottom-4 mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-3.5 text-sm font-black shadow-lg transition-all cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? t("extensions.whatsapp.saved") : t("extensions.whatsapp.save")}
        </button>
      </div>
    </div>
  );
}
