const fs = require('fs');

let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!content.includes('import { useTenant } from')) {
    content = content.replace(
        /import \{ useAuth \} from "\.\.\/\.\.\/hooks\/useAuth";/,
        `import { useAuth } from "../../hooks/useAuth";\nimport { useTenant } from "../../contexts/TenantContext";`
    );
}

if (!content.includes('const { tenant } = useTenant();')) {
    content = content.replace(
        /const \{ user \} = useAuth\(\);/,
        `const { user } = useAuth();\n  const { tenant } = useTenant();`
    );
}

content = content.replace(
    /href="\/store"/,
    `href={tenant?.storeUrl ? \`/store/\${tenant.storeUrl}\` : "/store"}`
);

fs.writeFileSync('src/components/layout/Header.tsx', content);
console.log("Fixed Header.tsx");
