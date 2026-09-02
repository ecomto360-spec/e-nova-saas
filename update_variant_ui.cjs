const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const swatchOld = `                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariants(prev => ({ ...prev, [v.name]: value }));
                                      if (optObj.image) {
                                        setCurrentProductImage(optObj.image);
                                      }
                                    }}
                                    className={\`relative w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center \${
                                      isSelected ? "border-blue-600 shadow-md transform scale-110" : "border-gray-200 hover:scale-105"
                                    }\`}
                                    style={{ backgroundColor: optObj.colorCode || "#ccc" }}
                                    title={value}
                                  >
                                    {isSelected && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                  </button>`;

const swatchNew = `                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariants(prev => ({ ...prev, [v.name]: value }));
                                      if (optObj.image) {
                                        setCurrentProductImage(optObj.image);
                                      }
                                    }}
                                    className={\`relative overflow-hidden transition-all flex items-center justify-center \${
                                      optObj.hasImageCard && optObj.image 
                                        ? \`w-14 h-14 rounded-lg border-2 \${isSelected ? 'border-amber-500 shadow-md' : 'border-gray-200 hover:border-gray-400'}\` 
                                        : \`w-10 h-10 rounded-full border-2 \${isSelected ? 'border-amber-500 shadow-md transform scale-110' : 'border-gray-200 hover:scale-105'}\`
                                    }\`}
                                    style={!(optObj.hasImageCard && optObj.image) ? { backgroundColor: optObj.colorCode || "#ccc" } : {}}
                                    title={value}
                                  >
                                    {(optObj.hasImageCard && optObj.image) ? (
                                      <img src={optObj.image} alt={value} className="w-full h-full object-cover" />
                                    ) : null}
                                    
                                    {isSelected && !(optObj.hasImageCard && optObj.image) && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                  </button>`;

code = code.replace(swatchOld, swatchNew);
fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Updated variant UI");
