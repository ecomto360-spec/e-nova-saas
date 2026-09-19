const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

code = code.replace(
  'export default function LandingPagePublicView() {',
  'interface Props { previewData?: LandingPage; onOrderPlaced?: (order: any) => void; }\n\nexport default function LandingPagePublicView({ previewData, onOrderPlaced }: Props = {}) {'
);

code = code.replace(
  'const { slug } = useParams<{ slug: string }>();',
  'const { slug } = useParams<{ slug: string }>();\n  const isPreview = !!previewData;'
);

code = code.replace(
  'useEffect(() => {\n    async function loadLandingPage() {',
  'useEffect(() => {\n    if (isPreview) {\n      setPage(previewData);\n      setLoading(false);\n      return;\n    }\n    async function loadLandingPage() {'
);

// We should also replace the form submit to use onOrderPlaced if in preview mode.
const submitStart = 'const handleSubmitOrder = async (e: FormEvent) => {';
const submitEnd = 'setOrderSuccess(true);\n      setOrderReference(orderRef);\n    } catch (err) {';
const submitRegex = /const handleSubmitOrder = async \(e: FormEvent\) => \{[\s\S]*?setOrderSuccess\(true\);\n\s*setOrderReference\(orderRef\);\n\s*\} catch \(err\) \{/;

let match = code.match(submitRegex);
if (match) {
  let newSubmit = match[0].replace(
    'try {',
    'if (isPreview && onOrderPlaced) {\n      setOrderSuccess(true);\n      setOrderReference("PREVIEW-001");\n      onOrderPlaced({ fullName, phone, wilaya: curWilaya.name, total: grandTotal, bundle: selectedBundleId });\n      return;\n    }\n    try {'
  );
  code = code.replace(match[0], newSubmit);
}

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', code);
