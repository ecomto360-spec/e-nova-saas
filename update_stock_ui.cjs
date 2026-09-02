const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

const target = `                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors \${formFragile`;

const replacement = `                </div>
                {formTrackStock && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                      Quantité disponible
                    </label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700 bg-[#1e1e24] px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors \${formFragile`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Products.tsx', code);
