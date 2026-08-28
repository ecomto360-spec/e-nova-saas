import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface TenantData {
  storeName?: string;
  trialStartDate?: number | string | { seconds: number; nanoseconds: number } | null;
  subscriptionActive?: boolean;
  [key: string]: any;
}

interface TenantContextType {
  tenantData: TenantData | null;
  isTrialExpired: boolean;
  remainingTrialDays: number;
}

const TenantContext = createContext<TenantContextType>({
  tenantData: null,
  isTrialExpired: false,
  remainingTrialDays: 3,
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

  if (tenantData) {
    if (tenantData.subscriptionActive) {
      isTrialExpired = false;
    } else if (tenantData.trialStartDate) {
      const now = new Date();
      let trialStart: Date;
      if (typeof tenantData.trialStartDate === 'number') {
        trialStart = new Date(tenantData.trialStartDate);
      } else if (typeof tenantData.trialStartDate === 'string') {
        trialStart = new Date(tenantData.trialStartDate);
      } else if (tenantData.trialStartDate.seconds) {
        trialStart = new Date(tenantData.trialStartDate.seconds * 1000);
      } else {
        trialStart = now; 
      }

      const diffMs = now.getTime() - trialStart.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      isTrialExpired = diffHours >= 72;
      
      if (isTrialExpired) {
        remainingTrialDays = 0;
      } else {
        const remainingHours = 72 - diffHours;
        remainingTrialDays = Math.floor(remainingHours / 24);
        if (remainingTrialDays === 0) {
          remainingTrialDays = 1;
        }
      }
    } else {
      // Missing trial start date => treat as expired for safety/testing, or default to expired.
      isTrialExpired = true;
      remainingTrialDays = 0;
    }
  }

  return (
    <TenantContext.Provider value={{ tenantData, isTrialExpired, remainingTrialDays }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
