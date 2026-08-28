import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checkingTenant, setCheckingTenant] = useState(true);
  const [hasTenant, setHasTenant] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!loading) {
      if (!user) {
        setCheckingTenant(false);
        return;
      }

      const checkTenant = async () => {
        try {
          // Timeout race 3.5s to prevent any UI blocking
          const fetchPromise = getDoc(doc(db, "tenants", user.uid));
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout checking store")), 3500)
          );
          const docSnap = (await Promise.race([fetchPromise, timeoutPromise])) as any;
          if (isMounted) {
            if (docSnap && typeof docSnap.exists === "function" && docSnap.exists()) {
              setHasTenant(true);
            } else {
              setHasTenant(false);
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

  if (hasTenant === false) {
    return <Navigate to="/create-store" replace />;
  }

  return <>{children}</>;
}
