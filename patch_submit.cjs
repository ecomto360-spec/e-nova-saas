const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

const regex = /const handleCreatePublicOrder = async \(e: FormEvent\) => \{[\s\S]*?setOrderSuccess\(true\);\n\s*setOrderReference\(orderRef\);\n\s*\} catch \(err\) \{/;
let match = code.match(regex);
if (match) {
  let newSubmit = match[0].replace(
    'try {',
    'if (isPreview && onOrderPlaced) {\n      setOrderSuccess(true);\n      setOrderReference("PREVIEW-001");\n      onOrderPlaced({ fullName, phone, total: grandTotal, bundle: selectedBundleId });\n      return;\n    }\n    try {'
  );
  code = code.replace(match[0], newSubmit);
}

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', code);
