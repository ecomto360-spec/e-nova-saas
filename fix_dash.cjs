const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

if (!content.includes('const { tenantData } = useTenant();') && !content.includes('const { tenantData, isTrialExpired } = useTenant();')) {
  // Try to find useTenant import
  if (!content.includes('import { useTenant }')) {
    content = content.replace(
      'import { useAuth } from "../hooks/useAuth";',
      'import { useAuth } from "../hooks/useAuth";\nimport { useTenant } from "../contexts/TenantContext";'
    );
  }

  // Find the hook declaration
  content = content.replace(
    'const { user } = useAuth();',
    'const { user } = useAuth();\n  const { tenantData, isTrialExpired } = useTenant();'
  );
  
  // also we need to make sure isTrialExpired was removed if it was manually defined?
  // let's see if it's there
} else {
  if (content.includes('const { isTrialExpired } = useTenant();')) {
     content = content.replace(
       'const { isTrialExpired } = useTenant();',
       'const { tenantData, isTrialExpired } = useTenant();'
     );
  }
}

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Fixed dashboard tenantData");
