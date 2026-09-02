const fs = require('fs');

const content = `import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Monitor, 
  Smartphone, 
  Save, 
  ChevronDown, 
  Check, 
  Eye, 
  ExternalLink,
  Store,
  ShoppingBag,
  RotateCw,
  Search,
  Image as ImageIcon,
  ChevronRight,
  UploadCloud
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { STORE_THEMES, StoreTheme } from "../data/themesData";
import { ThemeStorePreview } from "../components/storefront/ThemeStorePreview";
import { StoreCustomizerConfig, defaultStoreConfig } from "../components/admin/StoreCustomizerConfig";

export default function Customize() {
  const navigate = useNavigate();
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [previewView, setPreviewView] = useState<"home" | "product" | "checkout">("home");
  
  const [activeThemeId, setActiveThemeId] = useState<string>(
    localStorage.getItem("dzbuild_active_theme") || "starter"
  );
  
  const currentTheme = STORE_THEMES.find(t => t.id === activeThemeId) || STORE_THEMES[0];

  const [config, setConfig] = useState<StoreCustomizerConfig>(defaultStoreConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const [activeMenu, setActiveMenu] = useState<string>("main"); // main, header, colors, etc.

  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (!auth.currentUser) return;
        const confRef = doc(db, "store_config", auth.currentUser.uid);
        const snap = await getDoc(confRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.activeThemeId) setActiveThemeId(data.activeThemeId);
          setConfig(prev => ({ ...prev, ...data.config }));
        }
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    
    // Si c'est la première fois qu'on sauvegarde, on l'active (blank slate)
    const newConfig = { ...config };
    if (!newConfig.isActivated) {
      newConfig.isActivated = true;
    }

    try {
      if (auth.currentUser) {
        await setDoc(doc(db, "store_config", auth.currentUser.uid), {
          activeThemeId,
          config: newConfig
        }, { merge: true });
      }
      setConfig(newConfig);
      
      localStorage.setItem("dzbuild_active_theme", activeThemeId);
      localStorage.setItem("dzbuild_store_name", newConfig.storeName);
      
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving theme settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof StoreCustomizerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderSidebarItem = (title: string, id: string, hasToggle?: boolean, toggleKey?: keyof StoreCustomizerConfig, hasArrow: boolean = true) => {
    return (
      <div 
        className="flex items-center justify-between p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-600 transition-colors"
        onClick={() => {
          if (hasArrow) {
            setActiveMenu(id);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
            {id === "header" && <Store size={16} />}
            {id === "colors" && <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-purple-500"></div>}
            {id === "search" && <Search size={16} />}
            {id === "announcement" && <div className="w-4 h-3 border-2 border-neutral-400 rounded-sm flex items-center justify-center"><div className="w-1.5 h-0.5 bg-neutral-400"></div></div>}
            {id === "hero" && <ImageIcon size={16} />}
            {id === "categories" && <div className="grid grid-cols-2 gap-0.5"><div className="w-2 h-2 bg-neutral-400 rounded-sm"/><div className="w-2 h-2 bg-neutral-400 rounded-sm"/><div className="w-2 h-2 bg-neutral-400 rounded-sm"/><div className="w-2 h-2 bg-neutral-400 rounded-sm"/></div>}
            {id === "promo" && <div className="w-4 h-3 bg-neutral-400 rounded-sm rotate-12" />}
            {id === "featured" && <div className="w-4 h-4 border-2 border-neutral-400 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"/></div>}
            {id === "brand" && <Store size={16} />}
            {id === "trust" && <Check size={16} />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasToggle && toggleKey && (
            <div 
              className={\`w-10 h-5 rounded-full relative cursor-pointer transition-colors \${config[toggleKey] ? 'bg-amber-500' : 'bg-neutral-600'}\`}
              onClick={(e) => {
                e.stopPropagation();
                updateConfig(toggleKey, !config[toggleKey]);
              }}
            >
              <div className={\`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform \${config[toggleKey] ? 'translate-x-5' : 'translate-x-0'}\`} />
            </div>
          )}
          {hasArrow && <ChevronRight size={16} className="text-neutral-500" />}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden font-sans">
      <div className="flex gap-6 flex-1 h-full p-4">
        {/* Sidebar Controls */}
        <div className="w-80 flex flex-col h-full bg-[#16161a] border border-neutral-800 rounded-2xl overflow-hidden shrink-0">
          
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Store size={18} />
              Personnaliser
            </h2>
            <Link to="/store" className="text-amber-500 hover:text-amber-400 text-xs font-bold flex items-center gap-1">
              <Eye size={14} /> Voir
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeMenu === "main" ? (
              <div className="space-y-3">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type="text" placeholder="Rechercher une section..." className="w-full bg-[#1e1e24] border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5 p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-600" onClick={() => setActiveMenu("colors")}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="text-base">🇦🇪</span> Langue de la boutique
                      </span>
                      <ChevronRight size={16} className="text-neutral-500" />
                    </div>
                    <span className="text-xs text-neutral-500 ml-6">Arabe ou Français</span>
                  </div>

                  <div className="flex flex-col gap-0.5 p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-600" onClick={() => setActiveMenu("header")}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                         <Store size={16} className="text-neutral-400" /> En-tête et Logo
                      </span>
                      <ChevronRight size={16} className="text-neutral-500" />
                    </div>
                    <span className="text-xs text-neutral-500 ml-6">Logo et barre de navigation</span>
                  </div>

                  <div className="flex flex-col gap-0.5 p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-600" onClick={() => setActiveMenu("colors")}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-purple-500"></div> Couleurs et Police
                      </span>
                      <ChevronRight size={16} className="text-neutral-500" />
                    </div>
                    <span className="text-xs text-neutral-500 ml-6">Couleurs principales et polices</span>
                  </div>

                  {renderSidebarItem("Barre de recherche", "search", true, "showSearch", false)}
                  {renderSidebarItem("Barre d'annonce", "announcement", true, "showAnnouncement", true)}
                  {renderSidebarItem("Section Hero", "hero", true, "showHero", true)}
                  {renderSidebarItem("Catégories", "categories", true, "showCategories", false)}
                  {renderSidebarItem("Bannière promotionnelle", "promo", false, undefined, true)}
                  {renderSidebarItem("Produits vedettes", "featured", true, "showFeatured", false)}
                  {renderSidebarItem("Infos de la marque", "brand", false, undefined, true)}
                  {renderSidebarItem("Badges de confiance", "trust", true, "showTrustBadges", false)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setActiveMenu("main")}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm font-medium mb-2"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" /> Retour
                </button>

                {activeMenu === "colors" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-purple-500"></div>
                      Couleurs et Police
                    </h3>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur principale</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.primaryColor} onChange={(e) => updateConfig('primaryColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.primaryColor} onChange={(e) => updateConfig('primaryColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur secondaire</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.secondaryColor} onChange={(e) => updateConfig('secondaryColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.secondaryColor} onChange={(e) => updateConfig('secondaryColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur d'arrière-plan</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.bgColor} onChange={(e) => updateConfig('bgColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.bgColor} onChange={(e) => updateConfig('bgColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur des titres de sections</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.headingColor} onChange={(e) => updateConfig('headingColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.headingColor} onChange={(e) => updateConfig('headingColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Police de caractères</label>
                      <select value={config.fontFamily} onChange={(e) => updateConfig('fontFamily', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="Cairo">Cairo</option>
                        <option value="Tajawal">Tajawal</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Langue de la boutique</label>
                      <select value={config.language} onChange={(e) => updateConfig('language', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="ar">dz العربية (Arabic)</option>
                        <option value="fr">Français (French)</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Style des boutons</label>
                      <select value={config.buttonStyle} onChange={(e) => updateConfig('buttonStyle', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="rounded">Arrondi</option>
                        <option value="pill">Pill</option>
                        <option value="square">Carré</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeMenu === "header" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">En-tête et Logo</h3>
                    
                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 cursor-pointer hover:bg-[#1e1e24]">
                       <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center mb-2">
                         <ImageIcon size={20} />
                       </div>
                       <p className="text-sm font-bold text-white text-center">Télécharger l'icône de la boutique (Favicon)</p>
                       <p className="text-xs text-neutral-500 text-center mt-1">PNG ou ICO - 32x32 ou 64x64 pixels</p>
                    </div>

                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 cursor-pointer hover:bg-[#1e1e24]">
                       <UploadCloud size={24} className="text-neutral-400 mb-2" />
                       <p className="text-sm font-bold text-white text-center">Logo de la boutique</p>
                       <p className="text-xs text-neutral-500 text-center mt-1">PNG, JPG, WebP, SVG</p>
                       <input 
                         type="text" 
                         placeholder="URL de l'image (pour la démo)" 
                         value={config.logoUrl} 
                         onChange={(e) => updateConfig('logoUrl', e.target.value)}
                         className="mt-3 w-full bg-[#111111] border border-neutral-700 rounded-md px-2 py-1 text-xs text-white" 
                        />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Nom de la boutique</label>
                      <input type="text" value={config.storeName} onChange={(e) => updateConfig('storeName', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur de la barre de navigation</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.navBgColor} onChange={(e) => updateConfig('navBgColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.navBgColor} onChange={(e) => updateConfig('navBgColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur du texte du menu</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.navTextColor} onChange={(e) => updateConfig('navTextColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.navTextColor} onChange={(e) => updateConfig('navTextColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Style de la barre de navigation</label>
                      <select value={config.navStyle} onChange={(e) => updateConfig('navStyle', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="default">Par défaut</option>
                        <option value="centered">Centré</option>
                      </select>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-sm text-white">Barre de navigation fixe (Sticky)</span>
                      <div className={\`w-10 h-5 rounded-full relative cursor-pointer transition-colors \${config.isSticky ? 'bg-amber-500' : 'bg-neutral-600'}\`} onClick={() => updateConfig('isSticky', !config.isSticky)}>
                        <div className={\`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform \${config.isSticky ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                  </div>
                )}

                {activeMenu === "hero" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ImageIcon size={20} className="text-amber-500" />
                      Section Hero
                    </h3>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Afficher la section</label>
                      <select value={config.showHero ? "yes" : "no"} onChange={(e) => updateConfig('showHero', e.target.value === "yes")} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                      </select>
                    </div>

                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 cursor-pointer hover:bg-[#1e1e24]">
                       <Monitor size={24} className="text-neutral-400 mb-2" />
                       <p className="text-sm font-bold text-white text-center">Image d'arrière-plan (ordinateur)</p>
                       <p className="text-xs text-neutral-500 text-center mt-1">1920x600 pixels recommandé</p>
                       <input 
                         type="text" 
                         placeholder="URL de l'image (pour la démo)" 
                         value={config.heroDesktopBg} 
                         onChange={(e) => updateConfig('heroDesktopBg', e.target.value)}
                         className="mt-3 w-full bg-[#111111] border border-neutral-700 rounded-md px-2 py-1 text-xs text-white" 
                        />
                    </div>

                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 cursor-pointer hover:bg-[#1e1e24]">
                       <Smartphone size={24} className="text-neutral-400 mb-2" />
                       <p className="text-sm font-bold text-white text-center">Image d'arrière-plan (mobile)</p>
                       <p className="text-xs text-neutral-500 text-center mt-1">600x800 pixels recommandé</p>
                       <input 
                         type="text" 
                         placeholder="URL de l'image (pour la démo)" 
                         value={config.heroMobileBg} 
                         onChange={(e) => updateConfig('heroMobileBg', e.target.value)}
                         className="mt-3 w-full bg-[#111111] border border-neutral-700 rounded-md px-2 py-1 text-xs text-white" 
                        />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Titre principal (H1)</label>
                      <input type="text" value={config.heroTitle} onChange={(e) => updateConfig('heroTitle', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Description courte</label>
                      <textarea value={config.heroSubtitle} onChange={(e) => updateConfig('heroSubtitle', e.target.value)} rows={3} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Texte du bouton</label>
                      <input type="text" value={config.heroButtonText} onChange={(e) => updateConfig('heroButtonText', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                )}

                {activeMenu === "announcement" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Barre d'annonce</h3>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Afficher la barre</label>
                      <select value={config.showAnnouncement ? "yes" : "no"} onChange={(e) => updateConfig('showAnnouncement', e.target.value === "yes")} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Texte de l'annonce</label>
                      <input type="text" value={config.announcementText} onChange={(e) => updateConfig('announcementText', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Lien (optionnel)</label>
                      <input type="text" value={config.announcementLink} onChange={(e) => updateConfig('announcementLink', e.target.value)} placeholder="https://..." className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur de fond</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.announcementBgColor} onChange={(e) => updateConfig('announcementBgColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.announcementBgColor} onChange={(e) => updateConfig('announcementBgColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur du texte</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.announcementTextColor} onChange={(e) => updateConfig('announcementTextColor', e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.announcementTextColor} onChange={(e) => updateConfig('announcementTextColor', e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-neutral-800 bg-[#1a1a24] flex items-center justify-between gap-2">
            <button className="p-2 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
              <RotateCw size={16} />
            </button>
            <button className="p-2 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
              <Eye size={16} />
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? <RotateCw className="w-4 h-4 animate-spin" /> : (savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
              {savedSuccess ? "Enregistré !" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>

        {/* Live Preview Window Container */}
        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#16161a] flex flex-col overflow-hidden shadow-sm">
          {/* Top Browser Toolbar */}
          <div className="h-14 bg-[#1e1e24] border-b border-neutral-800 flex items-center px-4 justify-between shrink-0">
            {/* Device Toggles */}
            <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800">
              <button 
                onClick={() => setDeviceMode("desktop")}
                className={\`p-1.5 rounded-md transition-colors \${deviceMode === "desktop" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Monitor size={16} />
              </button>
              <button 
                onClick={() => setDeviceMode("mobile")}
                className={\`p-1.5 rounded-md transition-colors \${deviceMode === "mobile" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Smartphone size={16} />
              </button>
            </div>
            {/* View Switcher (Accueil, Produit, Commande) */}
            <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800">
              <button 
                onClick={() => { setPreviewView("home"); setActiveMenu("main"); }}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 \${previewView === "home" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Store size={14} /> Accueil
              </button>
              <button 
                onClick={() => { setPreviewView("product"); }}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 \${previewView === "product" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <ShoppingBag size={14} /> Produit
              </button>
              <button 
                onClick={() => { setPreviewView("checkout"); }}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 \${previewView === "checkout" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Check size={14} /> Commande
              </button>
            </div>
            <Link
              to="/store"
              className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={14} /> Voir la boutique
            </Link>
          </div>
          {/* Interactive Live Theme Store View */}
          <div className={\`flex-1 overflow-y-auto bg-[#fafafa] flex justify-center \${deviceMode === "mobile" ? "p-4" : ""}\`}>
            <div className={\`transition-all duration-300 \${deviceMode === "mobile" ? "w-[390px] border-4 border-neutral-800 rounded-3xl shadow-xl overflow-hidden bg-white my-auto" : "w-full"}\`}>
              <ThemeStorePreview 
                theme={currentTheme}
                config={config}
                currentView={previewView}
                onSectionSelect={(sectionId) => {
                  if (sectionId === 'header') { setActiveMenu('header'); }
                  if (sectionId === 'hero_banner') { setActiveMenu('hero'); }
                  if (sectionId === 'trust') { setActiveMenu('trust'); }
                  if (sectionId === 'categories') { setActiveMenu('categories'); }
                  if (sectionId === 'featured') { setActiveMenu('featured'); }
                  if (sectionId === 'announcement') { setActiveMenu('announcement'); }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/pages/Customize.tsx', content);
