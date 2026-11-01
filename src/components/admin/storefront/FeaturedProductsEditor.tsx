import { Check, Sparkles } from "lucide-react";
import type { FeaturedProductsSettings } from "../../../types/storefront";
import type { StoreDemoProduct } from "../../../data/themesData";
import { BilingualField, Field, Toggle } from "./editorUI";

/**
 * Éditeur de la section Produits vedettes : textes bilingues, source
 * (meilleures ventes calculées depuis les commandes, ou sélection manuelle)
 * et nombre de produits affichés.
 */
export function FeaturedProductsEditor({
  value,
  onChange,
  products,
  soldCounts,
}: {
  value: FeaturedProductsSettings;
  onChange: (patch: Partial<FeaturedProductsSettings>) => void;
  products: StoreDemoProduct[];
  soldCounts: Record<string, number>;
}) {
  const toggleProduct = (id: string) => {
    const selected = value.productIds.includes(id)
      ? value.productIds.filter((p) => p !== id)
      : [...value.productIds, id];
    onChange({ productIds: selected });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-amber-500" />
        Produits vedettes
      </h3>

      <Toggle
        checked={value.visible}
        onChange={(v) => onChange({ visible: v })}
        label="Afficher la section"
      />

      <BilingualField
        label="Badge (au-dessus du titre)"
        value={value.badge}
        onChange={(badge) => onChange({ badge })}
      />
      <BilingualField
        label="Titre de la section"
        value={value.title}
        onChange={(title) => onChange({ title })}
      />
      <BilingualField
        label="Texte du lien « voir tout »"
        value={value.viewAllText}
        onChange={(viewAllText) => onChange({ viewAllText })}
      />

      <Field label="Source des produits">
        <select
          value={value.source}
          onChange={(e) => onChange({ source: e.target.value as FeaturedProductsSettings["source"] })}
          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="bestsales">Meilleures ventes (calculées depuis les commandes)</option>
          <option value="manual">Sélection manuelle</option>
        </select>
      </Field>

      {value.source === "manual" && (
        <div>
          <label className="text-xs font-medium text-neutral-400 block mb-1.5">
            Produits sélectionnés ({value.productIds.length})
          </label>
          {products.length === 0 ? (
            <div className="border border-dashed border-neutral-700 rounded-xl p-4 text-center">
              <p className="text-xs text-neutral-400">
                Aucun produit dans votre catalogue. Ajoutez des produits
                dans « Produits » pour les afficher ici.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {products.map((product) => {
                const selected = value.productIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-colors ${
                      selected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-neutral-800 bg-[#1e1e24] hover:border-neutral-600"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-neutral-500">IMG</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{product.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {product.price ? `${product.price.toLocaleString()} DA` : "—"}
                        {soldCounts[product.id] ? ` · ${soldCounts[product.id]} vendu(s)` : ""}
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
        </div>
      )}

      <Field
        label="Nombre de produits affichés"
        hint={
          value.source === "bestsales"
            ? "Les produits les plus vendus (commandes confirmées) en premier."
            : undefined
        }
      >
        <input
          type="number"
          min={1}
          max={12}
          value={value.count}
          onChange={(e) => onChange({ count: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
      </Field>
    </div>
  );
}
