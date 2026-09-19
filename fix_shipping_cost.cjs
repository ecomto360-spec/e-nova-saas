const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

if (content.includes('shippingCost: currentWilaya.deliveryCost,')) {
   content = content.replace(
      'shippingCost: currentWilaya.deliveryCost,',
      'shippingCost: deliveryPrice,'
   );
   fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
   console.log("Fixed shippingCost");
} else {
   console.log("Could not find shippingCost: currentWilaya.deliveryCost,");
}
