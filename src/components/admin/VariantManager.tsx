import React from 'react';
import { Plus, X, Trash2, Image as ImageIcon, UploadCloud, GripVertical, Folder, Info, CheckCircle2 } from "lucide-react";

export type VariantType = "text" | "color" | "image_text" | "multiple";

export interface VariantOptionDef {
  value: string;
  priceDiff?: number;
  quantity?: number;
  stock?: number;
  colorCode?: string;
  image?: string;
  hasImageCard?: boolean;
}

export interface ProductVariant {
  name: string;
  type?: VariantType;
  options: any[]; 
}

interface VariantManagerProps {
  onAddProductImage?: (image: string) => void;
  productImages?: string[];
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  trackVariantStock?: boolean;
}

export function VariantManager({ variants, onChange, productImages = [], onAddProductImage, trackVariantStock }: VariantManagerProps) {

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
      quantity: 0,
      stock: 0,
      colorCode: "#f59e0b",
      hasImageCard: false
    };
    
    const newOptions = [...group.options];
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
              className="text-neutral-500 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nom du groupe (ex: Taille, Couleur)</label>
              <input
                type="text"
                value={variant.name}
                onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                placeholder="Ex: Pointure"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Type d'affichage</label>
              <select
                value={variant.type || "text"}
                onChange={(e) => updateGroup(gIdx, { type: e.target.value as VariantType })}
                className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="text">Texte (Boutons)</option>
                <option value="color">Couleurs (Pastilles)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {variant.options.map((option, oIdx) => {
              const optionData: VariantOptionDef = typeof option === 'string' ? { value: option } : option;
              
              return (
                <div key={oIdx} className="flex items-center gap-3 bg-[#16161a] border border-neutral-800 p-2.5 rounded-lg group">
                  <GripVertical className="w-4 h-4 text-neutral-600 cursor-grab shrink-0" />
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={optionData.value}
                      onChange={(e) => updateOption(gIdx, oIdx, { value: e.target.value })}
                      className="w-full bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-neutral-600"
                      placeholder="Valeur de l'option (ex: Rouge, XL)"
                    />
                  </div>

                  {variant.type === "color" && (
                    <div className="flex items-center gap-2 shrink-0 border-l border-neutral-800 pl-3 ml-1">
                      <input 
                        type="color" 
                        value={optionData.colorCode || "#000000"} 
                        onChange={(e) => updateOption(gIdx, oIdx, { colorCode: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-neutral-600 bg-transparent p-0"
                      />
                      
                      <label className="flex items-center gap-1.5 px-3 py-2 border border-neutral-600 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                               const base64 = event.target?.result;
                               if (typeof base64 !== 'string') return;
                               
                               const img = new Image();
                               img.onload = () => {
                                 try {
                                   const canvas = document.createElement('canvas');
                                   const MAX_WIDTH = 400;
                                   const MAX_HEIGHT = 400;
                                   let width = img.width;
                                   let height = img.height;
                                   
                                   if (width > height) {
                                     if (width > MAX_WIDTH) { height = Math.round(height * MAX_WIDTH / width); width = MAX_WIDTH; }
                                   } else {
                                     if (height > MAX_HEIGHT) { width = Math.round(width * MAX_HEIGHT / height); height = MAX_HEIGHT; }
                                   }
                                   
                                   canvas.width = width;
                                   canvas.height = height;
                                   const ctx = canvas.getContext('2d');
                                   if (ctx) {
                                     ctx.drawImage(img, 0, 0, width, height);
                                     const compressed = canvas.toDataURL('image/webp', 0.8);
                                     updateOption(gIdx, oIdx, { image: compressed });
                                   } else {
                                     updateOption(gIdx, oIdx, { image: base64 });
                                   }
                                 } catch(err) {
                                   console.error("Resize error", err);
                                   updateOption(gIdx, oIdx, { image: base64 });
                                 }
                               };
                               img.onerror = () => {
                                 updateOption(gIdx, oIdx, { image: base64 });
                               };
                               img.src = base64;
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                        {optionData.image ? (
                          <>
                            <div className="w-5 h-5 rounded overflow-hidden border border-neutral-500 shrink-0 bg-white flex items-center justify-center">
                              <img src={optionData.image} alt="variant" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-yellow-500 truncate max-w-[60px]">Changer</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span>Image</span>
                          </>
                        )}
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer ml-1">
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={optionData.hasImageCard || false}
                          onChange={() => updateOption(gIdx, oIdx, { hasImageCard: !optionData.hasImageCard })}
                        />
                        <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${optionData.hasImageCard ? "bg-white" : "bg-neutral-600"}`} >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${optionData.hasImageCard ? "translate-x-3.5" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                           <ImageIcon className="w-3.5 h-3.5" /> Carte image
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Quantité disponible de l'option */}
                  <div className="flex items-center gap-2 shrink-0 ml-2 border-l border-neutral-800 pl-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={optionData.quantity !== undefined ? optionData.quantity : (optionData.stock !== undefined ? optionData.stock : "")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                        updateOption(gIdx, oIdx, { quantity: val, stock: val });
                      }}
                      className="w-20 rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <span className="text-xs text-neutral-400">Qté</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2 border-l border-neutral-800 pl-3">
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

      <button
        type="button"
        onClick={handleAddGroup}
        className="w-full py-4 border-2 border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Ajouter un autre groupe d'options
      </button>
    </div>
  );
}
