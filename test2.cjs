const fs = require('fs');
let content = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

if (!content.includes('import { useTenant }')) {
  content = content.replace(
    'export default function StoreSettings() {',
    'import { useTenant } from "../../contexts/TenantContext";\nimport { useAuth } from "../../hooks/useAuth";\nimport { format, differenceInDays } from "date-fns";\nimport { fr } from "date-fns/locale";\nimport { AlertTriangle } from "lucide-react";\n\nexport default function StoreSettings() {'
  );
}

if (!content.includes('const { tenantData, isTrialExpired } = useTenant();')) {
  content = content.replace(
    'export default function StoreSettings() {\n  const [formData, setFormData]',
    'export default function StoreSettings() {\n  const { tenantData, isTrialExpired } = useTenant();\n  const [formData, setFormData]'
  );
}

fs.writeFileSync('src/pages/settings/StoreSettings.tsx', content);
