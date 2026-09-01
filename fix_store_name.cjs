const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const target = `const storeName = customStoreName || theme.nameAr || theme.name || "أزياء الموضة";`;
const replacement = `const storeName = customStoreName !== undefined ? customStoreName : (theme.nameAr || theme.name || "أزياء الموضة");`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Updated ThemeStorePreview");
