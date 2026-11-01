/**
 * LOT D — Extensions (Super Admin).
 * Activation globale, accès par plan, quotas. Persisté dans
 * platform_settings/extensions.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Puzzle, Ban, RotateCcw } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiGet, apiSend } from "./api";
import { EXTENSIONS } from "../../data/extensionsRegistry";

interface ExtCfg { disabled: string[]; perPlan: Record<string, string[]>; quotas: Record<string, number>; }
interface Plan { id: string; name: string; }

export default function AdminExtensions(): React.ReactElement {
  const { t } = useLanguage();
  const [cfg, setCfg] = useState<ExtCfg>({ disabled: [], perPlan: {}, quotas: {} });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([apiGet<ExtCfg>("/extensions"), apiGet<{ plans: Plan[] }>("/plans")]);
      setCfg({ disabled: c.disabled || [], perPlan: c.perPlan || {}, quotas: c.quotas || {} });
      setPlans(p.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const save = async (next: ExtCfg): Promise<void> => {
    setSaving(true);
    setNotice("");
    try {
      await apiSend("/extensions", "PUT", next);
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
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Puzzle className="w-5 h-5 text-red-500" />{t("admin.nav.extensions")}</h1>
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
      {notice && <div className="p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl text-sm text-neutral-200">{notice}</div>}
      {loading && <p className="text-neutral-500 text-sm">…</p>}

      {!loading && (
        <div className="grid gap-3 md:grid-cols-2">
          {EXTENSIONS.map((ext) => {
            const id = ext.id;
            const disabled = cfg.disabled.includes(id);
            return (
              <div key={id} className={`bg-[#111] border rounded-2xl p-4 ${disabled ? "border-red-500/30 opacity-70" : "border-neutral-800"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white">{t(ext.nameKey)}</h3>
                    <p className="text-xs text-neutral-500 font-mono">{id}</p>
                  </div>
                  {disabled ? (
                    <button title={t("admin.themes.enable")} disabled={saving} onClick={() => save({ ...cfg, disabled: toggleIn(cfg.disabled, id) })} className="p-2 rounded-lg hover:bg-neutral-700/50 text-emerald-400"><RotateCcw className="w-4 h-4" /></button>
                  ) : (
                    <button title={t("admin.themes.disable")} disabled={saving} onClick={() => save({ ...cfg, disabled: toggleIn(cfg.disabled, id) })} className="p-2 rounded-lg hover:bg-neutral-700/50 text-red-400"><Ban className="w-4 h-4" /></button>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mb-3">{t(ext.descriptionKey)}</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {plans.map((plan) => {
                      const allowed = (cfg.perPlan[plan.id] || []).includes(id);
                      return (
                        <button
                          key={plan.id}
                          disabled={saving}
                          onClick={() => {
                            const perPlan = { ...cfg.perPlan };
                            const cur = perPlan[plan.id] || [];
                            perPlan[plan.id] = allowed ? cur.filter((x) => x !== id) : [...cur, id];
                            save({ ...cfg, perPlan });
                          }}
                          className={`px-2 py-1 rounded-lg text-xs border ${allowed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-neutral-800 text-neutral-500 hover:border-neutral-600"}`}
                        >
                          {plan.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500">{t("admin.plans.waQuota")} :</span>
                    <input
                      type="number" min={0}
                      value={cfg.quotas[id] ?? 0}
                      onChange={(e) => setCfg({ ...cfg, quotas: { ...cfg.quotas, [id]: Number(e.target.value) || 0 } })}
                      onBlur={() => save(cfg)}
                      className="w-24 bg-[#1a1a1a] border border-neutral-800 rounded-lg px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
