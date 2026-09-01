const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const target = `    const initialVariants: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach(v => {
        initialVariants[v.name] = v.options[0];
      });
    }`;

const replacement = `    const initialVariants: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach(v => {
        if (v.options && v.options.length > 0) {
          const firstOpt = v.options[0];
          initialVariants[v.name] = typeof firstOpt === 'string' ? firstOpt : firstOpt.value;
        }
      });
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Initial variants updated!");
