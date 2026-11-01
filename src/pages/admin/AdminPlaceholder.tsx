import { Construction } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

/** LOT A — page d'attente pour les modules livrés dans les lots B à E. */
export default function AdminPlaceholder() {
  const { t } = useLanguage();
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111114] border border-neutral-800 flex items-center justify-center mx-auto mb-4">
        <Construction className="w-8 h-8 text-amber-400" />
      </div>
      <h2 className="text-base font-bold text-white mb-1">{t("admin.placeholder.title")}</h2>
      <p className="text-xs text-neutral-400 max-w-sm mx-auto">{t("admin.placeholder.desc")}</p>
    </div>
  );
}
