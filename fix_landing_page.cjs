const fs = require('fs');
let content = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

if (!content.includes('import { isTenantExpired }')) {
  content = content.replace(
    'import { SAMPLE_PRODUCTS, ALGERIAN_WILAYAS, getDefaultSectionsForProduct } from "../data/landingData";',
    'import { SAMPLE_PRODUCTS, ALGERIAN_WILAYAS, getDefaultSectionsForProduct } from "../data/landingData";\nimport { isTenantExpired } from "../lib/checkExpiration";\nimport { StoreUnavailable } from "../components/storefront/StoreUnavailable";'
  );
}

if (!content.includes('const [isExpired, setIsExpired] = useState(false);')) {
  content = content.replace(
    'const [orderReference, setOrderReference] = useState("");',
    'const [orderReference, setOrderReference] = useState("");\n  const [isExpired, setIsExpired] = useState(false);'
  );
}

let newLoad = `        for (const tenantDoc of tenantsSnap.docs) {
          const tData = tenantDoc.data();
          if (tData.landingPages && Array.isArray(tData.landingPages)) {
            const match = tData.landingPages.find((p: LandingPage) => p.slug === slug || p.id === slug);
            if (match) {
              foundPage = match;
              foundTenantId = tenantDoc.id;
              if (isTenantExpired(tData)) {
                 setIsExpired(true);
              }
              break;
            }
          }
        }`;

content = content.replace(
  /for \(const tenantDoc of tenantsSnap\.docs\) \{[\s\S]*?break;\s*\}\s*\}\s*\}/,
  newLoad
);

if (!content.includes('if (isExpired) return <StoreUnavailable />;')) {
  content = content.replace(
    'if (loading) {',
    'if (isExpired) return <StoreUnavailable />;\n\n  if (loading) {'
  );
}

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', content);
