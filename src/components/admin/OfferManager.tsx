import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  UploadCloud, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Truck, 
  Sparkles,
  GripVertical
} from "lucide-react";
import { ProductOffer, PriceMode, calculateOfferFinalPrice, calculateOfferOriginalPrice } from '../../types/offers';

interface OfferManagerProps {
  offers: ProductOffer[];
  onChange: (offers: ProductOffer[]) => void;
  baseProductPrice: number;
  mainProductImage?: string;
}

export function OfferManager({
  offers,
  onChange,
  baseProductPrice,
  mainProductImage
}: OfferManagerProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddOffer = () => {
    if (offers.length >= 5) return;

    // Suggest next quantity
    const existingQuantities = new Set(offers.map(o => o.quantity));
    let nextQty = 2;
    while (existingQuantities.has(nextQty)) {
      nextQty++;
    }

    const newOffer: ProductOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product_id: "",
      title: `Pack ${nextQty} articles (Économisez)`,
      quantity: nextQty,
      price_mode: "percent",
      discount_value: 15,
      final_price: calculateOfferFinalPrice("percent", 15, nextQty, baseProductPrice || 1000),
      original_price: (baseProductPrice || 1000) * nextQty,
      badge_text: "-15% Remise",
      badge_color: "#10B981",
      free_shipping: false,
      image_url: null,
      sort_order: offers.length,
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onChange([...offers, newOffer]);
  };

  const handleUpdateOffer = (idx: number, updates: Partial<ProductOffer>) => {
    const updatedList = [...offers];
    const current = { ...updatedList[idx], ...updates, updatedAt: new Date().toISOString() };

    // Auto recalculate prices if mode/discount/quantity changed
    const unitPrice = baseProductPrice > 0 ? baseProductPrice : 1000;
    const finalCalculated = calculateOfferFinalPrice(
      current.price_mode,
      current.discount_value,
      current.quantity,
      unitPrice,
      current.final_price
    );
    if (current.price_mode !== "fixed") {
      current.final_price = finalCalculated;
    }
    
    // Auto-calculate original price if not manually set or zero
    if (!current.original_price || current.original_price <= 0) {
      current.original_price = unitPrice * Math.max(1, current.quantity);
    }

    updatedList[idx] = current;
    onChange(updatedList);
  };

  const handleRemoveOffer = (id: string) => {
    onChange(offers.filter(o => o.id !== id).map((o, idx) => ({ ...o, sort_order: idx })));
    setDeleteConfirmId(null);
  };

  const handleMove = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= offers.length) return;
    const items = [...offers];
    const temp = items[idx];
    items[idx] = items[newIdx];
    items[newIdx] = temp;
    onChange(items.map((it, i) => ({ ...it, sort_order: i })));
  };

  const handleImageUpload = (idx: number, file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result;
      if (typeof base64 !== "string") return;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX = 600;
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else if (h > MAX) {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL("image/webp", 0.85);
          handleUpdateOffer(idx, { image_url: compressed });
        } catch {
          handleUpdateOffer(idx, { image_url: base64 });
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Offres et lots</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {offers.length} / 5
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Proposez des offres par quantité avec remise ou livraison offerte pour maximiser votre panier moyen.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddOffer}
          disabled={offers.length >= 5}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            offers.length >= 5
              ? "opacity-50 cursor-not-allowed bg-neutral-800 text-neutral-500 border border-neutral-700"
              : "bg-amber-500 text-black hover:bg-amber-400 font-bold shadow-sm"
          }`}
        >
          <Plus className="w-4 h-4" /> Ajouter une offre
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="border border-dashed border-neutral-700/80 rounded-xl p-8 text-center bg-[#18181c]/50">
          <Tag className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-300">Aucune offre configurée pour ce produit</p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
            Ajoutez jusqu'à 5 offres (ex: "Achetez 2, obtenez -20% et la livraison gratuite") pour déclencher l'achat immédiat.
          </p>
          <button
            type="button"
            onClick={handleAddOffer}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Créer la 1ère offre
          </button>
        </div>
      ) : (
        <div className="space-y-5 mt-4">
          {offers.map((offer, idx) => {
            const unitPrice = baseProductPrice > 0 ? baseProductPrice : 0;
            const originalCalculated = calculateOfferOriginalPrice(offer.quantity, unitPrice, offer.original_price);
            
            // Validation errors
            const isTitleEmpty = !offer.title || !offer.title.trim();
            const isQtyInvalid = !offer.quantity || offer.quantity < 1;
            const isDuplicateQty = offers.some((o, i) => i !== idx && o.quantity === offer.quantity);
            const isFinalPriceInvalid = offer.final_price <= 0;
            const isPercentInvalid = offer.price_mode === "percent" && (Number(offer.discount_value) < 1 || Number(offer.discount_value) > 99);
            const isAmountInvalid = offer.price_mode === "amount" && (Number(offer.discount_value) <= 0 || (unitPrice > 0 && Number(offer.discount_value) >= unitPrice * offer.quantity));
            const isPriceExceedingOriginal = offer.final_price > (originalCalculated || 999999);

            return (
              <div 
                key={offer.id || idx}
                className={`rounded-2xl border transition-all ${
                  offer.is_active 
                    ? "bg-[#16161a] border-neutral-800 shadow-md" 
                    : "bg-[#141416]/60 border-neutral-850 opacity-70"
                } p-5 relative`}
              >
                {/* Offer Header bar */}
                <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-800/80">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-neutral-600 cursor-grab shrink-0" />
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Offre {idx + 1} : {offer.title || "Nouvelle offre"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateOffer(idx, { is_active: !offer.is_active })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        offer.is_active 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                          : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                      }`}
                      title={offer.is_active ? "Offre active dans la boutique" : "Offre désactivée"}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${offer.is_active ? "bg-emerald-400" : "bg-neutral-500"}`} />
                      {offer.is_active ? "Active" : "Désactivée"}
                    </button>

                    {/* Move up / down */}
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Monter"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === offers.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Descendre"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button with confirmation */}
                    {deleteConfirmId === offer.id ? (
                      <div className="flex items-center gap-1 bg-red-950/40 border border-red-800/60 rounded-lg p-1">
                        <span className="text-[11px] text-red-300 font-medium px-1">Supprimer ?</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOffer(offer.id)}
                          className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold hover:bg-red-500 transition-colors"
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[11px]"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(offer.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title="Supprimer cette offre"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Offer Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Titre de l'offre */}
                  <div className="md:col-span-8">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Titre de l'offre <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={offer.title}
                      onChange={(e) => handleUpdateOffer(idx, { title: e.target.value })}
                      placeholder="Ex: Commandez 2, économisez 500 DA"
                      className={`w-full rounded-xl border ${
                        isTitleEmpty ? "border-red-500/80 bg-red-950/10" : "border-neutral-700 bg-[#121215]"
                      } px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium`}
                    />
                    {isTitleEmpty && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Le titre de l'offre est obligatoire.
                      </p>
                    )}
                  </div>

                  {/* Quantité */}
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Quantité d'articles <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={offer.quantity}
                      onChange={(e) => handleUpdateOffer(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className={`w-full rounded-xl border ${
                        isQtyInvalid || isDuplicateQty ? "border-red-500/80 bg-red-950/10" : "border-neutral-700 bg-[#121215]"
                      } px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium text-center`}
                    />
                    {isDuplicateQty && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Chaque offre doit avoir une quantité unique.
                      </p>
                    )}
                  </div>

                  {/* Mode de calcul du prix */}
                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Mode de calcul du prix <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateOffer(idx, { price_mode: "fixed" })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          offer.price_mode === "fixed"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-sm"
                            : "border-neutral-700 bg-[#121215] text-neutral-400 hover:text-white"
                        }`}
                      >
                        Prix fixe du pack
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateOffer(idx, { price_mode: "percent" })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          offer.price_mode === "percent"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-sm"
                            : "border-neutral-700 bg-[#121215] text-neutral-400 hover:text-white"
                        }`}
                      >
                        Remise en %
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateOffer(idx, { price_mode: "amount" })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          offer.price_mode === "amount"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-sm"
                            : "border-neutral-700 bg-[#121215] text-neutral-400 hover:text-white"
                        }`}
                      >
                        Remise en DA
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5 flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      Si vos variantes ont des prix différents, choisissez une remise : le prix suit ce que l'acheteur sélectionne.
                    </p>
                  </div>

                  {/* Price inputs depending on mode */}
                  {offer.price_mode === "fixed" && (
                    <div className="md:col-span-6">
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Prix final de l'offre (DA) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={offer.final_price || ""}
                        onChange={(e) => handleUpdateOffer(idx, { final_price: Number(e.target.value) || 0 })}
                        placeholder="Ex: 4500"
                        className={`w-full rounded-xl border ${
                          isFinalPriceInvalid ? "border-red-500/80 bg-red-950/10" : "border-neutral-700 bg-[#121215]"
                        } px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium`}
                      />
                      {isFinalPriceInvalid && (
                        <p className="text-red-400 text-xs mt-1">Le prix final doit être supérieur à 0 DA.</p>
                      )}
                    </div>
                  )}

                  {offer.price_mode === "percent" && (
                    <div className="md:col-span-6">
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Pourcentage de remise (%) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={offer.discount_value !== undefined && offer.discount_value !== null ? offer.discount_value : 10}
                        onChange={(e) => handleUpdateOffer(idx, { discount_value: Number(e.target.value) || 0 })}
                        placeholder="Ex: 20"
                        className={`w-full rounded-xl border ${
                          isPercentInvalid ? "border-red-500/80 bg-red-950/10" : "border-neutral-700 bg-[#121215]"
                        } px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium`}
                      />
                      {isPercentInvalid && (
                        <p className="text-red-400 text-xs mt-1">La remise doit être comprise entre 1% et 99%.</p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        Prix final calculé : <strong className="text-amber-400">{offer.final_price.toLocaleString()} DA</strong>
                      </p>
                    </div>
                  )}

                  {offer.price_mode === "amount" && (
                    <div className="md:col-span-6">
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Montant de la remise (DA) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={offer.discount_value !== undefined && offer.discount_value !== null ? offer.discount_value : 500}
                        onChange={(e) => handleUpdateOffer(idx, { discount_value: Number(e.target.value) || 0 })}
                        placeholder="Ex: 500"
                        className={`w-full rounded-xl border ${
                          isAmountInvalid ? "border-red-500/80 bg-red-950/10" : "border-neutral-700 bg-[#121215]"
                        } px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium`}
                      />
                      {isAmountInvalid && (
                        <p className="text-red-400 text-xs mt-1">
                          La remise en DA doit être inférieure au prix total de base ({originalCalculated} DA).
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        Prix final calculé : <strong className="text-amber-400">{offer.final_price.toLocaleString()} DA</strong>
                      </p>
                    </div>
                  )}

                  {/* Prix avant remise (barré) */}
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Prix avant remise (DA, barré)
                    </label>
                    <input
                      type="number"
                      value={offer.original_price || ""}
                      onChange={(e) => handleUpdateOffer(idx, { original_price: e.target.value ? Number(e.target.value) : null })}
                      placeholder={`Auto : ${(unitPrice * offer.quantity).toLocaleString()} DA`}
                      className={`w-full rounded-xl border ${
                        isPriceExceedingOriginal ? "border-red-500/80 bg-red-950/10" : "border-neutral-700 bg-[#121215]"
                      } px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium`}
                    />
                    {isPriceExceedingOriginal ? (
                      <p className="text-red-400 text-xs mt-1">
                        Le prix final ({offer.final_price} DA) ne peut pas dépasser le prix avant remise.
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-500 mt-1">
                        Si vide, auto-calculé = prix unitaire × {offer.quantity}.
                      </p>
                    )}
                  </div>

                  {/* Badge Text & Color */}
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Texte du badge (optionnel)
                    </label>
                    <input
                      type="text"
                      value={offer.badge_text || ""}
                      onChange={(e) => handleUpdateOffer(idx, { badge_text: e.target.value })}
                      placeholder="Ex: -30%, Populaire, Économique"
                      className="w-full rounded-xl border border-neutral-700 bg-[#121215] px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors font-medium"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Couleur du badge & Aperçu direct
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-[#121215] border border-neutral-700 rounded-xl px-3 py-2 flex-1">
                        <input
                          type="color"
                          value={offer.badge_color || "#10B981"}
                          onChange={(e) => handleUpdateOffer(idx, { badge_color: e.target.value })}
                          className="w-7 h-7 rounded-lg cursor-pointer border border-neutral-600 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          value={offer.badge_color || "#10B981"}
                          onChange={(e) => handleUpdateOffer(idx, { badge_color: e.target.value })}
                          className="bg-transparent border-none text-xs text-white font-mono uppercase focus:outline-none w-20"
                        />
                      </div>

                      {/* Live Badge Preview */}
                      <div className="shrink-0">
                        {offer.badge_text ? (
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm inline-block"
                            style={{ backgroundColor: offer.badge_color || "#10B981" }}
                          >
                            {offer.badge_text}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500 italic">Sans badge</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Free shipping toggle */}
                  <div className="md:col-span-12 bg-[#121215] border border-neutral-800 rounded-xl p-3.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Livraison gratuite sur cette offre</span>
                          <span className="text-[11px] text-neutral-400 block">
                            Annuler les frais de livraison pour le client lorsqu'il choisit ce lot
                          </span>
                        </div>
                      </div>
                      <div 
                        onClick={() => handleUpdateOffer(idx, { free_shipping: !offer.free_shipping })}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                          offer.free_shipping ? "bg-emerald-500" : "bg-neutral-700"
                        }`}
                      >
                        <span 
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            offer.free_shipping ? "translate-x-5" : "translate-x-1"
                          }`} 
                        />
                      </div>
                    </label>
                  </div>

                  {/* Image de l'offre */}
                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Image spécifique à l'offre (optionnel)
                    </label>
                    <div className="flex items-center gap-4">
                      {offer.image_url ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-700 shrink-0 bg-neutral-900 group">
                          <img src={offer.image_url} alt="Offer preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleUpdateOffer(idx, { image_url: null })}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                            title="Retirer l'image"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-700 hover:border-neutral-500 bg-[#121215] text-xs font-medium text-neutral-300 hover:text-white cursor-pointer transition-colors">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageUpload(idx, f);
                              e.target.value = "";
                            }}
                          />
                          <UploadCloud className="w-4 h-4 text-neutral-400" />
                          <span>Télécharger une photo du pack (max 2 Mo)</span>
                        </label>
                      )}

                      <span className="text-xs text-neutral-500">
                        {offer.image_url ? "Image personnalisée appliquée" : "Si aucune image n'est choisie, l'image principale du produit sera utilisée."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
