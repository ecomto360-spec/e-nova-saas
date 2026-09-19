const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

// Fix quantity text color from text-white to text-gray-900 so it's visible on white/gray backgrounds
content = content.replace(
  '<span className="w-8 text-center font-bold text-lg text-white">{quantity}</span>',
  '<span className="w-8 text-center font-bold text-lg text-gray-900">{quantity}</span>'
);

content = content.replace(
  '<span className="font-bold text-lg text-white">{quantity}</span>',
  '<span className="font-bold text-lg text-gray-900">{quantity}</span>'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
console.log("Updated quantity text color");
