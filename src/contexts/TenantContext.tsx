import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface TenantData {
  storeName?: string;
  trialStartDate?: number | string | { seconds: number; nanoseconds: number } | null;
  subscriptionActive?: boolean;
  planExpiresAt?: string;
  plan?: string;
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
  remainingTrialDays: 3,
  showBanner: false,
  bannerMessage: "",
});

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      const fetchTenant = async () => {
        try {
          const docRef = doc(db, "tenants", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && isMounted) {
            setTenantData(docSnap.data() as TenantData);
          }
        } catch (error) {
          console.error("Error fetching tenant", error);
        }
      };
      fetchTenant();
    } else {
      setTenantData(null);
    }
    return () => { isMounted = false; };
  }, [user]);

  let isTrialExpired = false;
  let remainingTrialDays = 3;
  let showBanner = false;
  let bannerMessage: React.ReactNode = "";

  if (tenantData) {
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
      // Sinon, on applique la logique de l'essai gratuit de 3 jours
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
        
        isTrialExpired = diffHours >= 72;
        
        if (isTrialExpired) {
          remainingTrialDays = 0;
          showBanner = true;
          bannerMessage = "Votre essai gratuit a expiré.";
        } else {
          const remainingHours = 72 - diffHours;
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
