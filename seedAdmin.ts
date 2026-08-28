import { db } from "./src/lib/firebase-backend.js";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function seedAdmin() {
  const email = "ecomto360@gmail.com";
  const password = "NovaSecur!ty2026"; // Changed because old password was compromised
  
  const usersRef = collection(db, 'admin_users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  
  const password_hash = await bcrypt.hash(password, 10);

  if (snapshot.empty) {
    console.log("Seeding first admin user...");
    const id = crypto.randomUUID();
    
    await setDoc(doc(db, 'admin_users', id), {
      id,
      email,
      password_hash,
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString()
    });
    console.log(`Admin created: ${email} / ${password}`);
  } else {
    console.log("Admin user exists, updating password...");
    const docId = snapshot.docs[0].id;
    await setDoc(doc(db, 'admin_users', docId), { password_hash }, { merge: true });
    console.log(`Admin password updated for: ${email}`);
  }
}

seedAdmin().then(() => process.exit(0)).catch(console.error);
