const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

content = content.replace(
  'alert("Une erreur est survenue lors de la confirmation de votre commande. Veuillez réessayer.");',
  'alert(`Une erreur est survenue lors de la confirmation de votre commande. Veuillez réessayer. Erreur: ${error.message}`);'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
