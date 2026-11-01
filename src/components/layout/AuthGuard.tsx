import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc, DocumentSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { readTenantCache, writeTenantCache } from "../../lib/tenantCache";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checkingTenant, setCheckingTenant] = useState(true);
  // Cache versionné (enova:v1:tenant) : les anciennes clés dzbuild_* ne
  // servent PLUS de laissez-passer — elles étaient valables pour n'importe
  // quel compte et laissaient entrer une session « fantôme ».
  const [hasTenant, setHasTenant] = useState<boolean | null>(() => {
    return readTenantCache() ? true : null;
  });

  useEffect(() => {
    let isMounted = true;

    if (!loading) {
      if (!user) {
        setCheckingTenant(false);
        return;
      }

      // Cache présent ET écrit pour CE compte : accès immédiat.
      if (readTenantCache(user.uid)) {
        if (isMounted) {
          setHasTenant(true);
          setCheckingTenant(false);
        }
        return;
      }

      const checkTenant = async () => {
        try {
          const fetchPromise = getDoc(doc(db, "tenants", user.uid));
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve("timeout"), 3000));
          const result = await Promise.race([fetchPromise, timeoutPromise]);
          if (isMounted) {
            if (result === "timeout") {
              // Réseau lent/hors ligne : ne pas enfermer le propriétaire
              // hors du dashboard (les pages afficheront leurs propres
              // erreurs si la connexion est réellement coupée).
              setHasTenant(true);
            } else {
              const docSnap = result as DocumentSnapshot;
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (data?.storeName) {
                  writeTenantCache(user.uid, data);
                }
                setHasTenant(true);
              } else {
                // Pas de tenant pour ce compte : le cache (versionné) seul
                // peut encore sauver un retour utilisateur.
                setHasTenant(readTenantCache(user.uid) ? true : false);
              }
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
