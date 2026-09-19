const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

if (content.includes('productId: selectedProduct.id,')) {
   content = content.replace(
      'productId: selectedProduct.id,',
      'productId: selectedProduct.id || "demo-product",'
   );
   fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
   console.log("Fixed productId");
} else {
   console.log("Could not find productId: selectedProduct.id,");
}
