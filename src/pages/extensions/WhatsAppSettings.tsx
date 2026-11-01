import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, ChevronRight, Info, Settings2 } from "lucide-react";
import { resolveExtensionStatus } from "../../data/extensionsRegistry";
import { WhatsAppIcon } from "../../components/common/WhatsAppIcon";
import type { ExtensionSettingsSnapshot, ExtensionStatus } from "../../types/extensions";

/**
 * Réglages « Order Automation (WhatsApp) » — Étape 1/5 (coquille).
 *
 * Étape 1 : en-tête + lien retour + bandeau d'information + badge d'état réel.
 * Les réglages détaillés (activation, heures calmes, rappel, langue, portée,
 * notifications par statut, numéro WhatsApp) arrivent à l'étape 2.
 */
export default function WhatsAppSettings() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const [status, setStatus] = useState<ExtensionStatus | "loading">("loading");

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "whatsapp_settings", user.uid));
        if (isMounted) {
          setStatus(resolveExtensionStatus(snap.exists() ? (snap.data() as ExtensionSettingsSnapshot) : null));
        }
      } catch {
        if (isMounted) setStatus("inactive");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const badgeStyles: Record<ExtensionStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    inactive: "bg-neutral-500/10 text-neutral-400 border-neutral-700",
    not_connected: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Retour vers les apps */}
      <Link
        to="/dashboard/extensions"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-amber-400 transition-colors mb-4"
      >
        <BackIcon className="w-4 h-4" />
        {t("extensions.backToApps")}
      </Link>

      {/* En-tête */}
      <div className="flex items-start gap-4 mb-6">
        <span className="w-14 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center shrink-0">
          <WhatsAppIcon className="w-7 h-7 text-[#25D366]" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
            {t("extensions.whatsapp.name")}
          </h1>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
              status === "loading" ? badgeStyles.inactive : badgeStyles[status]
            }`}
          >
            {status === "loading" ? t("extensions.badge.loading") : t(`extensions.badge.${status}`)}
          </span>
        </div>
      </div>

      {/* Bandeau d'information (A) */}
      <div className="bg-amber-500/5 dark:bg-amber-500/[0.06] border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          {t("extensions.whatsapp.infoBanner")}
        </p>
      </div>

      {/* Étapes suivantes */}
      <div className="bg-white dark:bg-[#1e1e24] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {t("extensions.whatsapp.upcomingTitle")}
          </h2>
        </div>
        <ul className="space-y-1.5 text-[13px] text-neutral-500 dark:text-neutral-400 list-disc ps-5">
          <li>{t("extensions.whatsapp.upcoming.toggle")}</li>
          <li>{t("extensions.whatsapp.upcoming.quietHours")}</li>
          <li>{t("extensions.whatsapp.upcoming.reminder")}</li>
          <li>{t("extensions.whatsapp.upcoming.language")}</li>
          <li>{t("extensions.whatsapp.upcoming.scope")}</li>
          <li>{t("extensions.whatsapp.upcoming.notifications")}</li>
          <li>{t("extensions.whatsapp.upcoming.number")}</li>
        </ul>
      </div>
    </div>
  );
}
