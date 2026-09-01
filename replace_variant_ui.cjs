const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

const importTarget = `import { ConfirmModal } from "../components/common/ConfirmModal";`;
const importReplacement = `import { ConfirmModal } from "../components/common/ConfirmModal";\nimport { VariantManager } from "../components/admin/VariantManager";`;
code = code.replace(importTarget, importReplacement);

// Let's remove handleAddVariant and handleRemoveVariant and the related state
// First let's find the Exact block of handleAddVariant

const methodsTarget = `  const handleAddVariant = () => {
    if (!variantInputName.trim() || !variantInputOptions.trim()) return;
    const options = variantInputOptions.split(",").map(o => o.trim()).filter(Boolean);
    if (options.length === 0) return;

    setFormVariants([...formVariants, { name: variantInputName.trim(), options }]);
    setVariantInputName("");
    setVariantInputOptions("");
  };

  const handleRemoveVariant = (idx: number) => {
    setFormVariants(formVariants.filter((_, i) => i !== idx));
  };`;
code = code.replace(methodsTarget, "");

// Replace the UI
const uiTarget = `              <p className="text-xs text-neutral-500 flex items-start gap-1 mb-6"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Ajoutez des groupes de variantes comme : couleurs, tailles, capacité... Le client doit choisir une option de chaque groupe</p>
              
              <div className="space-y-4">
                {formVariants.map((variant, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[#16161a] border border-neutral-800">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{variant.name}</span>
                        <button type="button" onClick={() => handleRemoveVariant(idx)} className="text-neutral-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variant.options.map((opt, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300">{opt}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-800 bg-[#16161a]">
                  <input type="text" placeholder="Type (ex: Couleur, Taille, Poids)" value={variantInputName} onChange={(e) => setVariantInputName(e.target.value)} className="w-1/3 rounded-lg border border-neutral-700 bg-[#1e1e24] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500" />
                  <input type="text" placeholder="Ex: Rouge, Bleu, XL (séparées par virgules)" value={variantInputOptions} onChange={(e) => setVariantInputOptions(e.target.value)} className="flex-1 rounded-lg border border-neutral-700 bg-[#1e1e24] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500" />
                  <button type="button" onClick={handleAddVariant} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors">+ Ajouter</button>
                </div>
              </div>`;

const uiReplacement = `              <p className="text-xs text-neutral-500 flex items-start gap-1 mb-6"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Ajoutez des groupes de variantes comme : couleurs, tailles, capacité... Le client doit choisir une option de chaque groupe</p>
              
              <VariantManager variants={formVariants} onChange={setFormVariants} />`;

code = code.replace(uiTarget, uiReplacement);

const buttonTarget = `                <button type="button" onClick={handleAddVariant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-600 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" /> Ajouter un groupe
                </button>`;
const buttonReplacement = `                <button type="button" onClick={() => setFormVariants([...formVariants, { name: "", type: "text", options: [] }])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-600 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" /> Ajouter un groupe
                </button>`;

code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/pages/Products.tsx', code);
