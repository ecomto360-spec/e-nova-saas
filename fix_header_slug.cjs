const fs = require('fs');

let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// The header link needs the ACTUAL slug of the current user to form `/store/SLUG`, not just `/store`. 
// Otherwise it falls back to auth.uid in StorefrontView, which IS NOT the slug.
// We need to fetch the slug from tenant context if available. Let's see if we have access to it.

if (content.includes("useTenant")) {
   // Already has it?
} else {
   content = content.replace(
      /import \{ useAuth \} from '\.\.\/\.\.\/contexts\/AuthContext';/,
      `import { useAuth } from '../../contexts/AuthContext';\nimport { useTenant } from '../../contexts/TenantContext';`
   );
   
   content = content.replace(
      /const \{ user, logout \} = useAuth\(\);/,
      `const { user, logout } = useAuth();\n  const { tenant } = useTenant();`
   );
   
   content = content.replace(
      /href="\/store"/,
      `href={tenant?.storeUrl ? \`/store/\${tenant.storeUrl}\` : "/store"}`
   );
}

fs.writeFileSync('src/components/layout/Header.tsx', content);
console.log("Header link updated with slug");
