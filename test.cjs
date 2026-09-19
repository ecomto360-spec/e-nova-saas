const fs = require('fs');
let content = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');
if (!content.includes('const { tenantData, isTrialExpired } = useTenant')) {
   content = content.replace(
        'const { user } = useAuth();',
        'const { user } = useAuth();\n  const { tenantData, isTrialExpired } = useTenant();'
      );
      fs.writeFileSync('src/pages/settings/StoreSettings.tsx', content);
}
