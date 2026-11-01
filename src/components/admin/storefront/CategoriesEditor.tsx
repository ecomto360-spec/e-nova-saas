import { Check, ImageIcon } from "lucide-react";
import type { CategoriesSettings, EditorCategoryLite } from "../../../types/storefront";
import { BilingualField, Field, Toggle } from "./editorUI";

/**
 * Éditeur de la section Catégories : titres bilingues, sélection des
 * catégories (collection `categories`) et nombre maximum affiché.
 */
export function CategoriesEditor({
  value,
  onChange,
  categories,
}: {
  value: CategoriesSettings;
  onChange: (patch: Partial<CategoriesSettings>) => void;
  categories: EditorCategoryLite[];
}) {
  const toggleCategory = (id: string) => {
    const selected = value.categoryIds.includes(id)
      ? value.categoryIds.filter((c) => c !== id)
      : [...value.categoryIds, id];
    onChange({ categoryIds: selected });
  };

  const selectAll = () => onChange({ categoryIds: categories.map((c) => c.id) });
  const selectNone = () => onChange({ categoryIds: [] });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <div className="grid grid-cols-2 gap-0.5">
          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
        </div>
        Section Catégories
      </h3>

      <Toggle
        checked={value.visible}
        onChange={(v) => onChange({ visible: v })}
        label="Afficher la section"
      />

      <BilingualField
        label="Titre de la section"
        value={value.title}
        onChange={(title) => onChange({ title })}
      />
      <BilingualField
        label="Sous-titre"
        value={value.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        multiline
        rows={2}
      />

      <Field label="Nombre maximum de catégories affichées">
        <input
          type="number"
          min={1}
          max={20}
          value={value.maxCount}
          onChange={(e) => onChange({ maxCount: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-neutral-400">
            Catégories affichées ({value.categoryIds.length}/{categories.length})
          </label>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] font-bold text-amber-500 hover:text-amber-400"
            >
              Tout
            </button>
            <button
              onClick={selectNone}
              className="text-[11px] font-bold text-neutral-500 hover:text-neutral-300"
            >
              Aucune
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="border border-dashed border-neutral-700 rounded-xl p-4 text-center">
            <ImageIcon size={20} className="text-neutral-500 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">
              Aucune catégorie active. Créez vos catégories dans
              « Catégories » pour les afficher ici.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {categories.map((cat) => {
              const selected = value.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-colors ${
                    selected
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-neutral-800 bg-[#1e1e24] hover:border-neutral-600"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={14} className="text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                    <p className="text-[11px] text-neutral-500">
                      {cat.productCount ?? 0} produit(s)
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      selected ? "bg-amber-500 border-amber-500" : "border-neutral-600"
                    }`}
                  >
                    {selected && <Check size={12} className="text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-neutral-500 mt-1.5">
          Aucune sélection = toutes vos catégories actives sont affichées.
        </p>
      </div>
    </div>
  );
}
