import React, { useState, useMemo, FormEvent, useEffect, useCallback, useRef } from "react";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { formatDate } from "../../lib/date";
import { StoreCustomizerConfig } from "../admin/StoreCustomizerConfig";
import { 
  ArrowRight,
  ShoppingCart,
  ClipboardList,
  User,
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
  ChevronDown,
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
  Copy,
  StickyNote,
  Mail,
  MessageSquare,
  Send,
  Bell,
  Trash2
} from "lucide-react";
import { StoreTheme, StoreDemoProduct } from "../../data/themesData";
import { ALGERIAN_WILAYAS as WILAYAS_LIST } from "../../data/landingData";
import { getCommunesForWilaya } from "../../data/algerianCommunes";
import { isPhoneBlacklisted, normalizePhoneForBlacklist } from "../../lib/blacklist";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../../lib/phoneUtils";
import { sendOrderNotifications, triggerWhatsAppNotification } from "../../lib/notifyService";
import { deduplicateProducts, deduplicateOrders } from "../../lib/orderUtils";
import { saveAbandonedCart, markAbandonedCartAsRecovered } from "../../lib/abandonedCartService";

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
    if (initialProductId) {
      let found = (actualProducts || []).find(p => p.id === initialProductId);
      if (!found) {
        try {
          const cached = localStorage.getItem("dzbuild_products");
          if (cached) {
            const list = JSON.parse(cached);
            found = list.find((p: any) => p.id === initialProductId);
          }
        } catch {}
      }
      if (found) {
        handleOpenProduct(found);
      }
    }
  }, [initialProductId, actualProducts]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartCheckoutMode, setCartCheckoutMode] = useState(false);

  // Cart items from local storage
  const [cartItems, setCartItems] = useState<any[]>(() => {
    try {
      const existing = localStorage.getItem("dzbuild_cart_items");
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  });

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [cartItems]);

  // Synchronize cart across tabs and window events
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const existing = localStorage.getItem("dzbuild_cart_items");
        setCartItems(existing ? JSON.parse(existing) : []);
      } catch {}
    };
    window.addEventListener("dzbuild_cart_updated", handleCartSync);
    window.addEventListener("storage", handleCartSync);
    return () => {
      window.removeEventListener("dzbuild_cart_updated", handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, []);

  const updateCartItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty };
      try {
        localStorage.setItem("dzbuild_cart_items", JSON.stringify(updated));
        window.dispatchEvent(new Event("dzbuild_cart_updated"));
      } catch {}
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCartItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem("dzbuild_cart_items", JSON.stringify(updated));
        window.dispatchEvent(new Event("dzbuild_cart_updated"));
      } catch {}
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem("dzbuild_cart_items");
      window.dispatchEvent(new Event("dzbuild_cart_updated"));
    } catch {}
  };

  // Cart COD Form State
  const [cartCustomerName, setCartCustomerName] = useState("");
  const [cartCustomerPhone, setCartCustomerPhone] = useState("");
  const [cartCustomerEmail, setCartCustomerEmail] = useState("");
  const [cartCustomerPhoneError, setCartCustomerPhoneError] = useState("");
  const [cartWilayaCode, setCartWilayaCode] = useState<number | "">("");
  const [cartCommune, setCartCommune] = useState("");
  const [cartAddress, setCartAddress] = useState("");
  const [cartDeliveryType, setCartDeliveryType] = useState<"home" | "desk">("home");
  const [cartIsSubmitting, setCartIsSubmitting] = useState(false);

  // Active product for COD Fast Checkout Modal
  const [selectedProduct, setSelectedProduct] = useState<StoreDemoProduct | null>(null);
  const [currentProductImage, setCurrentProductImage] = useState<string>("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  
  // COD Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhoneError, setCustomerPhoneError] = useState("");
  const [customerEmailError, setCustomerEmailError] = useState("");
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number | "">(""); // Default empty (* اختر الولاية)
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [commune, setCommune] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [whatsAppNotifyUrl, setWhatsAppNotifyUrl] = useState("");
  const [trackingView, setTrackingView] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);
  const [cartToastMessage, setCartToastMessage] = useState<string | null>(null);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;

    setJustAddedToCart(true);
    
    const prodId = selectedProduct.id;
    const prodName = selectedProduct.nameAr || selectedProduct.name;
    const prodPrice = selectedProduct.price;
    const prodImg = currentProductImage || selectedProduct.image || "";

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => 
        String(item.id) === String(prodId) && 
        JSON.stringify(item.variants || {}) === JSON.stringify(selectedVariants || {})
      );

      let updated;
      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (Number(updated[existingIdx].quantity) || 1) + quantity
        };
      } else {
        updated = [
          ...prev,
          {
            id: prodId,
            name: prodName,
            price: prodPrice,
            quantity: quantity,
            variants: { ...selectedVariants },
            image: prodImg,
            addedAt: Date.now()
          }
        ];
      }
      try {
        localStorage.setItem("dzbuild_cart_items", JSON.stringify(updated));
        window.dispatchEvent(new Event("dzbuild_cart_updated"));
      } catch {}
      return updated;
    });

    setCartToastMessage(`تمت إضافة "${prodName}" (${quantity}) إلى السلة بنجاح !`);
    
    setTimeout(() => {
      setJustAddedToCart(false);
    }, 2500);

    setTimeout(() => {
      setCartToastMessage(null);
    }, 5000);
  };

  // Communes disponibles filtrées selon la wilaya choisie
  const availableCommunes = useMemo(() => {
    if (!selectedWilayaCode) return [];
    return getCommunesForWilaya(Number(selectedWilayaCode));
  }, [selectedWilayaCode]);

  const cartAvailableCommunes = useMemo(() => {
    if (!cartWilayaCode) return [];
    return getCommunesForWilaya(Number(cartWilayaCode));
  }, [cartWilayaCode]);

  const cartWilaya = useMemo(() => {
    if (!cartWilayaCode) return null;
    return WILAYAS_LIST.find((w) => w.code === Number(cartWilayaCode)) || null;
  }, [cartWilayaCode]);

  const cartDeliveryPrice = useMemo(() => {
    if (!cartWilaya) return 400;
    return cartDeliveryType === "home" ? cartWilaya.homeDeliveryPrice : cartWilaya.deskDeliveryPrice;
  }, [cartWilaya, cartDeliveryType]);

  const cartTotalAmount = useMemo(() => {
    return cartSubtotal + (cartWilaya ? cartDeliveryPrice : 0);
  }, [cartSubtotal, cartWilaya, cartDeliveryPrice]);

  const handleCartOrderSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!cartCustomerName.trim()) {
      alert("يرجى إدخال الإسم واللقب");
      return;
    }
    const phoneVal = validatePhoneNumber(cartCustomerPhone, "ar");
    if (!phoneVal.isValid) {
      setCartCustomerPhoneError(phoneVal.errorAr || phoneVal.error || "رقم الهاتف غير صالح");
      return;
    }
    setCartCustomerPhoneError("");

    if (!cartWilayaCode) {
      alert("يرجى اختيار الولاية أولاً");
      return;
    }
    if (!cartCommune.trim()) {
      alert("يرجى اختيار البلدية");
      return;
    }

    setCartIsSubmitting(true);
    try {
      const generatedOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}-20260908-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
      const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";

      if (effectiveTenantId && cartCustomerPhone) {
        try {
          const isBanned = await isPhoneBlacklisted(effectiveTenantId, cartCustomerPhone);
          if (isBanned) {
            alert("عذراً، هذا الرقم محظور من إتمام الطلبات في هذا المتجر.");
            setCartIsSubmitting(false);
            return;
          }
        } catch {}
      }

      const nowIso = new Date().toISOString();

      const itemsSummary = cartItems.map(item => `${item.quantity}x ${item.name}${item.variants && Object.keys(item.variants).length ? ` (${Object.values(item.variants).join(", ")})` : ""}`).join(" | ");

      const orderData = {
        orderNumber: generatedOrderId.substring(4, 10),
        reference: generatedOrderId,
        userId: effectiveTenantId,
        client: cartCustomerName.trim(),
        phone: cartCustomerPhone.trim(),
        email: cartCustomerEmail.trim().toLowerCase(),
        customerEmail: cartCustomerEmail.trim().toLowerCase(),
        wilaya: cartWilaya ? `${cartWilaya.code < 10 ? `0${cartWilaya.code}` : cartWilaya.code} - ${cartWilaya.arName}` : "الجزائر",
        commune: cartCommune.trim(),
        address: cartAddress.trim() || (cartDeliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
        itemsSummary,
        total: cartTotalAmount,
        status: "En attente",
        paymentStatus: "Non payé",
        paymentMethod: "COD (الدفع عند الاستلام)",
        deliveryType: cartDeliveryType === "home" ? "À domicile" : "Stop desk",
        deliveryPrice: cartDeliveryPrice,
        date: nowIso,
        source: "storefront_cart",
        createdAt: nowIso,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variants: item.variants || {},
          image: item.image || ""
        }))
      };

      // 1. Save to localStorage
      try {
        const existingOrdersRaw = localStorage.getItem("dzbuild_local_orders");
        const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
        existingOrders.unshift({ ...orderData, id: generatedOrderId });
        localStorage.setItem("dzbuild_local_orders", JSON.stringify(deduplicateOrders(existingOrders)));
        window.dispatchEvent(new Event("dzbuild_order_placed"));
        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.warn("Local storage order save error:", err);
      }

      // 2. Save to Firestore with deterministic ID
      try {
        await setDoc(doc(db, "orders", generatedOrderId), {
          ...orderData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (effectiveTenantId) {
          await setDoc(doc(db, "tenants", effectiveTenantId, "orders", generatedOrderId), {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (dbErr) {
        console.warn("Firestore cart order sync error:", dbErr);
      }

      // Clear cart
      clearCart();
      setCartCheckoutMode(false);
      setIsCartDrawerOpen(false);

      // Mark abandoned cart as recovered
      if (cartCustomerPhone) {
        markAbandonedCartAsRecovered(cartCustomerPhone, generatedOrderId, effectiveTenantId).catch(e => console.warn("Recovery update error:", e));
      }

      // Open Success modal
      setOrderId(generatedOrderId);
      setOrderSuccess(true);
    } catch (error: any) {
      alert(`Une erreur est survenue lors de la commande: ${error?.message || error}`);
    } finally {
      setCartIsSubmitting(false);
    }
  };

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

  // Sanitize and strictly deduplicate store products
  const cleanProducts = useMemo(() => {
    const rawList = isStandaloneView || actualProducts !== undefined ? (actualProducts || []) : theme.products;
    return deduplicateProducts(rawList);
  }, [actualProducts, theme.products, isStandaloneView]);

  const displayCategories = useMemo(() => {
    if (actualCategories && actualCategories.length > 0) {
      return actualCategories.map(c => ({
        id: c.name,
        name: c.name,
        nameAr: c.name,
        image: c.imageUrl,
        productCount: c.productCount || 0
      }));
    }
    
    // If user has actual products, extract categories dynamically
    if (cleanProducts.length > 0) {
      const catsCount: Record<string, number> = {};
      cleanProducts.forEach(p => {
        const catName = p.category || "Général";
        catsCount[catName] = (catsCount[catName] || 0) + 1;
      });
      return Object.entries(catsCount).map(([catName, count]) => ({
        id: catName,
        name: catName,
        nameAr: catName,
        image: cleanProducts.find(p => p.category === catName)?.image || "",
        productCount: count
      }));
    }

    // In live store (standalone view), do not show mock categories
    if (isStandaloneView) {
      return [];
    }

    return theme.categories;
  }, [actualCategories, cleanProducts, theme.categories, isStandaloneView]);

  // Categories list with "All"
  const categories = useMemo(() => {
    return [
      { id: "all", nameAr: "الكل", name: "Tous" },
      ...displayCategories
    ];
  }, [displayCategories]);

  // Filtered Products - strictly real products in live store
  const filteredProducts = useMemo(() => {
    return cleanProducts.filter(product => {
      // Exclude inactive products
      if (product.status === "inactive") return false;

      const matchesCategory = selectedCategory === "all" || 
        product.category === selectedCategory ||
        product.categoryAr === selectedCategory ||
        (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());
      
      const matchesSearch = searchQuery === "" || 
        (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.nameAr && product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [cleanProducts, selectedCategory, searchQuery]);

  // Featured products - strictly real products explicitly marked as featured
  // (NEVER automatically duplicate the entire catalog into featured when count <= 4)
  const featuredProducts = useMemo(() => {
    const featured = cleanProducts.filter(p => p.featured === true || p.isFeatured === true);
    return featured.slice(0, 4);
  }, [cleanProducts]);

  // Catalog Products - if featured section is shown and user views all categories without search,
  // do not duplicate the featured products in the catalog section right below
  const catalogProducts = useMemo(() => {
    if (featuredProducts.length > 0 && c_featuredShow && selectedCategory === "all" && !searchQuery) {
      const featuredIdSet = new Set(featuredProducts.map(p => String(p.id)));
      const remaining = filteredProducts.filter(p => !featuredIdSet.has(String(p.id)));
      if (remaining.length > 0) return remaining;
    }
    return filteredProducts;
  }, [filteredProducts, featuredProducts, c_featuredShow, selectedCategory, searchQuery]);

  // Calculate pricing for checkout
  const currentWilaya = useMemo(() => {
    if (!selectedWilayaCode) return null;
    return WILAYAS_LIST.find(w => w.code === Number(selectedWilayaCode)) || null;
  }, [selectedWilayaCode]);

  const deliveryPrice = useMemo(() => {
    if (!currentWilaya) return deliveryType === "home" ? 400 : 300;
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

  // ========================================================
  // DÉTECTION AUTOMATIQUE DU PANIER ABANDONNÉ (FORMULAIRE REMPLI SANS CLIC SUR COMMANDER)
  // ========================================================
  const cartSessionIdRef = useRef<string>(`cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const cartDrawerSessionIdRef = useRef<string>(`cart_drawer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const saveProductAbandonedCartNow = useCallback(() => {
    if (!selectedProduct || orderSuccess) return;

    // Détection active dès qu'au moins UN champ commence à être saisi !
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    const hasData = cleanPhone.length > 0 || trimmedName.length > 0 || trimmedEmail.length > 0 || !!selectedWilayaCode || customerAddress.trim().length > 0;
    if (!hasData) return;

    const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";
    const prodImg = currentProductImage || selectedProduct.image || (selectedProduct.images && selectedProduct.images[0]) || "";
    const variantDesc = selectedVariants && Object.keys(selectedVariants).length > 0 
      ? ` (${Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")})` 
      : "";

    // ID stable pour éviter les doublons à chaque frappe
    const cartId = cleanPhone.length >= 4 
      ? `cart_${effectiveTenantId}_${cleanPhone}` 
      : (trimmedEmail ? `cart_${effectiveTenantId}_${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : cartSessionIdRef.current);

    saveAbandonedCart({
      id: cartId,
      tenantId: effectiveTenantId,
      userId: effectiveTenantId,
      client: trimmedName || customerPhone.trim() || "Client potentiel",
      phone: customerPhone.trim(),
      email: trimmedEmail.toLowerCase(),
      wilaya: currentWilaya ? `${currentWilaya.code < 10 ? `0${currentWilaya.code}` : currentWilaya.code} - ${currentWilaya.arName}` : "",
      commune: commune.trim(),
      address: customerAddress.trim(),
      itemsSummary: `${quantity}x ${selectedProduct.nameAr || selectedProduct.name}${variantDesc}`,
      items: [{
        id: selectedProduct.id,
        name: selectedProduct.nameAr || selectedProduct.name,
        price: selectedProduct.price,
        quantity: quantity,
        variants: selectedVariants,
        image: prodImg
      }],
      total: totalPrice,
      status: "abandoned",
      recovered: false,
      source: "storefront_product_form"
    }).catch(err => console.warn("Abandoned cart auto-save error:", err));
  }, [
    selectedProduct, 
    orderSuccess, 
    customerPhone, 
    customerName, 
    customerEmail, 
    selectedWilayaCode, 
    currentWilaya, 
    commune, 
    customerAddress, 
    quantity, 
    selectedVariants, 
    totalPrice, 
    currentProductImage, 
    tenantId
  ]);

  // Détection en continu ultra-réactive (debounce de 300ms)
  useEffect(() => {
    if (!selectedProduct || orderSuccess) return;
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const hasData = cleanPhone.length > 0 || customerName.trim().length > 0 || customerEmail.trim().length > 0 || !!selectedWilayaCode;
    if (hasData) {
      const timer = setTimeout(() => {
        saveProductAbandonedCartNow();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    customerPhone, 
    customerName, 
    customerEmail, 
    selectedWilayaCode, 
    commune, 
    customerAddress, 
    quantity, 
    selectedVariants, 
    saveProductAbandonedCartNow, 
    selectedProduct, 
    orderSuccess
  ]);

  // Détection automatique pour le checkout de la modale du panier (Cart Drawer)
  const saveCartDrawerAbandonedCartNow = useCallback(() => {
    if (!isCartDrawerOpen || cartItems.length === 0) return;
    const cleanPhone = cartCustomerPhone.replace(/\D/g, "");
    const trimmedName = cartCustomerName.trim();
    const trimmedEmail = cartCustomerEmail.trim();
    const hasData = cleanPhone.length > 0 || trimmedName.length > 0 || trimmedEmail.length > 0 || !!cartWilayaCode;
    if (!hasData) return;

    const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";
    const itemsSummary = cartItems.map(item => `${item.quantity}x ${item.name}`).join(" | ");

    const cartId = cleanPhone.length >= 4 
      ? `cart_${effectiveTenantId}_${cleanPhone}` 
      : (trimmedEmail ? `cart_${effectiveTenantId}_${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : cartDrawerSessionIdRef.current);

    saveAbandonedCart({
      id: cartId,
      tenantId: effectiveTenantId,
      userId: effectiveTenantId,
      client: trimmedName || cartCustomerPhone.trim() || "Client potentiel",
      phone: cartCustomerPhone.trim(),
      email: trimmedEmail.toLowerCase(),
      wilaya: cartWilaya ? `${cartWilaya.code < 10 ? `0${cartWilaya.code}` : cartWilaya.code} - ${cartWilaya.arName}` : "",
      commune: cartCommune.trim(),
      address: cartAddress.trim(),
      itemsSummary,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variants: item.variants || {},
        image: item.image || ""
      })),
      total: cartTotalAmount,
      status: "abandoned",
      recovered: false,
      source: "storefront_cart_drawer"
    }).catch(err => console.warn("Cart drawer abandoned auto-save error:", err));
  }, [
    isCartDrawerOpen, 
    cartItems, 
    cartCustomerPhone, 
    cartCustomerName, 
    cartCustomerEmail, 
    cartWilaya, 
    cartCommune, 
    cartAddress, 
    cartTotalAmount, 
    tenantId
  ]);

  useEffect(() => {
    if (!isCartDrawerOpen || cartItems.length === 0) return;
    const cleanPhone = cartCustomerPhone.replace(/\D/g, "");
    const hasData = cleanPhone.length > 0 || cartCustomerName.trim().length > 0 || cartCustomerEmail.trim().length > 0 || !!cartWilayaCode;
    if (hasData) {
      const timer = setTimeout(() => {
        saveCartDrawerAbandonedCartNow();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    cartCustomerPhone, 
    cartCustomerName, 
    cartCustomerEmail, 
    cartWilayaCode, 
    cartCommune, 
    cartAddress, 
    cartItems, 
    isCartDrawerOpen, 
    saveCartDrawerAbandonedCartNow
  ]);

  // Sauvegarde si le client quitte la page ou change d'onglet
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProductAbandonedCartNow();
      saveCartDrawerAbandonedCartNow();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveProductAbandonedCartNow();
        saveCartDrawerAbandonedCartNow();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveProductAbandonedCartNow, saveCartDrawerAbandonedCartNow]);

  const handleOpenProduct = (product: StoreDemoProduct) => {
    setSelectedProduct(product);
    setCurrentProductImage(product.image);
    setSelectedWilayaCode("");
    setCommune("");
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

    if (customerEmail.trim() && !customerEmail.includes("@")) {
      setCustomerEmailError("يرجى إدخال بريد إلكتروني صالح");
      return;
    }
    setCustomerEmailError("");

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
      
      const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";

      if (effectiveTenantId && customerPhone) {
        try {
          const checkBlacklistPromise = isPhoneBlacklisted(effectiveTenantId, customerPhone);
          const timeoutCheck = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1200));
          const isBanned = await Promise.race([checkBlacklistPromise, timeoutCheck]);
          if (isBanned) {
            alert("عذراً، هذا الرقم محظور من إتمام الطلبات في هذا المتجر. / Ce numéro de téléphone est sur liste noire pour cette boutique.");
            setIsSubmitting(false);
            return;
          }
        } catch (e) {
          // Continue if blacklist check fails
        }
      }
      
      const nowIso = new Date().toISOString();

      const prodImg = selectedProduct.image || (selectedProduct.images && selectedProduct.images[0]) || "";
      const orderData = {
        orderNumber: generatedOrderId.substring(4, 10), // Short number for dashboard display
        reference: generatedOrderId,
        userId: effectiveTenantId,
        client: customerName,
        phone: customerPhone,
        email: customerEmail.trim().toLowerCase(),
        customerEmail: customerEmail.trim().toLowerCase(),
        wilaya: currentWilaya ? `${currentWilaya.code < 10 ? `0${currentWilaya.code}` : currentWilaya.code} - ${currentWilaya.arName}` : "الجزائر",
        commune: commune || "",
        address: customerAddress.trim() || (deliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
        itemsSummary: `${quantity}x ${selectedProduct.nameAr || selectedProduct.name}`,
        total: totalPrice,
        status: "En attente",
        date: nowIso,
        createdAt: nowIso,
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
        notes: customerNotes.trim(),
      };

      // Generate & Dispatch instant Email & WhatsApp confirmation notification
      try {
        const cleanPhone = customerPhone.replace(/\D/g, "");
        const phoneFormatted = cleanPhone.startsWith("0") ? `213${cleanPhone.slice(1)}` : cleanPhone;
        const msg = encodeURIComponent(
          `👋 مرحباً ${customerName}،\n` +
          `تم استلام طلبك رقم *${generatedOrderId}* بنجاح!\n\n` +
          `📦 المنتج: ${quantity}x ${selectedProduct.nameAr || selectedProduct.name}\n` +
          `💰 المبلغ الإجمالي: ${totalPrice.toLocaleString()} دج (الدفع عند الاستلام)\n` +
          `📍 عنوان التوصيل: ${currentWilaya?.arName || "الجزائر"} - ${commune || ""}\n` +
          `📬 تم إرسال إشعار التأكيد أيضاً إلى بريدك: ${customerEmail}\n\n` +
          `شكراً لثقتكم بنا!`
        );
        const waUrl = `https://api.whatsapp.com/send?phone=${phoneFormatted}&text=${msg}`;
        setWhatsAppNotifyUrl(waUrl);

        // Send real-time email & WhatsApp notifications in parallel
        sendOrderNotifications({
          reference: generatedOrderId,
          orderNumber: generatedOrderId.substring(4, 10),
          client: customerName,
          phone: customerPhone,
          email: customerEmail.trim().toLowerCase(),
          wilaya: currentWilaya?.arName || "الجزائر",
          commune: commune || "",
          address: customerAddress.trim() || (deliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
          itemsSummary: `${quantity}x ${selectedProduct.nameAr || selectedProduct.name}`,
          total: totalPrice,
          shippingCost: deliveryPrice,
          storeName: c_storeName || customStoreName || "Enova Store",
          merchantEmail: "nabsterzero@gmail.com",
          tenantId: effectiveTenantId,
          items: orderData.items,
        }).catch(e => console.warn("Backend notification failed:", e));

        // Auto-open WhatsApp notification
        triggerWhatsAppNotification(waUrl);
      } catch (notifErr) {
        console.warn("Notification error:", notifErr);
      }

      // Save order to local storage for immediate persistence
      try {
        const existingLocal = localStorage.getItem("dzbuild_local_orders");
        const list = existingLocal ? JSON.parse(existingLocal) : [];
        const orderEntry = { ...orderData, id: generatedOrderId, reference: generatedOrderId, createdAt: nowIso, date: nowIso };
        const cleanList = deduplicateOrders([orderEntry, ...list]);
        localStorage.setItem("dzbuild_local_orders", JSON.stringify(cleanList));

        // Automatically register/update customer in customer database
        const normalizedPhone = normalizePhoneForBlacklist(customerPhone);
        const existingCustLocal = localStorage.getItem("dzbuild_customers");
        const custList = existingCustLocal ? JSON.parse(existingCustLocal) : [];
        const existingIdx = custList.findIndex((c: any) => c.phone === customerPhone || c.id === normalizedPhone);
        
        const customerRecord = {
          id: normalizedPhone || `cust_${Date.now()}`,
          userId: effectiveTenantId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail.trim().toLowerCase(),
          wilaya: currentWilaya ? `${currentWilaya.code < 10 ? `0${currentWilaya.code}` : currentWilaya.code} - ${currentWilaya.arName}` : "الجزائر",
          commune: commune || "",
          address: customerAddress.trim() || (deliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
          totalSpent: totalPrice,
          orderCount: 1,
          lastOrderDate: nowIso,
          ip: "41.189.42.9",
          isBanned: false,
          createdAt: nowIso,
          updatedAt: nowIso
        };

        if (existingIdx >= 0) {
          custList[existingIdx].orderCount = (custList[existingIdx].orderCount || 1) + 1;
          custList[existingIdx].totalSpent = (Number(custList[existingIdx].totalSpent) || 0) + totalPrice;
          custList[existingIdx].name = customerName;
          custList[existingIdx].email = customerEmail.trim().toLowerCase();
          custList[existingIdx].wilaya = customerRecord.wilaya;
          custList[existingIdx].commune = customerRecord.commune;
          custList[existingIdx].address = customerRecord.address;
          custList[existingIdx].lastOrderDate = nowIso;
        } else {
          custList.unshift(customerRecord);
        }
        localStorage.setItem("dzbuild_customers", JSON.stringify(custList));
        window.dispatchEvent(new CustomEvent("customers_updated", { detail: custList }));
      } catch {}

      // Fire real-time events immediately
      try {
        const alertPayload = {
          ...orderData,
          id: generatedOrderId,
          reference: generatedOrderId,
          createdAt: nowIso,
          date: nowIso
        };
        window.dispatchEvent(new CustomEvent("order_created", { detail: alertPayload }));
        localStorage.setItem("last_order_alert", JSON.stringify(alertPayload));
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "order_created", data: alertPayload }, "*");
        }
      } catch (evErr) {
        console.warn("Order notification dispatch error:", evErr);
      }

      // Save to real database with a 2-second timeout race so order never hangs
      if (effectiveTenantId) {
        const saveOrders = async () => {
          try {
            const canonicalOrderPayload = {
              ...orderData,
              id: generatedOrderId,
              reference: generatedOrderId,
            };
            // Save canonical order with matching deterministic ID in both collections
            await setDoc(doc(db, "orders", generatedOrderId), canonicalOrderPayload);
            await setDoc(doc(db, "tenants", effectiveTenantId, "orders", generatedOrderId), canonicalOrderPayload);

            // Also persist customer to customers collection
            const normalizedPhone = normalizePhoneForBlacklist(customerPhone);
            if (normalizedPhone) {
              const custDocRef = doc(db, "customers", `${effectiveTenantId}_${normalizedPhone}`);
              await setDoc(custDocRef, {
                userId: effectiveTenantId,
                name: customerName,
                phone: customerPhone,
                normalizedPhone,
                wilaya: currentWilaya ? `${currentWilaya.code < 10 ? `0${currentWilaya.code}` : currentWilaya.code} - ${currentWilaya.arName}` : "الجزائر",
                commune: commune || "",
                address: customerAddress.trim() || (deliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
                lastOrderDate: serverTimestamp(),
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          } catch (dbErr) {
            console.warn("Firestore order background sync notice:", dbErr);
          }
        };

        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
        await Promise.race([saveOrders(), timeoutPromise]);
      }
      
      // Mark abandoned cart as recovered
      if (customerPhone) {
        markAbandonedCartAsRecovered(customerPhone, generatedOrderId, effectiveTenantId).catch(e => console.warn("Recovery update error:", e));
      }

      setOrderId(generatedOrderId);
      setOrderSuccess(true);
    } catch (error: any) {
      console.error("Error submitting order:", error);
      alert(`Une erreur est survenue lors de la confirmation de votre commande. Veuillez réessayer. Erreur: ${error?.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 flex flex-col font-sans relative" dir={isRtl ? "rtl" : "ltr"}>
      {/* Toast Notification for Add To Cart */}
      {cartToastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c192b] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-bottom-5 duration-300 max-w-md w-[92%]">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shrink-0 shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <p className="font-bold text-sm text-white line-clamp-1">{cartToastMessage}</p>
            <button 
              type="button"
              onClick={() => {
                setCartToastMessage(null);
                setIsCartDrawerOpen(true);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer mt-0.5 inline-block"
            >
              عرض السلة وتأكيد الطلب ({cartCount}) ←
            </button>
          </div>
          <button 
            type="button"
            onClick={() => setCartToastMessage(null)}
            className="text-gray-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                title="سلة المشتريات"
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
        {catalogProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {catalogProducts.map((product) => (
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
                      style={{ backgroundColor: c_primaryColor }}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>اطلب الآن / أضف إلى السلة</span>
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
              <span className="text-amber-400 font-bold">Enova E-Commerce</span>
            </div>
          </div>
        </div>
      </footer>

        </>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 fade-in">
          <div className="mb-6 flex items-center justify-between">
             <button onClick={() => { saveProductAbandonedCartNow(); setSelectedProduct(null); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
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
                               <Clock size={12} /> {formatDate(new Date())}
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

                      {/* Instant Notifications Box */}
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-right space-y-2">
                        <div className="flex items-center justify-end gap-2 text-emerald-800 font-bold text-xs">
                          <span>تم إرسال إشعارات تأكيد الطلب</span>
                          <Bell size={15} className="text-emerald-600" />
                        </div>
                        <p className="text-[12px] text-emerald-700 leading-relaxed">
                          📬 تم إرسال تفاصيل الفاتورة وتأكيد الطلب إلى: <strong>{customerEmail}</strong> ورقم الهاتف: <strong>{customerPhone}</strong>
                        </p>
                      </div>
                      
                   </div>
                </div>

                <div className="px-6 mt-6 space-y-3">
                  {whatsAppNotifyUrl && (
                    <a
                      href={whatsAppNotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={18} /> تأكيد واستلام الإشعار عبر الواتساب
                    </a>
                  )}
                  <button
                    onClick={() => setTrackingView(true)}
                    className="w-full bg-[#1c192b] hover:bg-[#2d2a3f] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    تتبع الطلب <MapPin size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setOrderSuccess(false);
                      setTrackingView(false);
                    }}
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
                         <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{selectedProduct.nameAr || selectedProduct.name}</h1>
                      </div>
                      
                      <div className="flex justify-end gap-3 items-center mb-8">
                         <span className="text-3xl sm:text-4xl font-black text-gray-900">{selectedProduct.price.toLocaleString()} د.ج</span>
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
                        <div className="space-y-6 mb-8 border-b border-gray-100 pb-8 text-right" dir="rtl">
                          {selectedProduct.variants.map((v, i) => {
                            const isDropdown = v.type === 'dropdown';
                            const isRadio = v.type === 'radio';
                            const isColorGroup = v.type === 'color' || v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('couleur') || v.name.toLowerCase().includes('لون');
                            const isImageText = v.type === 'image_text';
                            const isImageOnly = v.type === 'image';

                            return (
                              <div key={i} className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                    <span className="text-amber-500 font-black">*</span>
                                    {v.name}
                                    {selectedVariants[v.name] && (
                                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        {selectedVariants[v.name]}
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* DROPDOWN TYPE */}
                                {isDropdown ? (
                                  <div className="relative">
                                    <select
                                      value={selectedVariants[v.name] || ""}
                                      onChange={(e) => {
                                        const chosenVal = e.target.value;
                                        setSelectedVariants(prev => ({ ...prev, [v.name]: chosenVal }));
                                        const optObj = v.options?.find(o => (typeof o === 'string' ? o : o.value) === chosenVal);
                                        if (optObj && typeof optObj !== 'string' && optObj.image) {
                                          setCurrentProductImage(optObj.image);
                                        }
                                      }}
                                      className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:border-amber-500 focus:outline-none appearance-none cursor-pointer"
                                    >
                                      {v.options?.map((opt, idx) => {
                                        const optObj = typeof opt === 'string' ? { value: opt, priceDiff: 0 } : opt;
                                        const diffText = optObj.priceDiff ? ` (${optObj.priceDiff > 0 ? `+${optObj.priceDiff}` : optObj.priceDiff} دج)` : "";
                                        return (
                                          <option key={idx} value={optObj.value}>
                                            {optObj.value}{diffText}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                ) : isRadio ? (
                                  /* RADIO TYPE */
                                  <div className="space-y-2">
                                    {v.options?.map((opt, idx) => {
                                      const optObj = typeof opt === 'string' ? { value: opt, priceDiff: 0, image: null } : opt;
                                      const isSelected = selectedVariants[v.name] === optObj.value;

                                      return (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                            if (optObj.image) setCurrentProductImage(optObj.image);
                                          }}
                                          className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                            isSelected 
                                              ? "border-gray-900 bg-gray-50/80 shadow-sm" 
                                              : "border-gray-200 hover:border-gray-300 bg-white"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                              isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300"
                                            }`}>
                                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            {optObj.image && (
                                              <img src={optObj.image} alt={optObj.value} className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
                                            )}
                                            <span className="text-sm font-bold text-gray-800">{optObj.value}</span>
                                          </div>
                                          {Boolean(optObj.priceDiff) && (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                              {optObj.priceDiff! > 0 ? `+${optObj.priceDiff}` : optObj.priceDiff} دج
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  /* BUTTONS / CARDS / SWATCHES */
                                  <div className="flex flex-wrap gap-2.5">
                                    {v.options?.map((opt, idx) => {
                                      const optObj = typeof opt === 'string' ? { value: opt, priceDiff: 0, image: null, colorCode: null } : opt;
                                      const isSelected = selectedVariants[v.name] === optObj.value;
                                      const isOutOfStock = optObj.stock !== undefined && optObj.stock <= 0;

                                      // COLOR SWATCH TYPE
                                      if (isColorGroup) {
                                        let bgColor = optObj.colorCode;
                                        if (!bgColor && typeof optObj.value === 'string') {
                                          const valLower = optObj.value.trim().toLowerCase();
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

                                        const isValidHex = bgColor && (bgColor.startsWith('#') || bgColor.match(/^[a-z]+$/i) || optObj.colorCode);

                                        if (isValidHex) {
                                          return (
                                            <button
                                              key={idx}
                                              type="button"
                                              disabled={isOutOfStock}
                                              onClick={() => {
                                                setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                                if (optObj.image) setCurrentProductImage(optObj.image);
                                              }}
                                              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${
                                                isSelected 
                                                  ? "border-gray-900 bg-gray-900 text-white shadow-md scale-105" 
                                                  : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                                              } ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                              title={optObj.value}
                                            >
                                              <span 
                                                className={`w-5 h-5 rounded-full border shadow-inner shrink-0 ${
                                                  bgColor?.toLowerCase() === '#ffffff' ? 'border-gray-300' : 'border-black/20'
                                                }`}
                                                style={{ backgroundColor: bgColor }}
                                              />
                                              <span className="text-xs font-bold">{optObj.value}</span>
                                              {Boolean(optObj.priceDiff) && (
                                                <span className={`text-[10px] font-bold ${isSelected ? "text-amber-300" : "text-amber-600"}`}>
                                                  ({optObj.priceDiff! > 0 ? `+${optObj.priceDiff}` : optObj.priceDiff} دج)
                                                </span>
                                              )}
                                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-amber-400 mr-0.5" />}
                                            </button>
                                          );
                                        }
                                      }

                                      // IMAGE ONLY TYPE
                                      if (isImageOnly && optObj.image) {
                                        return (
                                          <button
                                            key={idx}
                                            type="button"
                                            disabled={isOutOfStock}
                                            onClick={() => {
                                              setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                              if (optObj.image) setCurrentProductImage(optObj.image);
                                            }}
                                            className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all group ${
                                              isSelected 
                                                ? "border-gray-900 ring-2 ring-gray-900/30 scale-105 shadow-md" 
                                                : "border-gray-200 hover:border-gray-300"
                                            } ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                            title={optObj.value}
                                          >
                                            <img src={optObj.image} alt={optObj.value} className="w-full h-full object-cover" />
                                            {isSelected && (
                                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white stroke-[3]" />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      }

                                      // IMAGE + TEXT TYPE
                                      if (isImageText && optObj.image) {
                                        return (
                                          <button
                                            key={idx}
                                            type="button"
                                            disabled={isOutOfStock}
                                            onClick={() => {
                                              setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                              if (optObj.image) setCurrentProductImage(optObj.image);
                                            }}
                                            className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border-2 transition-all ${
                                              isSelected 
                                                ? "border-gray-900 bg-gray-50 shadow-sm" 
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                            } ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                          >
                                            <img src={optObj.image} alt={optObj.value} className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                                            <span className="text-xs font-bold text-gray-800">{optObj.value}</span>
                                            {Boolean(optObj.priceDiff) && (
                                              <span className="text-[10px] font-bold text-amber-600">
                                                ({optObj.priceDiff! > 0 ? `+${optObj.priceDiff}` : optObj.priceDiff} دج)
                                              </span>
                                            )}
                                          </button>
                                        );
                                      }

                                      // STANDARD TEXT BUTTON
                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          disabled={isOutOfStock}
                                          onClick={() => {
                                            setSelectedVariants(prev => ({ ...prev, [v.name]: optObj.value }));
                                            if (optObj.image) setCurrentProductImage(optObj.image);
                                          }}
                                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 flex items-center gap-1.5 ${
                                            isSelected 
                                              ? "bg-[#1c192b] text-white border-[#1c192b] shadow-md" 
                                              : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                                          } ${isOutOfStock ? "opacity-40 cursor-not-allowed line-through" : "cursor-pointer"}`}
                                        >
                                          <span>{optObj.value}</span>
                                          {Boolean(optObj.priceDiff) && (
                                            <span className={`text-[10px] font-extrabold ${isSelected ? "text-amber-300" : "text-amber-600"}`}>
                                              ({optObj.priceDiff! > 0 ? `+${optObj.priceDiff}` : optObj.priceDiff} دج)
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Order Form Card */}
                      <form id="order-form" onSubmit={handleOrderSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                         <div className="flex justify-center items-center gap-2 mb-8 text-xl font-black text-gray-900">
                           اطلب الآن <ClipboardList size={24} className="text-gray-900" />
                         </div>
                         
                         <div className="space-y-4 mb-6">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="relative">
                               <input 
                                 type="text" required
                                 placeholder="* الإسم واللقب" 
                                 value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                  onBlur={saveProductAbandonedCartNow}
                                 className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-right pr-12 focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white transition-all font-medium" 
                               />
                               <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                             </div>
                             <div className="relative">
                               <input 
                                 type="tel" required dir="ltr"
                                 maxLength={getPhoneMaxLength(customerPhone)}
                                 placeholder="* رقم الهاتف / واتساب (0550252565)"
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
                           <div className="relative">
                             <input 
                               type="text" 
                               placeholder="العنوان الكامل (مثال: حي النصر، شارع رقم 12)"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                 onBlur={saveProductAbandonedCartNow}
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-right pr-12 focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white transition-all font-medium"
                              />
                             <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                           </div>


                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="relative">
                                <select 
                                  value={selectedWilayaCode} 
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : "";
                                    setSelectedWilayaCode(val);
                                    setCommune("");
                                  }}
                                  onBlur={saveProductAbandonedCartNow}
                                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-right appearance-none pr-12 focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white transition-all font-medium text-gray-900 cursor-pointer"
                                >
                                  <option value="">-- اختر الولاية --</option>
                                  {WILAYAS_LIST.map((w) => (
                                    <option key={w.code} value={w.code}>
                                      {w.code < 10 ? `0${w.code}` : w.code} - {w.arName}
                                    </option>
                                  ))}
                                </select>
                                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
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
                                  onBlur={saveProductAbandonedCartNow}
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

                           {/* Email Input */}
                           <div className="relative">
                             <input 
                               type="email" dir="ltr"
                               placeholder="البريد الإلكتروني (اختياري - لتلقي إشعار التأكيد والفاتورة)"
                               value={customerEmail}
                               onChange={(e) => {
                                 setCustomerEmail(e.target.value);
                                 if (customerEmailError) setCustomerEmailError("");
                               }}
                               className={`w-full bg-gray-50/50 border rounded-xl py-3.5 px-4 text-right pr-12 focus:outline-none focus:ring-2 focus:bg-white transition-all font-medium ${customerEmailError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#1c192b]"}`}
                             />
                             <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                           </div>
                           {customerEmailError && (
                             <p className="text-xs text-red-600 font-medium text-right -mt-2 mb-2">{customerEmailError}</p>
                           )}
                         </div>

                         <div className="mb-8 text-right">
                           <div className="font-bold text-gray-800 mb-3 text-sm">التوصيل:</div>
                           <label className={`flex items-center justify-between p-3 rounded-xl border mb-2 cursor-pointer transition-colors ${deliveryType === 'home' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                             <span className="text-gray-500 font-bold text-sm" dir="ltr">{currentWilaya ? currentWilaya.homeDeliveryPrice : 400} د.ج</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-700">التوصيل للمنزل</span>
                                <input type="radio" name="delivery" checked={deliveryType === "home"} onChange={() => setDeliveryType("home")} className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-gray-300" />
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

                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                           {/* Quantity */}
                           <div className="flex items-center justify-between sm:justify-center border border-gray-200 rounded-xl bg-white shadow-sm h-14 px-2 sm:w-auto">
                             <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-xl font-bold cursor-pointer">
                               -
                             </button>
                             <span className="w-10 text-center font-bold text-lg text-gray-900">{quantity}</span>
                             <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-xl font-bold cursor-pointer">
                               +
                             </button>
                           </div>

                           {/* Ajouter au panier button */}
                           <button 
                             type="button"
                             onClick={handleAddToCart}
                             className={`flex-1 h-14 rounded-xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer border ${
                               justAddedToCart 
                                 ? "bg-emerald-600 border-emerald-600 text-white animate-pulse" 
                                 : "bg-amber-500 hover:bg-amber-400 border-amber-500 text-black active:scale-95"
                             }`}
                           >
                             {justAddedToCart ? (
                               <>
                                 <Check className="w-5 h-5" />
                                 <span>تمت الإضافة للسلة ✓</span>
                               </>
                             ) : (
                               <>
                                 <ShoppingCart className="w-5 h-5" />
                                 <span>أضف إلى السلة</span>
                               </>
                             )}
                           </button>

                           {/* Commander maintenant / اطلب الآن (Submit) */}
                           <button 
                             type="submit"
                             disabled={isSubmitting}
                             className="flex-1 h-14 bg-[#1daa61] hover:bg-[#189958] text-white rounded-xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                           >
                             {isSubmitting ? (
                               <span className="flex items-center gap-2">
                                 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                 <span>جاري التسجيل...</span>
                               </span>
                             ) : (
                               <>
                                 <span>اطلب الآن</span>
                                 <ShoppingBag className="w-5 h-5" />
                               </>
                             )}
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
      {/* ======================================================== */}
      {/* SLIDE-OVER CART DRAWER & DIRECT COD CHECKOUT              */}
      {/* ======================================================== */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => {
              saveCartDrawerAbandonedCartNow();
              setIsCartDrawerOpen(false);
              setCartCheckoutMode(false);
            }} 
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col z-50 font-sans border-l border-gray-100">
              
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#1c192b] text-white flex items-center justify-center shadow-sm">
                    <ShoppingCart className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">سلة المشتريات</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {cartItems.length > 0 ? `${cartCount} عنصر في السلة` : "السلة فارغة"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && !cartCheckoutMode && (
                    <button
                      type="button"
                      onClick={clearCart}
                      title="إفراغ السلة"
                      className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      إفراغ
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => {
                      saveCartDrawerAbandonedCartNow();
                      setIsCartDrawerOpen(false);
                      setCartCheckoutMode(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <h4 className="font-black text-gray-800 text-lg mb-1">سلتك فارغة حالياً</h4>
                    <p className="text-gray-500 text-sm max-w-xs mb-6">
                      لم تقم بإضافة أي منتجات للسلة بعد. تصفح تشكيلتنا المميزة واختر ما يعجبك!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartDrawerOpen(false);
                        const el = document.getElementById('all-products') || document.getElementById('featured-products');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 rounded-xl bg-[#1c192b] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>تصفح المنتجات</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                ) : cartCheckoutMode ? (
                  /* Fast COD Form within Drawer */
                  <form onSubmit={handleCartOrderSubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <button 
                        type="button" 
                        onClick={() => setCartCheckoutMode(false)}
                        className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>العودة لمراجعة السلة</span>
                      </button>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        الدفع عند الاستلام 100%
                      </span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 font-medium">
                      يرجى إدخال معلومات التوصيل بدقة لضمان سرعة وصول طلبك
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="* الإسم واللقب"
                          value={cartCustomerName}
                          onChange={(e) => setCartCustomerName(e.target.value)}
                          onBlur={saveCartDrawerAbandonedCartNow}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white font-medium text-right"
                        />
                        <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>

                      <div className="relative">
                        <input
                          type="tel"
                          required
                          dir="ltr"
                          maxLength={getPhoneMaxLength(cartCustomerPhone)}
                          placeholder="* رقم الهاتف (0550252565)"
                          value={cartCustomerPhone}
                          onChange={(e) => {
                            setCartCustomerPhone(cleanAndLimitPhone(e.target.value));
                            if (cartCustomerPhoneError) setCartCustomerPhoneError("");
                          }}
                          onBlur={saveCartDrawerAbandonedCartNow}
                          className={`w-full bg-gray-50 border rounded-xl py-3 px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:bg-white font-medium text-right ${
                            cartCustomerPhoneError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#1c192b]"
                          }`}
                        />
                        <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                      {cartCustomerPhoneError && (
                        <p className="text-xs text-red-600 font-medium -mt-1">{cartCustomerPhoneError}</p>
                      )}

                      <div className="relative">
                        <input
                          type="email"
                          placeholder="البريد الإلكتروني (اختياري للإشعار)"
                          value={cartCustomerEmail}
                          onChange={(e) => setCartCustomerEmail(e.target.value)}
                          onBlur={saveCartDrawerAbandonedCartNow}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white font-medium text-right"
                        />
                        <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>

                      {/* Wilaya & Commune */}
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="relative">
                          <select
                            required
                            value={cartWilayaCode}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              setCartWilayaCode(val);
                              setCartCommune("");
                            }}
                            onBlur={saveCartDrawerAbandonedCartNow}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white font-medium text-right cursor-pointer"
                          >
                            <option value="">-- * اختر الولاية --</option>
                            {WILAYAS_LIST.map((w) => (
                              <option key={w.code} value={w.code}>
                                {w.code < 10 ? `0${w.code}` : w.code} - {w.arName}
                              </option>
                            ))}
                          </select>
                          <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>

                        <div className="relative">
                          <select
                            required
                            disabled={!cartWilayaCode}
                            value={cartCommune}
                            onChange={(e) => setCartCommune(e.target.value)}
                            onBlur={saveCartDrawerAbandonedCartNow}
                            className={`w-full border rounded-xl py-3 px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 font-medium text-right ${
                              !cartWilayaCode
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#1c192b] focus:bg-white cursor-pointer"
                            }`}
                          >
                            <option value="">{cartWilayaCode ? "* اختر البلدية" : "* البلدية (يرجى اختيار الولاية أولاً)"}</option>
                            {cartAvailableCommunes.map((c) => (
                              <option key={c.name} value={c.arName || c.name}>
                                {c.arName ? `${c.arName} (${c.name})` : c.name}
                              </option>
                            ))}
                          </select>
                          <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="العنوان الكامل (الحي، الشارع)"
                          value={cartAddress}
                          onChange={(e) => setCartAddress(e.target.value)}
                          onBlur={saveCartDrawerAbandonedCartNow}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c192b] focus:bg-white font-medium text-right"
                        />
                        <Home className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>

                      {/* Delivery Choice */}
                      <div className="pt-2">
                        <div className="text-xs font-bold text-gray-700 mb-2">نوع التوصيل:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            cartDeliveryType === 'home' ? 'border-[#1c192b] bg-gray-50 ring-1 ring-[#1c192b]' : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                            <input 
                              type="radio" 
                              name="cartDelivery" 
                              checked={cartDeliveryType === 'home'} 
                              onChange={() => setCartDeliveryType('home')} 
                              className="sr-only" 
                            />
                            <div className="text-xs font-bold text-gray-900">للمنزل</div>
                            <div className="text-[11px] text-gray-500 font-bold mt-0.5">{cartWilaya ? cartWilaya.homeDeliveryPrice : 400} د.ج</div>
                          </label>

                          <label className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            cartDeliveryType === 'desk' ? 'border-[#1c192b] bg-gray-50 ring-1 ring-[#1c192b]' : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                            <input 
                              type="radio" 
                              name="cartDelivery" 
                              checked={cartDeliveryType === 'desk'} 
                              onChange={() => setCartDeliveryType('desk')} 
                              className="sr-only" 
                            />
                            <div className="text-xs font-bold text-gray-900">للمكتب (Stop Desk)</div>
                            <div className="text-[11px] text-gray-500 font-bold mt-0.5">{cartWilaya ? cartWilaya.deskDeliveryPrice : 300} د.ج</div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cartIsSubmitting}
                      className="w-full mt-4 py-4 rounded-xl bg-[#1c192b] hover:bg-[#2c2742] text-white font-black text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {cartIsSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>جاري تأكيد الطلب...</span>
                        </span>
                      ) : (
                        <>
                          <Check className="w-5 h-5 text-emerald-400" />
                          <span>تأكيد الطلب الآن ({cartTotalAmount.toLocaleString()} د.ج)</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Cart Items List */
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => (
                      <div 
                        key={idx}
                        className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm flex items-center gap-3.5 hover:border-gray-200 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 truncate mb-0.5">
                            {item.name}
                          </h4>
                          {item.variants && Object.keys(item.variants).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {Object.entries(item.variants).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                  {v as string}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-xs font-black text-gray-900">
                            {(Number(item.price) || 0).toLocaleString()} د.ج
                          </div>
                        </div>

                        {/* Quantity and Remove */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8 px-1">
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(idx, (item.quantity || 1) - 1)}
                              className="w-6 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold text-sm cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(idx, (item.quantity || 1) + 1)}
                              className="w-6 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold text-sm cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Bottom Bar (when cart has items and not in checkout mode) */}
              {cartItems.length > 0 && !cartCheckoutMode && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/80 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-bold">المجموع الفرعي ({cartCount} منتجات)</span>
                    <span className="font-black text-lg text-gray-900">{cartSubtotal.toLocaleString()} د.ج</span>
                  </div>

                  <div className="text-[11px] text-gray-400 text-center font-medium">
                    يتم احتساب مصاريف التوصيل في الخطوة التالية حسب الولاية
                  </div>

                  <button
                    type="button"
                    onClick={() => setCartCheckoutMode(true)}
                    className="w-full py-4 rounded-xl bg-[#1c192b] hover:bg-[#2c2742] text-white font-black text-base shadow-xl flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>متابعة الطلب والدفع عند الاستلام</span>
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
