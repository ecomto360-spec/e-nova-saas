const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const target1 = `<h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{storeName}</h1>`;
const rep1 = `{customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-8 sm:max-h-10 object-contain" /> : <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{storeName}</h1>}`;

const target2 = `<h4 className="text-lg font-black text-white">{storeName}</h4>`;
const rep2 = `{customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-8 object-contain" /> : <h4 className="text-lg font-black text-white">{storeName}</h4>}`;

code = code.replace(target1, rep1);
code = code.replace(target2, rep2);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Updated logo in header");
