const fs = require('fs');
let content = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

if (!content.includes('setDoc')) {
  content = content.replace(
    'import { doc, getDoc, updateDoc } from "firebase/firestore";',
    'import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";'
  );
}

const oldUpdate = `  const handleUpdateStatus = async () => {
    if (!user || !id) return;
    try {
      const orderRef = doc(db, "tenants", user.uid, "orders", id);
      await updateDoc(orderRef, { status });
      const globalOrderRef = doc(db, "orders", id);
      await updateDoc(globalOrderRef, { status });
      setOrder((prev: any) => ({ ...prev, status }));
      alert("Statut mis à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };`;

const newUpdate = `  const handleUpdateStatus = async () => {
    if (!user || !id) return;
    try {
      // Check if global exists
      const globalOrderRef = doc(db, "orders", id);
      const globalOrderSnap = await getDoc(globalOrderRef);
      
      const orderRef = doc(db, "tenants", user.uid, "orders", id);
      const orderSnap = await getDoc(orderRef);
      
      if (globalOrderSnap.exists()) {
         await updateDoc(globalOrderRef, { status });
      }
      
      if (orderSnap.exists()) {
         await updateDoc(orderRef, { status });
      } else if (!globalOrderSnap.exists()) {
         // If neither exist, something is wrong
         console.warn("Order not found in either collection for update");
      }
      
      setOrder((prev: any) => ({ ...prev, status }));
      alert("Statut mis à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };`;

content = content.replace(oldUpdate, newUpdate);
fs.writeFileSync('src/pages/OrderDetails.tsx', content);
