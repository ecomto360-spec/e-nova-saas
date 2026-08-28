import { db } from "./src/lib/firebase-backend.js";
import { collection, doc, setDoc } from "firebase/firestore";
import crypto from "crypto";

async function seed() {
  const tenants = [
    {
      id: crypto.randomUUID(),
      storeName: "Boutique Mode",
      ownerEmail: "test1@gmail.com",
      plan: "pro",
      planName: "Professionnel",
      status: "active",
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
    },
    {
      id: crypto.randomUUID(),
      storeName: "Tech Store",
      ownerEmail: "test2@gmail.com",
      plan: "starter",
      planName: "Starter",
      status: "active",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      storeName: "Maison & Déco",
      ownerEmail: "test3@gmail.com",
      plan: "free",
      planName: "Essai Gratuit",
      status: "expired",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    }
  ];

  for (const t of tenants) {
    await setDoc(doc(db, 'tenants', t.id), t);
  }

  const payments = [
    {
      id: crypto.randomUUID(),
      tenantId: tenants[0].id,
      tenantEmail: tenants[0].ownerEmail,
      storeName: tenants[0].storeName,
      plan: "Professionnel",
      planType: "pro",
      duration: "1 an",
      amountDA: 25000,
      paymentMethod: "ccp",
      status: "completed",
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      tenantId: tenants[1].id,
      tenantEmail: tenants[1].ownerEmail,
      storeName: tenants[1].storeName,
      plan: "Starter",
      planType: "starter",
      duration: "3 mois",
      amountDA: 8000,
      paymentMethod: "baridimob",
      status: "completed",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    }
  ];

  for (const p of payments) {
    await setDoc(doc(db, 'payments', p.id), p);
  }

  console.log("Seeded tenants and payments");
}

seed().then(() => process.exit(0)).catch(console.error);
