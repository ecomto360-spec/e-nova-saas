const fs = require('fs');

let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

if (!content.includes('useParams')) {
  content = content.replace(
    /import { Link, useNavigate } from "react-router-dom";/,
    `import { Link, useNavigate, useParams } from "react-router-dom";`
  );
}

content = content.replace(
  /export default function StorefrontView\(\) \{/,
  `export default function StorefrontView() {\n  const { storeSlug } = useParams<{ storeSlug: string }>();`
);

const replaceBlock = `
      let targetUserId = user?.uid;
      
      // If a storeSlug is provided in the URL, fetch the tenant by storeUrl (slug)
      if (storeSlug) {
        try {
          const tenantQuery = query(collection(db, "tenants"), where("storeUrl", "==", storeSlug));
          const tenantSnap = await getDocs(tenantQuery);
          if (!tenantSnap.empty) {
            targetUserId = tenantSnap.docs[0].id;
            const data = tenantSnap.docs[0].data();
            if (data.storeName) setStoreName(data.storeName);
            if (data.activeTheme) {
              const found = STORE_THEMES.find(t => t.id === data.activeTheme);
              if (found) setActiveTheme(found);
            }
          }
        } catch (err) {
          console.error("Error fetching tenant by slug:", err);
        }
      }

      if (targetUserId) {
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
          }
              
          // Fetch products
          const prodQuery = query(collection(db, "products"), where("userId", "==", targetUserId));
          const prodSnap = await getDocs(prodQuery);
          const loadedProducts: any[] = [];
          prodSnap.forEach(docSnap => {
            loadedProducts.push({ id: docSnap.id, ...docSnap.data() });
          });
          setActualProducts(loadedProducts);
        } catch (error) {
          console.error("Error loading store configuration:", error);
        }
      } else {
         // If no user and no slug, just show demo mode but without fetching
      }
`;

content = content.replace(
  /if \(user\) \{\s*try \{\s*const docRef = doc\(db, "tenants", user\.uid\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*const data = docSnap\.data\(\);\s*if \(data\.storeName\) setStoreName\(data\.storeName\);\s*if \(data\.activeTheme\) \{\s*const found = STORE_THEMES\.find\(t => t\.id === data\.activeTheme\);\s*if \(found\) setActiveTheme\(found\);\s*\}\s*\}\s*\/\/ Fetch Custom Store Config\s*const confRef = doc\(db, "store_config", user\.uid\);\s*const confSnap = await getDoc\(confRef\);\s*if \(confSnap\.exists\(\)\) \{\s*const confData = confSnap\.data\(\);\s*if \(confData\.activeThemeId\) \{\s*const found = STORE_THEMES\.find\(t => t\.id === confData\.activeThemeId\);\s*if \(found\) setActiveTheme\(found\);\s*\}\s*if \(confData\.config\) \{\s*setStoreConfig\(confData\.config\);\s*\}\s*\}\s*\/\/ Fetch products\s*const prodQuery = query\(collection\(db, "products"\), where\("userId", "==", user\.uid\)\);\s*const prodSnap = await getDocs\(prodQuery\);\s*const loadedProducts: any\[\] = \[\];\s*prodSnap\.forEach\(docSnap => \{\s*loadedProducts\.push\(\{ id: docSnap\.id, \.\.\.docSnap\.data\(\) \}\);\s*\}\);\s*setActualProducts\(loadedProducts\);\s*\} catch \(error\) \{\s*console\.error\("Error loading store configuration:", error\);\s*\}\s*\}/,
  replaceBlock
);

fs.writeFileSync('src/pages/StorefrontView.tsx', content);
console.log("StorefrontView updated with slug support");
