const fs = require('fs');

let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

// The issue is that config coming from DB might not have `isActivated: true`, OR it might be missing entirely if not fully saved. 
// However, the `ThemeStorePreview` expects `config={{ ...config, isActivated: true }}` in `Customize.tsx`, but NOT here.
// Let's force it to be activated in StorefrontView as well since we ARE the live store.

content = content.replace(
  /config=\{storeConfig\}/,
  `config={storeConfig ? { ...storeConfig, isActivated: true } : undefined}`
);

fs.writeFileSync('src/pages/StorefrontView.tsx', content);
console.log("Forced isActivated in StorefrontView");
