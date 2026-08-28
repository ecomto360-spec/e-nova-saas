import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Monitor, 
  Smartphone, 
  Upload, 
  LayoutTemplate, 
  Save, 
  ChevronDown, 
  Palette, 
  Sparkles, 
  Check, 
  Eye, 
  ExternalLink,
  Store,
  RotateCw
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { STORE_THEMES, StoreTheme } from "../data/themesData";
import { ThemeStorePreview } from "../components/storefront/ThemeStorePreview";

export default function Customize() {
  const navigate = useNavigate();
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [activeThemeId, setActiveThemeId] = useState<string>(
    localStorage.getItem("dzbuild_active_theme") || "starter"
  );
  const [storeName, setStoreName] = useState<string>(
    localStorage.getItem("dzbuild_store_name") || "أزياء الموضة"
  );

  // Customization state
  const [primaryColor, setPrimaryColor] = useState<string>("#f59e0b");
  const [fontFamily, setFontFamily] = useState<string>("Inter");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Open sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    colors: true,
    typography: false,
    headerFooter: false
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "tenants", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.activeTheme) {
              setActiveThemeId(data.activeTheme);
            }
            if (data.storeName) {
              setStoreName(data.storeName);
            }
            if (data.themeSettings?.primaryColor) {
              setPrimaryColor(data.themeSettings.primaryColor);
            }
          }
        } catch (err) {
          console.error("Error loading customizer data:", err);
        }
      }
    };

    fetchSettings();
  }, []);

  const currentTheme = STORE_THEMES.find(t => t.id === activeThemeId) || STORE_THEMES[0];

  // Customized theme preview instance
  const liveTheme: StoreTheme = {
    ...currentTheme,
    primaryColor: primaryColor
  };

  const handleSave = async () => {
    setIsSaving(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "tenants", user.uid);
        await updateDoc(docRef, {
          "themeSettings.primaryColor": primaryColor,
          "themeSettings.fontFamily": fontFamily,
          updatedAt: new Date()
        });
      } catch (err) {
        console.error("Error saving theme settings:", err);
      }
    }
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Personnaliser la boutique</h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Ajustez l'apparence visuelle, les couleurs et le style de votre boutique en direct
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-[#1e1e24] rounded-lg border border-gray-200 dark:border-neutral-800 p-1">
            <button 
              onClick={() => setDeviceMode("desktop")}
              className={`p-1.5 rounded transition-all ${
                deviceMode === "desktop"
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Vue Ordinateur"
            >
              <Monitor size={16} />
            </button>
            <button 
              onClick={() => setDeviceMode("mobile")}
              className={`p-1.5 rounded transition-all ${
                deviceMode === "mobile"
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Vue Mobile"
            >
              <Smartphone size={16} />
            </button>
          </div>

          <Link 
            to="/store"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#1e1e24] px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Eye className="h-4 w-4" />
            <span>Plein écran</span>
          </Link>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 transition-all shadow-sm active:scale-95"
          >
            {isSaving ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : savedSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{savedSuccess ? "Enregistré !" : "Enregistrer"}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar Controls */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide shrink-0">
          
          {/* Active Theme Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] p-4 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              Thème Actif
            </h3>
            <div className="p-3 border border-amber-500/30 bg-amber-500/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-amber-600 dark:text-amber-400 font-bold text-sm">{currentTheme.name} {currentTheme.version || ""}</p>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400">Installé sur votre boutique</p>
              </div>
              <Link 
                to="/themes"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Changer
              </Link>
            </div>
          </div>

          {/* Accordion Settings */}
          <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] divide-y divide-gray-100 dark:divide-neutral-800 shadow-sm overflow-hidden">
            
            {/* Section 1: Logo & Favicon */}
            <div className="p-4">
              <div 
                onClick={() => toggleSection("identity")}
                className="flex justify-between items-center cursor-pointer group"
              >
                <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">Identité visuelle</h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.identity ? "rotate-180" : ""}`} />
              </div>
              {openSections.identity && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-neutral-400 block mb-1.5 font-medium">Nom de la boutique</label>
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#16161a] border border-gray-200 dark:border-neutral-700 text-xs rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-neutral-400 block mb-1.5 font-medium">Logo de la boutique</label>
                    <div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-[#16161a]/50 hover:bg-gray-50 dark:hover:bg-[#16161a] transition-colors cursor-pointer group">
                      <Upload className="w-5 h-5 text-gray-400 mb-1 group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-amber-500">Importer un logo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Colors */}
            <div className="p-4">
              <div 
                onClick={() => toggleSection("colors")}
                className="flex justify-between items-center cursor-pointer group"
              >
                <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">Palette de Couleurs</h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.colors ? "rotate-180" : ""}`} />
              </div>
              {openSections.colors && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">Couleur principale</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-gray-500 dark:text-neutral-400">{primaryColor}</span>
                    </div>
                  </div>

                  {/* Preset Colors */}
                  <div>
                    <span className="text-[11px] text-gray-500 block mb-2 font-medium">Couleurs prédéfinies :</span>
                    <div className="flex items-center gap-2">
                      {["#f59e0b", "#8b5cf6", "#d97706", "#ec4899", "#0284c7", "#10b981", "#ef4444"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPrimaryColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            primaryColor === c ? "scale-110 border-white ring-2 ring-amber-500" : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Typography */}
            <div className="p-4">
              <div 
                onClick={() => toggleSection("typography")}
                className="flex justify-between items-center cursor-pointer group"
              >
                <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">Typographie</h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections.typography ? "rotate-180" : ""}`} />
              </div>
              {openSections.typography && (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-neutral-400 block mb-1.5">Police d'écriture</label>
                    <select 
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#16161a] border border-gray-200 dark:border-neutral-700 text-xs rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="Inter">Inter (Moderne & Standard)</option>
                      <option value="Cairo">Cairo (Idéal Arabe & Français)</option>
                      <option value="Poppins">Poppins (Arrondi & Élégant)</option>
                      <option value="Tajawal">Tajawal (Arabe Pro)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Live Preview Window Container */}
        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#16161a] flex flex-col overflow-hidden shadow-sm">
          {/* Top Browser Toolbar */}
          <div className="h-11 bg-gray-100 dark:bg-[#1e1e24] border-b border-gray-200 dark:border-neutral-800 flex items-center px-4 gap-4 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50"></div>
            </div>
            <div className="flex-1 max-w-sm mx-auto bg-white dark:bg-[#16161a] rounded-lg px-3 py-1 text-xs text-gray-500 dark:text-neutral-400 font-mono text-center border border-gray-200 dark:border-neutral-800 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>demo-{liveTheme.id}.dzbuild.app</span>
            </div>
            <Link
              to="/store"
              className="text-xs text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink size={13} />
            </Link>
          </div>

          {/* Interactive Live Theme Store View */}
          <div className={`flex-1 overflow-y-auto bg-[#fafafa] flex justify-center ${deviceMode === "mobile" ? "p-4" : ""}`}>
            <div className={`transition-all duration-300 ${deviceMode === "mobile" ? "w-[390px] border-4 border-neutral-800 rounded-3xl shadow-xl overflow-hidden bg-white my-auto" : "w-full"}`}>
              <ThemeStorePreview 
                theme={liveTheme} 
                customStoreName={storeName}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
