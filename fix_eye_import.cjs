const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

if (!content.includes('Eye,')) {
    content = content.replace(
        '} from "lucide-react";',
        '  Eye\n} from "lucide-react";'
    );
    fs.writeFileSync('src/pages/Orders.tsx', content);
    console.log("Added Eye import to Orders.tsx");
} else {
    console.log("Eye already imported");
}
