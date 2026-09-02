const fs = require('fs');
let code = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

const target = `          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.activeTheme) {
              setActiveThemeId(data.activeTheme);
            }
            if (data.storeName) {
              setStoreName(data.storeName);
            }
            if (data.themeSettings?.primaryColor) {
              setPrimaryColor(data.themeSettings.primaryColor);
            }
          }`;

const replacement = `          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.activeTheme) {
              setActiveThemeId(data.activeTheme);
            }
            if (data.storeName !== undefined) {
              setStoreName(data.storeName);
            }
            if (data.themeSettings?.primaryColor !== undefined) {
              setPrimaryColor(data.themeSettings.primaryColor);
            }
            if (data.themeSettings?.fontFamily !== undefined) {
              setFontFamily(data.themeSettings.fontFamily);
            }
          }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Customize.tsx', code);
console.log("Updated Customize fetchSettings");
