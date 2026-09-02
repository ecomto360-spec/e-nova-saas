const fs = require('fs');

let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Add formImages to state
code = code.replace(
  'const [formImage, setFormImage] = useState("");',
  'const [formImages, setFormImages] = useState<string[]>([]);'
);

// 2. handleImageFileChange
const handleImageFileChangeOld = `      setFormImage(base64Image);
      showToast("Image ajoutée avec succès");
    } catch (error) {`;
const handleImageFileChangeNew = `      setFormImages(prev => [...prev, base64Image]);
      showToast("Image ajoutée avec succès");
    } catch (error) {`;
code = code.replace(handleImageFileChangeOld, handleImageFileChangeNew);

// 3. handleEditProduct - Edit mode
code = code.replace(
  'setFormImage(prod.image || "");',
  'setFormImages(prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []));'
);

// 4. handleEditProduct - Create mode
code = code.replace(
  'setFormImage("");',
  'setFormImages([]);'
);

// 5. handleSaveProduct payload
const payloadOld = `        image: formImage,
        category: formCategory,`;
const payloadNew = `        image: formImages[0] || "",
        images: formImages,
        category: formCategory,`;
code = code.replace(payloadOld, payloadNew);

// 6. UI for images
const imagesUIOld = `              {formImage ? (
                <div className="relative rounded-xl overflow-hidden border border-neutral-700 bg-[#16161a] aspect-square flex items-center justify-center group mb-4">
                  <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => setFormImage("")}
                      className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={\`border border-dashed border-neutral-600 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-800/50 transition-colors mb-4 \${isUploading ? 'opacity-50 pointer-events-none' : ''}\`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-3" />
                      <span className="text-sm font-medium text-white mb-1">Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-neutral-400 mb-3" />
                      <span className="text-sm font-medium text-white mb-1">Cliquez pour télécharger</span>
                      <span className="text-xs text-neutral-500">Au moins une image requise (Max 5 Mo)</span>
                    </>
                  )}
                </div>
              )}

              {/* Optional: URL Input fallback for images since backend uses URLs for preset */}
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <label className="block text-xs font-medium text-neutral-400 mb-2">Ou URL de l'image</label>
                <input type="text" value={formImage} onChange={(e) => setFormImage(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none" />
              </div>`;

const imagesUINew = `              <div 
                onClick={() => fileInputRef.current?.click()}
                className={\`border border-dashed border-neutral-600 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-800/50 transition-colors mb-6 \${isUploading ? 'opacity-50 pointer-events-none' : ''}\`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-yellow-500 animate-spin mb-2" />
                    <span className="text-sm font-medium text-white">Téléchargement...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-sm font-medium text-white mb-1">Cliquez pour télécharger</span>
                    <span className="text-xs text-neutral-500">Au moins une image requise</span>
                  </>
                )}
              </div>

              {formImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-neutral-700 bg-[#16161a] aspect-square flex items-center justify-center group">
                      <img src={img} alt={\`Preview \${idx}\`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute bottom-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                          Principale
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormImages(prev => {
                                const newArr = [...prev];
                                [newArr[0], newArr[idx]] = [newArr[idx], newArr[0]];
                                return newArr;
                              });
                            }}
                            className="p-2 bg-neutral-700/80 text-white hover:bg-neutral-600 rounded-lg transition-colors text-xs font-medium"
                          >
                            Rendre principale
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional: URL Input fallback */}
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <label className="block text-xs font-medium text-neutral-400 mb-2">Ajouter via URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="img-url-input"
                    placeholder="https://..." 
                    className="flex-1 rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value;
                        if (val) {
                          setFormImages(prev => [...prev, val]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('img-url-input') as HTMLInputElement;
                      if (input && input.value) {
                        setFormImages(prev => [...prev, input.value]);
                        input.value = "";
                      }
                    }}
                    className="px-3 py-2 bg-neutral-700 text-white rounded-lg text-sm hover:bg-neutral-600"
                  >
                    Ajouter
                  </button>
                </div>
              </div>`;

code = code.replace(imagesUIOld, imagesUINew);

// Ensure we update VariantManager to use formImages if it doesn't already
fs.writeFileSync('src/pages/Products.tsx', code);
console.log("Products.tsx updated!");
