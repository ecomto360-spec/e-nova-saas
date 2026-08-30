import { adminDb } from "./src/lib/firebase-admin.js";

async function clearCollections() {
  const collections = ["customers", "products", "orders", "categories", "landing_pages"];
  
  for (const coll of collections) {
    console.log(`Clearing ${coll}...`);
    const querySnapshot = await adminDb.collection(coll).get();
    const batch = adminDb.batch();
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (querySnapshot.docs.length > 0) {
      await batch.commit();
      console.log(`Cleared ${querySnapshot.docs.length} docs from ${coll}!`);
    } else {
      console.log(`${coll} is already empty.`);
    }
  }
  console.log("Done clearing!");
  process.exit(0);
}

clearCollections().catch(console.error);
