const fs = require('fs');

let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

code = code.replace(
  'image: formImage.trim(),',
  'image: formImages[0] || "",\n        images: formImages,'
);

code = code.replace(
  'image: formImage.trim(),',
  'image: formImages[0] || "",\n            images: formImages,'
);

fs.writeFileSync('src/pages/Products.tsx', code);
console.log("Updated Products.tsx");
