const fs = require('fs');

let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

const oldBlock = `      if (targetUserId) {
        try {
          // Fetch Custom Store Config
          const confRef = doc(db, "store_config", targetUserId);
          const confSnap = await getDoc(confRef);
          if (confSnap.exists()) {
            const confData = confSnap.data();
            if (confData.activeThemeId) {
              const found = STORE_THEMES.find(t => t.id === confData.activeThemeId);
              if (found) setActiveTheme(found);
            }
            if (confData.config) {
              setStoreConfig(confData.config);
            }
          } else {
             // Fallback to tenant doc if no config
             const tRef = doc(db, "tenants", targetUserId);
             const tSnap = await getDoc(tRef);
             if (tSnap.exists()) {
               const data = tSnap.data();
               if (data.storeName) setStoreName(data.storeName);
               if (data.activeTheme) {
                 const found = STORE_THEMES.find(t => t.id === data.activeTheme);
                 if (found) setActiveTheme(found);
               }
             }
          }`;

const newBlock = `      if (targetUserId) {
        try {
          // ALWAYS fetch tenant doc to check expiration
          const tRef = doc(db, "tenants", targetUserId);
          const tSnap = await getDoc(tRef);
          if (tSnap.exists()) {
             const data = tSnap.data();
             if (isTenantExpired(data)) {
                 setIsExpired(true);
             }
             if (data.storeName) setStoreName(data.storeName);
             if (data.activeTheme) {
                 const found = STORE_THEMES.find(t => t.id === data.activeTheme);
                 if (found) setActiveTheme(found);
             }
          }

          // Fetch Custom Store Config
          const confRef = doc(db, "store_config", targetUserId);
          const confSnap = await getDoc(confRef);
          if (confSnap.exists()) {
            const confData = confSnap.data();
            if (confData.activeThemeId) {
              const found = STORE_THEMES.find(t => t.id === confData.activeThemeId);
              if (found) setActiveTheme(found);
            }
            if (confData.config) {
              setStoreConfig(confData.config);
            }
          }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/pages/StorefrontView.tsx', content);
console.log("Updated StorefrontView expiration check");
