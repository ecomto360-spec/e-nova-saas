const fs = require('fs');
let code = fs.readFileSync('src/components/admin/VariantManager.tsx', 'utf8');

const target = `<label className="flex items-center gap-2 cursor-pointer ml-1">
                        <div className={\`relative inline-flex h-4 w-7 items-center rounded-full transition-colors \${optionData.hasImageCard ? "bg-white" : "bg-neutral-600"}\`} >
                          <span className={\`inline-block h-3 w-3 transform rounded-full bg-black transition-transform \${optionData.hasImageCard ? "translate-x-3.5" : "translate-x-0.5"}\`} />
                        </div>
                        <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                           <ImageIcon className="w-3.5 h-3.5" /> Carte image
                        </span>
                      </label>`;

const replacement = `<label className="flex items-center gap-2 cursor-pointer ml-1">
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={optionData.hasImageCard || false}
                          onChange={() => updateOption(gIdx, oIdx, { hasImageCard: !optionData.hasImageCard })}
                        />
                        <div className={\`relative inline-flex h-4 w-7 items-center rounded-full transition-colors \${optionData.hasImageCard ? "bg-white" : "bg-neutral-600"}\`} >
                          <span className={\`inline-block h-3 w-3 transform rounded-full bg-black transition-transform \${optionData.hasImageCard ? "translate-x-3.5" : "translate-x-0.5"}\`} />
                        </div>
                        <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                           <ImageIcon className="w-3.5 h-3.5" /> Carte image
                        </span>
                      </label>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/admin/VariantManager.tsx', code);
    console.log("Fixed toggle");
} else {
    console.log("Target not found");
}
