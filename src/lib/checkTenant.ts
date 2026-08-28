import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export const checkTenantAndRedirect = async (user: User, navigate: any) => {
  try {
    // Add a 5s timeout race to prevent UI hanging if network is congested
    const fetchDocPromise = getDoc(doc(db, "tenants", user.uid));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout checking store")), 5000)
    );

    const tenantDoc = (await Promise.race([fetchDocPromise, timeoutPromise])) as any;
    if (tenantDoc && tenantDoc.exists && tenantDoc.exists()) {
      navigate("/");
    } else {
      navigate("/create-store");
    }
  } catch (error) {
    console.warn("Could not retrieve tenant document (proceeding to store setup or home):", error);
    navigate("/create-store");
  }
};
