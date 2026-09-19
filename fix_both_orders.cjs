const fs = require('fs');

// Fix Orders.tsx
let ordersContent = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

// Replace loadOrders
const oldLoadOrders = `  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const loaded: OrderItem[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          ...data
        } as OrderItem);
      });

      // sort locally since we don't have a complex index right now
      loaded.sort((a, b) => {
        const da = a.createdAt?.toMillis?.() || 0;
        const db = b.createdAt?.toMillis?.() || 0;
        return db - da;
      });

      setOrders(loaded);
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    } finally {
      setLoading(false);
    }
  };`;

const newLoadOrders = `  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const loaded: OrderItem[] = [];
      
      // Fetch from global orders
      const qGlobal = query(collection(db, "orders"), where("userId", "==", user.uid));
      const snapshotGlobal = await getDocs(qGlobal);
      snapshotGlobal.forEach(docSnap => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as OrderItem);
      });

      // Fetch from tenant orders (Landing Pages)
      const qTenant = query(collection(db, "tenants", user.uid, "orders"));
      const snapshotTenant = await getDocs(qTenant);
      snapshotTenant.forEach(docSnap => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as OrderItem);
      });

      // sort locally
      loaded.sort((a, b) => {
        const da = (a.createdAt || a.created_at)?.toMillis?.() || 0;
        const db = (b.createdAt || b.created_at)?.toMillis?.() || 0;
        return db - da;
      });

      // Remove duplicates by ID just in case
      const uniqueOrders = Array.from(new Map(loaded.map(item => [item.id, item])).values());
      
      setOrders(uniqueOrders);
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    } finally {
      setLoading(false);
    }
  };`;

ordersContent = ordersContent.replace(oldLoadOrders, newLoadOrders);
fs.writeFileSync('src/pages/Orders.tsx', ordersContent);

// Fix Dashboard.tsx
let dashContent = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dashContent = dashContent.replace(
  `        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Dashboard loaded orders:", loaded);
        setOrders(loaded);`,
  `        const qGlobal = query(collection(db, "orders"), where("userId", "==", user.uid));
        const snapGlobal = await getDocs(qGlobal);
        const ordersGlobal = snapGlobal.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const qTenant = query(collection(db, "tenants", user.uid, "orders"));
        const snapTenant = await getDocs(qTenant);
        const ordersTenant = snapTenant.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allOrders = Array.from(new Map([...ordersGlobal, ...ordersTenant].map(item => [item.id, item])).values());
        setOrders(allOrders);`
);

dashContent = dashContent.replace(
  `const parseOrderDate = (order: any) => {
  if (order.createdAt?.toDate) {
    return order.createdAt.toDate();
  }
  if (order.date) {
    const [datePart, timePart] = order.date.split(' ');
    if (datePart && timePart) {
      const [d, m, y] = datePart.split('/');
      const [h, min] = timePart.split(':');
      return new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min));
    }
  }
  return new Date();
};`,
  `const parseOrderDate = (order: any) => {
  const timestamp = order.created_at || order.createdAt;
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (order.date && typeof order.date === 'string') {
    // try to parse ISO string first
    if (order.date.includes('T')) {
      return new Date(order.date);
    }
    const [datePart, timePart] = order.date.split(' ');
    if (datePart && timePart) {
      const [d, m, y] = datePart.split('/');
      const [h, min] = timePart.split(':');
      if (d && m && y && h && min) {
        return new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min));
      }
    }
  }
  return new Date();
};`
);

fs.writeFileSync('src/pages/Dashboard.tsx', dashContent);

console.log("Updated both Dashboard and Orders to fetch from both collections, and fixed date parsing.");
