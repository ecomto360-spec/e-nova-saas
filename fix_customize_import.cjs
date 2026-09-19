const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

// If useTenant is not imported, add it
if (!content.includes('import { useTenant } from')) {
    content = content.replace(
        /import \{ auth, db, storage \} from "\.\.\/lib\/firebase";/,
        `import { auth, db, storage } from "../lib/firebase";\nimport { useTenant } from "../contexts/TenantContext";`
    );
}

fs.writeFileSync('src/pages/Customize.tsx', content);
console.log("Fixed Customize.tsx import");
