const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/const \{ tenant \} = useTenant\(\);/g, 'const { tenantData } = useTenant();');
    content = content.replace(/tenant\?\.storeUrl/g, 'tenantData?.storeUrl');
    fs.writeFileSync(filePath, content);
}

fixFile('src/components/layout/Header.tsx');
fixFile('src/pages/Customize.tsx');
console.log("Fixed tenant destructuring");
