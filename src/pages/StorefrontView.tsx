import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Palette, Sparkles, Store } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { STORE_THEMES, StoreTheme } from "../data/themesData";
import { ThemeStorePreview } from "../components/storefront/ThemeStorePreview";

export default function StorefrontView() {
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState<StoreTheme>(STORE_THEMES[0]);
  const [storeName, setStoreName] = useState<string>("أزياء الموضة");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoreSettings = async () => {
      const user = auth.currentUser;
      const cachedThemeId = localStorage.getItem("dzbuild_active_theme");
      const cachedStoreName = localStorage.getItem("dzbuild_store_name");

      if (cachedStoreName) {
        setStoreName(cachedStoreName);
      }

      if (cachedThemeId) {
        const found = STORE_THEMES.find(t => t.id === cachedThemeId);
        if (found) setActiveTheme(found);
      }

      if (user) {
        try {
          const docRef = doc(db, "tenants", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.storeName) setStoreName(data.storeName);
            if (data.activeTheme) {
              const found = STORE_THEMES.find(t => t.id === data.activeTheme);
              if (found) setActiveTheme(found);
            }
          }
        } catch (error) {
          console.error("Error loading store configuration:", error);
        }
      }
      setLoading(false);
    };

    loadStoreSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Top Admin Quick Bar for Store Owner */}
      <div className="bg-[#18181b] text-neutral-300 px-4 py-2 text-xs flex items-center justify-between border-b border-neutral-800 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            to="/customize"
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
            to="/themes"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            <Palette size={12} className="text-amber-400" />
            <span>Changer de thème</span>
          </Link>
          <Link
            to="/customize"
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
          customStoreName={storeName}
          isStandaloneView={true}
        />
      </div>
    </div>
  );
}
