import React, { useState, useMemo, FormEvent, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { StoreCustomizerConfig } from "../admin/StoreCustomizerConfig";
import { 
  ArrowRight,
  ShoppingCart,
  ClipboardList,
  User,
  Map,
  MapPin,
  Home,
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  Phone, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  ArrowLeft,
  Filter,
  Eye,
  Heart,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Clipboard,
  Package,
  Box,
  Copy
} from "lucide-react";
import { StoreTheme, StoreDemoProduct } from "../../data/themesData";
import { ALGERIAN_WILAYAS as WILAYAS_LIST } from "../../data/landingData";
import { getCommunesForWilaya } from "../../data/algerianCommunes";
import { isPhoneBlacklisted } from "../../lib/blacklist";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../../lib/phoneUtils";

const RenderStars = ({ count, reviewsCount }: { count?: number; reviewsCount?: number }) => {
  if (!count) return null;
  
  return (

    <div className="flex items-center gap-1.5 mb-2 flex-row-reverse justify-end">
      <div className="flex gap-0.5 flex-row-reverse">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3.5 w-3.5 ${i < Math.floor(count) ? "fill-amber-500 text-amber-500" : "fill-gray-200 text-gray-800"}`} 
          />
        ))}
      </div>
      {reviewsCount && (
        <span className="text-[10px] text-gray-400 font-medium">({reviewsCount})</span>
      )}
    </div>
  );
};

interface ThemeStorePreviewProps {
  config?: StoreCustomizerConfig;
  theme: StoreTheme;
  customStoreName?: string;
  customLogoUrl?: string;
  isStandaloneView?: boolean;
  actualProducts?: any[];
  actualCategories?: any[];
  currentView?: "home" | "product" | "checkout";
  onSectionSelect?: (sectionId: string) => void;
  initialProductId?: string;
  tenantId?: string;
}

export function ThemeStorePreview({ theme, config, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts,
  actualCategories, currentView = "home", onSectionSelect, initialProductId, tenantId }: ThemeStorePreviewProps) {
  
  const isActivated = config?.isActivated || false;

  // Helpers to get value based on state
  const getVal = (configVal, fallbackDemo, placeholder = "") => {
    if (!isActivated) return fallbackDemo;
    return configVal || placeholder;
  };
  
  const getBool = (configVal, fallbackDemo) => {
    if (!isActivated) return fallbackDemo;
    return configVal;
  };

  const c_primaryColor = getVal(config?.primaryColor, theme.primaryColor, "#dddddd");
  const c_fontFamily = getVal(config?.fontFamily, "sans", "sans");
  const c_lang = getVal(config?.language, "ar", "ar");
  const isRtl = c_lang === "ar";
  
  // Header
  const c_storeName = getVal(config?.storeName, theme.nameAr || theme.name || "أزياء الموضة", "Nom de la boutique");
  const c_logoUrl = getVal(config?.logoUrl, customLogoUrl || "", "");
  
  // Hero
  const c_heroShow = getBool(config?.showHero, true);
  const c_heroBg = getVal(config?.heroDesktopBg, theme.bannerImage, "");
  const c_heroTitle = getVal(config?.heroTitle, theme.bannerHeadlineAr || theme.bannerHeadline, "Titre principal");
  const c_heroSubtitle = getVal(config?.heroSubtitle, theme.bannerSubheadlineAr || theme.bannerSubheadline, "Description de votre boutique");
  const c_heroBtn = getVal(config?.heroButtonText, theme.bannerCtaAr || "تسوق الآن", "Bouton");
  
  // Announcement
  const c_announcementShow = getBool(config?.showAnnouncement, true);
  const c_announcementBg = getVal(config?.announcementBgColor, theme.primaryColor || "#f59e0b", "#999999");
  const c_announcementText = getVal(config?.announcementText, "{c_announcementText}", "Votre message d'annonce");
  const c_announcementTextColor = getVal(config?.announcementTextColor, "#ffffff", "#ffffff");

  
  // Header
  
  const c_faviconUrl = getVal(config?.faviconUrl, "", "");
  
  useEffect(() => {
    if (c_faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = c_faviconUrl;
    }
  }, [c_faviconUrl]);

  const c_navBgColor = getVal(config?.navBgColor, "#ffffff", "#ffffff");
  const c_navTextColor = getVal(config?.navTextColor, "#1f2937", "#1f2937");
  const c_navStyle = getVal(config?.navStyle, "default", "default");
  const c_menuStyle = getVal(config?.menuStyle, "default", "default");
  const c_logoSize = getVal(config?.logoSize, "medium", "medium");
  const c_showStoreNameWithLogo = getBool(config?.showStoreNameWithLogo, false);
  const c_cartIconStyle = getVal(config?.cartIconStyle, "default", "default");
  const c_isSticky = getBool(config?.isSticky, true);
  const c_hasShadow = getBool(config?.hasShadow, true);
  const c_hasBottomBorder = getBool(config?.hasBottomBorder, false);
  const c_showCartIcon = getBool(config?.showCartIcon, true);
  const c_hideOnProductPage = getBool(config?.hideOnProductPage, false);

  // Trust
  const c_trustShow = getBool(config?.showTrustBadges, true);
  
  // Categories
  const c_categoriesShow = getBool(config?.showCategories, true);

  // Featured
  const c_featuredShow = getBool(config?.showFeatured, true);

  
  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialProductId && actualProducts && actualProducts.length > 0) {
      const found = actualProducts.find(p => p.id === initialProductId);
      if (found) {
        handleOpenProduct(found);
      }
    }
  }, [initialProductId, actualProducts]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(1);
  
  // Active product for COD Fast Checkout Modal
  const [selectedProduct, setSelectedProduct] = useState<StoreDemoProduct | null>(null);
  const [currentProductImage, setCurrentProductImage] = useState<string>("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  
  // COD Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhoneError, setCustomerPhoneError] = useState("");
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number | "">(16); // Default Alger (16)
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [commune, setCommune] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [trackingView, setTrackingView] = useState(false);

  // Communes disponibles filtrées selon la wilaya choisie
  const availableCommunes = useMemo(() => {
    if (!selectedWilayaCode) return [];
    return getCommunesForWilaya(Number(selectedWilayaCode));
  }, [selectedWilayaCode]);

  // Helper pour entourer les sections cliquables
  const EditableSection = ({ id, children, className = "" }: { id: string, children: React.ReactNode, className?: string }) => {
    if (isStandaloneView) return <div className={className}>{children}</div>;
    return (
      <div 
        className={`relative group/section cursor-pointer ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onSectionSelect) onSectionSelect(id);
        }}
      >
        <div className="absolute inset-0 border-2 border-transparent group-hover/section:border-amber-500 group-hover/section:bg-amber-500/5 transition-all z-40 pointer-events-none rounded-lg m-0.5"></div>
        {/* Badge indicateur au survol */}
        <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/section:opacity-100 transition-opacity z-50 pointer-events-none shadow-sm">
          Modifier
        </div>
        {children}
      </div>
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayCategories = useMemo(() => {
    if (actualCategories !== undefined) {
      return actualCategories.map(c => ({
        id: c.name, // The product.category usually matches the category name in the db
        name: c.name,
        nameAr: c.name,
        image: c.imageUrl,
        productCount: c.productCount || 0
      }));
    }
    return theme.categories;
  }, [actualCategories, theme.categories]);

  // Categories list with "All"
  const categories = useMemo(() => {
    return [
      { id: "all", nameAr: "الكل", name: "Tous" },
      ...displayCategories
    ];
  }, [displayCategories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return (actualProducts ? actualProducts : theme.products).filter(product => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.nameAr && product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [(actualProducts ? actualProducts : theme.products), selectedCategory, searchQuery]);

  // Featured products
  const featuredProducts = useMemo(() => {
    return (actualProducts ? actualProducts : theme.products).filter(p => p.isFeatured).slice(0, 4);
  }, [(actualProducts ? actualProducts : theme.products)]);

  // Calculate pricing for checkout
  const currentWilaya = useMemo(() => {
    if (!selectedWilayaCode) return null;
    return WILAYAS_LIST.find(w => w.code === Number(selectedWilayaCode)) || null;
  }, [selectedWilayaCode]);

  const deliveryPrice = useMemo(() => {
    if (!currentWilaya) return 400;
    return deliveryType === "home" ? currentWilaya.homeDeliveryPrice : currentWilaya.deskDeliveryPrice;
  }, [currentWilaya, deliveryType]);

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    
    // Calculate variant price differences
    let variantPriceDiff = 0;
    if (selectedProduct.variants && Object.keys(selectedVariants).length > 0) {
      selectedProduct.variants.forEach(v => {
        const selectedValue = selectedVariants[v.name];
        if (selectedValue) {
          const optMatch = v.options.find(o => typeof o === 'string' ? o === selectedValue : o.value === selectedValue);
          if (optMatch && typeof optMatch !== 'string' && optMatch.priceDiff) {
            variantPriceDiff += optMatch.priceDiff;
          }
        }
      });
    }

    return ((selectedProduct.price + variantPriceDiff) * quantity) + deliveryPrice;
  }, [selectedProduct, quantity, deliveryPrice, selectedVariants]);

  const handleOpenProduct = (product: StoreDemoProduct) => {
    setSelectedProduct(product);
    setCurrentProductImage(product.image);
    const initialVariants: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach(v => {
        if (v.options && v.options.length > 0) {
          const firstOpt = v.options[0];
          initialVariants[v.name] = typeof firstOpt === 'string' ? firstOpt : firstOpt.value;
        }
      });
    }
    setSelectedVariants(initialVariants);
    setQuantity(1);
    setOrderSuccess(false);
    setTrackingView(false);
  };

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const phoneValidation = validatePhoneNumber(customerPhone, "ar");
    if (!phoneValidation.isValid) {
      setCustomerPhoneError(phoneValidation.errorAr || phoneValidation.error || "رقم الهاتف غير صحيح");
      return;
    }
    setCustomerPhoneError("");

    if (!selectedWilayaCode) {
      alert("يرجى اختيار الولاية أولاً");
      return;
    }

    if (!commune.trim()) {
      alert("يرجى اختيار البلدية");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const generatedOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}-20260908-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
      
      const effectiveTenantId = tenantId || auth.currentUser?.uid;

      if (effectiveTenantId && customerPhone) {
        const isBanned = await isPhoneBlacklisted(effectiveTenantId, customerPhone);
        if (isBanned) {
          alert("عذراً، هذا الرقم محظور من إتمام الطلبات في هذا المتجر. / Ce numéro de téléphone est sur liste noire pour cette boutique.");
          setIsSubmitting(false);
          return;
        }
      }
      
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const formattedDateWithTime = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      if (effectiveTenantId) {
        // Save to real database
        const prodImg = selectedProduct.image || (selectedProduct.images && selectedProduct.images[0]) || "";
        const orderData = {
          orderNumber: generatedOrderId.substring(4, 10), // Short number for dashboard display
          reference: generatedOrderId,
          userId: effectiveTenantId,
          client: customerName,
          phone: customerPhone,
          wilaya: currentWilaya ? `${currentWilaya.code < 10 ? `0${currentWilaya.code}` : currentWilaya.code} - ${currentWilaya.arName}` : "الجزائر",
          commune: commune || "",
          address: customerAddress.trim() || (deliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
          itemsSummary: `${quantity}x ${selectedProduct.nameAr || selectedProduct.name}`,
          total: totalPrice,
          status: "En attente",
          date: formattedDateWithTime,
          createdAt: serverTimestamp(),
          image: prodImg,
          productImage: prodImg,
          items: [{
            productId: selectedProduct.id || "demo-product",
            name: selectedProduct.nameAr || selectedProduct.name,
            price: selectedProduct.price,
            quantity: quantity,
            variants: selectedVariants,
            image: prodImg
          }],
          shippingMethod: deliveryType === "home" ? "Livraison à domicile" : "Point de relais",
          shippingCost: deliveryPrice,
        };
        
        await addDoc(collection(db, "orders"), orderData);
        // Also save to tenant subcollection to ensure compatibility
        await addDoc(collection(db, "tenants", effectiveTenantId, "orders"), orderData);

        // Real-time alert for Header notification bell and audio chime
        try {
          const alertPayload = {
            ...orderData,
            createdAt: Date.now()
          };
          window.dispatchEvent(new CustomEvent("order_created", { detail: alertPayload }));
          localStorage.setItem("last_order_alert", JSON.stringify(alertPayload));
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "order_created", data: alertPayload }, "*");
          }
        } catch (evErr) {
          console.warn("Order notification dispatch error:", evErr);
        }
      }
      
      setOrderId(generatedOrderId);
      setOrderSuccess(true);
      setCartCount(prev => prev + 1);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(`Une erreur est survenue lors de la confirmation de votre commande. Veuillez réessayer. Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 flex flex-col font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top Announcement Bar */}
      {c_announcementShow && (<div className="text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-3 font-medium transition-colors shadow-sm" style={{ backgroundColor: c_announcementBg, color: c_announcementTextColor }}
      >
        <span className="flex items-center gap-1.5 font-bold">
          <Truck className="w-4 h-4" />
          {c_announcementText}
        </span>
        <span className="hidden sm:inline opacity-80">•</span>
        <span className="hidden sm:inline font-normal">{isActivated ? "" : "ضمان استبدال وإرجاع مجاني لمدة 7 أيام"}</span></div>)}

      
      {/* Main Store Header */}
      <EditableSection id="header">
        <header 
          className={`${c_isSticky ? 'sticky top-0' : 'relative'} z-30 transition-all ${c_hasShadow ? 'shadow-sm' : ''} ${c_hasBottomBorder ? 'border-b border-gray-200' : ''} ${c_hideOnProductPage && selectedProduct ? 'hidden' : 'block'}`} 
          style={{ backgroundColor: c_navBgColor }}
        >
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center gap-4 ${c_navStyle === 'centered' ? 'justify-center relative' : 'justify-between'}`}>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg hover:opacity-70 ${c_navStyle === 'centered' ? 'absolute left-4' : ''}`}
            style={{ color: c_navTextColor }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo / Store Name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {!c_logoUrl && (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0"
                style={{ backgroundColor: c_primaryColor }}
              >
                {c_storeName.charAt(0)}
              </div>
              )}
              <div className="flex items-center gap-3">
                {c_logoUrl ? (
                  <img src={c_logoUrl} alt="Logo" className={`object-contain ${c_logoSize === 'small' ? 'max-h-8 sm:max-h-10' : c_logoSize === 'large' ? 'max-h-20 sm:max-h-24' : 'max-h-12 sm:max-h-16'} ${c_logoSize === 'large' ? 'max-w-[200px] sm:max-w-[280px]' : 'max-w-[150px] sm:max-w-[200px]'}`} />
                ) : null}
                {(!c_logoUrl || c_showStoreNameWithLogo) && (
                  <div className="flex flex-col">
                    <h1 className={`font-black tracking-tight ${c_logoUrl ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`} style={{ color: c_navTextColor }}>{c_storeName}</h1>
                    <span className="text-[10px] font-medium hidden sm:block opacity-60" style={{ color: c_navTextColor }}>المتجر الرسمي المعتمد</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className={`hidden md:flex flex-1 max-w-md mx-6 relative ${c_navStyle === 'centered' ? 'absolute right-20 w-64' : ''}`}>
            <input 
              type="text"
              placeholder="ابحث عن منتج، قسم، أو فئة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 border border-black/10 rounded-full py-2.5 pr-11 pl-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              style={{ color: c_navTextColor }}
            />
            <Search className="w-4 h-4 opacity-50 absolute right-4 top-1/2 -translate-y-1/2" style={{ color: c_navTextColor }} />
          </div>

          {/* Header Action Buttons */}
          <div className={`flex items-center gap-3 ${c_navStyle === 'centered' ? 'absolute right-4' : ''}`}>
            {c_showCartIcon && (
              <button 
                onClick={() => {
                  if ((actualProducts ? actualProducts : theme.products).length > 0) handleOpenProduct((actualProducts ? actualProducts : theme.products)[0]);
                }}
                className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors"
                title="السلة"
                style={{ color: c_navTextColor }}
              >
                {c_cartIconStyle === 'filled' ? (
                  <ShoppingBag className="w-5 h-5 fill-current" />
                ) : c_cartIconStyle === 'minimal' ? (
                  <ShoppingCart className="w-5 h-5" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
                
                {cartCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: c_primaryColor }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            
            <a 
              href="#order-now"
              onClick={(e) => {
                e.preventDefault();
                if ((actualProducts ? actualProducts : theme.products).length > 0) handleOpenProduct((actualProducts ? actualProducts : theme.products)[0]);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all transform active:scale-95"
              style={{ backgroundColor: c_primaryColor }}
            >
              <span>اطلب الآن</span>
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Navigation Bar (Desktop) */}
        <div className={`hidden lg:block border-t border-black/5 ${c_hideOnProductPage && selectedProduct ? 'hidden' : ''}`} style={{ backgroundColor: c_navBgColor }}>
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${c_navStyle === 'centered' ? 'flex justify-center' : ''}`}>
            <div className="flex items-center gap-8 py-2 text-sm font-semibold">
              <button 
                onClick={() => setSelectedCategory("all")}
                className={`transition-colors ${selectedCategory === "all" ? 'font-bold opacity-100' : 'opacity-70 hover:opacity-100'} ${
                  c_menuStyle === 'pills' ? (selectedCategory === "all" ? 'bg-black/10 px-4 py-1.5 rounded-full' : 'px-4 py-1.5') :
                  c_menuStyle === 'underline' ? (selectedCategory === "all" ? 'border-b-2 py-2' : 'py-2 border-b-2 border-transparent hover:border-black/20') :
                  c_menuStyle === 'square' ? (selectedCategory === "all" ? 'bg-black/10 px-4 py-1.5 rounded-md' : 'px-4 py-1.5') :
                  (selectedCategory === "all" ? 'border-b-2 py-2' : 'py-2 border-b-2 border-transparent')
                }`}
                style={{ 
                  color: c_navTextColor, 
                  borderColor: selectedCategory === "all" ? (c_menuStyle === 'underline' || c_menuStyle === 'default' ? c_primaryColor : 'transparent') : 'transparent' 
                }}
              >
                الرئيسية
              </button>
              {!isActivated && displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`transition-colors ${selectedCategory === cat.id ? 'font-bold opacity-100' : 'opacity-70 hover:opacity-100'} ${
                    c_menuStyle === 'pills' ? (selectedCategory === cat.id ? 'bg-black/10 px-4 py-1.5 rounded-full' : 'px-4 py-1.5') :
                    c_menuStyle === 'underline' ? (selectedCategory === cat.id ? 'border-b-2 py-2' : 'py-2 border-b-2 border-transparent hover:border-black/20') :
                    c_menuStyle === 'square' ? (selectedCategory === cat.id ? 'bg-black/10 px-4 py-1.5 rounded-md' : 'px-4 py-1.5') :
                    (selectedCategory === cat.id ? 'border-b-2 py-2' : 'py-2 border-b-2 border-transparent')
                  }`}
                  style={{ 
                    color: c_navTextColor, 
                    borderColor: selectedCategory === cat.id ? (c_menuStyle === 'underline' || c_menuStyle === 'default' ? c_primaryColor : 'transparent') : 'transparent' 
                  }}
                >
                  {cat.nameAr}
                </button>
              ))}
            </div>
          </div>
        </div>
        </header></EditableSection>


      {/* Hero Banner Section (Matching Screenshot 2 & 3) */}
      {!selectedProduct ? (
        <>
      {c_heroShow && <EditableSection id="hero_banner"><section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={c_heroBg || (isActivated ? undefined : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80")} 
            alt="Hero Banner" 
            className="w-full h-full object-cover object-center opacity-30 scale-105 transform hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/70 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تشكيلة الموسم الجديدة 2026</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
              {c_heroTitle || (isActivated ? "" : "أزياء عصرية لكل المناسبات")}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-8 font-normal leading-relaxed">
              {c_heroSubtitle || (isActivated ? "" : "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة وجودة عالية مع توصيل سريع لجميع الولايات.")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="#all-products"
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-xl hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {c_heroBtn}
              </a>
              <a 
                href="#categories"
                className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
              >
                تصفح الأقسام
              </a>
            </div>
          </div>
        </div>
      </section></EditableSection>}

      {/* Trust Badges */}
      {c_trustShow && (
<EditableSection id="trust"><section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">توصيل لـ 58 ولاية</h4>
                <p className="text-[11px] text-gray-500">سريع خلال 24 - 48 ساعة</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">الدفع عند الاستلام</h4>
                <p className="text-[11px] text-gray-500">افحص طلبك قبل الدفع</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">ضمان استبدال سهل</h4>
                <p className="text-[11px] text-gray-500">خلال 7 أيام من الاستلام</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">خدمة عملاء 7/7</h4>
                <p className="text-[11px] text-gray-500">رد فوري على الواتساب</p>
              </div>
            </div>
          </div>
        </div>
      </section></EditableSection>
)}

      {/* Categories Circle Grid (Matching Screenshot 2 & 3) */}
      {c_categoriesShow && <EditableSection id="categories"><section id="categories" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="text-right">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">تصفح الأقسام</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">اختر القسم المناسب وتصفح أفضل المنتجات</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`group flex flex-col items-center text-center p-4 rounded-2xl bg-white border transition-all duration-300 ${
                selectedCategory === cat.id 
                  ? "border-amber-500 shadow-md ring-2 ring-amber-500/20 bg-amber-50/20" 
                  : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-gray-100 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                {isActivated ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <ImageIcon size={24} />
                  </div>
                ) : (
                  <img 
                    src={cat.image} 
                    alt={cat.nameAr} className="w-full h-full object-cover object-center"
                  />
                )}
              </div>
              <span className={`font-bold text-sm transition-colors ${isActivated ? 'text-gray-400' : 'text-white group-hover:text-amber-600'}`}>
                {isActivated ? "قسم جديد" : cat.nameAr}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                {isActivated ? "0 منتجات" : `${cat.productCount} منتج`}
              </span>
            </button>
          ))}
        </div>
      </section></EditableSection>}

      {/* Featured Products Section (المنتجات المميزة - Matching Screenshot 2 & 4) */}
      {featuredProducts.length > 0 && c_featuredShow && (
        <EditableSection id="featured"><section id="featured" className="py-8 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md mb-1">
                  <Sparkles className="w-3 h-3" />
                  الأكثر مبيعاً
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">المنتجات المميزة</h3>
              </div>
              <a href="#all-products" className="text-xs sm:text-sm font-bold text-amber-600 hover:underline">
                عرض الكل ({(actualProducts ? actualProducts : theme.products).length})
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden cursor-pointer" onClick={() => handleOpenProduct(product)}>
                    
                      {product.image ? (
    <img 
      src={product.image} alt={product.nameAr || product.name}
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
    />
  ) : (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
      <ImageIcon size={32} />
    </div>
  )}
                    {/* Badges */}
                    {product.discountBadge && (
                      <span className="absolute top-2.5 right-2.5 bg-amber-500 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm">
                        {product.discountBadge}
                      </span>
                    )}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-right">
                    <div>
                      <span className="text-[11px] text-gray-400 font-medium block mb-1">
                        {product.categoryAr || product.category || "التصنيف"}
                      </span>
                      <h4 
                        onClick={() => handleOpenProduct(product)}
                        className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer mb-2"
                      >
                        {product.nameAr || product.name || "منتج تجريبي"}
                      </h4>
                      <RenderStars count={product.rating} reviewsCount={product.reviewsCount} />
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-3">
                      <div className="flex items-baseline gap-2 justify-start">
                        <span className="text-base sm:text-lg font-black text-gray-900">
                          {product.price ? product.price.toLocaleString() : "0"} د.ج
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {product.originalPrice.toLocaleString()} د.ج
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenProduct(product)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>اختر الخيارات / اطلب</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section></EditableSection>
      )}

      {/* All Products Catalog with Filter Tabs (Matching Screenshot 4) */}
      <EditableSection id="all_products"><section id="all-products" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="text-right">
            <h3 className="text-2xl font-black text-gray-900">جميع المنتجات</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">تصفح التشكيلة الكاملة بأفضل الأسعار</p>
          </div>

          {/* Category Filter Pills (Matching Screenshot 4) */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 text-black shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Product Image */}
                <div 
                  className="relative aspect-[3/4] bg-gray-50 overflow-hidden cursor-pointer" 
                  onClick={() => handleOpenProduct(product)}
                >
                  
                    {product.image ? (
    <img 
      src={product.image} alt={product.nameAr || product.name}
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
    />
  ) : (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
      <ImageIcon size={32} />
    </div>
  )}
                  {product.discountBadge && (
                    <span className="absolute top-2.5 right-2.5 bg-amber-500 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm">
                      {product.discountBadge}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between text-right">
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium block mb-1">
                      {product.categoryAr || product.category || "التصنيف"}
                    </span>
                    <h4 
                      onClick={() => handleOpenProduct(product)}
                      className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer mb-2"
                    >
                      {product.nameAr || product.name || "منتج تجريبي"}
                    </h4>
                    <RenderStars count={product.rating} reviewsCount={product.reviewsCount} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-3">
                    <div className="flex items-baseline gap-2 justify-start">
                      <span className="text-base sm:text-lg font-black text-gray-900">
                        {product.price ? product.price.toLocaleString() : "0"} د.ج
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {product.originalPrice.toLocaleString()} د.ج
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenProduct(product)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>اختر الخيارات</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center my-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-800">لا توجد منتجات في هذا القسم</h4>
            <p className="text-xs text-gray-500 mt-1">جرب اختيار قسم آخر أو مسح البحث</p>
            <button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              عرض جميع المنتجات
            </button>
          </div>
        )}
      </section></EditableSection>

      {/* Store Footer (Matching Screenshot 5) */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 border-t border-gray-800 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-gray-800">
            
            {/* Col 1: Store Bio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                >
                  {c_storeName.charAt(0)}
                </div>
                {c_logoUrl ? <img src={c_logoUrl} alt="Logo" className="max-h-8 object-contain" /> : <h4 className="text-lg font-black text-white">{c_storeName}</h4>}
              </div>
              <p className="text-xs leading-relaxed text-gray-400">
                متجرك الإلكتروني المفضل للتسوق بأمان في الجزائر. منتجات أصلية، توصيل سريع لـ 58 ولاية، والدفع عند الاستلام مع ضمان كامل.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>متجر موثوق 100%</span>
                </div>
              </div>
            </div>

            {/* Col 2: Categories */}
            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-4">الأقسام الرئيسية</h5>
              <ul className="space-y-2 text-xs">
                {displayCategories.map((cat) => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => setSelectedCategory(cat.id)}
                      className="hover:text-amber-400 transition-colors"
                    >
                      {cat.nameAr}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Quick Links */}
            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-4">روابط تهمك</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#about" className="hover:text-amber-400 transition-colors">من نحن</a></li>
                <li><a href="#shipping" className="hover:text-amber-400 transition-colors">سياسة الشحن والتوصيل 58 ولاية</a></li>
                <li><a href="#returns" className="hover:text-amber-400 transition-colors">سياسة الاستبدال والاسترجاع (7 أيام)</a></li>
                <li><a href="#track" className="hover:text-amber-400 transition-colors">تتبع حالة الطلبية</a></li>
                <li><a href="#terms" className="hover:text-amber-400 transition-colors">الشروط والأحكام</a></li>
              </ul>
            </div>

            {/* Col 4: Contact Info */}
            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-4">خدمة العملاء والاتصال</h5>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span dir="ltr">+213 555 00 00 00</span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  متاحون يومياً من 09:00 صباحاً حتى 21:00 مساءً للرد على استفساراتكم وتأكيد طلبياتكم.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      if ((actualProducts ? actualProducts : theme.products).length > 0) handleOpenProduct((actualProducts ? actualProducts : theme.products)[0]);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all shadow-md text-center"
                  >
                    تواصل معنا عبر واتساب
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 {c_storeName}. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>تم التطوير والتصميم بواسطة</span>
              <span className="text-amber-400 font-bold">DZBuild E-Commerce</span>
            </div>
          </div>
        </div>
      </footer>

        </>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 fade-in">
          <div className="mb-6 flex items-center justify-between">
             <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                <ArrowRight size={18} />
                العودة للمتجر
             </button>
             {/* We can put breadcrumbs here if needed */}
          </div>
          
          {trackingView ? (
             <div className="bg-gray-50 rounded-3xl pb-12 shadow-sm border border-gray-100 max-w-2xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-[#1c192b] text-white pt-12 pb-24 px-6 text-center relative">
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                   <div className="relative z-10">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg backdrop-blur-md">
                        <Package className="text-white w-8 h-8" />
                     </div>
                     <h3 className="text-3xl font-black mb-2 tracking-wide">تتبع طلبك</h3>
                     <p className="text-gray-300 opacity-90">تابع حالة طلبك في الوقت الفعلي</p>
                   </div>
                </div>

                <div className="px-6 -mt-12 relative z-20">
                   <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 mb-6">
                      <div className="flex items-center justify-between text-sm relative">
                         <div className="flex items-center p-1 w-full gap-2">
                            <button className="bg-[#1c192b] hover:bg-[#2d2a3f] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors w-24">
                               لصق <ClipboardList size={16} />
                            </button>
                            <input type="text" value={orderId} readOnly className="flex-1 bg-white text-gray-800 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none text-left font-mono tracking-wider" dir="ltr" />
                         </div>
                      </div>
                      <p className="text-center text-xs text-gray-400 mt-4 mb-2 flex items-center justify-center gap-1"><CheckCircle2 size={12}/> ستجد رقم الطلب في رسالة التأكيد المرسلة إليك</p>
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-10">
                         <div className="text-right flex-1 pt-1">
                            <span className="text-gray-500 text-xs block mb-1">رقم الطلب</span>
                            <div className="font-mono font-bold text-gray-900 text-sm flex items-center justify-end" dir="ltr">
                               # {orderId}
                            </div>
                            <div className="text-gray-400 text-xs flex items-center gap-1 justify-end mt-1">
                               <Clock size={12} /> {new Date().toLocaleDateString('fr-CA')}
                            </div>
                         </div>
                         <div className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md h-fit whitespace-nowrap">
                            <Clock size={16} /> قيد الانتظار
                         </div>
                      </div>
                      
                      <div className="text-center mb-8">
                         <div className="flex items-center justify-center gap-2 mb-8 border-b border-gray-100 pb-4">
                           <span className="text-sm font-bold text-gray-700">مراحل الطلب</span>
                           <Package size={16} className="text-gray-400"/> 
                         </div>
                         
                         <div className="relative flex justify-between items-start w-full px-2 max-w-md mx-auto">
                            <div className="absolute top-5 left-8 right-8 h-[2px] bg-gray-200 -z-10"></div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-[#1c192b] text-white flex items-center justify-center shadow-md relative z-10">
                                 <Clock size={18} />
                               </div>
                               <span className="text-[10px] font-bold text-gray-900 text-center">قيد الانتظار</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Check size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">تم التأكيد</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Box size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">جاري التجهيز</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Truck size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">في الطريق</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Home size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">تم التسليم</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                         <div className="flex justify-end items-center text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 gap-2">
                           المنتجات المطلوبة <ShoppingBag size={16} /> 
                         </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="font-bold text-gray-900">{selectedProduct.price.toLocaleString()} دج</div>
                            <div className="flex items-center gap-4 text-right">
                               <div>
                                  <div className="font-medium text-gray-800 text-sm mb-1">{selectedProduct.nameAr || selectedProduct.name}</div>
                                  <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full">الكمية: {quantity}</div>
                               </div>
                               <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                  {selectedProduct.image ? (
                                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="w-6 h-6 text-gray-400 m-auto mt-3" />
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>

                   </div>
                   
                   <div className="bg-[#1c192b] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
                     <div className="space-y-4 relative z-10 text-sm font-medium">
                        <div className="flex justify-between text-gray-300">
                           <span>{selectedProduct.price.toLocaleString()} دج</span>
                           <span>المجموع الفرعي</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                           <span>{(totalPrice - (selectedProduct.price * quantity)).toLocaleString()} دج</span>
                           <span>الشحن</span>
                        </div>
                        <div className="flex justify-between font-black text-xl pt-4 border-t border-white/20 mt-4">
                           <span>{totalPrice.toLocaleString()} دج</span>
                           <span>الإجمالي</span>
                        </div>
                     </div>
                   </div>
                   
                   <div className="text-center">
                     <button
                       onClick={() => {
                         setSelectedProduct(null);
                         setOrderSuccess(false);
                         setTrackingView(false);
                       }}
                       className="text-[#64748b] bg-[#f1f5f9] hover:bg-[#e2e8f0] px-6 py-3.5 rounded-xl font-bold transition-colors inline-flex items-center justify-center gap-2 text-sm w-48 shadow-sm"
                     >
                       العودة للمتجر <ArrowLeft size={16} />
                     </button>
                   </div>
                </div>
             </div>
          ) : orderSuccess ? (
             <div className="bg-white rounded-3xl pb-8 shadow-2xl border border-gray-100 max-w-xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-500 text-white text-center py-16 relative overflow-hidden rounded-t-3xl">
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)', backgroundSize: '150% 150%', backgroundPosition: 'center' }}></div>
                   <div className="w-24 h-24 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl relative z-10 border-4 border-emerald-400">
                     <Check size={48} strokeWidth={3} />
                   </div>
                   <h3 className="text-3xl font-black mt-6 mb-2 relative z-10 tracking-wide">تم تأكيد طلبك!</h3>
                   <p className="text-emerald-50 opacity-90 relative z-10">سيتم التواصل معك قريباً لتأكيد الطلب</p>
                </div>
                
                <div className="px-6 -mt-6 relative z-20">
                   <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                      
                      <div className="text-right border-b border-gray-100 pb-4">
                         <span className="text-gray-400 text-xs block mb-1 font-medium">رقم الطلب</span>
                         <div className="flex items-center justify-between">
                            <button 
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                              onClick={() => navigator.clipboard.writeText(orderId)}
                            >
                               <Copy size={14} /> نسخ
                            </button>
                            <span className="font-mono font-bold text-[#1c192b] text-base">{orderId}</span>
                         </div>
                      </div>

                      <div className="text-right border-b border-gray-100 pb-4">
                         <span className="text-gray-400 text-xs block mb-3 font-medium">المنتجات</span>
                         <div className="flex justify-between items-center">
                            <div className="text-left font-bold text-gray-900 text-sm">
                               {selectedProduct.price.toLocaleString()} دج <span className="text-gray-400 text-xs mr-1 font-normal">x{quantity}</span>
                            </div>
                            <div className="text-right">
                               <div className="text-sm font-bold text-gray-800">{selectedProduct.nameAr || selectedProduct.name}</div>
                               <div className="flex items-center gap-1 justify-end mt-1">
                                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                     couleur: noir <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                         <div className="text-left">
                            <span className="text-gray-400 text-xs block mb-1 font-medium">المجموع</span>
                            <span className="text-2xl font-black text-emerald-500 block leading-none">{totalPrice.toLocaleString()}</span>
                            <span className="text-gray-400 text-xs">دج</span>
                         </div>
                         <div className="text-right">
                            <span className="text-gray-400 text-xs block mb-2 font-medium">التوصيل</span>
                            <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5 justify-end">
                               {deliveryType === "home" ? "التوصيل للمنزل" : "التوصيل للمكتب"} <Home size={14} className="text-gray-400" />
                            </span>
                         </div>
                      </div>
                      
                   </div>
                </div>

                <div className="px-6 mt-6 space-y-3">
                  <button
                    onClick={() => setTrackingView(true)}
                    className="w-full bg-[#1c192b] hover:bg-[#2d2a3f] text-white py-4 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    تتبع الطلب <MapPin size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setOrderSuccess(false);
                      setTrackingView(false);
                    }}
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    المتجر <Home size={18} />
                  </button>
                </div>
              </div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Right Column: Product Details & Order Form (Col span 5 or 6) */}
                <div className="lg:col-span-5 flex flex-col order-2 lg:order-1">
                   <div className="text-right mb-6">
                      <div className="flex justify-between items-center mb-3">
                         <div className="bg-emerald-50 text-emerald-600 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                            <CheckCircle2 size={14} /> متوفر
                         </div>
                         <h1 className="text-2xl sm:text-3xl font-black text-white">{selectedProduct.nameAr || selectedProduct.name}</h1>
                      </div>
                      
                      <div className="flex justify-end gap-3 items-center mb-8">
                         <span className="text-3xl sm:text-4xl font-black text-white">{selectedProduct.price.toLocaleString()} د.ج</span>
                         {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                           <>
                             <span className="text-gray-400 line-through text-lg">{selectedProduct.originalPrice.toLocaleString()} د.ج</span>
                             <span className="bg-red-500 text-white rounded-full px-2.5 py-1 text-xs font-bold">
                               -{Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%
                             </span>
                           </>
                         )}
                      </div>

                      {/* Variants */}
                      {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="space-y-6 mb-8 border-b border-gray-100 pb-8">
                          {selectedProduct.variants.map((v, i) => (
                            <div key={i}>
                              <div className="text-right mb-3">
                                <span className="text-sm font-bold text-gray-700">* {v.name}</span>
                              </div>
                              <div className="flex flex-wrap justify-end gap-2">
                                {v.options?.map((opt, idx) => {
                                  const optObj = typeof opt === 'string' ? { value: opt, priceDiff: 0, image: null } : opt;
                                  const isSelected = selectedVariants[v.name] === optObj.value;
                                  
                                  // Color detection
                                  const isColorGroup = v.type === 'color' || v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('couleur') || v.name.toLowerCase().includes('لون');
                                  
                                  if (isColorGroup) {
                                     let bgColor = optObj.colorCode;
                                     if (!bgColor && typeof optObj.value === 'string') {
                                        bgColor = optObj.value.trim();
                                        const valLower = bgColor.toLowerCase();
                                        if (valLower === 'noir' || valLower === 'black' || valLower === 'أسود') bgColor = '#000000';
                                        else if (valLower === 'blanc' || valLower === 'white' || valLower === 'أبيض') bgColor = '#ffffff';
                                        else if (valLower === 'rouge' || valLower === 'red' || valLower === 'أحمر') bgColor = '#ef4444';
                                        else if (valLower === 'bleu' || valLower === 'blue' || valLower === 'أزرق') bgColor = '#3b82f6';
                                        else if (valLower === 'vert' || valLower === 'green' || valLower === 'أخضر') bgColor = '#22c55e';
                                        else if (valLower === 'jaune' || valLower === 'yellow' || valLower === 'أصفر') bgColor = '#eab308';
                                        else if (valLower === 'gris' || valLower === 'gray' || valLower === 'grey' || valLower === 'رمادي') bgColor = '#6b7280';
                                        else if (valLower === 'rose' || valLower === 'pink' || valLower === 'وردي') bgColor = '#ec4899';
                                        else if (valLower === 'violet' || valLower === 'purple' || valLower === 'بنفسجي') bgColor = '#a855f7';
                                        else if (valLower === 'orange' || valLower === 'برتقالي') bgColor = '#f97316';
                                        else if (valLower === 'marron' || valLower === 'brown' || valLower === 'بني') bgColor = '#854d0e';
                                     }
                                     
                                     // If we don't have a valid hex, we fallback to just text unless it's explicitly set by colorCode
                                     const isValidHexOrKnown = bgColor && (bgColor.startsWith('#') || bgColor.match(/^[a-z]+$/i) || optObj.colorCode);
                                     
                                     if (isValidHexOrKnown) {
                                       return (
                                         <button
                                           key={idx}
                                           type="button"
                                           onClick={() => {
                                              setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                              if (optObj.image) setCurrentProductImage(optObj.image);
                                           }}
                                           className={`w-10 h-10 rounded-full transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-[#1c192b]' : 'ring-1 ring-gray-200 hover:ring-gray-300'}`}
                                           style={{ backgroundColor: bgColor }}
                                           title={optObj.value}
                                         />
                                       );
                                     }
                                  }
                                  
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                          setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                          if (optObj.image) setCurrentProductImage(optObj.image);
                                      }}
                                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        isSelected 
                                          ? "bg-[#1c192b] text-white shadow-md border border-[#1c192b]" 
                                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                      }`}
                                    >
                                      {optObj.value}
                                    </button>
                                  )})}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Main Actions before form */}
                      <div className="flex items-center gap-3 mb-10">
                         {/* Quantity */}
                         <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm h-14 px-1">
                           <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
                             -
                           </button>
                           <span className="w-8 text-center font-bold text-lg text-gray-900">{quantity}</span>
                           <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
                             +
                           </button>
                         </div>
                         <button className="w-14 h-14 bg-[#1c192b] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity shadow-md shrink-0">
                           <ShoppingCart size={22} />
                         </button>
                         <button onClick={() => {
                           document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
                         }} className="flex-1 h-14 bg-[#1c192b] text-white rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-md">
                           اطلب الآن <ShoppingBag size={20} />
                         </button>
                      </div>

                      {/* Order Form Card */}
                      <form id="order-form" onSubmit={handleOrderSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                         <div className="flex justify-center items-center gap-2 mb-8 text-xl font-black text-white">
                           اطلب الآن <ClipboardList size={24} />
                         </div>
                         
                         <div className="space-y-4 mb-6">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="relative">
                               <input 
                                 type="text" required
                                 placeholder="* الإسم واللقب" 
                                 value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                 className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-right pr-12 focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white transition-all font-medium" 
                               />
                               <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                             </div>
                             <div className="relative">
                               <input 
                                 type="tel" required dir="ltr"
                                 maxLength={getPhoneMaxLength(customerPhone)}
                                 placeholder="* رقم الهاتف (0550252565)"
                                  value={customerPhone} 
                                 onChange={(e) => {
                                   const cleaned = cleanAndLimitPhone(e.target.value);
                                   setCustomerPhone(cleaned);
                                   if (customerPhoneError) setCustomerPhoneError("");
                                 }}
                                 className={`w-full bg-gray-50/50 border rounded-xl py-3.5 px-4 text-right pr-12 focus:outline-none focus:ring-2 focus:bg-white transition-all font-medium ${customerPhoneError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#1c192b]"}`}
                               />
                               <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                             </div>
                           </div>
                           {customerPhoneError ? (
                             <p className="text-xs text-red-600 font-medium text-right -mt-2 mb-2">{customerPhoneError}</p>
                           ) : (
                             <p className="text-[11px] text-gray-400 text-right -mt-2 mb-2">10 أرقام تبدأ بـ 05 أو 06 أو 07 (أو مع الرمز 213 مثال: 213550252565)</p>
                           )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="relative">
                                <select 
                                  value={selectedWilayaCode} 
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : "";
                                    setSelectedWilayaCode(val);
                                    setCommune("");
                                  }}
                                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-right appearance-none pr-12 focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white transition-all font-medium text-gray-900 cursor-pointer"
                                >
                                  <option value="">-- اختر الولاية --</option>
                                  {WILAYAS_LIST.map((w) => (
                                    <option key={w.code} value={w.code}>
                                      {w.code < 10 ? `0${w.code}` : w.code} - {w.arName}
                                    </option>
                                  ))}
                                </select>
                                <Map className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                              </div>
                              <div className="relative">
                                <select 
                                  required
                                  disabled={!selectedWilayaCode}
                                  value={commune} 
                                  onChange={(e) => setCommune(e.target.value)}
                                  className={`w-full border rounded-xl py-3.5 px-4 text-right appearance-none pr-12 focus:outline-none focus:ring-2 transition-all font-medium ${
                                    !selectedWilayaCode
                                      ? "bg-gray-100/90 border-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-50/50 border-gray-200 text-gray-900 focus:ring-[#1c192b] focus:bg-white cursor-pointer"
                                  }`}
                                >
                                  <option value="">
                                    {selectedWilayaCode ? "* اختر البلدية" : "* البلدية (يرجى اختيار الولاية أولاً)"}
                                  </option>
                                  {availableCommunes.map((c) => (
                                    <option key={c.name} value={c.arName || c.name}>
                                      {c.arName ? `${c.arName} (${c.name})` : c.name}
                                    </option>
                                  ))}
                                </select>
                                <MapPin className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${!selectedWilayaCode ? "text-gray-300" : "text-gray-400"}`} size={20} />
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${!selectedWilayaCode ? "text-gray-300" : "text-gray-400"}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                              </div>
                            </div>

                           <div className="relative">
                             <input 
                               type="text" 
                               placeholder="العنوان الكامل (مثال: حي النصر، شارع رقم 12)"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-right pr-12 focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white transition-all font-medium"
                              />
                             <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                           </div>
                         </div>

                         <div className="mb-8 text-right">
                           <div className="font-bold text-gray-800 mb-3 text-sm">التوصيل:</div>
                           <label className={`flex items-center justify-between p-3 rounded-xl border mb-2 cursor-pointer transition-colors ${deliveryType === 'home' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                             <span className="text-gray-500 font-bold text-sm" dir="ltr">{currentWilaya ? currentWilaya.homeDeliveryPrice : 400} د.ج</span>
                             <div className="flex items-center gap-3">
                               <span className="text-sm font-bold text-gray-700">التوصيل للمنزل</span>
                               <input type="radio" name="delivery" checked={deliveryType === 'home'} onChange={() => setDeliveryType('home')} className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-gray-300" />
                             </div>
                           </label>
                           <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${deliveryType === 'desk' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                             <span className="text-gray-500 font-bold text-sm" dir="ltr">{currentWilaya ? currentWilaya.deskDeliveryPrice : 300} د.ج</span>
                             <div className="flex items-center gap-3">
                               <span className="text-sm font-bold text-gray-700">التوصيل للمكتب (Stop Desk)</span>
                               <input type="radio" name="delivery" checked={deliveryType === 'desk'} onChange={() => setDeliveryType('desk')} className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-gray-300" />
                             </div>
                           </label>
                         </div>

                         <div className="border-t border-gray-100 pt-6 flex justify-between items-center mb-8">
                           <div className="text-left">
                             {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                               <div className="text-gray-400 line-through text-sm">{selectedProduct.originalPrice.toLocaleString()} د.ج</div>
                             )}
                             <div className="text-2xl sm:text-3xl font-black text-gray-900">{totalPrice.toLocaleString()} د.ج</div>
                           </div>
                           <div className="font-black text-lg text-gray-900">التكلفة الإجمالية</div>
                         </div>

                         <div className="flex flex-col sm:flex-row gap-3">
                           <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-gray-50 h-14 px-2 sm:w-1/3">
                             <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-xl font-bold">
                               -
                             </button>
                             <span className="font-bold text-lg text-gray-900">{quantity}</span>
                             <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-xl font-bold">
                               +
                             </button>
                           </div>
                           <button type="submit" disabled={isSubmitting} className="flex-1 h-14 bg-[#1c192b] text-white rounded-xl font-black text-lg hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2">
                             {isSubmitting ? 'جاري التسجيل...' : 'اطلب الآن'}
                           </button>
                         </div>
                      </form>
                   </div>
                </div>

                {/* Left Column: Images (Col span 7) */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                   <div className="sticky top-24 space-y-4">
                      {/* Main Image */}
                      <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-auto lg:h-[700px] bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center group">
                        <img 
                           src={currentProductImage || selectedProduct.image} 
                           alt={selectedProduct.name} 
                           className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Image Counter */}
                        {selectedProduct.images && selectedProduct.images.length > 0 && (
                          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                            {/* find current index */}
                            {[selectedProduct.image, ...selectedProduct.images].filter((v, i, a) => a.indexOf(v) === i).findIndex(img => img === (currentProductImage || selectedProduct.image)) + 1} / {[selectedProduct.image, ...selectedProduct.images].filter((v, i, a) => a.indexOf(v) === i).length}
                          </div>
                        )}
                      </div>
                      
                      {/* Thumbnails */}
                      {selectedProduct.images && selectedProduct.images.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                          {[selectedProduct.image, ...selectedProduct.images].filter((v, i, a) => a.indexOf(v) === i).map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentProductImage(img)}
                              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${(currentProductImage || selectedProduct.image) === img ? 'border-[#1c192b] shadow-md ring-2 ring-white ring-inset' : 'border-gray-100 hover:border-gray-300'}`}
                            >
                              <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Description */}
                      {selectedProduct.description && (
                        <div className="mt-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-right">
                          <h4 className="text-lg font-black text-white mb-4">وصف المنتج</h4>
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                        </div>
                      )}
                   </div>
                </div>

             </div>
          )}
        </div>
      )}
</div>
  );
}
