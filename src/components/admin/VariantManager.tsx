import React, { useState, useRef } from 'react';
import { 
  Plus, 
  X, 
  Trash2, 
  Image as ImageIcon, 
  Folder, 
  Check, 
  ChevronDown,
  ChevronUp,
  List, 
  CheckSquare, 
  Palette, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  Radio, 
  Layers, 
  Package, 
  AlertCircle
} from "lucide-react";

export type VariantType = "text" | "color" | "image_text" | "image" | "multiple" | "dropdown" | "radio";

export interface VariantOptionDef {
  value: string;
  priceDiff?: number;
  costPrice?: number;
  stock?: number;
  quantity?: number;
  colorCode?: string;
  image?: string;
  sku?: string;
  hasImageCard?: boolean;
}

export interface ProductVariant {
  name: string;
  type?: VariantType;
  options: (string | VariantOptionDef)[]; 
}

export interface VariantManagerProps {
  onAddProductImage?: (image: string) => void;
  productImages?: string[];
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  trackVariantStock?: boolean;
}

// Popular e-commerce color presets in Algeria & North Africa
export const POPULAR_COLORS = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF", border: true },
  { name: "Gris anthracite", hex: "#374151" },
  { name: "Gris clair", hex: "#9CA3AF" },
  { name: "Bleu marine", hex: "#1E3A8A" },
  { name: "Bleu roi", hex: "#2563EB" },
  { name: "Bleu ciel", hex: "#38BDF8" },
  { name: "Rouge", hex: "#DC2626" },
  { name: "Bordeaux", hex: "#881337" },
  { name: "Vert bouteille", hex: "#14532D" },
  { name: "Vert kaki", hex: "#3F6212" },
  { name: "Vert menthe", hex: "#10B981" },
  { name: "Jaune", hex: "#EAB308" },
  { name: "Moutarde", hex: "#CA8A04" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Rose poudré", hex: "#F472B6" },
  { name: "Violet", hex: "#9333EA" },
  { name: "Marron", hex: "#78350F" },
  { name: "Beige / Camel", hex: "#D2B48C" },
  { name: "Doré", hex: "#D97706" },
  { name: "Argenté", hex: "#CBD5E1" }
];

// Quick presets for fast variant group creation
const VARIANT_PRESETS = [
  {
    label: "Tailles vêtements (S - 3XL)",
    groupName: "Taille",
    type: "text" as VariantType,
    options: [
      { value: "S", priceDiff: 0, stock: 20 },
      { value: "M", priceDiff: 0, stock: 25 },
      { value: "L", priceDiff: 0, stock: 25 },
      { value: "XL", priceDiff: 0, stock: 20 },
      { value: "XXL", priceDiff: 0, stock: 15 },
      { value: "3XL", priceDiff: 0, stock: 10 }
    ]
  },
  {
    label: "Pointures chaussures (38 - 44)",
    groupName: "Pointure",
    type: "text" as VariantType,
    options: [
      { value: "38", priceDiff: 0, stock: 10 },
      { value: "39", priceDiff: 0, stock: 15 },
      { value: "40", priceDiff: 0, stock: 20 },
      { value: "41", priceDiff: 0, stock: 20 },
      { value: "42", priceDiff: 0, stock: 20 },
      { value: "43", priceDiff: 0, stock: 15 },
      { value: "44", priceDiff: 0, stock: 10 }
    ]
  },
  {
    label: "Couleurs basiques",
    groupName: "Couleur",
    type: "color" as VariantType,
    options: [
      { value: "Noir", colorCode: "#000000", priceDiff: 0, stock: 30 },
      { value: "Blanc", colorCode: "#FFFFFF", priceDiff: 0, stock: 30 },
      { value: "Gris", colorCode: "#6B7280", priceDiff: 0, stock: 20 },
      { value: "Bleu", colorCode: "#2563EB", priceDiff: 0, stock: 20 },
      { value: "Rouge", colorCode: "#DC2626", priceDiff: 0, stock: 15 }
    ]
  },
  {
    label: "Couleurs tendance",
    groupName: "Couleur",
    type: "color" as VariantType,
    options: [
      { value: "Bleu marine", colorCode: "#1E3A8A", priceDiff: 0, stock: 20 },
      { value: "Bordeaux", colorCode: "#881337", priceDiff: 0, stock: 20 },
      { value: "Vert kaki", colorCode: "#3F6212", priceDiff: 0, stock: 20 },
      { value: "Beige", colorCode: "#D2B48C", priceDiff: 0, stock: 20 }
    ]
  },
  {
    label: "Capacité / Stockage",
    groupName: "Capacité",
    type: "dropdown" as VariantType,
    options: [
      { value: "64 Go", priceDiff: 0, stock: 15 },
      { value: "128 Go", priceDiff: 2000, stock: 25 },
      { value: "256 Go", priceDiff: 5000, stock: 15 },
      { value: "512 Go", priceDiff: 9000, stock: 10 }
    ]
  }
];

// Helper to normalize any option (string or object)
function normalizeOption(option: string | VariantOptionDef): VariantOptionDef {
  if (typeof option === 'string') {
    return {
      value: option,
      priceDiff: 0,
      stock: 10
    };
  }
  return {
    value: option.value || "",
    priceDiff: option.priceDiff ?? 0,
    stock: option.stock ?? option.quantity ?? 10,
    quantity: option.quantity ?? option.stock ?? 10,
    colorCode: option.colorCode,
    costPrice: option.costPrice,
    image: option.image,
    sku: option.sku
  };
}

export function VariantManager({ 
  variants, 
  onChange, 
  productImages = [], 
  onAddProductImage, 
  trackVariantStock = false 
}: VariantManagerProps) {
  // Modal for choosing/uploading variant image
  const [activeImagePicker, setActiveImagePicker] = useState<{
    groupIndex: number;
    optionIndex: number;
  } | null>(null);

  // Modal / popover for color palette
  const [activeColorPicker, setActiveColorPicker] = useState<{
    groupIndex: number;
    optionIndex: number;
  } | null>(null);

  // Bulk add modal/input per group
  const [bulkInputGroup, setBulkInputGroup] = useState<number | null>(null);
  const [bulkInputValue, setBulkInputValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddGroup = (template?: typeof VARIANT_PRESETS[0]) => {
    if (template) {
      const newVariant: ProductVariant = {
        name: template.groupName,
        type: template.type,
        options: template.options.map(opt => ({ ...opt }))
      };
      onChange([...variants, newVariant]);
      return;
    }

    const newVariant: ProductVariant = {
      name: "",
      type: "text",
      options: [
        { value: "", priceDiff: 0, stock: 10 }
      ]
    };
    onChange([...variants, newVariant]);
  };

  const handleRemoveGroup = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
  };

  const updateGroup = (idx: number, updates: Partial<ProductVariant>) => {
    const newVariants = [...variants];
    newVariants[idx] = { ...newVariants[idx], ...updates };
    onChange(newVariants);
  };

  const duplicateGroup = (idx: number) => {
    const groupToClone = variants[idx];
    const clonedGroup: ProductVariant = {
      name: `${groupToClone.name || "Groupe"} (copie)`,
      type: groupToClone.type,
      options: (groupToClone.options || []).map(opt => {
        const norm = normalizeOption(opt);
        return { ...norm };
      })
    };
    const newArr = [...variants];
    newArr.splice(idx + 1, 0, clonedGroup);
    onChange(newArr);
  };

  const moveGroup = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= variants.length) return;
    const newArr = [...variants];
    const [moved] = newArr.splice(idx, 1);
    newArr.splice(targetIdx, 0, moved);
    onChange(newArr);
  };

  const addOption = (groupIndex: number) => {
    const group = variants[groupIndex];
    const isColor = group.type === "color";
    const newOption: VariantOptionDef = {
      value: "",
      priceDiff: 0,
      stock: 10,
      ...(isColor ? { colorCode: "#2563EB" } : {})
    };
    
    const newOptions = [...(group.options || [])];
    newOptions.push(newOption);
    updateGroup(groupIndex, { options: newOptions });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const group = variants[groupIndex];
    const newOptions = (group.options || []).filter((_, i) => i !== optionIndex);
    updateGroup(groupIndex, { options: newOptions });
  };

  const duplicateOption = (groupIndex: number, optionIndex: number) => {
    const group = variants[groupIndex];
    const currentOpt = normalizeOption(group.options[optionIndex]);
    const clonedOpt: VariantOptionDef = {
      ...currentOpt,
      value: `${currentOpt.value} (copie)`
    };
    const newOptions = [...(group.options || [])];
    newOptions.splice(optionIndex + 1, 0, clonedOpt);
    updateGroup(groupIndex, { options: newOptions });
  };

  const moveOption = (groupIndex: number, optionIndex: number, direction: "up" | "down") => {
    const group = variants[groupIndex];
    const targetIdx = direction === "up" ? optionIndex - 1 : optionIndex + 1;
    if (targetIdx < 0 || targetIdx >= group.options.length) return;
    const newOptions = [...(group.options || [])];
    const [moved] = newOptions.splice(optionIndex, 1);
    newOptions.splice(targetIdx, 0, moved);
    updateGroup(groupIndex, { options: newOptions });
  };

  const updateOption = (groupIndex: number, optionIndex: number, updates: Partial<VariantOptionDef>) => {
    const group = variants[groupIndex];
    const newOptions = [...(group.options || [])];
    const current = normalizeOption(newOptions[optionIndex]);
    
    newOptions[optionIndex] = {
      ...current,
      ...updates
    };
    
    updateGroup(groupIndex, { options: newOptions });
  };

  const handleBulkAdd = (groupIndex: number) => {
    if (!bulkInputValue.trim()) return;
    const group = variants[groupIndex];
    const isColor = group.type === "color";

    // Split by commas or newlines
    const rawItems = bulkInputValue
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (rawItems.length === 0) return;

    const newOptions = [...(group.options || [])];

    rawItems.forEach(item => {
      // If color type, check if item matches a known color
      let matchingColorHex = isColor ? "#3b82f6" : undefined;
      if (isColor) {
        const found = POPULAR_COLORS.find(c => c.name.toLowerCase() === item.toLowerCase());
        if (found) matchingColorHex = found.hex;
      }

      newOptions.push({
        value: item,
        priceDiff: 0,
        stock: 10,
        ...(matchingColorHex ? { colorCode: matchingColorHex } : {})
      });
    });

    updateGroup(groupIndex, { options: newOptions });
    setBulkInputValue("");
    setBulkInputGroup(null);
  };

  const handleFileUpload = (file: File) => {
    if (!file || !activeImagePicker) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result;
      if (typeof base64 !== 'string') return;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX = 600;
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else if (h > MAX) {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/webp', 0.85);
          
          updateOption(activeImagePicker.groupIndex, activeImagePicker.optionIndex, { image: compressed });
          if (onAddProductImage) onAddProductImage(compressed);
        } catch {
          updateOption(activeImagePicker.groupIndex, activeImagePicker.optionIndex, { image: base64 });
          if (onAddProductImage) onAddProductImage(base64);
        }
        setActiveImagePicker(null);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Quick Preset Buttons if no variants yet */}
      {variants.length === 0 && (
        <div className="bg-[#16161b] border border-dashed border-neutral-700/80 rounded-2xl p-6 text-center">
          <Layers className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-90" />
          <h3 className="text-sm font-bold text-white mb-1">Créez vos variantes en 1 clic</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mb-5">
            Choisissez un modèle prédéfini ou créez un groupe personnalisé selon vos produits.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {VARIANT_PRESETS.map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleAddGroup(preset)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500/50 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleAddGroup()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Plus className="w-3.5 h-3.5" /> Groupe personnalisé
            </button>
          </div>
        </div>
      )}

      {/* List of Variant Groups */}
      {variants.map((variant, gIdx) => {
        const currentType: VariantType = variant.type || "text";

        return (
          <div key={gIdx} className="bg-[#18181c] border border-neutral-800/90 rounded-2xl p-5 relative shadow-sm transition-all">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4 border-b border-neutral-800/70 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  {gIdx + 1}
                </span>
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-sm font-bold text-white">
                  {variant.name ? variant.name : `Groupe de variantes #${gIdx + 1}`}
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono">
                  ({(variant.options || []).length} {((variant.options || []).length <= 1) ? 'option' : 'options'})
                </span>
              </div>

              {/* Group Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveGroup(gIdx, "up")}
                  disabled={gIdx === 0}
                  className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Déplacer vers le haut"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveGroup(gIdx, "down")}
                  disabled={gIdx === variants.length - 1}
                  className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Déplacer vers le bas"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateGroup(gIdx)}
                  className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Dupliquer ce groupe"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => handleRemoveGroup(gIdx)}
                  className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors ml-1"
                  title="Supprimer ce groupe"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inputs: Nom du groupe & Type de variante */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Nom du groupe de variantes <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-700 bg-[#121215] px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-neutral-600 transition-colors"
                  placeholder="Exemple : Couleur, Taille, Capacité, Pointure..."
                />
                {/* Suggestions pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-neutral-500 py-0.5">Suggestions :</span>
                  {["Couleur", "Taille", "Pointure", "Capacité", "Matière", "Pack"].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        const newType: VariantType = sug === "Couleur" ? "color" : sug === "Capacité" ? "dropdown" : "text";
                        updateGroup(gIdx, { name: sug, type: newType });
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 border border-neutral-700/80 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Type d'affichage pour l'acheteur
                </label>
                <div className="relative">
                  <select
                    value={currentType}
                    onChange={(e) => {
                      const newType = e.target.value as VariantType;
                      // When switching to color, assign color codes to existing options if missing
                      if (newType === "color") {
                        const updatedOptions = (variant.options || []).map((opt, i) => {
                          const norm = normalizeOption(opt);
                          return {
                            ...norm,
                            colorCode: norm.colorCode || POPULAR_COLORS[i % POPULAR_COLORS.length].hex
                          };
                        });
                        updateGroup(gIdx, { type: newType, options: updatedOptions });
                      } else {
                        updateGroup(gIdx, { type: newType });
                      }
                    }}
                    className="w-full appearance-none rounded-xl border border-amber-500/70 bg-[#121215] px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-colors pr-10 cursor-pointer font-medium"
                  >
                    <option value="text">Texte / Boutons (ex : S, M, L, XL)</option>
                    <option value="color">Couleur (Pastille visuelle + pipette)</option>
                    <option value="image_text">Image avec texte (photo + libellé)</option>
                    <option value="image">Image seule (miniatures photos cliquables)</option>
                    <option value="dropdown">Menu déroulant (liste de choix)</option>
                    <option value="radio">Boutons radio détaillés (vertical)</option>
                    <option value="multiple">Choix multiples (cases à cocher)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  {currentType === "color" && "Affiche des pastilles colorées cliquables avec code HEX."}
                  {currentType === "text" && "Boutons carrés ou arrondis parfaits pour tailles et formats."}
                  {currentType === "image_text" && "Affiche une miniature photo à côté du nom de l'option."}
                  {currentType === "image" && "Pastilles photos miniatures (idéal pour styles/motifs)."}
                  {currentType === "dropdown" && "Idéal pour les listes longues afin d'éviter d'encombrer la page."}
                  {currentType === "radio" && "Affichage en cartes verticales détaillées."}
                  {currentType === "multiple" && "Permet à l'acheteur de sélectionner plusieurs options."}
                </p>
              </div>
            </div>

            {/* Quick Bulk Add Button / Bar */}
            <div className="flex items-center justify-between mb-3 pt-2 border-t border-neutral-800/60">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                Options du groupe ({variant.options?.length || 0})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkInputGroup(bulkInputGroup === gIdx ? null : gIdx)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {bulkInputGroup === gIdx ? "Fermer l'ajout en lot" : "Ajouter en lot"}
                </button>
              </div>
            </div>

            {/* Bulk Add Input Field */}
            {bulkInputGroup === gIdx && (
              <div className="mb-4 p-3 bg-[#121215] border border-amber-500/40 rounded-xl animate-in fade-in duration-200">
                <label className="block text-xs font-medium text-amber-400 mb-1">
                  Saisie rapide d'options (séparées par une virgule ou un retour à la ligne)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bulkInputValue}
                    onChange={(e) => setBulkInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBulkAdd(gIdx);
                      }
                    }}
                    placeholder={
                      currentType === "color" 
                        ? "Ex: Noir, Blanc, Bleu marine, Rouge, Vert kaki..." 
                        : "Ex: S, M, L, XL, XXL ou 38, 39, 40, 41..."
                    }
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleBulkAdd(gIdx)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Insérer
                  </button>
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="space-y-2.5">
              {(variant.options || []).map((option, oIdx) => {
                const optionData = normalizeOption(option);
                const isColor = currentType === "color";
                const isImageAllowed = currentType === "image_text" || currentType === "image" || currentType === "color";

                return (
                  <div 
                    key={oIdx} 
                    className="bg-[#121215] border border-neutral-800 hover:border-neutral-700/90 p-3 rounded-xl transition-all"
                  >
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                      {/* Left handles / numbering */}
                      <span className="text-[11px] font-bold text-neutral-500 w-4 text-center select-none">
                        {oIdx + 1}
                      </span>

                      {/* COLOR PICKER (If type is color) */}
                      {isColor && (
                        <div className="relative shrink-0 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveColorPicker(
                              activeColorPicker?.groupIndex === gIdx && activeColorPicker?.optionIndex === oIdx 
                                ? null 
                                : { groupIndex: gIdx, optionIndex: oIdx }
                            )}
                            className="w-8 h-8 rounded-full border-2 border-neutral-600 shadow-inner flex items-center justify-center hover:scale-105 transition-all relative overflow-hidden"
                            style={{ backgroundColor: optionData.colorCode || "#2563EB" }}
                            title="Changer la couleur"
                          >
                            {optionData.colorCode?.toLowerCase() === "#ffffff" && (
                              <span className="absolute inset-0 border border-neutral-400 rounded-full" />
                            )}
                          </button>

                          {/* Quick color code badge */}
                          <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">
                            {optionData.colorCode || "#2563EB"}
                          </span>
                        </div>
                      )}

                      {/* IMAGE BUTTON (For image_text, image, or color photo association) */}
                      {isImageAllowed && (
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveImagePicker({ groupIndex: gIdx, optionIndex: oIdx })}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs transition-colors ${
                              optionData.image
                                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                                : "border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400"
                            }`}
                            title={optionData.image ? "Changer ou retirer la photo" : "Associer une photo"}
                          >
                            {optionData.image ? (
                              <img src={optionData.image} alt="Option" className="w-6 h-6 rounded object-cover border border-amber-500/40" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-neutral-400" />
                            )}
                            <span className="text-[10px] hidden md:inline">
                              {optionData.image ? "Photo liée" : "Photo"}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* OPTION VALUE INPUT */}
                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          value={optionData.value}
                          onChange={(e) => updateOption(gIdx, oIdx, { value: e.target.value })}
                          className="w-full bg-[#18181c] border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none font-medium"
                          placeholder={
                            isColor
                              ? "Nom de la couleur (ex : Noir, Blanc, Bleu nuit...)"
                              : currentType === "image"
                              ? "Titre ou référence de l'image (ex : Motif floral...)"
                              : currentType === "dropdown"
                              ? "Option (ex : 128 Go, Version Pro...)"
                              : "Valeur de l'option (ex : S, M, L, XL...)"
                          }
                        />
                      </div>

                      {/* PRICE DIFFERENCE INPUT */}
                      <div className="flex items-center gap-1 shrink-0 bg-[#18181c] border border-neutral-700/80 rounded-lg px-2 py-1" title="Différence de prix (+ / - DA)">
                        <span className="text-[11px] text-neutral-500 font-bold select-none">+ / -</span>
                        <input
                          type="number"
                          value={optionData.priceDiff !== undefined && optionData.priceDiff !== null ? optionData.priceDiff : 0}
                          onChange={(e) => updateOption(gIdx, oIdx, { priceDiff: Number(e.target.value) || 0 })}
                          className="w-16 bg-transparent text-xs text-white text-center focus:outline-none font-semibold"
                          placeholder="0"
                        />
                        <span className="text-[10px] font-bold text-amber-500 select-none">DA</span>
                      </div>

                      {/* OPTIONAL COST PRICE */}
                      <div className="flex items-center gap-1 shrink-0 bg-[#18181c] border border-neutral-700/80 rounded-lg px-2 py-1" title="Prix d'achat (coût) pour le calcul du profit">
                        <span className="text-[10px] text-neutral-400 font-medium select-none">Coût:</span>
                        <input
                          type="number"
                          min="0"
                          value={optionData.costPrice !== undefined && optionData.costPrice !== null ? optionData.costPrice : ""}
                          onChange={(e) => updateOption(gIdx, oIdx, { costPrice: e.target.value === "" ? undefined : Number(e.target.value) })}
                          className="w-14 bg-transparent text-xs text-white text-center focus:outline-none font-semibold"
                          placeholder="0"
                        />
                        <span className="text-[10px] text-neutral-500 select-none">DA</span>
                      </div>

                      {/* STOCK PER OPTION (Enabled or visible with inventory tracking) */}
                      <div className="flex items-center gap-1 shrink-0 bg-[#18181c] border border-neutral-700/80 rounded-lg px-2 py-1" title="Stock disponible pour cette option">
                        <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <input
                          type="number"
                          min="0"
                          value={optionData.stock !== undefined ? optionData.stock : 10}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            updateOption(gIdx, oIdx, { stock: val, quantity: val });
                          }}
                          className="w-12 bg-transparent text-xs text-white text-center focus:outline-none font-semibold"
                          placeholder="Stock"
                        />
                        <span className="text-[10px] text-neutral-400 select-none">u.</span>
                      </div>

                      {/* OPTION ACTIONS (Move, Duplicate, Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveOption(gIdx, oIdx, "up")}
                          disabled={oIdx === 0}
                          className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 rounded"
                          title="Monter"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveOption(gIdx, oIdx, "down")}
                          disabled={oIdx === (variant.options || []).length - 1}
                          className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 rounded"
                          title="Descendre"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateOption(gIdx, oIdx)}
                          className="p-1 text-neutral-500 hover:text-amber-400 rounded"
                          title="Dupliquer l'option"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOption(gIdx, oIdx)}
                          className="p-1 text-red-500/70 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                          title="Supprimer cette option"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* COLOR PALETTE POPOVER IF OPEN */}
                    {isColor && activeColorPicker?.groupIndex === gIdx && activeColorPicker?.optionIndex === oIdx && (
                      <div className="mt-3 pt-3 border-t border-neutral-800 bg-[#16161b] p-3 rounded-xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5" /> Nuancier de couleurs populaires
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-neutral-400 flex items-center gap-1 cursor-pointer hover:text-white">
                              Pipette personnalisée :
                              <input
                                type="color"
                                value={optionData.colorCode || "#2563EB"}
                                onChange={(e) => updateOption(gIdx, oIdx, { colorCode: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setActiveColorPicker(null)}
                              className="text-neutral-500 hover:text-white p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Color Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
                          {POPULAR_COLORS.map((col) => {
                            const isSelected = (optionData.colorCode || "").toLowerCase() === col.hex.toLowerCase();
                            return (
                              <button
                                key={col.hex}
                                type="button"
                                onClick={() => {
                                  updateOption(gIdx, oIdx, {
                                    colorCode: col.hex,
                                    value: optionData.value ? optionData.value : col.name
                                  });
                                  setActiveColorPicker(null);
                                }}
                                className={`flex flex-col items-center gap-1 p-1 rounded-lg border transition-all ${
                                  isSelected 
                                    ? "border-amber-500 bg-amber-500/10 shadow-sm" 
                                    : "border-neutral-800 hover:border-neutral-600 bg-neutral-900"
                                }`}
                                title={col.name}
                              >
                                <div 
                                  className="w-5 h-5 rounded-full border border-black/20 shadow-inner"
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span className="text-[9px] text-neutral-300 truncate w-full text-center">
                                  {col.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Option Button */}
              <button
                type="button"
                onClick={() => addOption(gIdx)}
                className="w-full mt-2 py-2.5 border border-dashed border-amber-600/60 hover:border-amber-500 text-amber-500 hover:text-amber-400 hover:bg-amber-500/5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Ajouter une option
              </button>
            </div>
          </div>
        );
      })}

      {/* Button to add another group */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => handleAddGroup()}
          className="w-full py-3.5 border-2 border-dashed border-neutral-700 hover:border-amber-500/80 text-neutral-300 hover:text-amber-400 bg-neutral-900/50 hover:bg-neutral-900 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Ajouter un autre groupe de variantes
        </button>
      </div>

      {/* Hidden file input for variant photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
      />

      {/* MODAL: SELECT / UPLOAD VARIANT IMAGE */}
      {activeImagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181c] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Associer une photo à l'option</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveImagePicker(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Image preview if any */}
            {(() => {
              const currentOpt = normalizeOption(variants[activeImagePicker.groupIndex]?.options[activeImagePicker.optionIndex]);
              return currentOpt.image ? (
                <div className="mb-4 p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={currentOpt.image} alt="Selected" className="w-12 h-12 rounded-lg object-cover border border-neutral-700" />
                    <div>
                      <p className="text-xs font-semibold text-white">Photo actuellement assignée</p>
                      <p className="text-[11px] text-neutral-500">S'affichera lorsque le client choisit cette option</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateOption(activeImagePicker.groupIndex, activeImagePicker.optionIndex, { image: undefined });
                      setActiveImagePicker(null);
                    }}
                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium rounded-lg transition-colors"
                  >
                    Retirer la photo
                  </button>
                </div>
              ) : null;
            })()}

            {/* Existing Product Images */}
            {productImages && productImages.length > 0 && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  1. Choisir parmi les photos du produit :
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {productImages.map((img, i) => {
                    const currentOpt = normalizeOption(variants[activeImagePicker.groupIndex]?.options[activeImagePicker.optionIndex]);
                    const isSelected = currentOpt.image === img;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          updateOption(activeImagePicker.groupIndex, activeImagePicker.optionIndex, { image: img });
                          setActiveImagePicker(null);
                        }}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                          isSelected 
                            ? "border-amber-500 ring-2 ring-amber-500/40" 
                            : "border-neutral-700 hover:border-neutral-500"
                        }`}
                      >
                        <img src={img} alt={`Product ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-black p-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload or URL options */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300">
                2. Ou téléchargez une nouvelle image :
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500/50 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-amber-400" /> Télécharger depuis votre appareil
                </button>
              </div>

              {/* Paste URL */}
              <div className="pt-2">
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Ou coller une URL d'image :
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="variant-url-input"
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          updateOption(activeImagePicker.groupIndex, activeImagePicker.optionIndex, { image: val });
                          setActiveImagePicker(null);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("variant-url-input") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        updateOption(activeImagePicker.groupIndex, activeImagePicker.optionIndex, { image: input.value.trim() });
                        setActiveImagePicker(null);
                      }
                    }}
                    className="px-3 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors"
                  >
                    Valider
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
