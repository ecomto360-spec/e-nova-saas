const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

const regex = /const handleBulkStatusChange = async \(newStatus: OrderStatus, idsToUpdate = selectedIds\) => {[\s\S]*?};/;
const replacement = `const handleBulkStatusChange = async (newStatus: OrderStatus, idsToUpdate = selectedIds) => {
    if (idsToUpdate.length === 0) return;
    try {
      for (const id of idsToUpdate) {
        await updateDoc(doc(db, "orders", id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      }
      setOrders(orders.map(o => idsToUpdate.includes(o.id) ? { ...o, status: newStatus } : o));
      showToast(\`\${idsToUpdate.length} commande(s) marquée(s) comme "\${newStatus}"\`);
      if (idsToUpdate === selectedIds) setSelectedIds([]);
    } catch (err) {
      console.error("Error updating bulk status:", err);
      showToast("Erreur lors de la mise à jour groupée", "error");
    }
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Orders.tsx', content);
