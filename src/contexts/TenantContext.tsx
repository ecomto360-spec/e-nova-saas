import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { readTenantCache, writeTenantCache, clearTenantCache } from "../lib/tenantCache";

interface TenantData {
  storeName?: string;
  trialStartDate?: number | string | { seconds: number; nanoseconds: number } | null;
  subscriptionActive?: boolean;
  planExpiresAt?: string;
  plan?: string;
  isTestAccount?: boolean;
  [key: string]: any;
}

interface TenantContextType {
  tenantData: TenantData | null;
  isTrialExpired: boolean;
  remainingTrialDays: number;
  showBanner: boolean;
  bannerMessage: React.ReactNode;
}

const TenantContext = createContext<TenantContextType>({
  tenantData: null,
  isTrialExpired: false,
  remainingTrialDays: 365,
  showBanner: false,
  bannerMessage: "",
});

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  // Cache versionné (clé enova:v1:tenant) : peinture instantanée du header
  // pendant que l'auth se résout. Les anciennes clés dzbuild_* sont purgées
  // à la lecture. Le cache n'est honoré que s'il appartient au compte
  // connecté (vérifié dans l'effet ci-dessous).
  const [tenantData, setTenantData] = useState<TenantData | null>(() => readTenantCache());

  useEffect(() => {
    // Attendre que l'état d'authentification soit résolu (sinon on purge le
    // cache avant même de savoir qui est connecté).
    if (loading) return;

    if (!user) {
      setTenantData(null);
      // Déconnexion : le cache n'a plus de sens pour le prochain compte.
      clearTenantCache();
      return;
    }

    // Cache d'un AUTRE compte (ancienne session) : ignoré immédiatement.
    // Le onSnapshot ci-dessous fournit les données à jour de CE compte.
    if (readTenantCache(user.uid) === null) {
      setTenantData(null);
    }

    const docRef = doc(db, "tenants", user.uid);

    // Auto-provision 365 days for test account nabsterzero@gmail.com
    if (user.email === "nabsterzero@gmail.com") {
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const testData: TenantData = {
        email: "nabsterzero@gmail.com",
        plan: "pro",
        planExpiresAt: oneYearFromNow,
        subscriptionActive: true,
        status: "active",
        isTestAccount: true,
        storeName: tenantData?.storeName || "Enova - Boutique Test",
        updatedAt: new Date().toISOString()
      };
      setDoc(docRef, testData, { merge: true }).catch(() => {});
    }

    // Listen to real-time updates with graceful error fallback
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as TenantData;
            
            // If it's nabsterzero, guarantee 365 days expiration
            if (user.email === "nabsterzero@gmail.com" || data.email === "nabsterzero@gmail.com") {
              if (!data.planExpiresAt || new Date(data.planExpiresAt).getTime() < Date.now() + 300 * 24 * 60 * 60 * 1000) {
                data.planExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                data.plan = "pro";
                data.subscriptionActive = true;
                data.isTestAccount = true;
              }
            }

            setTenantData(data);
            writeTenantCache(user.uid, data);
          } else if (user.email === "nabsterzero@gmail.com") {
            const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
            const initialTest: TenantData = {
              email: "nabsterzero@gmail.com",
              plan: "pro",
              planExpiresAt: oneYearFromNow,
              subscriptionActive: true,
              status: "active",
              isTestAccount: true,
              storeName: "Enova - Boutique Test"
            };
            setTenantData(initialTest);
            setDoc(docRef, initialTest, { merge: true }).catch(() => {});
          }
        },
        (error) => {
          // Offline or transient connection drop fallback
          // (cache versionné : uniquement s'il appartient à CE compte)
          const cached = readTenantCache(user.uid);
          if (cached) {
            setTenantData(cached as TenantData);
          }
        }
      );
    } catch (err) {
      const cached = readTenantCache(user.uid);
      if (cached) {
        setTenantData(cached as TenantData);
      }
    }

    return () => unsubscribe();
  }, [user, loading]);

  let isTrialExpired = false;
  let remainingTrialDays = 365;
  let showBanner = false;
  let bannerMessage: React.ReactNode = "";

  const isVipTestAccount = user?.email === "nabsterzero@gmail.com" || tenantData?.email === "nabsterzero@gmail.com" || tenantData?.isTestAccount;

  if (isVipTestAccount) {
    isTrialExpired = false;
    remainingTrialDays = 365;
    showBanner = false;
    bannerMessage = "";
  } else if (tenantData) {
    const now = new Date();
    
    // Si l'utilisateur a un abonnement actif/existant avec une date d'expiration
    if (tenantData.planExpiresAt) {
      const expDate = new Date(tenantData.planExpiresAt);
      const diffMs = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      remainingTrialDays = Math.max(0, diffDays);
      
      if (diffDays <= 0) {
        isTrialExpired = true;
        showBanner = true;
        bannerMessage = "Votre abonnement a expiré.";
      } else if (diffDays <= 3) {
        isTrialExpired = false;
        showBanner = true;
        bannerMessage = `Votre abonnement expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}.`;
      } else {
        isTrialExpired = false;
        showBanner = false;
        bannerMessage = "";
      }
    } else {
      // Sinon, on applique la logique de l'essai gratuit de 5 jours
      let trialStart: Date | null = null;
      if (tenantData.trialStartDate) {
        if (typeof tenantData.trialStartDate === 'number') {
          trialStart = new Date(tenantData.trialStartDate);
        } else if (typeof tenantData.trialStartDate === 'string') {
          trialStart = new Date(tenantData.trialStartDate);
        } else if (tenantData.trialStartDate.seconds) {
          trialStart = new Date(tenantData.trialStartDate.seconds * 1000);
        } else {
          trialStart = now; 
        }
      }

      if (!trialStart) {
        // Sécurité par défaut si pas de date d'essai trouvée (considéré comme expiré)
        isTrialExpired = true;
        remainingTrialDays = 0;
        showBanner = true;
        bannerMessage = "Votre essai gratuit a expiré.";
      } else {
        const diffMs = now.getTime() - trialStart.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        isTrialExpired = diffHours >= 120;
        
        if (isTrialExpired) {
          remainingTrialDays = 0;
          showBanner = true;
          bannerMessage = "Votre essai gratuit a expiré.";
        } else {
          const remainingHours = 120 - diffHours;
          remainingTrialDays = Math.floor(remainingHours / 24);
          if (remainingTrialDays === 0) remainingTrialDays = 1;
          showBanner = true;
          bannerMessage = (
            <>
              Vous explorez E-Nova ! Il reste dans votre essai gratuit <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{remainingTrialDays} jour{remainingTrialDays > 1 ? 's' : ''}</span>
            </>
          );
        }
      }
    }
  }

  return (
    <TenantContext.Provider value={{ tenantData, isTrialExpired, remainingTrialDays, showBanner, bannerMessage }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
