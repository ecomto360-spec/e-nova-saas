import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  Palette,  
  Check, 
  Eye, 
  Zap, 
  Info, 
  Store, 
  ShoppingBag, 
  Layers, 
  CheckCircle2, 
  Sliders,
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
  Tag,
  RotateCw,
  X
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
import {
  THEME_REGISTRY,
  THEME_CATEGORIES,
  EnovaThemeManifest,
  ThemeCategory,
  getManifestByLegacyId,
} from "../themes/registry";
import {
  ensureStoreThemeMigration,
  activateTheme,
} from "../lib/themeSettingsService";

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
    case "Scissors": return <Scissors size={size} className={className} />;
    case "CircleDot": return <CircleDot size={size} className={className} />;
    case "List": return <List size={size} className={className} />;
    case "Tag": return <Tag size={size} className={className} />;
    default: return <Palette size={size} className={className} />;
  }
};

const CATEGORY_BADGES: Record<ThemeCategory, { label: string; className: string }> = {
  ecommerce: { label: "E-Commerce", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  digital_services: { label: "Digital & Services", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  corporate: { label: "Vitrine Entreprise", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
};

export default function Themes() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Tabs: 'store' | 'checkout' | 'variant'
  const [activeTab, setActiveTab] = useState<"store" | "checkout" | "variant">("store");
  
  // Active installed theme ID (registre)
  const [activeRegistryThemeId, setActiveRegistryThemeId] = useState<string>("starter_v2");
  const [categoryFilter, setCategoryFilter] = useState<ThemeCategory | "all">("all");
  
  // Active fast checkout & variant design
  const [activeCheckoutId, setActiveCheckoutId] = useState<string>(
    localStorage.getItem("dzbuild_active_checkout") || "modal_classic"
  );
  const [activeVariantId, setActiveVariantId] = useState<string>(
    localStorage.getItem("dzbuild_active_variant") || "color_swatches"
  );

  // Preview modal state
  const [previewTheme, setPreviewTheme] = useState<StoreTheme | null>(null);
  const [previewManifest, setPreviewManifest] = useState<EnovaThemeManifest | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Activation confirmation modal
  const [confirmManifest, setConfirmManifest] = useState<EnovaThemeManifest | null>(null);
  
  // Toast notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // Migration vers le registre + lecture du thème actif
  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        // 1) Migration idempotente (boutiques existantes -> registre, sans perte)
        const { manifestId } = await ensureStoreThemeMigration(user.uid);
        setActiveRegistryThemeId(manifestId);

        // 2) Checkout / variantes actifs
        const docRef = doc(db, "tenants", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
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
        console.warn("Notice fetching active theme:", error);
      }
    };

    init();
  }, []);

  // Show Toast
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ---- Activation d'un thème du registre (avec confirmation) ----
  const runActivation = async (manifest: EnovaThemeManifest) => {
    setLoading(true);
    const user = auth.currentUser;
    try {
      if (user) {
        await activateTheme(user.uid, manifest.id);
      }
      setActiveRegistryThemeId(manifest.id);
      setConfirmManifest(null);
      if (previewModalOpen) setPreviewModalOpen(false);
      showToast(`Le thème « ${manifest.name} » est actif ! Vos données de marque (logo, nom, couleurs) ont été reprises — la personnalisation de chaque thème est conservée séparément.`);
    } catch (err) {
      console.error("Error activating theme:", err);
      showToast("Une erreur est survenue lors de l'activation du thème. Réessayez.", "info");
    } finally {
      setLoading(false);
    }
  };

  // Appelé par la modale d'aperçu (bouton « Appliquer ce thème »)
  const handleApplyLegacyTheme = async (theme: StoreTheme) => {
    const manifest = getManifestByLegacyId(theme.id);
    if (!manifest) return;
    await runActivation(manifest);
  };

  // ---- Checkout / Variantes (comportement inchangé) ----
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

  const handleOpenPreview = (manifest: EnovaThemeManifest) => {
    const legacy = STORE_THEMES.find(th => th.id === manifest.legacyStoreThemeId) || STORE_THEMES[0];
    setPreviewTheme(legacy);
    setPreviewManifest(manifest);
    setPreviewModalOpen(true);
  };

  const currentActiveManifest = THEME_REGISTRY.find(m => m.id === activeRegistryThemeId) || THEME_REGISTRY[0];
  const currentActiveCheckoutObj = CHECKOUT_DESIGNS.find(t => t.id === activeCheckoutId) || CHECKOUT_DESIGNS[0];
  const currentActiveVariantObj = VARIANT_DESIGNS.find(t => t.id === activeVariantId) || VARIANT_DESIGNS[0];

  const filteredThemes = THEME_REGISTRY.filter(
    m => categoryFilter === "all" || m.category === categoryFilter
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-3 bg-neutral-900 border border-amber-500/40 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-400">Succès</p>
            <p className="text-xs text-neutral-200 max-w-md">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header Section */}
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
              {activeTab === "store" && "9 thèmes professionnels, activables en 1 clic et entièrement personnalisables"}
              {activeTab === "checkout" && "Choisissez le design du formulaire de commande rapide affiché sur la page produit."}
              {activeTab === "variant" && "Choisissez l'apparence des sélecteurs de couleur, taille et options sur vos pages produits."}
            </p>
          </div>
        </div>
      </div>

      {/* Top Tabs */}
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
          <span>{t("store.storeFront")}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
            activeTab === "store" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-neutral-400"
          }`}>
            {THEME_REGISTRY.length}
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
          <span>{t("store.variants")}</span>
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
            Thème actuel : <strong className="font-bold underline">{currentActiveManifest.name}</strong> — Chaque thème garde sa personnalisation : changez de thème puis revenez, vos réglages sont restaurés. Les données de marque (logo, nom, couleurs, textes) sont reprises automatiquement.
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

      {/* TAB 1: Store Themes (registre) */}
      {activeTab === "store" && (
        <div className="space-y-5">
          {/* Filtres par catégorie */}
          <div className="flex flex-wrap items-center gap-2">
            {THEME_CATEGORIES.map(cat => {
              const count = cat.id === "all"
                ? THEME_REGISTRY.length
                : THEME_REGISTRY.filter(m => m.category === cat.id).length;
              const isActive = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:text-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-600"
                  }`}
                >
                  {cat.label}
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? "bg-black/10 text-black" : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grille des thèmes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map((manifest) => {
              const isCurrent = manifest.id === activeRegistryThemeId;
              const badge = CATEGORY_BADGES[manifest.category];

              return (
                <div 
                  key={manifest.id}
                  className={`flex flex-col bg-white dark:bg-[#1e1e24] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                    isCurrent 
                      ? "border-amber-500 ring-2 ring-amber-500/30" 
                      : "border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                  }`}
                >
                  {/* Aperçu (image) */}
                  <div className="relative aspect-[16/10] bg-gray-100 dark:bg-neutral-900 overflow-hidden group cursor-pointer" onClick={() => handleOpenPreview(manifest)}>
                    <img 
                      src={manifest.previewImage} 
                      alt={manifest.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview(manifest);
                        }}
                        className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-gray-100 transform active:scale-95"
                      >
                        <Eye size={14} />
                        <span>Aperçu en direct</span>
                      </button>
                    </div>

                    {isCurrent && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                        <Check size={12} strokeWidth={3} />
                        <span>ACTIF</span>
                      </div>
                    )}

                    {!isCurrent && manifest.isNew && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md">
                        NOUVEAU
                      </div>
                    )}

                    <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${badge.className}`}>
                      {badge.label}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Store className="w-5 h-5 text-amber-500 shrink-0" />
                          <h3 className="font-bold text-base text-gray-900 dark:text-white">{manifest.name}</h3>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-medium" dir="rtl">{manifest.nameAr}</span>
                      </div>

                      {manifest.supportsQuote && (
                        <span className="inline-block text-[11px] text-blue-500 border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 rounded-full mb-2 font-medium">
                          « Demander un devis » + Leads
                        </span>
                      )}
                      {!manifest.supportsCart && !manifest.supportsQuote && (
                        <span className="inline-block text-[11px] text-neutral-400 border border-neutral-500/30 bg-neutral-500/10 px-2.5 py-0.5 rounded-full mb-2 font-medium">
                          Vitrine sans panier
                        </span>
                      )}

                      <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed mb-4">
                        {manifest.description}
                      </p>

                      <div className="space-y-2 border-t border-gray-100 dark:border-neutral-800/80 pt-3">
                        {manifest.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-neutral-300">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`grid gap-3 pt-3 border-t border-gray-100 dark:border-neutral-800 ${isCurrent ? "grid-cols-2" : "grid-cols-2"}`}>
                      {isCurrent ? (
                        <button
                          onClick={() => navigate("/dashboard/customize")}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                        >
                          <Sliders size={14} />
                          <span>Personnaliser</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmManifest(manifest)}
                          disabled={loading}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Zap size={14} />
                          <span>Activer ce thème</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenPreview(manifest)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                      >
                        <Eye size={14} />
                        <span>{t("store.preview")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Modale de confirmation d'activation */}
      {confirmManifest && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1e1e24] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0"
                style={{ backgroundColor: confirmManifest.defaultColors.primary }}
              >
                {confirmManifest.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">Activer « {confirmManifest.name} » ?</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">{CATEGORY_BADGES[confirmManifest.category].label}</p>
              </div>
              <button
                onClick={() => setConfirmManifest(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>Vos <strong>données de marque</strong> (logo, nom de boutique, couleurs personnalisées, textes d'annonce) sont <strong>reprises automatiquement</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>La personnalisation du thème actuel est <strong>conservée</strong> : si vous y revenez plus tard, vous la retrouverez intacte.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>Vous pourrez ajuster toutes les sections, couleurs et textes juste après, via « Personnaliser ».</p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center gap-3">
              <button
                onClick={() => setConfirmManifest(null)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => runActivation(confirmManifest)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <RotateCw size={14} className="animate-spin" /> : <Zap size={14} />}
                {loading ? "Activation..." : "Activer ce thème"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Theme Preview Modal */}
      {previewTheme && previewManifest && (
        <ThemePreviewModal
          theme={previewTheme}
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          onApplyTheme={handleApplyLegacyTheme}
          isCurrentTheme={previewManifest.id === activeRegistryThemeId}
          registryThemeId={previewManifest.id}
        />
      )}
    </div>
  );
}
