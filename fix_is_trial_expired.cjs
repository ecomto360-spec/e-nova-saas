const fs = require('fs');
let content = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

content = content.replace(
  'const { tenantData, isTrialExpired } = useTenant();',
  'const { tenantData, isTrialExpired } = useTenant() || { tenantData: null, isTrialExpired: false };'
);

// We should also check if it's imported at the top, but the sed script before replaced it. Let's make absolutely sure.
if (content.includes('const { tenantData } = useTenant();') && !content.includes('isTrialExpired')) {
  content = content.replace('const { tenantData } = useTenant();', 'const { tenantData, isTrialExpired } = useTenant();');
}

// In case the replacement failed in the previous step because of exact matching.
if (content.includes('const { user } = useAuth();\n  const { tenantData, isTrialExpired } = useTenant();')) {
    // it was already there
} else if (!content.includes('useTenant()')) {
    content = content.replace(
        'const { user } = useAuth();',
        'const { user } = useAuth();\n  const { tenantData, isTrialExpired } = useTenant();'
      );
}


fs.writeFileSync('src/pages/settings/StoreSettings.tsx', content);
