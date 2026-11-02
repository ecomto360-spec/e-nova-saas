/**
 * T1 — Modale « Choisir les options » (référence).
 * Variantes (couleur en pastilles, taille en puces), quantité, total dynamique,
 * ajout au panier. Accessible : rôle dialog, focus piégé simple, Échap ferme,
 * aria-labels. RTL/LTR.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import type { StorefrontProductLite } from "./sectionTypes";
import { t } from "./sectionTypes";
import { formatPrice } from "../../../lib/storefrontCart";

interface OptionsModalProps {
  product: StorefrontProductLite;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  priceFormat: "plain" | "comma" | "space";
  onClose: () => void;
  onAddToCart: (qty: number, variantLabel: string) => void;
  /** Lien direct vers la commande rapide avec ces options. */
  onOrderNow: (qty: number, variantLabel: string) => void;
}

export function OptionsModal({
  product,
  lang,
  isRtl,
  primaryColor,
  priceFormat,
  onClose,
  onAddToCart,
  onOrderNow,
}: OptionsModalProps): React.ReactElement | null {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    product.variants.forEach((v, vi) => {
      init[vi] = 0;
    });
    return init;
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const soldOut = product.stock <= 0;
  const total = useMemo(() => product.price * qty, [product.price, qty]);

  const variantLabel = useMemo(
    () =>
      product.variants
        .map((v, vi) => {
          const opt = v.options[selected[vi]];
          return opt ? `${v.name} : ${opt.label}` : null;
        })
        .filter(Boolean)
        .join(" · "),
    [product.variants, selected]
  );

  const allRequiredChosen = product.variants.every((v, vi) => v.options.length === 0 || selected[vi] < v.options.length);

  const image = product.images[0] || "";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "Options du produit", "خيارات المنتج")}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        dir={isRtl ? "rtl" : "ltr"}
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900 truncate">
            {lang === "ar" ? product.nameAr : product.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label={t(lang, "Fermer", "إغلاق")}
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-5 p-5">
            {/* Image */}
            {image && (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
                <img
                  src={image}
                  alt={lang === "ar" ? product.nameAr : product.name}
                  width={220}
                  height={220}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Prix */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black" style={{ color: primaryColor }}>
                  {formatPrice(product.price, priceFormat, lang)}
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.oldPrice, priceFormat, lang)}
                  </span>
                )}
                {soldOut && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-800 text-white text-[11px] font-bold">
                    {t(lang, "Épuisé", "نفذ")}
                  </span>
                )}
              </div>

              {/* Variantes */}
              {product.variants.map((v, vi) => (
                <div key={v.name}>
                  <div className="text-xs font-bold text-gray-700 mb-2">
                    {lang === "ar" ? v.nameAr : v.name}
                    <span className="text-gray-400 font-normal ms-1.5">
                      {v.options[selected[vi]] ? (lang === "ar" ? v.options[selected[vi]].labelAr : v.options[selected[vi]].label) : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt, oi) => {
                      const active = selected[vi] === oi;
                      const isSwatch = Boolean(opt.swatch) || /couleur|لون|color/i.test(v.name + v.nameAr);
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setSelected((prev) => ({ ...prev, [vi]: oi }))}
                          aria-pressed={active}
                          title={lang === "ar" ? opt.labelAr : opt.label}
                          className={
                            isSwatch
                              ? `w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${active ? "border-gray-900 ring-2 ring-offset-1 ring-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"}`
                              : `min-w-[2.75rem] px-3 h-9 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`
                          }
                          style={isSwatch && opt.swatch ? { backgroundColor: opt.swatch } : undefined}
                        >
                          {!isSwatch ? (lang === "ar" ? opt.labelAr : opt.label) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantité */}
              <div>
                <div className="text-xs font-bold text-gray-700 mb-2">{t(lang, "Quantité", "الكمية")}</div>
                <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 cursor-pointer"
                    aria-label={t(lang, "Diminuer la quantité", "تقليل الكمية")}
                  >
                    <Minus className="w-4 h-4" aria-hidden />
                  </button>
                  <span className="w-12 text-center font-black text-gray-900" aria-live="polite">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 cursor-pointer"
                    aria-label={t(lang, "Augmenter la quantité", "زيادة الكمية")}
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-600">{t(lang, "Total", "المجموع")}</span>
                <span className="text-xl font-black" style={{ color: primaryColor }}>
                  {formatPrice(total, priceFormat, lang)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 p-5 border-t border-gray-100 bg-white sticky bottom-0">
          <button
            type="button"
            disabled={soldOut || !allRequiredChosen}
            onClick={() => onAddToCart(qty, variantLabel)}
            className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden />
            {t(lang, "Ajouter au panier", "أضف إلى السلة")}
          </button>
          <button
            type="button"
            disabled={soldOut || !allRequiredChosen}
            onClick={() => onOrderNow(qty, variantLabel)}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            {t(lang, "Commande rapide", "الطلب السريع")}
          </button>
        </div>
      </div>
    </div>
  );
}
