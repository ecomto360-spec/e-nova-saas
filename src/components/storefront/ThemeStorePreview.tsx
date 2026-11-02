import React, { useState, useMemo, useRef, FormEvent, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, dbPublic, auth } from "../../lib/firebase";
import { doc as fsDoc, getDoc as fsGetDoc } from "firebase/firestore";
import {
  CartCaptureInput,
  trackAbandonedCart,
  trackAbandonedCartNow,
  flushAbandonedCart,
  notifyCartRecovered
} from "../../lib/abandonedCartCapture";
import { StoreCustomizerConfig } from "../admin/StoreCustomizerConfig";
import {
  BilingualText,
  SectionId,
  StorefrontSettings,
  defaultStorefrontSettings,
  mergeStorefrontSettings,
  pickText,
} from "../../types/storefront";
import { getTrustIcon } from "../admin/storefront/trustIcons";
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
  Copy, MessageCircle, Facebook, Instagram, Music2, Send, Github, Link2
} from "lucide-react";
import { StoreTheme, StoreDemoProduct } from "../../data/themesData";
import { getManifestByLegacyId, getThemeManifest } from "../../themes/registry";
import { ensureGoogleFonts, fontStack } from "../../lib/themeFonts";
import { ALGERIAN_WILAYAS as WILAYAS_LIST } from "../../data/landingData";
import { getCommunesForWilaya } from "../../data/algerianCommunes";
import { isPhoneBlacklisted } from "../../lib/blacklist";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../../lib/phoneUtils";
// T1 — système de sections v2, panier, modale options, widget d'aide.
import { useStorefrontCart } from "../../lib/storefrontCart";
import { ProductCardV2 } from "./sections/ProductCardV2";
import { OptionsModal } from "./sections/OptionsModal";
import { MiniCart } from "./sections/MiniCart";
import { CartCheckoutModal } from "./sections/CartCheckoutModal";
import { ReviewsSectionView, FaqSectionView, PromoBannerSectionView, BrandInfoSectionView, TrustSectionView, TextImageSectionView, VideoSectionView } from "./sections/ContentSections";
import { HelpWidget } from "./HelpWidget";
import type { StorefrontProductLite } from "./sections/sectionTypes";
import type { HomeSection, StoreV2Settings } from "../../types/storefrontSections";
import { migrateLegacySettings, defaultV2Settings } from "../../data/storefrontDefaults";
import { CollectionView } from "./sections/CollectionView";

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

const defaultV2Card = defaultV2Settings().productCard;

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
  /** Contenu éditable de la page d'accueil (voir types/storefront). */
  storefront?: StorefrontSettings;
  /** Nombre de ventes par productId (calculé depuis les commandes). */
  soldCounts?: Record<string, number>;
  /** T1 — sections v2 (page d'accueil ordonnée). Absent -> migration v1. */
  sectionsV2?: HomeSection[];
  /** T3 — identifiant du registre (prioritaire sur le thème legacy pour les tokens). */
  registryThemeId?: string;
  /** Section sélectionnée dans l'éditeur : contour pointillé orange persistant. */
  selectedSectionId?: string;
  /** Mode « œil » : masque les repères d'édition (survol, contour, badge). */
  disableEditorOverlays?: boolean;
  /** T1 — réglages globaux v2 (footer, widget d'aide, carte produit, prix). */
  v2Settings?: StoreV2Settings;
  /** Slug public (clé du panier localStorage). */
  storeSlug?: string;
}

export function ThemeStorePreview({ theme, config, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts,
  actualCategories, currentView = "home", onSectionSelect, initialProductId, tenantId, storefront, soldCounts, sectionsV2, v2Settings, selectedSectionId, disableEditorOverlays, registryThemeId, storeSlug }: ThemeStorePreviewProps) {
  
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

  /* ===== T3 — tokens du thème actif (typo + layout réellement distincts) ===== */
  const themeManifest = (registryThemeId ? getThemeManifest(registryThemeId) : getManifestByLegacyId(theme.id)) ?? getThemeManifest("starter_v2");
  const heroStyle = themeManifest.layoutVariants.heroStyle;
  const categoryStyle = themeManifest.layoutVariants.categoryStyle;
  const themeGridCols = themeManifest.layoutVariants.gridColumns;
  const themeCard = themeManifest.layoutVariants.productCard;
  const headingFontFamily = fontStack(themeManifest.defaultFonts.heading);
  const bodyFontFamily = fontStack(themeManifest.defaultFonts.body);
  const isDigitalTheme = themeManifest.id === "digital_products";

  const c_primaryColor = getVal(config?.primaryColor, theme.primaryColor, "#dddddd");
  const c_fontFamily = getVal(config?.fontFamily, "sans", "sans");
  const c_lang = getVal(config?.language, "ar", "ar");
  const isRtl = c_lang === "ar";

  // ===== Contenu éditable de la page d'accueil (StorefrontSettings) =====
  // Fusion tolérante : champs absents -> valeurs par défaut propres (jamais de placeholder).
  const sf = mergeStorefrontSettings(storefront);
  const bt = (value: BilingualText | undefined, fallback = ""): string => pickText(value, c_lang, fallback);
  
  // Header
  const c_storeName = getVal(config?.storeName, theme.nameAr || theme.name || "أزياء الموضة", "Nom de la boutique");
  const c_logoUrl = getVal(config?.logoUrl, customLogoUrl || "", "");
  
  // Hero (contenu piloté par StorefrontSettings ; thème de démo si non activé)
  const c_heroShow = !isActivated ? true : sf.hero.visible;
  const c_heroBg = !isActivated ? (theme.bannerImage || "") : (sf.hero.desktopImage || theme.bannerImage || "");
  const c_heroBgMobile = !isActivated ? (theme.bannerImage || "") : (sf.hero.mobileImage || sf.hero.desktopImage || theme.bannerImage || "");
  const c_heroTitle = !isActivated ? (theme.bannerHeadlineAr || theme.bannerHeadline || "") : bt(sf.hero.title);
  const c_heroSubtitle = !isActivated ? (theme.bannerSubheadlineAr || theme.bannerSubheadline || "") : bt(sf.hero.description);
  const c_heroBadgeShow = !isActivated ? true : sf.hero.badge.visible;
  const c_heroBadge = !isActivated ? "تشكيلة الموسم الجديدة 2026" : bt(sf.hero.badge.text);
  const c_heroBtnShow = !isActivated ? true : sf.hero.primaryButton.visible;
  const c_heroBtn = !isActivated ? (theme.bannerCtaAr || "تسوق الآن") : bt(sf.hero.primaryButton.text);
  const c_heroBtnLink = !isActivated ? "#all-products" : (sf.hero.primaryButton.link || "#all-products");
  const c_heroSecondaryShow = !isActivated ? true : sf.hero.secondaryButton.visible;
  const c_heroSecondary = !isActivated ? "تصفح الأقسام" : bt(sf.hero.secondaryButton.text);
  const c_heroSecondaryLink = !isActivated ? "#categories" : (sf.hero.secondaryButton.link || "#categories");
  const c_heroOverlay = sf.hero.overlayOpacity / 100;
  const c_heroAlignInner = sf.hero.align === "center" ? "text-center items-center" : sf.hero.align === "end" ? "text-end items-end" : "text-start items-start";
  const c_heroJustify = sf.hero.align === "center" ? "justify-center" : sf.hero.align === "end" ? "justify-end" : "justify-start";
  const c_heroBadgeSelf = sf.hero.align === "center" ? "self-center" : sf.hero.align === "end" ? "self-end" : "self-start";
  
  // Announcement
  const c_announcementShow = getBool(config?.showAnnouncement, true);
  const c_announcementBg = getVal(config?.announcementBgColor, theme.primaryColor || "#f59e0b", "#999999");
  const c_announcementText = getVal(config?.announcementText, "🚚 توصيل سريع لـ 58 ولاية — الدفع عند الاستلام", "Votre message d'annonce");
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
  const c_showCartIcon = v2Settings ? v2Settings.header.showCartIcon : getBool(config?.showCartIcon, true);
  const c_showSearch = v2Settings ? v2Settings.header.showSearch : getBool((config as { showSearch?: boolean } | undefined)?.showSearch, true);
  const c_hideOnProductPage = getBool(config?.hideOnProductPage, false);

  // Trust (items pilotés par StorefrontSettings)
  const c_trustShow = !isActivated ? true : sf.trustBar.visible;
  const trustItems = !isActivated ? defaultStorefrontSettings.trustBar.items : sf.trustBar.items.filter(i => i.visible);

  // Categories
  const c_categoriesShow = !isActivated ? true : sf.categories.visible;
  const c_catTitle = !isActivated ? "تصفح الأقسام" : bt(sf.categories.title);
  const c_catSubtitle = !isActivated ? "اختر القسم المناسب وتصفح أفضل المنتجات" : bt(sf.categories.subtitle);

  // Featured
  const c_featuredShow = !isActivated ? true : sf.featured.visible;
  const c_featBadge = !isActivated ? "الأكثر مبيعاً" : bt(sf.featured.badge);
  const c_featTitle = !isActivated ? "المنتجات المميزة" : bt(sf.featured.title);
  const c_featViewAll = !isActivated ? "عرض الكل" : bt(sf.featured.viewAllText);

  
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

  /* T3 — charge les polices Google Fonts du thème (arabe inclus) + règle des titres. */
  useEffect(() => {
    ensureGoogleFonts([themeManifest.defaultFonts.heading, themeManifest.defaultFonts.body, config?.fontFamily]);
    let styleEl = document.getElementById("enova-storefront-fonts");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "enova-storefront-fonts";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = ".enova-storefront h1,.enova-storefront h2,.enova-storefront h3,.enova-storefront h4{font-family:var(--enova-heading-font,inherit)}";
  }, [themeManifest.defaultFonts.heading, themeManifest.defaultFonts.body, config?.fontFamily]);
  
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

  // Consentement WhatsApp (extension Order Automation) : mention sous le
  // formulaire + case à cocher si le vendeur l'exige (whatsapp_settings).
  const WA_CONSENT_TEXT_AR = "بإدخال رقمك، فإنك توافق على أن يتم التواصل معك عبر WhatsApp بخصوص طلبك.";
  const [waConsentRequired, setWaConsentRequired] = useState(false);
  const [waConsentChecked, setWaConsentChecked] = useState(false);

  useEffect(() => {
    const tid = tenantId || auth.currentUser?.uid;
    if (!tid) return;
    let mounted = true;
    (async () => {
      try {
        const snap = await fsGetDoc(fsDoc(dbPublic, "whatsapp_settings", tid));
        if (mounted && snap.exists()) {
          const data = snap.data() || {};
          setWaConsentRequired(data.enabled === true && data.consentCheckbox === true);
        }
      } catch { /* réglages absents → mention simple */ }
    })();
    return () => { mounted = false; };
  }, [tenantId]);

  // Communes disponibles filtrées selon la wilaya choisie
  const availableCommunes = useMemo(() => {
    if (!selectedWilayaCode) return [];
    return getCommunesForWilaya(Number(selectedWilayaCode));
  }, [selectedWilayaCode]);

  // Helper pour entourer les sections cliquables
  const EditableSection = ({ id, children, className = "" }: { id: string, children: React.ReactNode, className?: string }) => {
    if (isStandaloneView || disableEditorOverlays) return <div className={className}>{children}</div>;
    const selected = selectedSectionId === id;
    return (
      <div 
        className={`relative group/section cursor-pointer ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onSectionSelect) onSectionSelect(id);
        }}
      >
        <div className={`absolute inset-0 border-2 transition-all z-40 pointer-events-none rounded-lg m-0.5 ${selected ? "border-amber-500 border-dashed bg-amber-500/5" : "border-transparent group-hover/section:border-amber-500 group-hover/section:bg-amber-500/5"}`}></div>
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
      const rawCats = actualCategories as Array<Record<string, unknown>>;
      const mapped = rawCats.map(c => ({
        id: String(c.name ?? ""), // product.category = nom de la catégorie dans le modèle réel
        name: String(c.name ?? ""),
        nameAr: String((c as { nameAr?: string }).nameAr ?? c.name ?? ""),
        image: (c.imageUrl as string) || (c.image as string) || undefined,
        // Compteur recalculé depuis les produits (le champ productCount bd peut être périmé)
        productCount: (actualProducts ?? []).filter(
          (pr) => pr && typeof pr === "object" && String((pr as { category?: string }).category ?? "") === String(c.name ?? "")
        ).length
      }));
      // Aucune catégorie enregistrée en base : on les déduit des produits
      // (ex. « Vêtements », « Général ») pour ne jamais montrer une section vide.
      if (mapped.length === 0) {
        const names = Array.from(new Set(
          (actualProducts ?? [])
            .map((p) => (p && typeof p === "object" ? (p as { category?: string }).category : undefined))
            .filter((n): n is string => Boolean(n))
        ));
        return names.map((n) => ({ id: n, name: n, nameAr: n, image: undefined, productCount: 0 }));
      }
      return mapped;
    }
    return theme.categories;
  }, [actualCategories, actualProducts, theme.categories]);

  // Catégories affichées dans la SECTION Catégories (sélection éditable + maximum)
  const sectionCategories = useMemo(() => {
    const selected = isActivated ? sf.categories.categoryIds : [];
    const filtered = selected.length > 0 ? displayCategories.filter(c => selected.includes(c.id)) : displayCategories;
    const max = Math.max(1, isActivated ? sf.categories.maxCount : 10);
    return filtered.slice(0, max);
  }, [displayCategories, isActivated, sf.categories.categoryIds, sf.categories.maxCount]);

  // Categories list with "All"
  const categories = useMemo(() => {
    return [
      { id: "all", nameAr: "الكل", name: "Tous" },
      ...displayCategories
    ];
  }, [displayCategories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const base = (actualProducts ? actualProducts : theme.products).filter(product => {
      // Un produit réel marqué inactif/brouillon ne doit JAMAIS apparaître en
      // boutique publique (les produits de démo n'ont pas de statut -> actifs).
      const isActive = !product.status || product.status === "active";
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.nameAr && product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()));
      return isActive && matchesCategory && matchesSearch;
    });
    // T2 — tri par défaut + « en stock d'abord » pilotés par les réglages v2.
    const sortMode = v2Settings?.defaultProductSort ?? "recent";
    const stockFirst = v2Settings?.stockFirst ?? false;
    const withStock = (arr: typeof base) => (stockFirst ? [...arr].sort((a, b) => (Number(b.stock ?? 99) > 0 ? 1 : 0) - (Number(a.stock ?? 99) > 0 ? 1 : 0)) : arr);
    if (sortMode === "priceAsc") return withStock([...base].sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)));
    if (sortMode === "priceDesc") return withStock([...base].sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)));
    if (sortMode === "bestSelling") return withStock([...base].sort((a, b) => (soldCounts?.[b.id] ?? 0) - (soldCounts?.[a.id] ?? 0)));
    if (sortMode === "stockFirst") return [...base].sort((a, b) => (Number(b.stock ?? 99) > 0 ? 1 : 0) - (Number(a.stock ?? 99) > 0 ? 1 : 0));
    // « recent » et « manual » : ordre du catalogue (inséré/défini par le marchand).
    return withStock(base);
  }, [(actualProducts ? actualProducts : theme.products), selectedCategory, searchQuery, v2Settings?.defaultProductSort, v2Settings?.stockFirst, soldCounts]);

  // Featured products (source : meilleures ventes ou sélection manuelle)
  const featuredProducts = useMemo(() => {
    const rawSource = actualProducts ? actualProducts : theme.products;
    // Même règle : pas de produit inactif en vedette.
    const source = rawSource.filter(p => !p.status || p.status === "active");
    if (!isActivated) {
      return source.filter(p => p.isFeatured).slice(0, 4);
    }
    const settings = sf.featured;
    let list: StoreDemoProduct[];
    if (settings.source === "manual" && settings.productIds.length > 0) {
      list = settings.productIds
        .map(id => source.find(p => p.id === id))
        .filter((p): p is StoreDemoProduct => Boolean(p));
    } else {
      list = [...source].sort((a, b) => (soldCounts?.[b.id] ?? 0) - (soldCounts?.[a.id] ?? 0));
    }
    const count = Math.max(1, Math.min(12, settings.count));
    return list.slice(0, count);
  }, [actualProducts, theme.products, isActivated, sf.featured, soldCounts]);

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

  // ==========================================================================
  // DÉTECTION DES PANIERS ABANDONNÉS (capture publique, sans authentification)
  // Dès que le téléphone saisi est un numéro algérien valide, l'état du
  // formulaire est envoyé vers /api/abandoned-carts/track (débounce ~1,5 s),
  // puis re-validé au blur et à la fermeture de l'onglet (sendBeacon).
  // Aucune écriture directe dans Firestore depuis la boutique publique.
  // ==========================================================================
  const latestCartCaptureRef = useRef<CartCaptureInput | null>(null);

  useEffect(() => {
    const effectiveTenantId = tenantId || auth.currentUser?.uid;
    if (!selectedProduct || !effectiveTenantId) {
      latestCartCaptureRef.current = null;
      return;
    }
    const prodImg = selectedProduct.image || (selectedProduct.images && selectedProduct.images[0]) || "";
    const capture: CartCaptureInput = {
      tenantId: effectiveTenantId,
      slug: window.location.pathname.split("/").filter(Boolean).pop() || "",
      phone: customerPhone,
      client: customerName,
      wilaya: currentWilaya ? `${currentWilaya.code < 10 ? `0${currentWilaya.code}` : currentWilaya.code} - ${currentWilaya.arName}` : "",
      commune,
      address: customerAddress,
      deliveryType,
      items: [{
        productId: String(selectedProduct.id || "demo-product"),
        name: selectedProduct.nameAr || selectedProduct.name,
        image: prodImg,
        variants: selectedVariants,
        qty: quantity,
        price: totalPrice - deliveryPrice
      }],
      subtotal: totalPrice - deliveryPrice,
      shipping: deliveryPrice,
      total: totalPrice,
      lang: "ar",
      source: "storefront_product_form",
      consentText: WA_CONSENT_TEXT_AR,
      consentChecked: waConsentChecked
    };
    latestCartCaptureRef.current = capture;
    trackAbandonedCart(capture);
  }, [tenantId, selectedProduct, customerPhone, customerName, selectedWilayaCode, commune, customerAddress, deliveryType, quantity, selectedVariants, currentWilaya, totalPrice, deliveryPrice, waConsentChecked]);

  // Dernier état garanti à la fermeture de l'onglet / changement d'onglet.
  useEffect(() => {
    const flush = () => {
      if (latestCartCaptureRef.current) {
        flushAbandonedCart(latestCartCaptureRef.current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

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

        // Commande validée : toutes les fiches panier de ce téléphone passent
        // en "recovered" (plus jamais "abandonné").
        notifyCartRecovered(effectiveTenantId, customerPhone, generatedOrderId);

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

  // ===== T1 — sections v2, panier, modale options, toast, widget d'aide =====
  const v2Sections = useMemo<HomeSection[]>(
    () => (sectionsV2 && sectionsV2.length > 0 ? sectionsV2 : migrateLegacySettings(sf).sections),
    [sectionsV2, sf]
  );
  const v2 = v2Settings;

  /* T2 — Réglages pied de page (v2) avec défauts sûrs. */
  const footerSettings = v2?.footer ?? defaultV2Settings().footer;
  const footerAbout = c_lang === "ar" ? footerSettings.about.ar : footerSettings.about.fr;
  const footerShowCategories = footerSettings.showCategories;
  const footerShowQuickLinks = footerSettings.showQuickLinks;
  const footerHideBrand = footerSettings.hideBrand;
  const footerSocials = [
    { key: "whatsapp", href: `https://wa.me/${footerSettings.whatsapp.replace(/[^0-9]/g, "")}`, label: "WhatsApp", Icon: MessageCircle },
    { key: "facebook", href: footerSettings.facebook, label: "Facebook", Icon: Facebook },
    { key: "instagram", href: footerSettings.instagram, label: "Instagram", Icon: Instagram },
    { key: "tiktok", href: footerSettings.tiktok, label: "TikTok", Icon: Music2 },
    { key: "telegram", href: footerSettings.telegram, label: "Telegram", Icon: Send },
    { key: "github", href: footerSettings.github, label: "GitHub", Icon: Github },
    { key: "custom", href: footerSettings.customLink.url, label: footerSettings.customLink.name || "Lien", Icon: Link2 },
  ].filter((x) => x.href && x.href.length > 3);

  const effectiveSlug = storeSlug || tenantId || "preview";
  const cart = useStorefrontCart(effectiveSlug);
  const [optionsProduct, setOptionsProduct] = useState<StorefrontProductLite | null>(null);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [cartCheckoutOpen, setCartCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  /** Produits normalisés pour les composants v2 (cartes, modale, mini-panier). */
  const categoryNameOf = (raw: string, isReal: boolean): string => {
    if (!isReal) return raw; // produits du thème : category = nom lisible
    const cat = (actualCategories as Array<Record<string, unknown>> | undefined)?.find(
      (c) => String(c.id ?? "") === raw || String(c.name ?? "") === raw
    );
    if (!cat) return raw;
    return c_lang === "ar" ? String(cat.nameAr ?? cat.name ?? raw) : String(cat.name ?? raw);
  };
  const liteProducts = useMemo<StorefrontProductLite[]>(() => {
    const src = actualProducts ? actualProducts : theme.products;
    return (src as Array<Record<string, unknown>>).map((p, i) => {
      const raw = p as {
        id?: string; name?: string; nameAr?: string; price?: number; originalPrice?: number;
        image?: string; images?: string[]; category?: string; isFeatured?: boolean; stock?: number;
        description?: string; descriptionAr?: string; variants?: unknown; status?: string;
      };
      return {
        id: String(raw.id ?? "p" + i),
        name: String(raw.name ?? ""),
        nameAr: String(raw.nameAr ?? raw.name ?? ""),
        price: Number(raw.price ?? 0),
        oldPrice: raw.originalPrice ? Number(raw.originalPrice) : null,
        images: raw.images && raw.images.length > 0 ? raw.images.map(String) : raw.image ? [String(raw.image)] : [],
        category: categoryNameOf(String(raw.category ?? ""), Boolean(actualProducts)),
        isFeatured: Boolean(raw.isFeatured),
        stock: typeof raw.stock === "number" ? raw.stock : 99,
        variants: Array.isArray(raw.variants)
          ? (raw.variants as Array<Record<string, unknown>>).map((v) => ({
              name: String(v.name ?? ""),
              nameAr: String(v.nameAr ?? v.name ?? ""),
              options: Array.isArray(v.options)
                ? (v.options as Array<unknown>).map((o) => {
                    const opt = typeof o === "string" ? { value: o } : (o as Record<string, unknown>);
                    return { label: String(opt.value ?? opt.label ?? ""), labelAr: String(opt.valueAr ?? opt.labelAr ?? opt.value ?? opt.label ?? "") };
                })
                : [],
            }))
          : [],
        description: String(raw.description ?? ""),
        descriptionAr: String(raw.descriptionAr ?? raw.description ?? ""),
        isDemo: !actualProducts,
      };
    });
  }, [actualProducts, theme.products]);

  const relatedProducts = useMemo(() => {
    const inCart = new Set(cart.items.map((i) => i.productId));
    return liteProducts
      .filter((p) => !inCart.has(p.id) && p.stock > 0)
      .sort((a, b) => (soldCounts?.[b.id] ?? 0) - (soldCounts?.[a.id] ?? 0))
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: c_lang === "ar" ? p.nameAr : p.name, image: p.images[0] || "", price: p.price }));
  }, [liteProducts, cart.items, soldCounts, c_lang]);

  /** Normalise un produit brut (bd ou thème) en StorefrontProductLite. */
  const toLiteProduct = (product: unknown, i = 0): StorefrontProductLite => {
    const raw = product as Record<string, unknown>;
    const v = liteProducts.find((lp) => lp.id === String(raw.id ?? ""));
    if (v) return v;
    return {
      id: String(raw.id ?? "p" + i),
      name: String(raw.name ?? ""),
      nameAr: String(raw.nameAr ?? raw.name ?? ""),
      price: Number(raw.price ?? 0),
      oldPrice: raw.originalPrice ? Number(raw.originalPrice) : null,
      images: Array.isArray(raw.images) && raw.images.length ? raw.images.map(String) : raw.image ? [String(raw.image)] : [],
      category: categoryNameOf(String(raw.category ?? ""), Boolean(actualProducts)),
      isFeatured: Boolean(raw.featured ?? raw.isFeatured),
      stock: typeof raw.stock === "number" ? raw.stock : 99,
      variants: [],
      description: String(raw.description ?? ""),
      descriptionAr: String(raw.descriptionAr ?? raw.description ?? ""),
      isDemo: !actualProducts,
    };
  };

  const handleQuickAdd = (p: StorefrontProductLite): void => {
    if (p.stock <= 0) return;
    if (p.variants && p.variants.length > 0) { setOptionsProduct(p); return; }
    cart.addItem({
      productId: p.id,
      name: c_lang === "ar" ? p.nameAr : p.name,
      image: p.images[0] || "",
      price: p.price,
      oldPrice: p.oldPrice,
      qty: 1,
      variantLabel: "",
      category: p.category,
    });
    setToastMsg(c_lang === "ar" ? "تمت الإضافة إلى السلة ✓" : "Ajouté au panier ✓");
  };

  const handleOptionsAdd = (qty: number, variantLabel: string): void => {
    if (!optionsProduct) return;
    cart.addItem({
      productId: optionsProduct.id,
      name: c_lang === "ar" ? optionsProduct.nameAr : optionsProduct.name,
      image: optionsProduct.images[0] || "",
      price: optionsProduct.price,
      oldPrice: optionsProduct.oldPrice,
      qty,
      variantLabel,
      category: optionsProduct.category,
    });
    setOptionsProduct(null);
    setToastMsg(c_lang === "ar" ? "تمت الإضافة إلى السلة ✓" : "Ajouté au panier ✓");
  };

  /** Ouverture de la fiche produit existante depuis une carte v2. */
  const handleOpenLite = (p: StorefrontProductLite): void => {
    const src = actualProducts ? actualProducts : theme.products;
    const found = (src as Array<Record<string, unknown>>).find((x) => String(x.id ?? "") === p.id);
    if (found) handleOpenProduct(found as unknown as StoreDemoProduct);
  };

  /** T1 — commande panier : crée la commande COD multi-articles (mêmes
   * collections que la commande rapide), capture le panier abandonné,
   * vide le panier. Retourne true en cas de succès. */
  const handleCartOrder = async (form: {
    name: string; phone: string; email: string; wilayaCode: number; commune: string;
    address: string; notes: string; deliveryType: "home" | "office"; deliveryPrice: number;
  }): Promise<boolean> => {
    const effectiveTenantId = tenantId || auth.currentUser?.uid;
    if (!effectiveTenantId || cart.items.length === 0) return false;
    try {
      if (await isPhoneBlacklisted(effectiveTenantId, form.phone)) {
        alert(c_lang === "ar" ? "عذراً، هذا الرقم محظور من إتمام الطلبات في هذا المتجر." : "Désolé, ce numéro est sur liste noire pour cette boutique.");
        return false;
      }
      const generatedOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
      const w = WILAYAS_LIST.find((x) => x.code === form.wilayaCode);
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const items = cart.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.qty,
        variants: { selection: it.variantLabel },
        image: it.image,
      }));
      const orderData = {
        orderNumber: generatedOrderId.substring(4, 10),
        reference: generatedOrderId,
        userId: effectiveTenantId,
        client: form.name,
        phone: form.phone,
        email: form.email || "",
        wilaya: w ? `${String(w.code).padStart(2, "0")} - ${w.arName}` : "",
        commune: form.commune,
        address: form.address || (form.deliveryType === "home" ? "Livraison à domicile" : "Point de relais"),
        notes: form.notes,
        itemsSummary: cart.items.map((it) => `${it.qty}x ${it.name}`).join(" + ").slice(0, 180),
        total: cart.totalDA + form.deliveryPrice,
        status: "En attente",
        date: `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        createdAt: serverTimestamp(),
        image: cart.items[0]?.image || "",
        productImage: cart.items[0]?.image || "",
        items,
        shippingMethod: form.deliveryType === "home" ? "Livraison à domicile" : "Point de relais",
        shippingCost: form.deliveryPrice,
        source: "cart",
      };
      await addDoc(collection(db, "orders"), orderData);
      await addDoc(collection(db, "tenants", effectiveTenantId, "orders"), orderData);
      notifyCartRecovered(effectiveTenantId, form.phone, generatedOrderId);
      try {
        window.dispatchEvent(new CustomEvent("order_created", { detail: { ...orderData, createdAt: Date.now() } }));
        localStorage.setItem("last_order_alert", JSON.stringify({ ...orderData, createdAt: Date.now() }));
      } catch { /* alerte best-effort */ }
      cart.clear();
      return true;
    } catch {
      alert(c_lang === "ar" ? "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى." : "Erreur lors de l'envoi de la commande, réessayez.");
      return false;
    }
  };

  return (
    <div
      className="enova-storefront min-h-screen bg-[#fafafa] text-gray-800 flex flex-col"
      style={{ fontFamily: bodyFontFamily, ["--enova-heading-font" as string]: headingFontFamily } as React.CSSProperties}
      dir={isRtl ? "rtl" : "ltr"}
    >
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
          <div className={`hidden md:flex flex-1 max-w-md mx-6 relative ${c_navStyle === 'centered' ? 'absolute right-20 w-64' : ''} ${c_showSearch ? "" : "md:hidden"}`}>
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
                onClick={() => setMiniCartOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors"
                title={c_lang === "ar" ? "السلة" : "Panier"}
                style={{ color: c_navTextColor }}
              >
                {c_cartIconStyle === 'filled' ? (
                  <ShoppingBag className="w-5 h-5 fill-current" />
                ) : c_cartIconStyle === 'minimal' ? (
                  <ShoppingCart className="w-5 h-5" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
                
                {cart.count > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: c_primaryColor }}
                  >
                    {cart.count}
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
      {/* === Sections éditables de la page d'accueil (ordre dynamique) === */}
      {(() => {
        const renderSection: Record<SectionId, React.ReactElement | null> = {
          hero: c_heroShow ? (
            <EditableSection id="hero_banner">
              <section className={`relative overflow-hidden ${
                heroStyle === "fullscreen"
                  ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white min-h-[78vh] flex items-center py-16 sm:py-24"
                  : heroStyle === "split"
                    ? "bg-white text-gray-900 py-12 sm:py-20 border-b border-gray-100"
                    : heroStyle === "minimal"
                      ? "bg-gray-50 text-gray-900 py-14 sm:py-20 border-b border-gray-100"
                      : "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-20"
              }`}>
                {/* Background Image with Overlay (banner / fullscreen ; encadré en split ; masqué en minimal) */}
                {heroStyle === "split" ? (
                  <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    {c_heroBg ? (
                      <img src={c_heroBg} alt="" className="w-full h-56 sm:h-72 object-cover rounded-3xl shadow-lg" />
                    ) : null}
                  </div>
                ) : heroStyle !== "minimal" ? (
                <div className="absolute inset-0 z-0">
                  <img
                    src={c_heroBgMobile}
                    alt=""
                    className="sm:hidden w-full h-full object-cover object-center scale-105"
                  />
                  <img
                    src={c_heroBg}
                    alt="Hero Banner"
                    className="hidden sm:block w-full h-full object-cover object-center scale-105"
                  />
                  <div className="absolute inset-0" style={{ backgroundColor: `rgba(17, 24, 39, ${heroStyle === "fullscreen" ? Math.max(c_heroOverlay, 0.45) : c_heroOverlay})` }}></div>
                </div>
                ) : null}

                <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex ${heroStyle === "fullscreen" || heroStyle === "minimal" ? "justify-center text-center" : c_heroJustify}`}>
                  <div className={`max-w-2xl flex flex-col ${heroStyle === "fullscreen" || heroStyle === "minimal" ? "items-center" : c_heroAlignInner}`}>
                    {c_heroBadgeShow && (
                      <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${c_heroBadgeSelf} ${heroStyle === "split" || heroStyle === "minimal" ? "bg-gray-900/5 border border-gray-900/10 text-gray-700" : "bg-amber-500/20 border border-amber-500/30 text-amber-300"}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{c_heroBadge}</span>
                      </div>
                    )}
                    {c_heroTitle && (
                      <h2 className={`${heroStyle === "fullscreen" ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl"} font-black tracking-tight leading-tight mb-4 ${heroStyle === "split" || heroStyle === "minimal" ? "text-gray-900" : "text-white"}`} style={{ fontFamily: headingFontFamily }}>
                        {c_heroTitle}
                      </h2>
                    )}
                    {c_heroSubtitle && (
                      <p className={`text-sm sm:text-base mb-8 font-normal leading-relaxed ${heroStyle === "split" || heroStyle === "minimal" ? "text-gray-600" : "text-gray-300"}`}>
                        {c_heroSubtitle}
                      </p>
                    )}
                    <div className={`flex flex-wrap items-center gap-4 ${c_heroJustify}`}>
                      {c_heroBtnShow && c_heroBtn && (
                        <a
                          href={c_heroBtnLink}
                          className="px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-xl hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                          style={{ backgroundColor: c_primaryColor }}
                        >
                          {c_heroBtn}
                        </a>
                      )}
                      {c_heroSecondaryShow && c_heroSecondary && (
                        <a
                          href={c_heroSecondaryLink}
                          className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${heroStyle === "split" || heroStyle === "minimal" ? "text-gray-800 bg-white hover:bg-gray-50 border border-gray-300" : "text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"}`}
                        >
                          {c_heroSecondary}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </EditableSection>
          ) : null,

          trust: c_trustShow ? (
            <EditableSection id="trust">
              <section className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {trustItems.map((item) => {
                      const Icon = getTrustIcon(item.icon);
                      return (
                        <div key={item.id} className="flex items-center gap-3 justify-center text-right">
                          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900">{bt(item.title)}</h4>
                            <p className="text-[11px] text-gray-500">{bt(item.subtitle)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </EditableSection>
          ) : null,

          categories: c_categoriesShow ? (
            <EditableSection id="categories">
              <section id="categories" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-right">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900">{c_catTitle}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{c_catSubtitle}</p>
                  </div>
                </div>

                <div className={
                  categoryStyle === "list"
                    ? "flex gap-3 overflow-x-auto pb-2 custom-scrollbar"
                    : categoryStyle === "cards"
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5"
                      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
                }>
                  {sectionCategories.map((cat) => {
                    const catActive = selectedCategory === cat.id;
                    /* T3 — variante de thème : pastilles défilantes / cartes rectangulaires / cercles. */
                    const btnCls = categoryStyle === "list"
                      ? "group flex items-center gap-2.5 px-4 py-2.5 rounded-full border whitespace-nowrap transition-all duration-300 " + (catActive ? "border-transparent text-white shadow-md" : "bg-white border-gray-200 hover:border-gray-400")
                      : "group flex flex-col items-center text-center bg-white border transition-all duration-300 " + (categoryStyle === "cards" ? "p-0 text-start rounded-2xl overflow-hidden" : "p-4 rounded-2xl") + " " + (catActive ? "border-amber-500 shadow-md ring-2 ring-amber-500/20 bg-amber-50/20" : "border-gray-100 hover:border-gray-200 hover:shadow-sm");
                    const thumbCls = categoryStyle === "list"
                      ? "w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/60"
                      : categoryStyle === "cards"
                        ? "w-full aspect-[4/3] overflow-hidden"
                        : "w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-gray-100 shadow-inner";
                    return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={categoryStyle === "list" && catActive ? { backgroundColor: c_primaryColor } : undefined}
                      className={btnCls}
                    >
                      <div className={thumbCls + " group-hover:scale-105 transition-transform duration-300"}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.nameAr}
                            className="w-full h-full object-cover object-center"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                      <span className={categoryStyle === "cards" ? "font-bold text-sm text-gray-900 px-4 pt-3" : "font-bold text-sm text-gray-900 group-hover:text-amber-600 transition-colors"}>
                        {isActivated ? cat.name : cat.nameAr}
                      </span>
                      <span className={categoryStyle === "cards" ? "text-xs text-gray-400 px-4 pb-4 pt-0.5" : "text-xs text-gray-400 mt-0.5"}>
                        {isActivated
                          ? `${cat.productCount} ${c_lang === "ar" ? "\u0645\u0646\u062a\u062c" : "produit(s)"}`
                          : `${cat.productCount} \u0645\u0646\u062a\u062c`}
                      </span>
                    </button>
                    );
                  })}
                </div>
              </section>
            </EditableSection>
          ) : null,

          featured: c_featuredShow && featuredProducts.length > 0 ? (
            <EditableSection id="featured">
              <section id="featured" className="py-8 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md mb-1">
                        <Sparkles className="w-3 h-3" />
                        {c_featBadge}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900">{c_featTitle}</h3>
                    </div>
                    <a href="#all-products" className="text-xs sm:text-sm font-bold text-amber-600 hover:underline">
                      {c_featViewAll} ({(actualProducts ? actualProducts : theme.products).length})
                    </a>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {featuredProducts.map((product, i) => (
                      <React.Fragment key={product.id}>
                      <ProductCardV2
                        product={toLiteProduct(product, i)}
                        card={v2?.productCard ?? defaultV2Card}
                        priceFormat={v2Settings?.priceFormat ?? "plain"}
                        lang={c_lang}
                        isRtl={isRtl}
                        primaryColor={c_primaryColor}
                        themeCard={themeCard}
                        onChooseOptions={(p) => setOptionsProduct(p)}
                        onOpenProduct={handleOpenLite}
                        onQuickAdd={handleQuickAdd}
                      />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </section>
            </EditableSection>
          ) : null,
        };

        // T1 — rendu piloté par le tableau v2 (ordre + visibilité), avec
        // rétro-compatibilité v1 (hero/trust/categories/featured existants).
        const legacyByType: Record<string, React.ReactElement | null> = {
          hero: renderSection.hero,
          trust: renderSection.trust,
          categories: renderSection.categories,
          featured: renderSection.featured,
        };
        return v2Sections.map((sec) => {
          if (!sec.visible) return null;
          if (sec.type === "allProducts") return null; // bloc dédié existant plus bas
          const legacy = legacyByType[sec.type];
          if (legacy !== undefined) return <React.Fragment key={sec.id}>{legacy}</React.Fragment>;
          switch (sec.type) {
            case "promoBanner":
              return (<React.Fragment key={sec.id}><PromoBannerSectionView section={sec} lang={c_lang} isRtl={isRtl} primaryColor={c_primaryColor} /></React.Fragment>);
            case "reviews":
              return (<React.Fragment key={sec.id}><ReviewsSectionView section={sec} lang={c_lang} isRtl={isRtl} primaryColor={c_primaryColor} productReviews={[]} isPublicView={isStandaloneView} /></React.Fragment>);
            case "faq":
              return (<React.Fragment key={sec.id}><FaqSectionView section={sec} lang={c_lang} isRtl={isRtl} /></React.Fragment>);
            case "brandInfo":
              return (
                <React.Fragment key={sec.id}>
                <BrandInfoSectionView
                  section={sec}
                  lang={c_lang}
                  isRtl={isRtl}
                  storeName={c_storeName}
                  logoUrl={c_logoUrl}
                  stats={{
                    products: liteProducts.length,
                    orders: Object.values(soldCounts || {}).reduce((a, b) => a + (Number(b) || 0), 0),
                    reviews: 0,
                  }}
                />
                </React.Fragment>
              );
            case "collection":
              return (
                <React.Fragment key={sec.id}>
                <CollectionView
                  section={sec}
                  sectionId={sec.id}
                  lang={c_lang}
                  isRtl={isRtl}
                  primaryColor={c_primaryColor}
                  headingColor="#111827"
                  products={liteProducts}
                  categories={sectionCategories.map((c) => ({ id: c.id, name: c.name, nameAr: c.nameAr || c.name, image: c.image, productCount: 0 }))}
                  card={v2?.productCard ?? defaultV2Card}
                  priceFormat={v2?.priceFormat ?? "space"}
                  themeCard={themeCard}
                  onChooseOptions={setOptionsProduct}
                  onOpenProduct={handleOpenLite}
                  onQuickAdd={handleQuickAdd}
                  soldCounts={soldCounts}
                />
                </React.Fragment>
              );
            case "textImage":
              return (<React.Fragment key={sec.id}><TextImageSectionView section={sec} lang={c_lang} isRtl={isRtl} primaryColor={c_primaryColor} /></React.Fragment>);
            case "video":
              return (<React.Fragment key={sec.id}><VideoSectionView section={sec} lang={c_lang} isRtl={isRtl} /></React.Fragment>);
            default:
              return null;
          }
        });
      })()}

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
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${themeGridCols === 3 ? "lg:grid-cols-3" : themeGridCols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-4 sm:gap-6`}>
            {filteredProducts.map((product) => (
              <div key={product.id || product.name}>
              <ProductCardV2
                product={liteProducts.find((lp) => lp.id === String(product.id ?? "")) || liteProducts[0]}
                lang={c_lang}
                isRtl={isRtl}
                primaryColor={c_primaryColor}
                card={v2?.productCard ?? defaultV2Card}
                priceFormat={v2?.priceFormat ?? "space"}
                themeCard={themeCard}
                onChooseOptions={setOptionsProduct}
                onOpenProduct={handleOpenLite}
                onQuickAdd={handleQuickAdd}
              />
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full text-center py-16 text-gray-400">
            {c_lang === "ar" ? "لا توجد منتجات مطابقة" : "Aucun produit correspondant"}
          </div>
        )}

        {/* cartes produits v2 : ProductCardV2 ci-dessus */}
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
                {footerAbout}
              </p>
              {(footerSocials.length > 0) && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {footerSocials.map((soc) => (
                    <a key={soc.key} href={soc.href} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors" aria-label={soc.label} title={soc.label}>
                      <soc.Icon className="w-4 h-4" aria-hidden />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>متجر موثوق 100%</span>
                </div>
              </div>
            </div>

            {/* Col 2: Categories */}
            <div className={footerShowCategories ? "" : "hidden"}>
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
            <div className={footerShowQuickLinks ? "" : "hidden"}>
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
            {!footerHideBrand && (
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <span>{c_lang === "ar" ? "تم التطوير والتصميم بواسطة" : "Développé avec"}</span>
                <span className="text-amber-400 font-bold">E-Nova</span>
              </div>
            )}
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
                      <div className={`flex items-center gap-3 mb-10 ${v2?.productPage.buttonSize === "large" ? "scale-105 origin-" + (isRtl ? "right" : "left") : ""}`}>
                         {/* Quantity */}
                         <div className={`flex items-center border border-gray-200 rounded-xl bg-white shadow-sm px-1 ${v2?.productPage.showQuantityInForm === false ? "hidden" : "h-14"}`}>
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
                         <div className="flex justify-center items-center gap-2 mb-8 text-xl font-black text-gray-900">
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
                                 onBlur={() => {
                                   // Capture immédiate du panier au blur du téléphone
                                   if (latestCartCaptureRef.current) {
                                     trackAbandonedCartNow({
                                       ...latestCartCaptureRef.current,
                                       phone: customerPhone
                                     });
                                   }
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

                         {/* Consentement WhatsApp (mention claire + case optionnelle) */}
                         <div className="mt-4 pt-3 border-t border-gray-100">
                           {waConsentRequired && (
                             <label className="flex items-start gap-2 cursor-pointer mb-2">
                               <input
                                 type="checkbox"
                                 checked={waConsentChecked}
                                 onChange={(e) => setWaConsentChecked(e.target.checked)}
                                 className="mt-0.5 w-4 h-4 accent-[#1c192b]"
                               />
                               <span className="text-[11px] text-gray-500 leading-relaxed text-right">
                                 {WA_CONSENT_TEXT_AR}
                               </span>
                             </label>
                           )}
                           {!waConsentRequired && (
                             <p className="text-[11px] text-gray-400 leading-relaxed text-right">
                               {WA_CONSENT_TEXT_AR}
                             </p>
                           )}
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
                              className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                                v2?.productPage.galleryLayout === "grid"
                                  ? "w-full aspect-square"
                                  : "w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                              } ${(currentProductImage || selectedProduct.image) === img ? 'border-[#1c192b] shadow-md ring-2 ring-white ring-inset' : 'border-gray-100 hover:border-gray-300'}`}
                            >
                              <img src={img} className="w-full h-full object-cover" alt="thumbnail" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Description */}
                      {selectedProduct.description && (
                        <div className="mt-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-right">
                          <h4 className="text-lg font-black text-gray-900 mb-4">وصف المنتج</h4>
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                        </div>
                      )}
                   </div>
                </div>

             </div>
          )}

            {/* T2 — barre d'achat mobile collante (page produit uniquement). */}
            {v2?.productPage.stickyBuyBarMobile !== false && selectedProduct && (
              <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-2.5 flex items-center gap-3" dir={isRtl ? "rtl" : "ltr"}>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-gray-500 truncate">{selectedProduct.category}</p>
                  <p className="text-sm font-black text-gray-900 truncate">{(c_lang === "ar" ? selectedProduct.nameAr : selectedProduct.name) || selectedProduct.name}</p>
                  {v2?.productPage.showQuantityInBar !== false && quantity > 1 && (
                    <p className="text-[11px] text-gray-400">{c_lang === "ar" ? "الكمية" : "Quantité"} : {quantity}</p>
                  )}
                </div>
                <div className="text-sm font-black whitespace-nowrap" style={{ color: c_primaryColor }}>
                  {(totalPrice).toLocaleString()} {c_lang === "ar" ? "دج" : "DA"}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-3 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 transition-transform whitespace-nowrap"
                  style={{ backgroundColor: c_primaryColor }}
                >
                  {c_lang === "ar" ? "اطلب الآن" : "Commander"}
                </button>
              </div>
            )}
        </div>
      )}

      {/* ===== T1 — modale options, mini-panier, commande panier, toast, widget d'aide ===== */}
      {optionsProduct && (
        <OptionsModal
          product={optionsProduct}
          lang={c_lang}
          isRtl={isRtl}
          primaryColor={c_primaryColor}
          priceFormat={v2?.priceFormat ?? "space"}
          onClose={() => setOptionsProduct(null)}
          onAddToCart={handleOptionsAdd}
          onOrderNow={(qty, variantLabel) => {
            cart.addItem({
              productId: optionsProduct.id,
              name: c_lang === "ar" ? optionsProduct.nameAr : optionsProduct.name,
              image: optionsProduct.images[0] || "",
              price: optionsProduct.price,
              oldPrice: optionsProduct.oldPrice,
              qty,
              variantLabel,
              category: optionsProduct.category,
            });
            setOptionsProduct(null);
            setMiniCartOpen(false);
            setCartCheckoutOpen(true);
          }}
        />
      )}

      <MiniCart
        open={miniCartOpen}
        onClose={() => setMiniCartOpen(false)}
        items={cart.items}
        totalDA={cart.totalDA}
        lang={c_lang}
        isRtl={isRtl}
        primaryColor={c_primaryColor}
        priceFormat={v2?.priceFormat ?? "space"}
        relatedProducts={relatedProducts}
        onSetQty={cart.setQty}
        onRemove={cart.removeItem}
        onAddRelated={(rp) => {
          const lite = liteProducts.find((x) => x.id === rp.id);
          if (lite) handleQuickAdd(lite);
        }}
        onCheckout={() => {
          setMiniCartOpen(false);
          setCartCheckoutOpen(true);
        }}
        onContinueShopping={() => setMiniCartOpen(false)}
      />

      <CartCheckoutModal
        /* La modale reste ouverte après succès même si le panier est vidé. */
        open={cartCheckoutOpen}
        items={cart.items}
        subtotalDA={cart.totalDA}
        lang={c_lang}
        isRtl={isRtl}
        primaryColor={c_primaryColor}
        priceFormat={v2?.priceFormat ?? "space"}
        texts={(() => {
          const ct = (v2?.checkout.texts) ?? defaultV2Settings().checkout.texts;
          return {
            pageTitle: c_lang === "ar" ? ct.pageTitle.ar : ct.pageTitle.fr,
            personalInfo: c_lang === "ar" ? ct.personalInfo.ar : ct.personalInfo.fr,
            address: c_lang === "ar" ? ct.address.ar : ct.address.fr,
            deliveryMethod: c_lang === "ar" ? ct.deliveryMethod.ar : ct.deliveryMethod.fr,
            summary: c_lang === "ar" ? ct.summary.ar : ct.summary.fr,
            confirmButton: c_lang === "ar" ? ct.confirmButton.ar : ct.confirmButton.fr,
            paymentMode: c_lang === "ar" ? ct.paymentMode.ar : ct.paymentMode.fr,
            successMessage: c_lang === "ar" ? ct.successMessage.ar : ct.successMessage.fr,
          };
        })()}
        hideEmail={v2?.checkout.hideEmail ?? false}
        hideAddress={v2?.checkout.hideAddress ?? false}
        hideNotes={v2?.checkout.hideNotes ?? false}
          digitalDelivery={isDigitalTheme}
        addressRequired={v2?.checkout.addressRequired ?? true}
        layout={v2?.checkout.layout ?? "twoColumns"}
        wilayas={WILAYAS_LIST}
        communesForWilaya={(code) => (getCommunesForWilaya(code) || []).map((c) => (typeof c === "string" ? c : String((c as { name?: string }).name ?? c)))}
        onValidatePhone={(ph) => validatePhoneNumber(ph, "ar")}
        onClose={() => setCartCheckoutOpen(false)}
        onSubmit={handleCartOrder}
      />

      {toastMsg && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold shadow-2xl flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]"
          role="status"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <ShoppingCart className="w-4 h-4" aria-hidden />
          {toastMsg}
        </div>
      )}

      {v2 && isStandaloneView && (
        <HelpWidget
          settings={v2.helpWidget}
          lang={c_lang}
          isRtl={isRtl}
          storeSlug={effectiveSlug}
          productName={optionsProduct ? (c_lang === "ar" ? optionsProduct.nameAr : optionsProduct.name) : undefined}
          productPrice={optionsProduct?.price}
          whatsappNumber={v2.footer.whatsapp || undefined}
        />
      )}
</div>
  );
}
