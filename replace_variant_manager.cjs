const fs = require('fs');

const code = `import React, { useState } from "react";
import { Plus, X, Trash2, Image as ImageIcon, UploadCloud, GripVertical, Folder, Info } from "lucide-react";

export type VariantType = "text" | "color" | "image_text" | "multiple";

export interface VariantOptionDef {
  value: string;
  priceDiff?: number;
  colorCode?: string;
  image?: string;
  hasImageCard?: boolean;
}

export interface ProductVariant {
  name: string;
  type?: VariantType;
  options: any[]; // Backward compatibility: string[] or VariantOptionDef[]
}

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const [imageModalOpen, setImageModalOpen] = useState<{gIdx: number, oIdx: number} | null>(null);

  const handleAddGroup = () => {
    const newVariant: ProductVariant = {
      name: "",
      type: "text",
      options: []
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

  const addOption = (groupIndex: number) => {
    const group = variants[groupIndex];
    const newOption: VariantOptionDef = {
      value: "",
      priceDiff: 0,
      colorCode: "#f59e0b",
      hasImageCard: false
    };
    
    let newOptions = [...group.options];
    newOptions.push(newOption);
    updateGroup(groupIndex, { options: newOptions });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const group = variants[groupIndex];
    const newOptions = group.options.filter((_, i) => i !== optionIndex);
    updateGroup(groupIndex, { options: newOptions });
  };

  const updateOption = (groupIndex: number, optionIndex: number, updates: Partial<VariantOptionDef>) => {
    const group = variants[groupIndex];
    const newOptions = [...group.options];
    
    if (typeof newOptions[optionIndex] === 'string') {
      newOptions[optionIndex] = { value: newOptions[optionIndex] as string, ...updates };
    } else {
      newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    }
    
    updateGroup(groupIndex, { options: newOptions });
  };

  return (
    <div className="space-y-6">
      {variants.map((variant, gIdx) => (
        <div key={gIdx} className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-neutral-500 cursor-grab" />
              <Folder className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold text-yellow-500">Groupe de variantes {gIdx + 1}</h3>
            </div>
            <button 
              type="button" 
              onClick={() => handleRemoveGroup(gIdx)}
              className="p-1.5 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Nom du groupe</label>
              <input
                type="text"
                placeholder="Exemple : couleur, taille, capacité"
                value={variant.name}
                onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Type de variante</label>
              <select
                value={variant.type || "text"}
                onChange={(e) => updateGroup(gIdx, { type: e.target.value as VariantType })}
                className="w-full rounded-lg border border-yellow-600/50 bg-[#25252d] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none cursor-pointer"
              >
                <option value="text">Texte (ex : S, M, L)</option>
                <option value="color">Couleur (sélection de couleur)</option>
                <option value="image_text">Texte avec image (carte image + libellé)</option>
                <option value="multiple">Choix multiples (l'acheteur peut en sélectionner plusieurs)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 bg-[#18181c] p-4 rounded-xl border border-neutral-800">
            {variant.options.map((opt, oIdx) => {
              const isString = typeof opt === 'string';
              const optionData: VariantOptionDef = isString ? { value: opt } : opt;
              const isColorOrImage = variant.type === 'color' || variant.type === 'image_text';

              return (
                <div key={oIdx} className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-neutral-600 cursor-grab shrink-0" />
                  
                  <input
                    type="text"
                    placeholder="Valeur de l'option (S, M, L...)"
                    value={optionData.value || ""}
                    onChange={(e) => updateOption(gIdx, oIdx, { value: e.target.value })}
                    className="flex-1 rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                  />
                  
                  {isColorOrImage && (
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="relative">
                        <input
                          type="color"
                          value={optionData.colorCode || "#f59e0b"}
                          onChange={(e) => updateOption(gIdx, oIdx, { colorCode: e.target.value })}
                          className="w-9 h-9 rounded-md cursor-pointer border-none p-0 overflow-hidden bg-transparent"
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        className="flex items-center gap-1.5 px-3 py-2 border border-neutral-600 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
                        onClick={() => setImageModalOpen({gIdx, oIdx})}
                      >
                        <ImageIcon className="w-4 h-4 text-neutral-400" />
                        Image
                      </button>
                      
                      <label className="flex items-center gap-2 cursor-pointer ml-1">
                        <div className={\`relative inline-flex h-4 w-7 items-center rounded-full transition-colors \${optionData.hasImageCard ? "bg-white" : "bg-neutral-600"}\`} >
                          <span className={\`inline-block h-3 w-3 transform rounded-full bg-black transition-transform \${optionData.hasImageCard ? "translate-x-3.5" : "translate-x-0.5"}\`} />
                        </div>
                        <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                           <ImageIcon className="w-3.5 h-3.5" /> Carte image
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={optionData.priceDiff || 0}
                      onChange={(e) => updateOption(gIdx, oIdx, { priceDiff: Number(e.target.value) })}
                      className="w-20 rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <span className="text-xs text-neutral-400">DA (diff.)</span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => removeOption(gIdx, oIdx)}
                    className="p-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/30 rounded-lg transition-colors shrink-0 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => addOption(gIdx)}
              className="w-full mt-2 py-2.5 border border-dashed border-yellow-600/60 text-yellow-500 hover:bg-yellow-500/5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter une option
            </button>
          </div>
        </div>
      ))}

      {/* Image Modal for Color Variants */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-white" />
                <h3 className="text-base font-semibold text-white">Sélectionner une image pour la couleur</h3>
              </div>
              <button 
                onClick={() => setImageModalOpen(null)}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1">
              <p className="text-xs text-white font-medium flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-white" />
                Sélectionnez l'image qui apparaîtra lors du choix de cette couleur
              </p>
              
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search images..." 
                    className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  Upload new
                </button>
              </div>

              <div className="h-48 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Veuillez d'abord télécharger les images du produit</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-neutral-800 flex items-center justify-center gap-3">
              <button 
                onClick={() => setImageModalOpen(null)}
                className="px-6 py-2 rounded-lg border border-neutral-600 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  updateOption(imageModalOpen.gIdx, imageModalOpen.oIdx, { image: undefined });
                  setImageModalOpen(null);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" /> Supprimer l'image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/admin/VariantManager.tsx', code);
