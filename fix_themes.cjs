const fs = require('fs');
let code = fs.readFileSync('src/pages/Themes.tsx', 'utf8');

const target = `        await updateDoc(docRef, {
          activeTheme: theme.id,
          activeThemeName: theme.name,
          themeVersion: theme.version || "V2",
          updatedAt: new Date()
        });`;

const replacement = `        // Vider la configuration pour forcer le client à personnaliser le nouveau thème
        await updateDoc(docRef, {
          activeTheme: theme.id,
          activeThemeName: theme.name,
          themeVersion: theme.version || "V2",
          storeName: "", // Blank slate
          themeSettings: {
            primaryColor: "", // Blank slate
            fontFamily: "", // Blank slate
            logo: "" // Blank slate
          },
          updatedAt: new Date()
        });
        
        // Vider aussi le localStorage
        localStorage.removeItem("dzbuild_store_name");`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Themes.tsx', code);
console.log("Updated Themes");
