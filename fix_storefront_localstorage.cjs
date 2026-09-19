const fs = require('fs');

let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

// The issue is that the code fetches localStorage FIRST and sets the theme/name based on that, 
// which is for the currently logged in admin user! 
// We should ONLY use localStorage for local state if there's no URL param, OR better yet, let's just strip localStorage from StorefrontView entirely 
// because it's meant to be a public view and should always read from DB.

content = content.replace(
  /const cachedThemeId = localStorage\.getItem\("dzbuild_active_theme"\);\s*const cachedStoreName = localStorage\.getItem\("dzbuild_store_name"\);\s*if \(cachedStoreName\) \{\s*setStoreName\(cachedStoreName\);\s*\}\s*if \(cachedThemeId\) \{\s*const found = STORE_THEMES\.find\(t => t\.id === cachedThemeId\);\s*if \(found\) setActiveTheme\(found\);\s*\}/,
  `// Removed localStorage cache that was overriding live DB data`
);

// We should also make sure useEffect re-runs when storeSlug changes
content = content.replace(
  /  \}, \[\]\);/g,
  `  }, [storeSlug]);`
);

fs.writeFileSync('src/pages/StorefrontView.tsx', content);
console.log("StorefrontView localStorage bug fixed");
