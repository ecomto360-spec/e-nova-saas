const fs = require('fs');
let code = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

const targetInput = `<input 
                        type="color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-gray-500 dark:text-neutral-400">{primaryColor}</span>`;

const repInput = `<input 
                        type="color" 
                        value={primaryColor || "#f59e0b"}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-gray-500 dark:text-neutral-400">{primaryColor || "Non défini"}</span>`;

code = code.replace(targetInput, repInput);

fs.writeFileSync('src/pages/Customize.tsx', code);
console.log("Updated Color Input");
