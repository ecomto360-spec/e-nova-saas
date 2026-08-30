import { db } from "./src/lib/firebase-backend.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

async function clearCollections() {
  const collections = ["customers", "products", "orders", "categories"];
  
  for (const coll of collections) {
    console.log(`Clearing ${coll}...`);
    const querySnapshot = await getDocs(collection(db, coll));
    for (const document of querySnapshot.docs) {
      await deleteDoc(doc(db, coll, document.id));
    }
    console.log(`Cleared ${coll}!`);
  }
  
  // also clear tenants' products inside their documents?
  const tenantsSnap = await getDocs(collection(db, "tenants"));
  for (const tenantDoc of tenantsSnap.docs) {
    const data = tenantDoc.data();
    if (data.products || data.orders || data.customers) {
       // just remove those fields? The user only sees what's in the actual collections now.
       // actually, the dashboard might read from tenants?
    }
  }

  console.log("Done clearing!");
  process.exit(0);
}

clearCollections().catch(console.error);
