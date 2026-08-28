import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  const tenants = [
    {
      id: "tenant_1",
      storeName: "Mode Paris",
      storeUrl: "mode-paris",
      ownerEmail: "contact@modeparis.fr",
      plan: "Pro",
      status: "active",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "tenant_2",
      storeName: "Tech Store FR",
      storeUrl: "tech-store-fr",
      ownerEmail: "admin@techstore.fr",
      plan: "Standard",
      status: "active",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "tenant_3",
      storeName: "Bio Beauté",
      storeUrl: "bio-beaute",
      ownerEmail: "hello@biobeaute.com",
      plan: "Standard",
      status: "active",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  for (const t of tenants) {
    await setDoc(doc(db, "tenants", t.id), t);
    console.log(`Seeded ${t.storeName}`);
  }
  console.log("Done seeding tenants.");
  process.exit(0);
}

seed().catch(console.error);
