const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

// Do the same for Customize.tsx's link
if (content.includes("useTenant")) {
   // Already has it?
} else {
   content = content.replace(
      /import \{ auth, db \} from "\.\.\/lib\/firebase";/,
      `import { auth, db } from "../lib/firebase";\nimport { useTenant } from '../contexts/TenantContext';`
   );
   
   content = content.replace(
      /export default function Customize\(\) \{/,
      `export default function Customize() {\n  const { tenant } = useTenant();`
   );
}

content = content.replace(
   /href="\/store"/,
   `href={tenant?.storeUrl ? \`/store/\${tenant.storeUrl}\` : "/store"}`
);

fs.writeFileSync('src/pages/Customize.tsx', content);
console.log("Customize link updated with slug");
