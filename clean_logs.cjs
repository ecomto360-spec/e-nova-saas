const fs = require('fs');
let dashContent = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

dashContent = dashContent.replace(
  `const currentOrders = orders.filter(o => { const d = parseOrderDate(o); const inRange = isWithinInterval(d, currentInterval); console.log("Order date:", d, "inRange:", inRange); return inRange; });\n    console.log("Stats calculated, current orders:", currentOrders);`,
  `const currentOrders = orders.filter(o => isWithinInterval(parseOrderDate(o), currentInterval));`
);

fs.writeFileSync('src/pages/Dashboard.tsx', dashContent);
console.log("Cleaned logs");
