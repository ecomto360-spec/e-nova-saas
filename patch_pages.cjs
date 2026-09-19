const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPages.tsx', 'utf8');

// Import LandingPagePublicView
code = code.replace(
  'import { ConfirmModal } from "../components/common/ConfirmModal";',
  'import { ConfirmModal } from "../components/common/ConfirmModal";\nimport LandingPagePublicView from "./LandingPagePublicView";'
);

// Replace <LandingPageLiveRenderer with <LandingPagePublicView
// There are two instances: 
// 1: <LandingPageLiveRenderer page={selectedPageForEdit} wilayas={ALGERIAN_WILAYAS} />
// 2: <LandingPageLiveRenderer page={previewPage} wilayas={ALGERIAN_WILAYAS} onOrderPlaced={...} />

// Use regex to replace the component name and map 'page' to 'previewData'
code = code.replace(/<LandingPageLiveRenderer/g, '<LandingPagePublicView');
code = code.replace(/page=\{selectedPageForEdit\}/g, 'previewData={selectedPageForEdit}');
code = code.replace(/page=\{previewPage\}/g, 'previewData={previewPage}');
code = code.replace(/wilayas=\{ALGERIAN_WILAYAS\}/g, ''); // we don't need to pass wilayas, PublicView imports it

// Delete the definition of LandingPageLiveRenderer
const defStart = 'function LandingPageLiveRenderer({ ';
const defRegex = /function LandingPageLiveRenderer\(\{[\s\S]*?\}\) \{\n  const \[selectedWilayaCode[\s\S]*?\n\}\n/;
code = code.replace(defRegex, ''); // Best effort replace... actually it might be safer to manually do it with substring

fs.writeFileSync('src/pages/LandingPages.tsx', code);
