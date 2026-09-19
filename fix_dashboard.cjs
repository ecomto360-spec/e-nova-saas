const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(/import \{ wipeUserData \} from "\.\.\/lib\/cleanup";/, '');
content = content.replace(/useEffect\(\(\) => \{ if \(user\?\.uid\) \{ wipeUserData\(user\.uid\); \} \}, \[user\]\);/, '');

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Fixed Dashboard.tsx");
