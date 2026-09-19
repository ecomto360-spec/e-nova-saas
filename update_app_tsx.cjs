const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('OrderDetails')) {
    content = content.replace(
        'import Orders from "./pages/Orders";',
        'import Orders from "./pages/Orders";\nimport OrderDetails from "./pages/OrderDetails";'
    );
    
    content = content.replace(
        '<Route path="orders" element={<Orders />} />',
        '<Route path="orders" element={<Orders />} />\n                <Route path="orders/:id" element={<OrderDetails />} />'
    );
    
    fs.writeFileSync('src/App.tsx', content);
}
