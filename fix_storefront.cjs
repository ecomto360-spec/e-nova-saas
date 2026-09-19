const fs = require('fs');
let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

if (!content.includes('import { isTenantExpired }')) {
  content = content.replace(
    'import { StoreCustomizerConfig, defaultStoreConfig } from "../components/admin/StoreCustomizerConfig";',
    'import { StoreCustomizerConfig, defaultStoreConfig } from "../components/admin/StoreCustomizerConfig";\nimport { isTenantExpired } from "../lib/checkExpiration";\nimport { StoreUnavailable } from "../components/storefront/StoreUnavailable";'
  );
}

if (!content.includes('const [isExpired, setIsExpired] = useState(false);')) {
  content = content.replace(
    'const [storeConfig, setStoreConfig] = useState<StoreCustomizerConfig | undefined>(undefined);',
    'const [storeConfig, setStoreConfig] = useState<StoreCustomizerConfig | undefined>(undefined);\n  const [isExpired, setIsExpired] = useState(false);'
  );
}

// In the loadStoreSettings function:
let newLoad = `      if (storeSlug) {
        try {
          const tenantQuery = query(collection(db, "tenants"), where("storeUrl", "==", storeSlug));
          const tenantSnap = await getDocs(tenantQuery);
          if (!tenantSnap.empty) {
            targetUserId = tenantSnap.docs[0].id;
            const data = tenantSnap.docs[0].data();
            if (isTenantExpired(data)) {
               setIsExpired(true);
            }
            if (data.storeName) setStoreName(data.storeName);
            if (data.activeTheme) {
              const found = STORE_THEMES.find(t => t.id === data.activeTheme);
              if (found) setActiveTheme(found);
            }
          }
        } catch (err) {
          console.error("Error fetching tenant by slug:", err);
        }
      }`;

content = content.replace(
  /if \(storeSlug\) \{[\s\S]*?console\.error\("Error fetching tenant by slug:", err\);\s*\}\s*\}/,
  newLoad
);

// We should also check the fallback tenant fetch if storeSlug was not provided (accessed via /storefront in admin)
// Wait, if accessed from admin, the targetUserId is just uid. We should fetch the tenant doc and check.
let adminFetch = `// Fallback to tenant doc if no config
             const tRef = doc(db, "tenants", targetUserId);
             const tSnap = await getDoc(tRef);
             if (tSnap.exists()) {
               const data = tSnap.data();
               if (isTenantExpired(data) && !window.location.pathname.startsWith('/admin')) {
                  setIsExpired(true);
               }
               if (data.storeName) setStoreName(data.storeName);
             }`;

content = content.replace(
  /\/\/ Fallback to tenant doc if no config[\s\S]*?if \(data\.storeName\) setStoreName\(data\.storeName\);\s*\}/,
  adminFetch
);

if (!content.includes('if (isExpired) return <StoreUnavailable />;')) {
  content = content.replace(
    'if (loading) {',
    'if (isExpired) return <StoreUnavailable />;\n\n  if (loading) {'
  );
}

fs.writeFileSync('src/pages/StorefrontView.tsx', content);
