import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import type { TrustBarSettings, TrustItem } from "../../../types/storefront";
import { BilingualField, Toggle } from "./editorUI";
import { TRUST_ICON_OPTIONS } from "./trustIcons";

/**
 * Éditeur de la barre de réassurance : items bilingues, icône au choix,
 * affichage individuel, réordonnancement et ajout/suppression.
 */
export function TrustBarEditor({
  value,
  onChange,
}: {
  value: TrustBarSettings;
  onChange: (patch: Partial<TrustBarSettings>) => void;
}) {
  const updateItem = (id: string, patch: Partial<TrustItem>) => {
    onChange({ items: value.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.items.length) return;
    const items = [...value.items];
    [items[index], items[target]] = [items[target], items[index]];
    onChange({ items });
  };

  const removeItem = (id: string) => {
    onChange({ items: value.items.filter((it) => it.id !== id) });
  };

  const addItem = () => {
    onChange({
      items: [
        ...value.items,
        {
          id: `trust-${Date.now()}`,
          icon: "check",
          visible: true,
          title: { fr: "Nouvel avantage", ar: "ميزة جديدة" },
          subtitle: { fr: "Description courte", ar: "وصف قصير" },
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Check size={20} className="text-amber-500" />
        Barre de réassurance
      </h3>

      <Toggle
        checked={value.visible}
        onChange={(v) => onChange({ visible: v })}
        label="Afficher la section"
      />

      <div className="space-y-3">
        {value.items.map((item, index) => (
          <div
            key={item.id}
            className="border border-neutral-800 rounded-xl bg-[#1e1e24]/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30"
                  title="Monter"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === value.items.length - 1}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30"
                  title="Descendre"
                >
                  <ArrowDown size={14} />
                </button>
                <span className="text-xs font-bold text-neutral-400 ml-1">
                  Item {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
                    item.visible ? "bg-amber-500" : "bg-neutral-600"
                  }`}
                  onClick={() => updateItem(item.id, { visible: !item.visible })}
                  title={item.visible ? "Masquer cet item" : "Afficher cet item"}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bottom-0.5 w-3.5 rounded-full bg-white transition-transform ${
                      item.visible ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Supprimer cet item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-400 block mb-1.5">
                Icône
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {TRUST_ICON_OPTIONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => updateItem(item.id, { icon: id })}
                    title={label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-neutral-400 transition-colors ${
                      item.icon === id
                        ? "border-amber-500 bg-amber-500/10 text-amber-500"
                        : "border-neutral-800 hover:border-neutral-600 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[9px] leading-tight text-center line-clamp-2">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <BilingualField
              label="Titre"
              value={item.title}
              onChange={(title) => updateItem(item.id, { title })}
            />
            <BilingualField
              label="Sous-titre"
              value={item.subtitle}
              onChange={(subtitle) => updateItem(item.id, { subtitle })}
            />
          </div>
        ))}
      </div>

      {value.items.length < 6 && (
        <button
          onClick={addItem}
          className="w-full border border-dashed border-neutral-700 rounded-xl py-2.5 text-sm font-bold text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={15} />
          Ajouter un item
        </button>
      )}
    </div>
  );
}
