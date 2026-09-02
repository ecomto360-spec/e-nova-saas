const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf-8');

content = content.replace(
  'import { StoreTheme } from "../../data/themesData";',
  'import { StoreTheme } from "../../data/themesData";\nimport { StoreCustomizerConfig } from "../admin/StoreCustomizerConfig";'
);

content = content.replace(
  'interface ThemeStorePreviewProps {',
  `interface ThemeStorePreviewProps {
  config?: StoreCustomizerConfig;`
);

content = content.replace(
  'export function ThemeStorePreview({ theme, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts, currentView = "home", onSectionSelect }: ThemeStorePreviewProps) {',
  'export function ThemeStorePreview({ theme, config, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts, currentView = "home", onSectionSelect }: ThemeStorePreviewProps) {'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
