import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";
import { readTenantCache, writeTenantCache } from "./tenantCache";

export const checkTenantAndRedirect = async (user: User, navigate: any) => {
  try {
    // 1. Cache local versionné (uniquement s'il appartient à CE compte) —
    //    les anciennes clés dzbuild_* sont purgées automatiquement à la lecture.
    const cachedTenant = readTenantCache(user.uid);

    // 2. Check direct tenant document by UID
    const fetchDocPromise = getDoc(doc(db, "tenants", user.uid));
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3500));

    const docSnap = (await Promise.race([fetchDocPromise, timeoutPromise])) as any;

    if (docSnap && typeof docSnap.exists === "function" && docSnap.exists()) {
      const data = docSnap.data();
      if (data.storeName) {
        writeTenantCache(user.uid, data);
      }
      navigate("/dashboard");
      return;
    }

    // 3. Check by ownerEmail query if document wasn't under user.uid
    if (user.email) {
      try {
        const q = query(collection(db, "tenants"), where("ownerEmail", "==", user.email.toLowerCase()));
        const querySnap = (await Promise.race([getDocs(q), timeoutPromise])) as any;
        if (querySnap && !querySnap.empty) {
          const firstDoc = querySnap.docs[0];
          const data = firstDoc.data();
          if (data.storeName) {
            writeTenantCache(user.uid, data);
          }
          navigate("/dashboard");
          return;
        }
      } catch (qErr) {
        console.warn("OwnerEmail query notice:", qErr);
      }
    }

    // 4. Fallback : ce compte avait déjà une boutique (cache versionné)
    if (cachedTenant) {
      navigate("/dashboard");
      return;
    }

    // 5. Only for genuine first-time users without any store
    navigate("/create-store");
  } catch (error) {
    console.warn("Could not retrieve tenant document (checking local fallback):", error);
    if (readTenantCache(user.uid)) {
      navigate("/dashboard");
    } else {
      navigate("/create-store");
    }
  }
};
