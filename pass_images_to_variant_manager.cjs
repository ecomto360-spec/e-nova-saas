const fs = require('fs');

let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');
code = code.replace(
  '<VariantManager variants={formVariants} onChange={setFormVariants} />',
  '<VariantManager variants={formVariants} onChange={setFormVariants} productImages={formImages} />'
);
fs.writeFileSync('src/pages/Products.tsx', code);

let variantManagerCode = fs.readFileSync('src/components/admin/VariantManager.tsx', 'utf8');
variantManagerCode = variantManagerCode.replace(
  'interface VariantManagerProps {',
  `interface VariantManagerProps {
  productImages?: string[];`
);

variantManagerCode = variantManagerCode.replace(
  'export function VariantManager({ variants, onChange }: VariantManagerProps) {',
  'export function VariantManager({ variants, onChange, productImages = [] }: VariantManagerProps) {'
);

// Update modal inside VariantManager
// It currently shows: "Veuillez d'abord télécharger les images du produit" and allows uploading directly.
// We need it to display the productImages so they can be clicked.

const modalReplacement = `{imageModalOpen && (() => {
        const opt = variants[imageModalOpen.gIdx].options[imageModalOpen.oIdx];
        const optData = typeof opt === 'string' ? null : opt;
        
        return (
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
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload new
                  </button>
                </div>

                {productImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {productImages.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          updateOption(imageModalOpen.gIdx, imageModalOpen.oIdx, { image: img });
                          setImageModalOpen(null);
                        }}
                        className={\`relative rounded-xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer border-2 transition-all \${optData?.image === img ? 'border-yellow-500 scale-95' : 'border-neutral-700 hover:border-neutral-500 bg-[#16161a]'}\`}
                      >
                        <img src={img} alt={\`Product image \${idx}\`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md">
                          #{idx + 1}
                        </div>
                        {optData?.image === img && (
                          <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                            <div className="bg-yellow-500 text-black rounded-full p-1 shadow-lg">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                    <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">Veuillez d'abord télécharger les images du produit</p>
                  </div>
                )}
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
        );
      })()}
`;

variantManagerCode = variantManagerCode.replace(/\{imageModalOpen && \(\(\) => \{[\s\S]*?\}\)\(\)\}/, modalReplacement);

// Just in case it wasn't an IIFE in the previous version
variantManagerCode = variantManagerCode.replace(/\{\/\* Image Modal for Color Variants \*\/\}[\s\S]*?\{imageModalOpen && \(\s*<div className="fixed inset-0[\s\S]*?<\/div>\s*\)\}/, 
`{/* Image Modal for Color Variants */}
      ${modalReplacement}`
);

fs.writeFileSync('src/components/admin/VariantManager.tsx', variantManagerCode);
console.log("VariantManager updated with productImages!");
