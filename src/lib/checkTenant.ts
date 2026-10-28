import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export const checkTenantAndRedirect = async (user: User, navigate: any) => {
  try {
    // 1. Check local storage first for instant feedback
    const localStoreName = localStorage.getItem("dzbuild_store_name");
    const localTenantData = localStorage.getItem("dzbuild_tenant_data");

    // 2. Check direct tenant document by UID
    const fetchDocPromise = getDoc(doc(db, "tenants", user.uid));
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3500));

    const docSnap = (await Promise.race([fetchDocPromise, timeoutPromise])) as any;

    if (docSnap && typeof docSnap.exists === "function" && docSnap.exists()) {
      const data = docSnap.data();
      if (data.storeName) {
        localStorage.setItem("dzbuild_store_name", data.storeName);
        localStorage.setItem("dzbuild_tenant_data", JSON.stringify(data));
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
            localStorage.setItem("dzbuild_store_name", data.storeName);
            localStorage.setItem("dzbuild_tenant_data", JSON.stringify(data));
          }
          navigate("/dashboard");
          return;
        }
      } catch (qErr) {
        console.warn("OwnerEmail query notice:", qErr);
      }
    }

    // 4. Fallback to local storage if user had created a store before
    if (localStoreName || localTenantData) {
      navigate("/dashboard");
      return;
    }

    // 5. Only for genuine first-time users without any store
    navigate("/create-store");
  } catch (error) {
    console.warn("Could not retrieve tenant document (checking local fallback):", error);
    if (localStorage.getItem("dzbuild_store_name")) {
      navigate("/dashboard");
    } else {
      navigate("/create-store");
    }
  }
};
