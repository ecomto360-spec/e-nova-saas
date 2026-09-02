const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const targetProps = `interface ThemeStorePreviewProps {
  theme: StoreTheme;
  customStoreName?: string;
  isStandaloneView?: boolean;
  actualProducts?: any[];
}`;

const repProps = `interface ThemeStorePreviewProps {
  theme: StoreTheme;
  customStoreName?: string;
  customLogoUrl?: string;
  isStandaloneView?: boolean;
  actualProducts?: any[];
}`;

const targetComp = `export function ThemeStorePreview({ theme, customStoreName, isStandaloneView = false, actualProducts }: ThemeStorePreviewProps) {`;
const repComp = `export function ThemeStorePreview({ theme, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts }: ThemeStorePreviewProps) {`;

const targetHeader = `<span className="font-bold tracking-tight text-white">{storeName}</span>`;
const repHeader = `{customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-6" /> : <span className="font-bold tracking-tight text-white">{storeName}</span>}`;

const targetHeaderAlt = `<span className="font-bold tracking-tight text-xl">{storeName}</span>`;
const repHeaderAlt = `{customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-8" /> : <span className="font-bold tracking-tight text-xl">{storeName}</span>}`;

const targetHeaderAlt2 = `<span className="font-black text-xl tracking-tight text-indigo-900">{storeName}</span>`;
const repHeaderAlt2 = `{customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-8" /> : <span className="font-black text-xl tracking-tight text-indigo-900">{storeName}</span>}`;

code = code.replace(targetProps, repProps);
code = code.replace(targetComp, repComp);
code = code.replace(targetHeader, repHeader);
code = code.replace(targetHeaderAlt, repHeaderAlt);
code = code.replace(targetHeaderAlt2, repHeaderAlt2);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Updated ThemeStorePreview logo prop");
