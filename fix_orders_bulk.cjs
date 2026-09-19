const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

content = content.replace(
  'const handleBulkStatusChange = async (newStatus: OrderStatus) => {',
  'const handleBulkStatusChange = async (newStatus: OrderStatus, idsToUpdate = selectedIds) => {'
);

content = content.replace(
  '    if (selectedIds.length === 0) return;',
  '    if (idsToUpdate.length === 0) return;'
);

content = content.replace(
  '      for (const id of selectedIds) {',
  '      for (const id of idsToUpdate) {'
);

content = content.replace(
  '      setOrders(orders.map(o => selectedIds.includes(o.id) ? { ...o, status: newStatus } : o));\n      showToast(`${selectedIds.length} commande(s) marquée(s) comme "${newStatus}"`);\n      setSelectedIds([]);',
  '      setOrders(orders.map(o => idsToUpdate.includes(o.id) ? { ...o, status: newStatus } : o));\n      showToast(`${idsToUpdate.length} commande(s) marquée(s) comme "${newStatus}"`);\n      if (idsToUpdate === selectedIds) setSelectedIds([]);'
);

fs.writeFileSync('src/pages/Orders.tsx', content);
