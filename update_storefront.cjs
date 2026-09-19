const fs = require('fs');
let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

if (!content.includes('const [tenantId, setTenantId] = useState<string>("");')) {
  content = content.replace(
    'const [isExpired, setIsExpired] = useState(false);',
    'const [isExpired, setIsExpired] = useState(false);\n  const [tenantId, setTenantId] = useState<string>("");'
  );
}

if (!content.includes('setTenantId(targetUserId);')) {
  content = content.replace(
    'const tRef = doc(db, "tenants", targetUserId);',
    'const tRef = doc(db, "tenants", targetUserId);\n          setTenantId(targetUserId);'
  );
}

if (!content.includes('tenantId={tenantId}')) {
  content = content.replace(
    'actualCategories={actualCategories}',
    'actualCategories={actualCategories}\n          tenantId={tenantId}'
  );
}

fs.writeFileSync('src/pages/StorefrontView.tsx', content);
