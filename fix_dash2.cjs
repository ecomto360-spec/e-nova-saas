const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The replacement above caused a duplicate definition
content = content.replace(
  'const { tenantData, isTrialExpired } = useTenant(); \n  const { isTrialExpired } = useTenant();',
  'const { tenantData, isTrialExpired } = useTenant();'
);

content = content.replace(
  'const { tenantData, isTrialExpired } = useTenant();\n  const { isTrialExpired } = useTenant();',
  'const { tenantData, isTrialExpired } = useTenant();'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Fixed duplicate useTenant");
