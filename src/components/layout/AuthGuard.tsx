import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checkingTenant, setCheckingTenant] = useState(true);
  const [hasTenant, setHasTenant] = useState<boolean | null>(() => {
    return localStorage.getItem("dzbuild_store_name") ? true : null;
  });

  useEffect(() => {
    let isMounted = true;

    if (!loading) {
      if (!user) {
        setCheckingTenant(false);
        return;
      }

      // If already present in localStorage, allow immediately
      if (localStorage.getItem("dzbuild_store_name")) {
        if (isMounted) {
          setHasTenant(true);
          setCheckingTenant(false);
        }
        return;
      }

      const checkTenant = async () => {
        try {
          const fetchPromise = getDoc(doc(db, "tenants", user.uid));
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
          const docSnap = (await Promise.race([fetchPromise, timeoutPromise])) as any;
          if (isMounted) {
            if (docSnap && typeof docSnap.exists === "function" && docSnap.exists()) {
              const data = docSnap.data();
              if (data?.storeName) {
                localStorage.setItem("dzbuild_store_name", data.storeName);
                localStorage.setItem("dzbuild_tenant_data", JSON.stringify(data));
              }
              setHasTenant(true);
            } else {
              setHasTenant(localStorage.getItem("dzbuild_store_name") ? true : false);
            }
          }
        } catch (error) {
          console.warn("Could not check tenant doc, allowing access:", error);
          if (isMounted) {
            setHasTenant(true); // Don't block the user if Firestore network times out
          }
        } finally {
          if (isMounted) {
            setCheckingTenant(false);
          }
        }
      };

      checkTenant();
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  if (loading || (user && checkingTenant)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#16161a]">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hasTenant === false && !localStorage.getItem("dzbuild_store_name")) {
    return <Navigate to="/create-store" replace />;
  }

  return <>{children}</>;
}
