const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

// Update Interface
content = content.replace(
  'interface ThemeStorePreviewProps {\n  theme: StoreTheme;\n  customStoreName?: string;\n  isStandaloneView?: boolean;\n}',
  'interface ThemeStorePreviewProps {\n  theme: StoreTheme;\n  customStoreName?: string;\n  isStandaloneView?: boolean;\n  actualProducts?: any[];\n}'
);

// Update destructuring
content = content.replace(
  'export function ThemeStorePreview({ theme, customStoreName, isStandaloneView = false }: ThemeStorePreviewProps) {',
  'export function ThemeStorePreview({ theme, customStoreName, isStandaloneView = false, actualProducts }: ThemeStorePreviewProps) {'
);

// Use actualProducts instead of theme.products
content = content.replace(
  /theme\.products/g,
  '(actualProducts && actualProducts.length > 0 ? actualProducts : theme.products)'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
