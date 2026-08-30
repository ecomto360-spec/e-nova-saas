import { db } from "./firebase";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

export const wipeUserData = async (userId: string) => {
  if (!userId) return;
  const wipeKey = `wiped_v1_${userId}`;
  if (localStorage.getItem(wipeKey)) return;

  const collections = ["customers", "products", "orders", "categories", "landing_pages"];
  
  for (const coll of collections) {
    try {
      const q = query(collection(db, coll), where("userId", "==", userId));
      const snap = await getDocs(q);
      for (const doc of snap.docs) {
        await deleteDoc(doc.ref);
      }
    } catch (error) {
      console.error(`Error wiping ${coll}:`, error);
    }
  }
  
  localStorage.setItem(wipeKey, "true");
  console.log("User data wiped successfully.");
};
