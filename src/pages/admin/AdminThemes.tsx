/**
 * LOT D — Thèmes (Super Admin).
 * Catalogue des thèmes de la plateforme : activer/désactiver globalement,
 * autorisés par plan, mise en avant. Persisté dans platform_settings/themes,
 * lu par le sélecteur de thèmes du dashboard marchand.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Palette, Star, Ban, RotateCcw } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend } from "./api";
import { THEME_REGISTRY } from "../../themes/registry";

interface ThemesCfg { disabled: string[]; featured: string[]; perPlan: Record<string, string[]>; }
interface Plan { id: string; name: string; }

export default function AdminThemes(): React.ReactElement {
  const { t } = useLanguage();
  const [cfg, setCfg] = useState<ThemesCfg>({ disabled: [], featured: [], perPlan: {} });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([apiGet<ThemesCfg>("/themes"), apiGet<{ plans: Plan[] }>("/plans")]);
      setCfg({ disabled: c.disabled || [], featured: c.featured || [], perPlan: c.perPlan || {} });
      setPlans(p.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const save = async (next: ThemesCfg): Promise<void> => {
    setSaving(true);
    setNotice("");
    try {
      await apiSend("/themes", "PUT", next);
      setCfg(next);
      setNotice(t("admin.themes.saved"));
    } catch (e) {
      setNotice("✗ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setSaving(false);
    }
  };

  const toggleIn = (list: string[], id: string): string[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-red-500" />{t("admin.nav.themes")}</h1>
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}
      {loading && <p className="text-neutral-500 text-sm">…</p>}

      {!loading && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {THEME_REGISTRY.map((theme) => {
              const disabled = cfg.disabled.includes(theme.id);
              const featured = cfg.featured.includes(theme.id);
              return (
                <div key={theme.id} className={`bg-[#111] border rounded-2xl p-4 ${disabled ? "border-red-500/30 opacity-70" : "border-neutral-800"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">{theme.name}{featured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}</h3>
                      <p className="text-xs text-neutral-500 font-mono">{theme.id}</p>
                    </div>
                    <div className="flex gap-1">
                      <button title={featured ? t("admin.themes.unfeature") : t("admin.themes.feature")} disabled={saving} onClick={() => save({ ...cfg, featured: toggleIn(cfg.featured, theme.id) })} className="p-2 rounded-lg hover:bg-neutral-700/50 text-yellow-400"><Star className="w-4 h-4" /></button>
                      {disabled ? (
                        <button title={t("admin.themes.enable")} disabled={saving} onClick={() => save({ ...cfg, disabled: toggleIn(cfg.disabled, theme.id) })} className="p-2 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><RotateCcw className="w-4 h-4" /></button>
                      ) : (
                        <button title={t("admin.themes.disable")} disabled={saving} onClick={() => save({ ...cfg, disabled: toggleIn(cfg.disabled, theme.id) })} className="p-2 rounded-lg hover:bg-neutral-700/50 text-red-400"><Ban className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                  {theme.description && <p className="text-xs text-neutral-400 mb-3">{theme.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {plans.map((plan) => {
                      const allowed = (cfg.perPlan[plan.id] || []).includes(theme.id);
                      return (
                        <button
                          key={plan.id}
                          disabled={saving}
                          onClick={() => {
                            const perPlan = { ...cfg.perPlan };
                            const cur = perPlan[plan.id] || [];
                            perPlan[plan.id] = allowed ? cur.filter((x) => x !== theme.id) : [...cur, theme.id];
                            save({ ...cfg, perPlan });
                          }}
                          className={`px-2 py-1 rounded-lg text-xs border ${allowed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-neutral-800 text-neutral-500 hover:border-neutral-600"}`}
                        >
                          {plan.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-neutral-600">{t("admin.themes.hint")}</p>
        </>
      )}
    </div>
  );
}
