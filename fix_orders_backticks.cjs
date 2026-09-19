const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

// Also orders table rows had \`
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/pages/Orders.tsx', content);
