import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../contexts/LanguageContext";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowUpRight, Puzzle } from "lucide-react";
import { EXTENSIONS, resolveExtensionStatus } from "../data/extensionsRegistry";
import { WhatsAppIcon } from "../components/common/WhatsAppIcon";
import type { ExtensionSettingsSnapshot, ExtensionStatus } from "../types/extensions";

/**
 * Page « Apps & Intégrations » (/dashboard/extensions) — Étape 1/5.
 *
 * Grille construite automatiquement depuis src/data/extensionsRegistry.ts.
 * Le badge de chaque carte reflète l'état réel des réglages Firestore
 * (aperçu léger : `enabled` + `connectionStatus`).
 */
export default function Extensions() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, ExtensionStatus | "loading">>({});

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    (async () => {
      const next: Record<string, ExtensionStatus | "loading"> = {};
      await Promise.all(
        EXTENSIONS.map(async (ext) => {
          try {
            const snap = await getDoc(doc(db, ext.settingsCollection, user.uid));
            next[ext.id] = resolveExtensionStatus(
              snap.exists() ? (snap.data() as ExtensionSettingsSnapshot) : null
            );
          } catch {
            // Erreur réseau : on affiche « Inactive » plutôt que de bloquer la page.
            next[ext.id] = "inactive";
          }
        })
      );
      if (isMounted) setStatuses(next);
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
  const dotStyles: Record<ExtensionStatus, string> = {
    active: "bg-emerald-400",
    inactive: "bg-neutral-500",
    not_connected: "bg-amber-400",
  };
  const badgeLabel = (s: ExtensionStatus | "loading"): string =>
    s === "loading" ? t("extensions.badge.loading") : t(`extensions.badge.${s}`);

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-amber-400" />
          </span>
          {t("extensions.title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{t("extensions.subtitle")}</p>
      </div>

      {/* Grille des apps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {EXTENSIONS.map((ext) => {
          const status = statuses[ext.id] ?? "loading";
          return (
            <div
              key={ext.id}
              className="bg-white dark:bg-[#1e1e24] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 transition-colors hover:border-amber-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center shrink-0">
                  {ext.icon === "whatsapp" && <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badgeStyles[status]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
                  {badgeLabel(status)}
                </span>
              </div>

              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{t(ext.nameKey)}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {t(ext.descriptionKey)}
                </p>
              </div>

              <button
                onClick={() => navigate(ext.route)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors"
              >
                {t("extensions.openApp")}
                <ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
