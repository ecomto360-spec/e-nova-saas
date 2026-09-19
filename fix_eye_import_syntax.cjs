const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

// The previous script added Eye without a comma after DollarSign, causing a syntax error.
content = content.replace(
    '  DollarSign\n  Eye\n} from "lucide-react";',
    '  DollarSign,\n  Eye\n} from "lucide-react";'
);
fs.writeFileSync('src/pages/Orders.tsx', content);
console.log("Fixed syntax error in Orders.tsx");
