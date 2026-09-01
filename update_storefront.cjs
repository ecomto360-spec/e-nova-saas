const fs = require('fs');

let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

// 1. Add currentProductImage state
code = code.replace(
  'const [selectedProduct, setSelectedProduct] = useState<StoreDemoProduct | null>(null);',
  `const [selectedProduct, setSelectedProduct] = useState<StoreDemoProduct | null>(null);
  const [currentProductImage, setCurrentProductImage] = useState<string>("");`
);

// 2. Set it in handleOpenProduct
code = code.replace(
  'setSelectedProduct(product);',
  `setSelectedProduct(product);
    setCurrentProductImage(product.image);`
);

// 3. Update the modal layout to max-w-4xl and split into 2 columns
const modalStartOld = `<div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">`;
const modalStartNew = `<div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col">`;
code = code.replace(modalStartOld, modalStartNew);

// 4. Update the Modal Body to be a grid
const formStartOld = `<form onSubmit={handleOrderSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* Product Summary Row */}
                <div className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 items-start sm:items-center flex-col sm:flex-row">
                  <div className="flex gap-4 items-center w-full sm:w-auto">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex-1 text-right">
                      <h4 className="font-bold text-sm text-gray-900 line-clamp-2">{selectedProduct.nameAr || selectedProduct.name}</h4>
                      <RenderStars count={selectedProduct.rating} reviewsCount={selectedProduct.reviewsCount} />
                      <div className="flex items-baseline justify-end gap-2 mt-1">
                        <span className="text-base font-black text-amber-600">{selectedProduct.price.toLocaleString()} د.ج</span>
                        {selectedProduct.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">{selectedProduct.originalPrice.toLocaleString()} د.ج</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Description */}`;

const formStartNew = `<form onSubmit={handleOrderSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  {/* Left Column: Image Gallery */}
                  <div className="space-y-4">
                    <div className="relative aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                      <img 
                        src={currentProductImage || selectedProduct.image} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover object-center"
                      />
                      {/* Optional Badge */}
                    </div>
                    {/* Thumbnails */}
                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {[selectedProduct.image, ...selectedProduct.images].filter((v, i, a) => a.indexOf(v) === i).map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentProductImage(img)}
                            className={\`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all \${currentProductImage === img ? 'border-amber-500' : 'border-gray-200 hover:border-gray-400'}\`}
                          >
                            <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Details & Form */}
                  <div className="space-y-6">
                    <div className="text-right">
                      <h4 className="font-black text-2xl text-gray-900 mb-2">{selectedProduct.nameAr || selectedProduct.name}</h4>
                      <RenderStars count={selectedProduct.rating} reviewsCount={selectedProduct.reviewsCount} />
                      <div className="flex items-baseline justify-end gap-3 mt-4">
                        <span className="text-3xl font-black text-amber-600">{selectedProduct.price.toLocaleString()} د.ج</span>
                        {selectedProduct.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">{selectedProduct.originalPrice.toLocaleString()} د.ج</span>
                        )}
                      </div>
                    </div>

                    {/* Product Description */}`;

code = code.replace(formStartOld, formStartNew);

// Close the grid div before the end of the form
code = code.replace(
  '              </form>',
  `                  </div>
                </div>
              </form>`
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Updated ThemeStorePreview.tsx grid layout");
