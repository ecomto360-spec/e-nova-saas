import { useState, useEffect } from "react";
import { 
  Palette, 
  Sparkles, 
  Check, 
  Eye, 
  Zap, 
  Info, 
  Store, 
  ShoppingBag, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Sliders,
  Smartphone,
  Cpu,
  Scissors,
  Lock,
  Square,
  Circle,
  SquareDashedBottomCode,
  Heart,
  Gem,
  Waves,
  ListOrdered,
  LayoutGrid,
  Feather,
  CircleDot,
  List,
  Tag
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  STORE_THEMES, 
  CHECKOUT_DESIGNS, 
  VARIANT_DESIGNS, 
  StoreTheme,
  CheckoutDesign,
  VariantDesign 
} from "../data/themesData";
import { ThemePreviewModal } from "../components/storefront/ThemePreviewModal";

const renderIcon = (name?: string, size: number = 24, className?: string) => {
  switch (name) {
    case "ShoppingBag": return <ShoppingBag size={size} className={className} />;
    case "Feather": return <Feather size={size} className={className} />;
    case "ListOrdered": return <ListOrdered size={size} className={className} />;
    case "LayoutGrid": return <LayoutGrid size={size} className={className} />;
    case "Square": return <Square size={size} className={className} />;
    case "Circle": return <Circle size={size} className={className} />;
    case "SquareDashedBottomCode": return <SquareDashedBottomCode size={size} className={className} />;
    case "Heart": return <Heart size={size} className={className} />;
    case "Gem": return <Gem size={size} className={className} />;
    case "Waves": return <Waves size={size} className={className} />;
    case "Layers": return <Layers size={size} className={className} />;
    case "Cpu": return <Cpu size={size} className={className} />;
    case "CircleDot": return <CircleDot size={size} className={className} />;
    case "List": return <List size={size} className={className} />;
    case "Tag": return <Tag size={size} className={className} />;
    default: return <Palette size={size} className={className} />;
  }
};

export default function Themes() {
  // Tabs: 'store' | 'checkout' | 'variant'
  const [activeTab, setActiveTab] = useState<"store" | "checkout" | "variant">("store");
  
  // Active installed theme ID
  const [activeThemeId, setActiveThemeId] = useState<string>(
    localStorage.getItem("dzbuild_active_theme") || "starter"
  );
  
  // Active fast checkout & variant design
  const [activeCheckoutId, setActiveCheckoutId] = useState<string>(
    localStorage.getItem("dzbuild_active_checkout") || "modal_classic"
  );
  const [activeVariantId, setActiveVariantId] = useState<string>(
    localStorage.getItem("dzbuild_active_variant") || "color_swatches"
  );

  // Preview modal state
  const [previewTheme, setPreviewTheme] = useState<StoreTheme | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Toast notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // Fetch current theme from Firestore
  useEffect(() => {
    const fetchCurrentTheme = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "tenants", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.activeTheme) {
              setActiveThemeId(data.activeTheme);
              localStorage.setItem("dzbuild_active_theme", data.activeTheme);
            }
            if (data.activeCheckout) {
              setActiveCheckoutId(data.activeCheckout);
              localStorage.setItem("dzbuild_active_checkout", data.activeCheckout);
            }
            if (data.activeVariant) {
              setActiveVariantId(data.activeVariant);
              localStorage.setItem("dzbuild_active_variant", data.activeVariant);
            }
          }
        } catch (error) {
          console.error("Error fetching active theme:", error);
        }
      }
    };

    fetchCurrentTheme();
  }, []);

  // Show Toast
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Apply Store Theme
  const handleApplyTheme = async (theme: StoreTheme) => {
    setLoading(true);
    setActiveThemeId(theme.id);
    localStorage.setItem("dzbuild_active_theme", theme.id);

    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "tenants", user.uid);
        await updateDoc(docRef, {
          activeTheme: theme.id,
          activeThemeName: theme.name,
          themeVersion: theme.version || "V2",
          updatedAt: new Date()
        });
      } catch (err) {
        console.error("Error updating theme in database:", err);
      }
    }

    setLoading(false);
    if (previewModalOpen) {
      setPreviewModalOpen(false);
    }
    showToast(`Le thème "${theme.name}" a été activé et appliqué avec succès à votre boutique !`);
  };

  // Apply Checkout Design
  const handleApplyCheckout = async (checkout: CheckoutDesign) => {
    setActiveCheckoutId(checkout.id);
    localStorage.setItem("dzbuild_active_checkout", checkout.id);

    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "tenants", user.uid);
        await updateDoc(docRef, {
          activeCheckout: checkout.id,
          activeCheckoutName: checkout.name
        });
      } catch (err) {
        console.error("Error updating checkout design:", err);
      }
    }
    showToast(`Le style de Fast Checkout "${checkout.name}" a été appliqué !`);
  };

  // Apply Variant Design
  const handleApplyVariant = async (variant: VariantDesign) => {
    setActiveVariantId(variant.id);
    localStorage.setItem("dzbuild_active_variant", variant.id);

    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "tenants", user.uid);
        await updateDoc(docRef, {
          activeVariant: variant.id,
          activeVariantName: variant.name
        });
      } catch (err) {
        console.error("Error updating variant design:", err);
      }
    }
    showToast(`Le sélecteur de variantes "${variant.name}" a été appliqué !`);
  };

  const handleOpenPreview = (theme: StoreTheme) => {
    setPreviewTheme(theme);
    setPreviewModalOpen(true);
  };

  const currentActiveThemeObj = STORE_THEMES.find(t => t.id === activeThemeId) || STORE_THEMES[0];
  const currentActiveCheckoutObj = CHECKOUT_DESIGNS.find(t => t.id === activeCheckoutId) || CHECKOUT_DESIGNS[0];
  const currentActiveVariantObj = VARIANT_DESIGNS.find(t => t.id === activeVariantId) || VARIANT_DESIGNS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-neutral-900 border border-amber-500/40 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-400">Succès</p>
            <p className="text-xs text-neutral-200">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header Section (Matching Image 1 & 2) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            {activeTab === "store" && <Palette size={22} />}
            {activeTab === "checkout" && <Zap size={22} />}
            {activeTab === "variant" && <Palette size={22} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === "store" && "Thèmes de la boutique"}
              {activeTab === "checkout" && "Thème du Fast Checkout"}
              {activeTab === "variant" && "Styles des variantes"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {activeTab === "store" && "Choisissez le design qui correspond le mieux à votre marque"}
              {activeTab === "checkout" && "Choisissez le design du formulaire de commande rapide affiché sur la page produit."}
              {activeTab === "variant" && "Choisissez l'apparence des sélecteurs de couleur, taille et options sur vos pages produits."}
            </p>
          </div>
        </div>
      </div>

      {/* Top Tabs (Boutique 7, Fast Checkout 5, Variantes 12 - Matching Image 1) */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "store"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1e1e24] dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <Store size={16} />
          <span>Boutique</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
            activeTab === "store" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-neutral-400"
          }`}>
            {STORE_THEMES.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("checkout")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "checkout"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1e1e24] dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <Zap size={16} />
          <span>Fast Checkout</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
            activeTab === "checkout" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-neutral-400"
          }`}>
            {CHECKOUT_DESIGNS.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("variant")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "variant"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1e1e24] dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <Layers size={16} />
          <span>Variantes</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
            activeTab === "variant" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-neutral-400"
          }`}>
            {VARIANT_DESIGNS.length}
          </span>
        </button>
      </div>

      {/* Informational Alert Notices */}
      {activeTab === "store" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="leading-relaxed">
            Thème actuel : <strong className="font-bold underline">{currentActiveThemeObj.name} {currentActiveThemeObj.version || ""}</strong> — Vos personnalisations (couleurs, textes, images) sont conservées lors du changement de thème.
          </p>
        </div>
      )}

      {activeTab === "checkout" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p>Vos personnalisations (titre, texte du bouton, couleur de fond, masquer l'adresse, afficher les notes, etc.) sont <strong>conservées</strong> quel que soit le thème choisi.</p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-400 text-sm">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <p>Thème actuel : <strong className="font-bold">{currentActiveCheckoutObj.name}</strong></p>
          </div>
        </div>
      )}

      {activeTab === "variant" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-400 text-sm">
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <p>Style actuel : <strong className="font-bold">{currentActiveVariantObj.name}</strong></p>
        </div>
      )}

      {/* TAB 1: Store Themes Grid (Matching Image 1) */}
      {activeTab === "store" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STORE_THEMES.map((theme) => {
            const isCurrent = theme.id === activeThemeId;

            return (
              <div 
                key={theme.id}
                className={`flex flex-col bg-white dark:bg-[#1e1e24] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  isCurrent 
                    ? "border-amber-500 ring-2 ring-amber-500/30" 
                    : "border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                }`}
              >
                {/* Theme Thumbnail Preview Header (Matching Screenshot 1) */}
                <div className="relative aspect-[16/10] bg-gray-100 dark:bg-neutral-900 overflow-hidden group cursor-pointer" onClick={() => handleOpenPreview(theme)}>
                  <img 
                    src={theme.thumbnail} 
                    alt={theme.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPreview(theme);
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-gray-100 transform active:scale-95"
                    >
                      <Eye size={14} />
                      <span>Aperçu en direct</span>
                    </button>
                  </div>

                  {/* Active Badge on Thumbnail */}
                  {isCurrent && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                      <Check size={12} strokeWidth={3} />
                      <span>ACTIF</span>
                    </div>
                  )}

                  {/* Optional Theme Tag */}
                  {theme.badge && !isCurrent && (
                    <div className="absolute top-3 left-3 bg-neutral-900/90 text-neutral-200 border border-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      {theme.badge}
                    </div>
                  )}
                </div>

                {/* Theme Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Title & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-amber-500 shrink-0" />
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{theme.name}</h3>
                      </div>
                      {theme.version && (
                        <span className="text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 px-2 py-0.5 rounded font-mono">
                          {theme.version}
                        </span>
                      )}
                    </div>

                    {/* Tag badge below title if digital or specific */}
                    {theme.id === "digital" && (
                      <span className="inline-block text-[11px] text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 rounded-full mb-2 font-medium">
                        Produits digitaux uniquement
                      </span>
                    )}

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed mb-4">
                      {theme.description}
                    </p>

                    {/* Features checklist (Matching Screenshot 1) */}
                    <div className="space-y-2 border-t border-gray-100 dark:border-neutral-800/80 pt-3">
                      {theme.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-neutral-300">
                          <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions (Activer ce thème & Aperçu - Matching Screenshot 1) */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      onClick={() => handleApplyTheme(theme)}
                      disabled={isCurrent || loading}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 cursor-default"
                          : "bg-amber-500 text-black hover:bg-amber-400 shadow-sm active:scale-95"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check size={14} />
                          <span>Thème actuel</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>Activer ce thème</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenPreview(theme)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                    >
                      <Eye size={14} />
                      <span>Aperçu</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Fast Checkout Designs */}
      {activeTab === "checkout" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHECKOUT_DESIGNS.map((checkout) => {
            const isCurrent = checkout.id === activeCheckoutId;

            return (
              <div 
                key={checkout.id}
                className={`flex flex-col bg-white dark:bg-[#1e1e24] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm relative ${
                  isCurrent 
                    ? "border-emerald-500 ring-2 ring-emerald-500/30" 
                    : "border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                }`}
              >
                {/* Header Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                  {isCurrent ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <Check size={10} /> Actif
                    </span>
                  ) : <div />}

                  {checkout.planBadge && (
                    <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                      checkout.planBadge === "PRO" ? "bg-emerald-500" :
                      checkout.planBadge === "UNLIMITED" ? "bg-amber-500 text-black" :
                      "bg-indigo-600"
                    }`}>
                      {checkout.planBadge}
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5 pt-12">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 flex items-center justify-center mb-4 border border-gray-200 dark:border-neutral-700">
                      {renderIcon(checkout.iconName, 24)}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      {checkout.name}
                      {checkout.isLocked && <Lock size={14} className="text-gray-400" />}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed mb-5">
                      {checkout.description}
                    </p>
                    <div className="space-y-2.5 pt-4 border-t border-gray-100 dark:border-neutral-800">
                      {checkout.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-neutral-300">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    {checkout.isLocked ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button className="col-span-2 bg-[#6d28d9] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#5b21b6] transition-colors flex items-center justify-center gap-1.5">
                          <Lock size={14} />
                          Passer à {checkout.planBadge}
                        </button>
                        <button className="col-span-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-neutral-700 py-2.5 rounded-xl text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                          <Eye size={14} /> Aperçu
                        </button>
                      </div>
                    ) : isCurrent ? (
                      <button className="w-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                        <Check size={14} /> Thème actif
                      </button>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleApplyCheckout(checkout)}
                          className="col-span-2 bg-amber-500 text-black py-2.5 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Activer ce thème
                        </button>
                        <button className="col-span-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-neutral-700 py-2.5 rounded-xl text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                          <Eye size={14} /> Aperçu
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Variants Designs */}
      {activeTab === "variant" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VARIANT_DESIGNS.map((variant) => {
            const isCurrent = variant.id === activeVariantId;

            return (
              <div 
                key={variant.id}
                className={`flex flex-col bg-white dark:bg-[#1e1e24] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm relative ${
                  isCurrent 
                    ? "border-emerald-500 ring-2 ring-emerald-500/30" 
                    : "border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                }`}
              >
                {/* Header Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                  {isCurrent ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <Check size={10} /> Actif
                    </span>
                  ) : <div />}

                  {variant.planBadge && (
                    <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                      variant.planBadge === "PRO" ? "bg-emerald-500" :
                      variant.planBadge === "UNLIMITED" ? "bg-amber-500 text-black" :
                      "bg-indigo-600"
                    }`}>
                      {variant.planBadge}
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5 pt-12">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 flex items-center justify-center mb-4 border border-gray-200 dark:border-neutral-700">
                      {renderIcon(variant.iconName, 24)}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      {variant.name}
                      {variant.isLocked && <Lock size={14} className="text-gray-400" />}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed mb-5">
                      {variant.description}
                    </p>
                    <div className="space-y-2.5 pt-4 border-t border-gray-100 dark:border-neutral-800">
                      {variant.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-neutral-300">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    {variant.isLocked ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button className="col-span-2 bg-[#6d28d9] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#5b21b6] transition-colors flex items-center justify-center gap-1.5">
                          <Lock size={14} />
                          Passer à {variant.planBadge}
                        </button>
                        <button className="col-span-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-neutral-700 py-2.5 rounded-xl text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                          <Eye size={14} /> Aperçu
                        </button>
                      </div>
                    ) : isCurrent ? (
                      <button className="w-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                        <Check size={14} /> Style actif
                      </button>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleApplyVariant(variant)}
                          className="col-span-2 bg-amber-500 text-black py-2.5 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Activer ce style
                        </button>
                        <button className="col-span-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-neutral-700 py-2.5 rounded-xl text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                          <Eye size={14} /> Aperçu
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Theme Preview Modal */}
      {previewTheme && (
        <ThemePreviewModal
          theme={previewTheme}
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          onApplyTheme={handleApplyTheme}
          isCurrentTheme={previewTheme.id === activeThemeId}
        />
      )}
    </div>
  );
}
