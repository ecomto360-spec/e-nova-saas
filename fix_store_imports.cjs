const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const missingIcons = ['Copy', 'Box', 'Package', 'Clipboard'];
for (const icon of missingIcons) {
  if (!content.includes(icon + ',')) {
     content = content.replace('Image as ImageIcon', `Image as ImageIcon,\n  ${icon}`);
  }
}

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
console.log("Fixed missing imports");
