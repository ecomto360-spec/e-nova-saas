const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

content = content.replace(
  /\(actualProducts && actualProducts\.length > 0 \? actualProducts : theme\.products\)/g,
  '(actualProducts ? actualProducts : theme.products)'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
