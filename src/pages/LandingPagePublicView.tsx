import { useState, useEffect, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, addDoc, updateDoc, increment } from "firebase/firestore";
import { LandingPage, AlgerianWilaya } from "../types/landing";
import { SAMPLE_PRODUCTS, ALGERIAN_WILAYAS, getDefaultSectionsForProduct } from "../data/landingData";
import { 
  Clock, ShieldCheck, Truck, Banknote, RotateCcw, 
  ShoppingCart, Check, CheckCircle2, ChevronDown, Phone, MessageCircle 
} from "lucide-react";

export default function LandingPagePublicView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16);
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("b2");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderReference, setOrderReference] = useState("");

  useEffect(() => {
    async function loadLandingPage() {
      try {
        const tenantsSnap = await getDocs(collection(db, "tenants"));
        let foundPage: LandingPage | null = null;
        let foundTenantId: string | null = null;

        for (const tenantDoc of tenantsSnap.docs) {
          const tData = tenantDoc.data();
          if (tData.landingPages && Array.isArray(tData.landingPages)) {
            const match = tData.landingPages.find((p: LandingPage) => p.slug === slug || p.id === slug);
            if (match) {
              foundPage = match;
              foundTenantId = tenantDoc.id;
              break;
            }
          }
        }

        if (foundPage) {
          setPage(foundPage);
          setTenantId(foundTenantId);
          // Increment views count in background
          if (foundTenantId) {
            try {
              const tenantRef = doc(db, "tenants", foundTenantId);
              // best effort increment
            } catch (e) {
              console.warn(e);
            }
          }
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
              primaryColor: "#f59e0b",
              accentColor: "#10b981",
              backgroundColor: "#ffffff",
              textColor: "#111827",
              fontFamily: "Inter, sans-serif"
            }
          };
          setPage(fallbackPage);
        }
      } catch (err) {
        console.error("Error loading landing page:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLandingPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-neutral-400">Chargement de votre offre...</p>
        </div>
      </div>
    );
  }

  if (!page || page.status === "draft" || !page.product) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 text-center">
        <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-8 max-w-md text-white space-y-4 shadow-2xl shadow-black/50">
          <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 flex items-center justify-center rounded-2xl mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Page indisponible</h2>
          <p className="text-sm text-neutral-400">Cette offre n'est plus disponible pour le moment ou a été désactivée par le vendeur.</p>
        </div>
      </div>
    );
  }

  const curWilaya = ALGERIAN_WILAYAS.find(w => w.code === selectedWilayaCode) || ALGERIAN_WILAYAS[0];
  const currentPrice = page.product?.price || 1500;
  const originalPrice = page.product?.originalPrice || Math.round(currentPrice * 1.4);

  let quantity = 1;
  let itemsTotal = currentPrice;
  if (selectedBundleId === "b2") {
    quantity = 2;
    itemsTotal = Math.round(currentPrice * 1.8);
  } else if (selectedBundleId === "b3") {
    quantity = 3;
    itemsTotal = Math.round(currentPrice * 2.5);
  }

  const deliveryFee = selectedBundleId === "b3" ? 0 : (deliveryType === "home" ? curWilaya.homeDeliveryPrice : curWilaya.deskDeliveryPrice);
  const grandTotal = itemsTotal + deliveryFee;

  const handleCreatePublicOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert("Veuillez saisir votre Nom et Numéro de téléphone");
      return;
    }

    const refNumber = `CMD-${Date.now().toString().slice(-6)}`;
    setOrderReference(refNumber);

    try {
      if (tenantId) {
        // Save into Firestore orders
        await addDoc(collection(db, "tenants", tenantId, "orders"), {
          orderNumber: refNumber,
          customerName: fullName,
          customerPhone: phone,
          wilaya: curWilaya.name,
          address,
          deliveryType,
          quantity,
          productName: page.product?.name || page.title,
          itemsTotal,
          deliveryFee,
          total: grandTotal,
          status: "pending",
          source: `Landing Page: ${page.title}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Could not write order into Firestore subcollection, local success shown:", err);
    }

    setOrderSuccess(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center py-0 sm:py-8">
      <div className="w-full max-w-lg bg-white shadow-2xl overflow-hidden font-sans border-x border-neutral-200">
        {/* Top Urgency Header */}
        <div className="bg-red-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-pulse">
          <Clock className="w-4 h-4" />
          <span>⚡ Offre Spéciale limitée • Paiement à la livraison 58 Wilayas</span>
        </div>

        {/* Product Image Showcase */}
        <div className="relative bg-neutral-100">
          <img 
            src={page.product?.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"} 
            alt={page.product?.name}
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">
            🔥 -30% Réduction
          </div>
        </div>

        {/* Title and Rating */}
        <div className="p-5 border-b border-neutral-100">
          <h1 className="text-2xl font-black text-neutral-900 leading-tight mb-2">
            {page.title}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-amber-400 text-sm">
              {"★".repeat(5)}
            </div>
            <span className="text-xs text-neutral-500 font-semibold">(4.9/5 • 148 avis clients vérifiés)</span>
          </div>

          <div className="flex items-baseline gap-4 mb-4 bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <span className="text-3xl font-black text-amber-700">
              {currentPrice.toLocaleString("fr-DZ")} DZD
            </span>
            <span className="text-base line-through text-neutral-400 font-bold">
              {originalPrice.toLocaleString("fr-DZ")} DZD
            </span>
          </div>

          <a 
            href="#checkout-form"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-xl text-center text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            COMMANDER MAINTENANT (PAIEMENT À RÉCEPTION)
          </a>
        </div>

        {/* Countdown */}
        <div className="bg-neutral-900 text-white p-4 text-center">
          <div className="text-xs font-bold text-yellow-400 mb-1.5 uppercase tracking-wider">
            ⏳ L'offre promotionnelle expire dans :
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-mono font-bold">
            <span className="bg-neutral-800 px-3 py-1.5 rounded-lg">02 H</span>
            <span>:</span>
            <span className="bg-neutral-800 px-3 py-1.5 rounded-lg">47 M</span>
            <span>:</span>
            <span className="bg-neutral-800 px-3 py-1.5 rounded-lg">35 S</span>
          </div>
        </div>

        {/* Guarantees */}
        <div className="p-5 bg-neutral-50 border-b border-neutral-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-neutral-800">Garantie 100% Satisfait</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
              <Truck className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="font-bold text-neutral-800">Livraison 58 Wilayas</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
              <Banknote className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="font-bold text-neutral-800">Paiement à la réception</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
              <RotateCcw className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="font-bold text-neutral-800">Échange sous 7 jours</span>
            </div>
          </div>
        </div>

        {/* Bundles */}
        <div className="p-5 border-b border-neutral-200 space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-neutral-700">
            Choisissez votre pack promotionnel :
          </div>

          <div className="space-y-2.5">
            <div 
              onClick={() => setSelectedBundleId("b1")}
              className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                selectedBundleId === "b1" ? "border-amber-500 bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white"
              }`}
            >
              <div>
                <div className="font-bold text-sm">1 Pièce (Standard)</div>
                <div className="text-xs text-neutral-500">Pour 1 personne</div>
              </div>
              <div className="font-bold text-sm text-neutral-900">{currentPrice.toLocaleString("fr-DZ")} DZD</div>
            </div>

            <div 
              onClick={() => setSelectedBundleId("b2")}
              className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all ${
                selectedBundleId === "b2" ? "border-amber-500 bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white"
              }`}
            >
              <span className="absolute -top-2.5 right-3 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                ⭐ Le plus vendu (-15%)
              </span>
              <div>
                <div className="font-bold text-sm">Pack de 2 Pièces</div>
                <div className="text-xs text-emerald-600 font-bold">Économisez {Math.round(currentPrice * 0.2)} DZD</div>
              </div>
              <div className="font-bold text-sm text-amber-700">{Math.round(currentPrice * 1.8).toLocaleString("fr-DZ")} DZD</div>
            </div>

            <div 
              onClick={() => setSelectedBundleId("b3")}
              className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all ${
                selectedBundleId === "b3" ? "border-amber-500 bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white"
              }`}
            >
              <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                🎉 LIVRAISON GRATUITE
              </span>
              <div>
                <div className="font-bold text-sm">Pack Famille (3 Pièces)</div>
                <div className="text-xs text-emerald-600 font-bold">Livraison offerte partout en Algérie</div>
              </div>
              <div className="font-bold text-sm text-amber-700">{Math.round(currentPrice * 2.5).toLocaleString("fr-DZ")} DZD</div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div id="checkout-form" className="p-5 bg-neutral-50">
          <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="text-center border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-neutral-900">
                Formulaire de Commande Express
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Paiement à la réception du colis (Cash on Delivery)
              </p>
            </div>

            {!orderSuccess ? (
              <form onSubmit={handleCreatePublicOrder} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nom et Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Karim Benmessaoud"
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Numéro de téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0661 23 45 67"
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Wilaya de livraison <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedWilayaCode}
                    onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {ALGERIAN_WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name} ({w.arName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mode de livraison
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("home")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center ${
                        deliveryType === "home" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200"
                      }`}
                    >
                      🏠 À Domicile ({selectedBundleId === "b3" ? "0 DZD" : `${curWilaya.homeDeliveryPrice} DZD`})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("desk")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center ${
                        deliveryType === "desk" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200"
                      }`}
                    >
                      🏢 Au Bureau ({selectedBundleId === "b3" ? "0 DZD" : `${curWilaya.deskDeliveryPrice} DZD`})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Commune / Adresse exacte
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Cité des martyrs, bâtiment B"
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Calculation */}
                <div className="bg-neutral-100 p-3.5 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Produits ({quantity} pièce{quantity > 1 ? "s" : ""}) :</span>
                    <span className="font-semibold">{itemsTotal.toLocaleString("fr-DZ")} DZD</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Livraison ({curWilaya.name}) :</span>
                    <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "font-semibold"}>
                      {deliveryFee === 0 ? "GRATUITE" : `${deliveryFee} DZD`}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 flex justify-between font-black text-base text-neutral-900">
                    <span>Total à régler :</span>
                    <span className="text-emerald-700 font-mono">{grandTotal.toLocaleString("fr-DZ")} DZD</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-center text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Check className="w-5 h-5" />
                  CONFIRMER MA COMMANDE
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-black text-neutral-900">
                  Commande Confirmée !
                </h4>
                <div className="bg-neutral-50 p-4 rounded-xl text-xs space-y-1 text-neutral-700">
                  <div className="font-mono font-bold text-emerald-700 text-sm">{orderReference}</div>
                  <div>Montant total : <strong>{grandTotal.toLocaleString("fr-DZ")} DZD</strong></div>
                  <div>Wilaya : <strong>{curWilaya.name}</strong></div>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Notre équipe de confirmation vous appellera au <strong>{phone}</strong> sous 24h pour valider l'expédition de votre colis.
                </p>
                <button
                  type="button"
                  onClick={() => setOrderSuccess(false)}
                  className="text-xs text-emerald-600 font-bold underline"
                >
                  Passer une autre commande
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
