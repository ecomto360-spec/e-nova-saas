import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Package } from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CreateStore() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [productType, setProductType] = useState<"physical" | "digital">("physical");
  const [language, setLanguage] = useState<"ar" | "fr">("fr");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate URL slug from store name
  useEffect(() => {
    if (storeName) {
      const slug = storeName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
        .trim()
        .replace(/\s+/g, "-"); // Replace spaces with hyphens
      setStoreUrl(slug);
    } else {
      setStoreUrl("");
    }
  }, [storeName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        // Save to Firestore
        await setDoc(doc(db, "tenants", user.uid), {
          storeName,
          storeUrl,
          productType,
          language,
          ownerEmail: user.email,
          createdAt: serverTimestamp(),
          trialStartDate: serverTimestamp(),
          status: 'active',
          plan: 'Standard'
        });
      }
      
      // Save to localStorage for simple persistence across UI components
      localStorage.setItem("dzbuild_store_name", storeName);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating store:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="w-full max-w-[500px] bg-[#16161a] rounded-[24px] p-8 shadow-2xl border border-neutral-800/50 my-8 flex flex-col">
      
      {/* Header with Logo */}
      <div className="flex flex-col items-center justify-center mb-8">
        <img src="/logo.png" alt="E nova" className="h-14 w-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <h1 className="text-3xl font-semibold text-white mb-2">Créez votre site web</h1>
        <p className="text-neutral-400 text-sm">Un nom + un lien et votre site est prêt !</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Store Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">1</div>
            <label className="text-sm font-medium text-white">Nom de la boutique <span className="text-red-500">*</span></label>
          </div>
          <input
            type="text"
            placeholder="Exemple : Boutique Elégance"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
          />
        </div>

        {/* 2. Store URL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">2</div>
            <label className="text-sm font-medium text-white">Lien de votre boutique</label>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed pl-7">
            Écrit depuis le nom et modifiable — minuscules, chiffres et (-). Non modifiable après la création.
          </p>
          <div className="flex items-center mt-2 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 flex items-center gap-1.5 pointer-events-none">
               <Lock size={14} />
               <span className="text-sm font-mono mt-0.5">https://e-nova.vercel.app/store/</span>
             </div>
             
             <input
                type="text"
                placeholder="my-store"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl pl-[230px] pr-4 py-3 text-sm text-yellow-500 font-mono placeholder-neutral-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
              />
          </div>
          {storeUrl && (
            <p className="text-xs text-emerald-400 font-medium pl-7 pt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Disponible !
            </p>
          )}
        </div>

        {/* 3. Product Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">3</div>
            <label className="text-sm font-medium text-white">Type de produits</label>
          </div>
          
          <div className="grid grid-cols-1 gap-3 mt-2 pl-7">
            <button
              type="button"
              onClick={() => setProductType("physical")}
              className={`flex items-center justify-start gap-3 py-3 px-4 rounded-full border transition-colors w-max pr-6 ${
                productType === "physical" 
                  ? "bg-yellow-500/10 border-yellow-500 text-white" 
                  : "bg-[#1e1e24] border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${productType === "physical" ? "border-yellow-500" : "border-neutral-500"}`}>
                {productType === "physical" && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
              </div>
              <span className="text-sm font-medium">Produits physiques</span>
            </button>

            <button
              type="button"
              onClick={() => setProductType("digital")}
              className={`flex items-center justify-start gap-3 py-3 px-4 rounded-full border transition-colors w-max pr-6 ${
                productType === "digital" 
                  ? "bg-yellow-500/10 border-yellow-500 text-white" 
                  : "bg-[#1e1e24] border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${productType === "digital" ? "border-yellow-500" : "border-neutral-500"}`}>
                {productType === "digital" && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
              </div>
              <span className="text-sm font-medium">Produits numériques</span>
            </button>
          </div>
          {productType === "physical" && (
            <p className="text-xs text-neutral-400 pl-7 mt-2">Vêtements, électronique, produits nécessitant une livraison</p>
          )}
        </div>

        {/* 4. Store Language */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">4</div>
            <label className="text-sm font-medium text-white">Langue de la boutique</label>
          </div>
          <p className="text-xs text-neutral-400 pl-7">La langue de votre boutique pour vos clients, modifiable plus tard.</p>
          
          <div className="flex gap-3 mt-2 pl-7">
            <button
              type="button"
              onClick={() => setLanguage("ar")}
              className={`flex items-center justify-center gap-2 py-2 px-6 rounded-full border transition-colors ${
                language === "ar" 
                  ? "bg-yellow-500/10 border-yellow-500 text-white" 
                  : "bg-[#1e1e24] border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              <span className="text-sm font-medium">العربية</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage("fr")}
              className={`flex items-center justify-center gap-3 py-2 px-6 rounded-full border transition-colors ${
                language === "fr" 
                  ? "bg-yellow-500/10 border-yellow-500 text-white" 
                  : "bg-[#1e1e24] border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${language === "fr" ? "border-yellow-500" : "border-neutral-500"}`}>
                {language === "fr" && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
              </div>
              <span className="text-sm font-medium">Français</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !storeName}
          className="w-full bg-yellow-500 text-black font-semibold rounded-xl py-4 mt-8 hover:bg-yellow-400 transition-colors text-base disabled:opacity-50"
        >
          {isSubmitting ? "Création en cours..." : "Créer ma boutique"}
        </button>
      </form>

      <div className="text-center mt-6">
        <button 
          onClick={handleLogout}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
