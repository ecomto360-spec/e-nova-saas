const fs = require('fs');
let code = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

// Add state
const stateTarget = `const [storeName, setStoreName] = useState<string>(
    localStorage.getItem("dzbuild_store_name") || "أزياء الموضة"
  );`;
const stateReplacement = `const [storeName, setStoreName] = useState<string>(
    localStorage.getItem("dzbuild_store_name") !== null ? localStorage.getItem("dzbuild_store_name") : "أزياء الموضة"
  );
  const [logoUrl, setLogoUrl] = useState<string>("");`;

// Add to fetchSettings
const fetchTarget = `            if (data.themeSettings?.fontFamily !== undefined) {
              setFontFamily(data.themeSettings.fontFamily);
            }
          }`;
const fetchReplacement = `            if (data.themeSettings?.fontFamily !== undefined) {
              setFontFamily(data.themeSettings.fontFamily);
            }
            if (data.themeSettings?.logo !== undefined) {
              setLogoUrl(data.themeSettings.logo);
            }
          }`;

// Add to handleSave
const saveTarget = `"themeSettings.fontFamily": fontFamily,`;
const saveReplacement = `"themeSettings.fontFamily": fontFamily,
          "themeSettings.logo": logoUrl,`;

// Update UI
const uiTarget = `<div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-[#16161a]/50 hover:bg-gray-50 dark:hover:bg-[#16161a] transition-colors cursor-pointer group">
                      <Upload className="w-5 h-5 text-gray-400 mb-1 group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-amber-500">Importer un logo</span>
                    </div>`;
const uiReplacement = `<div 
                      className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-[#16161a]/50 hover:bg-gray-50 dark:hover:bg-[#16161a] transition-colors cursor-pointer group relative overflow-hidden"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => setLogoUrl(event.target?.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {logoUrl ? (
                        <div className="w-full flex items-center justify-between">
                           <img src={logoUrl} alt="Logo" className="max-h-12 object-contain" />
                           <button 
                             type="button" 
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogoUrl(""); }}
                             className="text-xs text-red-500 z-10 px-2"
                           >Supprimer</button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400 mb-1 group-hover:text-amber-500 transition-colors" />
                          <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-amber-500">Importer un logo</span>
                        </>
                      )}
                    </div>`;

// Update props to ThemeStorePreview
const propsTarget = `<ThemeStorePreview 
                theme={liveTheme} 
                customStoreName={storeName}`;
const propsReplacement = `<ThemeStorePreview 
                theme={liveTheme} 
                customStoreName={storeName}
                customLogoUrl={logoUrl}`;

code = code.replace(stateTarget, stateReplacement);
code = code.replace(fetchTarget, fetchReplacement);
code = code.replace(saveTarget, saveReplacement);
code = code.replace(uiTarget, uiReplacement);
code = code.replace(propsTarget, propsReplacement);

fs.writeFileSync('src/pages/Customize.tsx', code);
console.log("Updated Customize logo state");
