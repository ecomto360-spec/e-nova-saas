const fs = require('fs');

const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to check if we can add a console.log(loaded)
content = content.replace(
  'const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));',
  'const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n        console.log("Dashboard loaded orders:", loaded);'
);

content = content.replace(
  'const currentOrders = orders.filter(o => isWithinInterval(parseOrderDate(o), currentInterval));',
  'const currentOrders = orders.filter(o => { const d = parseOrderDate(o); const inRange = isWithinInterval(d, currentInterval); console.log("Order date:", d, "inRange:", inRange); return inRange; });\n    console.log("Stats calculated, current orders:", currentOrders);'
);

fs.writeFileSync(path, content);
console.log("Added logs to Dashboard");
