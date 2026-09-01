const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const target = `                {/* Variants Selection */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-3">
                    {selectedProduct.variants.map((v) => (
                      <div key={v.name} className="text-right">
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">{v.name}</label>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                              className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all \${
                                selectedVariants[v.name] === opt
                                  ? "bg-amber-500 text-black ring-2 ring-amber-500 shadow-sm"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              }\`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}`;

const replacement = `                {/* Variants Selection */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-4">
                    {selectedProduct.variants.map((v) => (
                      <div key={v.name} className="text-right flex flex-col items-end">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-2">
                          <span className="text-red-500">*</span> {v.name}
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                          {v.options.map((optObj, idx) => {
                            const isString = typeof optObj === 'string';
                            const value = isString ? optObj : (optObj.value || "");
                            const priceDiff = !isString && optObj.priceDiff ? optObj.priceDiff : 0;
                            const isSelected = selectedVariants[v.name] === value;
                            
                            if (!isString && (v.type === 'color' || v.type === 'image_text')) {
                              // Color Swatch or Image Card
                              return (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: value }))}
                                    className={\`relative w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center \${
                                      isSelected ? "border-blue-600 shadow-md transform scale-110" : "border-gray-200 hover:scale-105"
                                    }\`}
                                    style={{ backgroundColor: optObj.colorCode || "#ccc" }}
                                    title={value}
                                  >
                                    {isSelected && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                  </button>
                                  {priceDiff > 0 && (
                                    <span className="text-[10px] font-bold text-white bg-green-500 px-1.5 rounded-full mt-1">
                                      +{priceDiff} دج
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-500">{value}</span>
                                </div>
                              );
                            }
                            
                            // Text or default button
                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: value }))}
                                className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 \${
                                  isSelected
                                    ? "bg-[#1c192b] text-white shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }\`}
                              >
                                {priceDiff > 0 && (
                                  <span className="text-[10px] font-bold text-white bg-green-500 px-1.5 rounded flex items-center">
                                    +{priceDiff} دج
                                  </span>
                                )}
                                <span>{value}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
  console.log("Storefront variants updated!");
} else {
  console.log("Target not found!");
}
