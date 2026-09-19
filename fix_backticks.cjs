const fs = require('fs');
let content = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

// The file literally contains \` instead of `
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/pages/OrderDetails.tsx', content);
