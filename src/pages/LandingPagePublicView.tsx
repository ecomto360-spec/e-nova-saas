import { useState, useEffect, useMemo, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, addDoc } from "firebase/firestore";
import { LandingPage, AlgerianWilaya } from "../types/landing";
import { SAMPLE_PRODUCTS, ALGERIAN_WILAYAS, getDefaultSectionsForProduct } from "../data/landingData";
import { getCommunesForWilaya } from "../data/algerianCommunes";
import { StoreUnavailable } from "../components/storefront/StoreUnavailable";
import { Clock, ShieldCheck, Truck, Banknote, RotateCcw, ShoppingCart, Check, CheckCircle2, Star, ChevronDown, MapPin, Map } from "lucide-react";
import { isTenantExpired } from "../lib/checkExpiration";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../lib/phoneUtils";
import { isPhoneBlacklisted } from "../lib/blacklist";

interface Props { previewData?: LandingPage; onOrderPlaced?: (order: any) => void; }

export default function LandingPagePublicView({ previewData, onOrderPlaced }: Props = {}) {
  const { slug } = useParams<{ slug: string }>();
  const isPreview = !!previewData;
  const [loadedPage, setLoadedPage] = useState<LandingPage | null>(null);
  const page = (isPreview && previewData) ? previewData : loadedPage;
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isPreview);
  const [isExpired, setIsExpired] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form state
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number | "">(16);
  const [commune, setCommune] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("b2");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [address, setAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderReference, setOrderReference] = useState("");

  const availableCommunes = useMemo(() => {
    if (!selectedWilayaCode) return [];
    return getCommunesForWilaya(Number(selectedWilayaCode));
  }, [selectedWilayaCode]);

  const curWilaya = useMemo(() => {
    if (!selectedWilayaCode) return null;
    return ALGERIAN_WILAYAS.find(w => w.code === Number(selectedWilayaCode)) || null;
  }, [selectedWilayaCode]);

  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      return;
    }
    async function loadLandingPage() {
      try {
        const tenantsSnap = await getDocs(collection(db, "tenants"));
        let foundPage: LandingPage | null = null;
        let foundTenantId: string | null = null;
        
        for (const tenantDoc of tenantsSnap.docs) {
          const tData = tenantDoc.data();
          
          // First check subcollection
          const pagesSnap = await getDocs(collection(db, "tenants", tenantDoc.id, "landingPages"));
          const match = pagesSnap.docs.map(d => d.data() as LandingPage).find(p => p.slug === slug || p.id === slug);
          
          if (match) {
            foundPage = match;
            foundTenantId = tenantDoc.id;
            setIsExpired(isTenantExpired(tData));
            break;
          }
          
          // Fallback to array for backward compatibility
          if (!match && tData.landingPages && Array.isArray(tData.landingPages)) {
            const arrMatch = tData.landingPages.find((p: LandingPage) => p.slug === slug || p.id === slug);
            if (arrMatch) {
              foundPage = arrMatch;
              foundTenantId = tenantDoc.id;
              setIsExpired(isTenantExpired(tData));
              break;
            }
          }
        }

        if (foundPage) {
          setLoadedPage(foundPage);
          setTenantId(foundTenantId);
        } else {
          // Fallback sample landing page matching requested slug
          const fallbackPage: LandingPage = {
            id: "lp-fallback",
            title: slug ? slug.replace(/-/g, " ") : "Offre Spéciale",
            slug: slug || "t-shirt-exemple",
            description: "Offre exclusive avec livraison 58 Wilayas en Algérie.",
            status: "active",
            product: SAMPLE_PRODUCTS[0],
            viewsCount: 1,
            ordersCount: 0,
            createdAt: "2026/08/22",
            updatedAt: "2026/08/22",
            sections: getDefaultSectionsForProduct(SAMPLE_PRODUCTS[0]),
            theme: {
              primaryColor: "#16a34a",
              accentColor: "#16a34a",
              backgroundColor: "#ffffff",
              textColor: "#111827",
              fontFamily: "Inter, sans-serif"
            }
          };
          setLoadedPage(fallbackPage);
        }
      } catch (err) {
        console.error("Error loading landing page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLandingPage();
  }, [slug, isPreview]);

  if (isExpired) return <StoreUnavailable />;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-neutral-400">Chargement de votre offre...</p>
        </div>
      </div>
    );
  }

  if (!page || page.status === "draft" || !page.product) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 text-center">
        <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-8 max-w-md text-white space-y-4 shadow-2xl shadow-black/50">
          <h2 className="text-2xl font-bold">Page indisponible</h2>
          <p className="text-sm text-neutral-400">Cette offre n'est plus disponible pour le moment.</p>
        </div>
      </div>
    );
  }

  const currentPrice = page.product?.price || 1500;
  const originalPrice = page.product?.originalPrice || Math.round(currentPrice * 1.3);

  let quantity = 1;
  let itemsTotal = currentPrice;
  if (selectedBundleId === "b2") {
    quantity = 2;
    itemsTotal = Math.round(currentPrice * 1.8);
  } else if (selectedBundleId === "b3") {
    quantity = 3;
    itemsTotal = Math.round(currentPrice * 2.5);
  }

  const deliveryFee = selectedBundleId === "b3" ? 0 : (!curWilaya ? 400 : (deliveryType === "home" ? curWilaya.homeDeliveryPrice : curWilaya.deskDeliveryPrice));
  const grandTotal = itemsTotal + deliveryFee;

  const handleCreatePublicOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Veuillez saisir votre Nom et Prénom");
      return;
    }

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Numéro de téléphone invalide");
      return;
    }
    setPhoneError("");

    if (!selectedWilayaCode) {
      alert("Veuillez sélectionner votre Wilaya");
      return;
    }

    if (!commune.trim()) {
      alert("Veuillez sélectionner votre Commune");
      return;
    }

    const refNumber = `CMD-${Date.now().toString().slice(-6)}`;
    setOrderReference(refNumber);

    if (isPreview && onOrderPlaced) {
      onOrderPlaced({ fullName, phone, total: grandTotal, bundle: selectedBundleId, refNumber, wilaya: curWilaya ? curWilaya.name : "", commune, address, deliveryType, quantity, productName: page.product?.name || page.title, itemsTotal, deliveryFee });
      setOrderSuccess(true);
      return;
    }

    try {
      if (tenantId) {
        const isBanned = await isPhoneBlacklisted(tenantId, phone);
        if (isBanned) {
          alert("عذراً، هذا الرقم محظور من إتمام الطلبات. / Désolé, ce numéro de téléphone est sur liste noire.");
          return;
        }

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const formattedDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const gallerySection = page.sections?.find(s => s.type === "gallery");
        const heroImages = gallerySection?.data?.images || (page.product?.image ? [page.product.image] : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]);
        const orderImg = page.product?.image || (heroImages && heroImages.length > 0 ? heroImages[0] : "");

        const orderData = {
          orderNumber: refNumber,
          customerName: fullName,
          client: fullName,
          customerPhone: phone,
          phone,
          wilaya: curWilaya ? curWilaya.name : "",
          commune: commune || "",
          address: address.trim() || commune,
          deliveryType,
          quantity,
          productName: page.product?.name || page.title,
          itemsSummary: `${quantity}x ${page.product?.name || page.title}`,
          itemsTotal,
          deliveryFee,
          total: grandTotal,
          status: "En attente",
          source: `Landing Page: ${page.title}`,
          date: formattedDate,
          userId: tenantId,
          image: orderImg,
          productImage: orderImg,
          items: [{
            productId: page.productId || page.product?.id || "landing-product",
            name: page.product?.name || page.title,
            price: itemsTotal / (quantity || 1),
            quantity: quantity,
            image: orderImg
          }],
          createdAt: new Date()
        };

        await addDoc(collection(db, "tenants", tenantId, "orders"), orderData);
        await addDoc(collection(db, "orders"), orderData);

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
    } catch (err) {
      console.warn("Could not write order into Firestore", err);
    }
    setOrderSuccess(true);
  };

  
  const gallerySection = page.sections?.find(s => s.type === "gallery");
  const heroImages = gallerySection?.data?.images || (page.product?.image ? [page.product.image] : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]);

  // Dynamic texts from sections
  const heroSec = page.sections?.find(s => s.type === "hero");
  const topBannerText = heroSec?.data?.topBanner || "⚡ Offre limitée • Paiement à réception (58 Wilayas)";
  const productTitle = heroSec?.data?.headline || page.title;
  const ctaTopText = heroSec?.data?.ctaText || "COMMANDER MAINTENANT";
  const ratingText = heroSec?.data?.ratingText || "(4.9/5 • 148 avis)";
  const savingsBadgeText = heroSec?.data?.savingsBadge || `🔥 Économisez ${(originalPrice - currentPrice).toLocaleString("fr-DZ")} DZD aujourd'hui`;

  const countdownSec = page.sections?.find(s => s.type === "countdown");
  const countdownTitle = countdownSec?.data?.title || "La promotion se termine dans :";
  const countdownHours = String(countdownSec?.data?.hours ?? 2).padStart(2, '0');
  const countdownMinutes = String(countdownSec?.data?.minutes ?? 47).padStart(2, '0');
  const countdownSeconds = String(countdownSec?.data?.seconds ?? 35).padStart(2, '0');

  const featuresSec = page.sections?.find(s => s.type === "features");
  const badgesList: Array<{ id?: string; text: string; icon?: string }> = (featuresSec?.data?.badges && Array.isArray(featuresSec.data.badges) && featuresSec.data.badges.length > 0)
    ? featuresSec.data.badges
    : [
        { id: "b1", text: "Paiement à réception", icon: "Banknote" },
        { id: "b2", text: "Livraison 58 Wilayas", icon: "Truck" },
        { id: "b3", text: "Échange facile (7j)", icon: "RotateCcw" },
        { id: "b4", text: "Garantie Qualité", icon: "ShieldCheck" }
      ];

  const detailsTitle = featuresSec?.data?.heading || "Détails du produit";
  const detailsDesc = featuresSec?.data?.description || page.description || "Découvrez notre produit phare, conçu pour répondre à tous vos besoins. Fabriqué avec des matériaux de haute qualité pour une durabilité maximale au quotidien.";
  const bulletsList: string[] = (featuresSec?.data?.bullets && Array.isArray(featuresSec.data.bullets) && featuresSec.data.bullets.length > 0)
    ? featuresSec.data.bullets
    : [
        "Qualité supérieure et durable",
        "Utilisation simple et pratique",
        "Design moderne et ergonomique",
        "Approuvé par des milliers de clients"
      ];
  const ctaMidText = featuresSec?.data?.ctaText || "JE VEUX MON PACK";

  const reviewsSec = page.sections?.find(s => s.type === "reviews");
  const reviewsTitle = reviewsSec?.data?.heading || "Ce que nos clients disent";
  const reviewsList: Array<{ id?: string; name: string; wilaya?: string; rating: number; text?: string; comment?: string }> = (reviewsSec?.data?.reviews && Array.isArray(reviewsSec.data.reviews) && reviewsSec.data.reviews.length > 0)
    ? reviewsSec.data.reviews
    : [
        { id: "r1", name: "Amine K.", wilaya: "Alger", rating: 5, text: "Livraison super rapide en 24h, le produit est conforme à la description. Je recommande vivement !" },
        { id: "r2", name: "Samira B.", wilaya: "Oran", rating: 5, text: "Très satisfaite de mon achat. Le service client est au top et le fait de payer à la livraison m'a vraiment rassurée." },
        { id: "r3", name: "Yacine M.", wilaya: "Setif", rating: 5, text: "Qualité excellente pour le prix. C'est exactement ce que je cherchais. Merci !" }
      ];

  const faqSec = page.sections?.find(s => s.type === "faq");
  const faqTitle = faqSec?.data?.heading || "Questions fréquentes";
  const rawFaqs = faqSec?.data?.faqs || faqSec?.data?.items;
  const faqList: Array<{ id?: string; q: string; a: string }> = (rawFaqs && Array.isArray(rawFaqs) && rawFaqs.length > 0)
    ? rawFaqs
    : [
        { q: "Comment se passe la livraison ?", a: "Nous livrons dans les 58 wilayas. Le délai est généralement de 24h à 72h selon votre région (jusqu'à 5 jours pour le Grand Sud)." },
        { q: "Puis-je payer à la réception ?", a: "Absolument ! Vous ne payez que lorsque le livreur vous remet le colis en main propre, après vérification." },
        { q: "Et si le produit a un défaut ?", a: "Vous bénéficiez d'une garantie d'échange de 7 jours. Contactez-nous et nous remplacerons le produit gratuitement." }
      ];

  const orderSec = page.sections?.find(s => s.type === "order_form");
  const orderTitle = orderSec?.data?.heading || "Finaliser la commande";
  const orderSubheading = orderSec?.data?.subheading || "Remplissez ce formulaire et payez à la réception";
  const orderCtaText = orderSec?.data?.btnText || orderSec?.data?.ctaText || "COMMANDER MAINTENANT";
  const orderGuaranteeText = orderSec?.data?.guaranteeText || "Paiement 100% sécurisé à la livraison";

  const renderBadgeIcon = (iconName?: string) => {
    switch (iconName) {
      case "Truck": return <Truck className="w-7 h-7 text-emerald-600 mb-2" />;
      case "RotateCcw": return <RotateCcw className="w-7 h-7 text-emerald-600 mb-2" />;
      case "ShieldCheck": return <ShieldCheck className="w-7 h-7 text-emerald-600 mb-2" />;
      case "Banknote":
      default:
        return <Banknote className="w-7 h-7 text-emerald-600 mb-2" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-24 sm:pb-10 selection:bg-emerald-200">
      {/* 1. Bandeau d'urgence (sticky top) */}
      <div className="sticky top-0 z-50 bg-neutral-900 text-white text-[12px] md:text-[13px] font-bold tracking-wider py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
        <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
        <span className="uppercase">{topBannerText}</span>
      </div>

      <div className="w-full max-w-lg mx-auto bg-white sm:my-8 sm:shadow-2xl sm:rounded-2xl overflow-hidden border-x sm:border border-neutral-200 relative">
        
        {/* 2. Hero : image produit + titre H1 ultra-bold + prix barré/réduit + CTA principal */}
        <div className="relative bg-neutral-100 aspect-square sm:aspect-[4/3] w-full overflow-hidden group">
          <div className="w-full h-full relative">
            {heroImages.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={page.product?.name || page.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              />
            ))}
            
            {/* Slider Controls */}
            {heroImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.preventDefault(); setCurrentImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-neutral-900 p-2 rounded-full shadow-md backdrop-blur-sm"
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setCurrentImageIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1)); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-neutral-900 p-2 rounded-full shadow-md backdrop-blur-sm"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
                
                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                  {heroImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.preventDefault(); setCurrentImageIndex(idx); }}
                      className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-white/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[12px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
            -30% Promo
          </div>
        </div>

        <div className="p-5 md:p-6 border-b border-neutral-100">
          <div className="flex items-center gap-1 mb-3 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
            <span className="text-xs text-neutral-500 font-bold ml-1.5">{ratingText}</span>
          </div>

          <h1 className="text-[26px] md:text-[28px] font-bold text-neutral-900 leading-tight mb-4 tracking-tight">
            {productTitle}
          </h1>

          <div className="flex flex-col gap-2 mb-6 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-emerald-600 tracking-tighter">
                {currentPrice.toLocaleString("fr-DZ")} <span className="text-xl">DZD</span>
              </span>
              <span className="text-base line-through text-neutral-400 font-bold">
                {originalPrice.toLocaleString("fr-DZ")} DZD
              </span>
            </div>
            <div className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg inline-flex w-max">
              {savingsBadgeText}
            </div>
          </div>

          <a 
            href="#checkout-form"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl text-center text-base shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <ShoppingCart className="w-5 h-5" />
            {ctaTopText}
          </a>
        </div>

        {/* 3. Compte à rebours d'urgence */}
        <div className="bg-red-50 p-5 border-b border-red-100 text-center">
          <div className="text-xs font-bold text-red-600 mb-3 uppercase tracking-widest">
            {countdownTitle}
          </div>
          <div className="flex items-center justify-center gap-3 font-mono">
            <div className="flex flex-col items-center">
              <span className="bg-white text-red-600 border-2 border-red-200 text-2xl font-bold px-4 py-2 rounded-xl shadow-sm w-16 text-center">{countdownHours}</span>
              <span className="text-[10px] text-red-500 font-bold mt-1.5 uppercase">Heures</span>
            </div>
            <span className="text-red-300 font-bold text-2xl mb-5">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white text-red-600 border-2 border-red-200 text-2xl font-bold px-4 py-2 rounded-xl shadow-sm w-16 text-center">{countdownMinutes}</span>
              <span className="text-[10px] text-red-500 font-bold mt-1.5 uppercase">Minutes</span>
            </div>
            <span className="text-red-300 font-bold text-2xl mb-5">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white text-red-600 border-2 border-red-200 text-2xl font-bold px-4 py-2 rounded-xl shadow-sm w-16 text-center">{countdownSeconds}</span>
              <span className="text-[10px] text-red-500 font-bold mt-1.5 uppercase">Secs</span>
            </div>
          </div>
        </div>

        {/* 4. Avantages clés */}
        <div className="p-5 border-b border-neutral-100 bg-white">
          <div className="grid grid-cols-2 gap-3">
            {badgesList.map((badge, bIdx) => (
              <div key={badge.id || bIdx} className="flex flex-col items-center text-center p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                {renderBadgeIcon(badge.icon)}
                <span className="font-bold text-xs text-neutral-900 uppercase">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Détails du produit + description + arguments à puces */}
        <div className="p-5 md:p-6 border-b border-neutral-100 bg-white space-y-6">
          <h2 className="text-[20px] md:text-[22px] font-bold text-neutral-900 tracking-tight">{detailsTitle}</h2>
          
          <div className="prose prose-sm text-neutral-600 leading-relaxed font-medium">
            <p>{detailsDesc}</p>
          </div>

          <div className="space-y-3 mt-6">
            {bulletsList.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-bold text-neutral-800">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <a 
              href="#checkout-form"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl text-center text-base shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <ShoppingCart className="w-5 h-5" />
              {ctaMidText}
            </a>
          </div>
        </div>

        {/* 6. Avis clients vérifiés */}
        <div className="p-5 md:p-6 border-b border-neutral-100 bg-neutral-50">
          <h2 className="text-[20px] md:text-[22px] font-bold text-neutral-900 tracking-tight mb-6 text-center">{reviewsTitle}</h2>
          
          <div className="space-y-4">
            {reviewsList.map((review, i) => (
              <div key={review.id || i} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-neutral-900 flex items-center gap-1">
                      {review.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-[11px] text-neutral-400 font-medium">{review.wilaya ? `${review.wilaya} • ` : ""}Achat vérifié</div>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(review.rating || 5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                </div>
                <p className="text-sm text-neutral-700 font-medium leading-relaxed">
                  "{review.text || review.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 7. FAQ */}
        <div className="p-5 md:p-6 border-b border-neutral-100 bg-white">
          <h2 className="text-[20px] md:text-[22px] font-bold text-neutral-900 tracking-tight mb-6 text-center">{faqTitle}</h2>
          <div className="space-y-3">
            {faqList.map((faq, i) => (
              <details key={faq.id || i} className="group bg-neutral-50 border border-neutral-100 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-4 text-neutral-900 font-bold">
                  {faq.q}
                  <span className="shrink-0 rounded-full bg-white p-1.5 text-neutral-900 sm:p-3 group-open:-rotate-180 transition-transform">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-neutral-600 font-medium leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* 8. Checkout Form */}
        <div id="checkout-form" className="p-5 md:p-8 bg-neutral-100 scroll-mt-10">
          <div className="text-center mb-6">
            <h3 className="text-[20px] md:text-[22px] font-bold text-neutral-900 tracking-tight">
              {orderTitle}
            </h3>
            <p className="text-sm text-neutral-600 mt-2 font-bold">
              {orderSubheading}
            </p>
          </div>

          {!orderSuccess ? (
            <form onSubmit={handleCreatePublicOrder} className="space-y-6">
              
              {/* Sélecteur de pack */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-widest mb-1">
                  1. Choisissez votre pack
                </label>
                
                <div 
                  onClick={() => setSelectedBundleId("b1")}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    selectedBundleId === "b1" ? "border-emerald-600 bg-emerald-50" : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedBundleId === "b1" ? "border-emerald-600" : "border-neutral-300 bg-white"
                    }`}>
                      {selectedBundleId === "b1" && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Pack 1 Pièce</div>
                    </div>
                  </div>
                  <div className="font-bold text-base text-neutral-900">{currentPrice.toLocaleString("fr-DZ")} DZD</div>
                </div>

                <div 
                  onClick={() => setSelectedBundleId("b2")}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all overflow-hidden ${
                    selectedBundleId === "b2" ? "border-emerald-600 bg-emerald-50" : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[12px] font-bold uppercase px-2 py-1 rounded-bl-xl shadow-sm">
                    Le plus vendu
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedBundleId === "b2" ? "border-emerald-600" : "border-neutral-300 bg-white"
                    }`}>
                      {selectedBundleId === "b2" && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Pack 2 Pièces</div>
                      <div className="text-[11px] text-red-600 font-bold">-15% de réduction</div>
                    </div>
                  </div>
                  <div className="font-bold text-base text-emerald-700">
                    {Math.round(currentPrice * 1.8).toLocaleString("fr-DZ")} DZD
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedBundleId("b3")}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all overflow-hidden ${
                    selectedBundleId === "b3" ? "border-emerald-600 bg-emerald-50" : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[12px] font-bold uppercase px-2 py-1 rounded-bl-xl shadow-sm">
                    Livraison Offerte
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedBundleId === "b3" ? "border-emerald-600" : "border-neutral-300 bg-white"
                    }`}>
                      {selectedBundleId === "b3" && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Pack Famille (3)</div>
                      <div className="text-[11px] text-emerald-600 font-bold">Livraison 0 DZD</div>
                    </div>
                  </div>
                  <div className="font-bold text-base text-emerald-700">
                    {Math.round(currentPrice * 2.5).toLocaleString("fr-DZ")} DZD
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-widest mb-1">
                  2. Coordonnées de livraison
                </label>
                
                <div className="space-y-3.5">
                  <div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nom et Prénom *"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="tel"
                      required
                      maxLength={getPhoneMaxLength(phone)}
                      value={phone}
                      onChange={(e) => {
                        const cleaned = cleanAndLimitPhone(e.target.value);
                        setPhone(cleaned);
                        if (phoneError) setPhoneError("");
                      }}
                      placeholder="Numéro de téléphone (ex: 0550252565) *"
                      className={`w-full bg-neutral-50 border rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-1 transition-all ${
                        phoneError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-neutral-200 focus:border-emerald-500 focus:ring-emerald-500"
                      }`}
                    />
                    {phoneError ? (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">{phoneError}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-neutral-400">
                        10 chiffres commençant par 05, 06 ou 07 (ou indicatif ex: 213550252565)
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <select
                        value={selectedWilayaCode}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : "";
                          setSelectedWilayaCode(val);
                          setCommune("");
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 pr-10 text-sm text-neutral-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- Choisir la Wilaya --</option>
                        {ALGERIAN_WILAYAS.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.code.toString().padStart(2, '0')} - {w.name} ({w.arName})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        required
                        disabled={!selectedWilayaCode}
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3.5 pr-10 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none ${
                          !selectedWilayaCode
                            ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                            : "bg-neutral-50 border-neutral-200 text-neutral-900 cursor-pointer"
                        }`}
                      >
                        <option value="">
                          {selectedWilayaCode ? "-- Choisir la Commune --" : "-- Choisir la Wilaya d'abord --"}
                        </option>
                        {availableCommunes.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.arName})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${!selectedWilayaCode ? "text-neutral-300" : "text-neutral-400"}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("home")}
                      className={`py-3 px-2 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        deliveryType === "home" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      🏠 À Domicile
                      <div className="text-[10px] font-bold mt-0.5 opacity-80">
                        {selectedBundleId === "b3" ? "0 DZD" : `${curWilaya ? curWilaya.homeDeliveryPrice : 400} DZD`}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("desk")}
                      className={`py-3 px-2 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        deliveryType === "desk" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      🏢 Bureau (Stop Desk)
                      <div className="text-[10px] font-bold mt-0.5 opacity-80">
                        {selectedBundleId === "b3" ? "0 DZD" : `${curWilaya ? curWilaya.deskDeliveryPrice : 300} DZD`}
                      </div>
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Adresse exacte (quartier, rue, n° de porte...)"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary Calculation */}
              <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-3 text-white shadow-xl">
                <div className="flex justify-between text-sm font-medium text-neutral-300">
                  <span>Produits ({quantity} pièce{quantity > 1 ? "s" : ""})</span>
                  <span>{itemsTotal.toLocaleString("fr-DZ")} DZD</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-neutral-300">
                  <span>Livraison ({curWilaya.name})</span>
                  <span className={deliveryFee === 0 ? "text-emerald-400 font-bold" : ""}>
                    {deliveryFee === 0 ? "GRATUITE" : `${deliveryFee} DZD`}
                  </span>
                </div>
                <div className="border-t border-neutral-700 pt-3 flex justify-between font-bold text-xl text-white">
                  <span>TOTAL À PAYER</span>
                  <span className="tracking-tight text-emerald-400">{grandTotal.toLocaleString("fr-DZ")} <span className="text-sm">DZD</span></span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl text-center text-lg shadow-[0_8px_30px_rgb(16,185,129,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Check className="w-6 h-6" />
                {orderCtaText}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 font-bold uppercase tracking-widest mt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {orderGuaranteeText}
              </div>
            </form>
          ) : (
            <div className="text-center py-10 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 rounded-2xl shadow-xl border border-emerald-100">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-[24px] font-bold text-neutral-900 tracking-tight">
                Félicitations !
              </h4>
              <p className="text-sm font-bold text-neutral-600">
                Votre commande a été enregistrée avec succès.
              </p>
              
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 text-left space-y-2 text-sm text-neutral-800 font-medium mt-6">
                <div className="flex justify-between border-b border-neutral-200 pb-2 mb-2">
                  <span className="text-neutral-500 font-bold">Référence</span>
                  <strong className="text-neutral-900 font-mono text-base">{orderReference}</strong>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2 mb-2">
                  <span className="text-neutral-500 font-bold">Total à payer</span>
                  <strong className="text-emerald-600 font-bold text-base">{grandTotal.toLocaleString("fr-DZ")} DZD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">Destinataire</span>
                  <strong className="text-neutral-900">{fullName}</strong>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-6">
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  ⚠️ Un conseiller va vous contacter au <span className="font-bold text-amber-900 text-sm">{phone}</span> dans les plus brefs délais pour confirmer l'expédition. Restez joignable !
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setOrderSuccess(false)}
                className="text-sm text-neutral-900 font-bold underline decoration-neutral-300 underline-offset-4 pt-6 inline-block hover:text-emerald-600 transition-colors"
              >
                Effectuer un autre achat
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Sticky Mobile Bottom Bar (Hidden on desktop or when success) */}
      {!orderSuccess && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-3 shadow-[0_-10px_40px_rgb(0,0,0,0.1)] sm:hidden z-50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-full duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total</span>
            <span className="font-bold text-emerald-600 text-xl leading-none">{grandTotal.toLocaleString("fr-DZ")} <span className="text-[10px] text-neutral-400">DZD</span></span>
          </div>
          <a 
            href="#checkout-form"
            className="bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-[0_4px_15px_rgb(16,185,129,0.4)]"
          >
            COMMANDER
          </a>
        </div>
      )}
    </div>
  );
}
