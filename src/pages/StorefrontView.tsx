import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Palette, Sparkles, Store } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { STORE_THEMES, StoreTheme } from "../data/themesData";
import { ThemeStorePreview } from "../components/storefront/ThemeStorePreview";
import { StoreCustomizerConfig, defaultStoreConfig } from "../components/admin/StoreCustomizerConfig";
import { isTenantExpired } from "../lib/checkExpiration";
import { StoreUnavailable } from "../components/storefront/StoreUnavailable";
import { deduplicateProducts } from "../lib/orderUtils";

export default function StorefrontView() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialProductId = location.state?.productId || queryParams.get('productId');
  const [activeTheme, setActiveTheme] = useState<StoreTheme>(STORE_THEMES[0]);
  const [storeName, setStoreName] = useState<string>(() => {
    return localStorage.getItem("dzbuild_store_name") || "أزياء الموضة";
  });
  const [loading, setLoading] = useState(false);
  const [actualProducts, setActualProducts] = useState<any[]>(() => {
    try {
      const cachedProds = localStorage.getItem("dzbuild_products");
      if (cachedProds) {
        const parsed = JSON.parse(cachedProds);
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateProducts(parsed);
      }
      const tenantData = localStorage.getItem("dzbuild_tenant_data");
      if (tenantData) {
        const parsedT = JSON.parse(tenantData);
        if (parsedT.products && Array.isArray(parsedT.products) && parsedT.products.length > 0) {
          return deduplicateProducts(parsedT.products);
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [actualCategories, setActualCategories] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreCustomizerConfig | undefined>(undefined);
  const [isExpired, setIsExpired] = useState(false);
  const [tenantId, setTenantId] = useState<string>("");

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const loadStoreSettings = async (uid?: string) => {
      let targetUserId = uid;
      
      const fetchRemoteStorefront = async () => {
        // If a storeSlug is provided in the URL, fetch the tenant by storeUrl (slug)
        if (storeSlug) {
          try {
            const tenantQuery = query(collection(db, "tenants"), where("storeUrl", "==", storeSlug));
            const tenantSnap = await getDocs(tenantQuery);
            if (!tenantSnap.empty) {
              targetUserId = tenantSnap.docs[0].id;
              const data = tenantSnap.docs[0].data();
              if (isTenantExpired(data)) {
                 setIsExpired(true);
              }
              if (data.storeName) setStoreName(data.storeName);
              if (data.activeTheme) {
                const found = STORE_THEMES.find(t => t.id === data.activeTheme);
                if (found) setActiveTheme(found);
              }
            }
          } catch (err) {
            // Offline fallback
          }
        }

        if (targetUserId) {
          try {
            const tRef = doc(db, "tenants", targetUserId);
            setTenantId(targetUserId);
            const tSnap = await getDoc(tRef);
            if (tSnap.exists()) {
               const data = tSnap.data();
               if (isTenantExpired(data)) {
                   setIsExpired(true);
               }
               if (data.storeName) setStoreName(data.storeName);
               if (data.activeTheme) {
                   const found = STORE_THEMES.find(t => t.id === data.activeTheme);
                   if (found) setActiveTheme(found);
               }
            }

            // Fetch Custom Store Config
            const confRef = doc(db, "store_config", targetUserId);
            const confSnap = await getDoc(confRef);
            if (confSnap.exists()) {
              const confData = confSnap.data();
              if (confData.activeThemeId) {
                const found = STORE_THEMES.find(t => t.id === confData.activeThemeId);
                if (found) setActiveTheme(found);
              }
              if (confData.config) {
                setStoreConfig(confData.config);
              }
            }

            // Fetch products
            let productsMap = new Map<string, any>();

            // 1. Seed from localStorage dzbuild_products & dzbuild_tenant_data
            try {
              const cachedProds = localStorage.getItem("dzbuild_products");
              if (cachedProds) {
                const parsed = JSON.parse(cachedProds);
                if (Array.isArray(parsed)) {
                  parsed.forEach((p: any) => { if (p && p.id) productsMap.set(String(p.id), p); });
                }
              }
              const tenantSaved = localStorage.getItem("dzbuild_tenant_data");
              if (tenantSaved) {
                const parsedT = JSON.parse(tenantSaved);
                if (parsedT.products && Array.isArray(parsedT.products)) {
                  parsedT.products.forEach((p: any) => { if (p && p.id && !productsMap.has(String(p.id))) productsMap.set(String(p.id), p); });
                }
              }
            } catch {}

            // 2. Fetch from Firestore products collection
            try {
              const productsQuery = query(collection(db, "products"), where("userId", "==", targetUserId));
              const productsSnap = await getDocs(productsQuery);
              productsSnap.docs.forEach(doc => {
                productsMap.set(String(doc.id), { id: doc.id, ...doc.data() });
              });
            } catch (pErr) {
              // Offline fallback
            }

            // 3. Merge with tenant document products array
            if (tSnap.exists()) {
              const tData = tSnap.data();
              if (tData.products && Array.isArray(tData.products) && tData.products.length > 0) {
                tData.products.forEach((tp: any) => {
                  if (tp && tp.id) {
                    productsMap.set(String(tp.id), tp);
                  }
                });
              }
            }

            if (productsMap.size > 0) {
              const clean = deduplicateProducts(Array.from(productsMap.values()));
              setActualProducts(clean);
            }

            // Fetch categories
            try {
              const categoriesQuery = query(collection(db, "categories"), where("userId", "==", targetUserId), where("status", "==", "active"));
              const categoriesSnap = await getDocs(categoriesQuery);
              const categoriesData = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              if (categoriesData.length > 0) setActualCategories(categoriesData);
            } catch {}
          } catch (err) {
            // Offline fallback
          }
        }
      };

      const timeoutPromise = new Promise(res => setTimeout(res, 800));
      await Promise.race([fetchRemoteStorefront(), timeoutPromise]);
      setLoading(false);
    };

    const handleRealtimeUpdate = () => {
      try {
        const savedProds = localStorage.getItem("dzbuild_products");
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActualProducts(deduplicateProducts(parsed));
          }
        }
      } catch {}
    };

    window.addEventListener("products_updated", handleRealtimeUpdate);
    window.addEventListener("storage", handleRealtimeUpdate);

    if (storeSlug) {
      loadStoreSettings();
    } else if (auth.currentUser) {
      loadStoreSettings(auth.currentUser.uid);
    } else {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          loadStoreSettings(user.uid);
        } else {
          loadStoreSettings();
        }
      });
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [storeSlug]);

  if (isExpired) return <StoreUnavailable />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Top Admin Quick Bar for Store Owner */}
      <div className="bg-[#18181b] text-neutral-300 px-4 py-2 text-xs flex items-center justify-between border-b border-neutral-800 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour au tableau de bord</span>
          </Link>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <Store size={14} />
            <span>Thème en direct : <strong>{activeTheme.name}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/themes"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            <Palette size={12} className="text-amber-400" />
            <span>Changer de thème</span>
          </Link>
          <Link
            to="/dashboard/customize"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors"
          >
            <Edit3 size={12} />
            <span>Personnaliser</span>
          </Link>
        </div>
      </div>

      {/* Main Storefront Layout */}
      <div className="flex-1">
        <ThemeStorePreview 
          theme={activeTheme}
          initialProductId={initialProductId} 
          customStoreName={storeName}
          isStandaloneView={true}
          actualProducts={actualProducts}
          actualCategories={actualCategories}
          tenantId={tenantId}
          config={storeConfig ? { ...storeConfig, isActivated: true } : undefined}
        />
      </div>
    </div>
  );
}
