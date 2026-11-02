/**
 * T1 — Mini-panier (tiroir latéral).
 * Articles (quantité, suppression, total), produits associés suggérés,
 * bouton « Commander » → page de commande. RTL/LTR, accessible.
 */

import React from "react";
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import type { StoreCartItem } from "../../../lib/storefrontCart";
import { formatPrice } from "../../../lib/storefrontCart";
import { t } from "./sectionTypes";

interface MiniCartProps {
  open: boolean;
  onClose: () => void;
  items: StoreCartItem[];
  totalDA: number;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  priceFormat: "plain" | "comma" | "space";
  relatedProducts: Array<{ id: string; name: string; image: string; price: number }>;
  onSetQty: (productId: string, variantLabel: string, qty: number) => void;
  onRemove: (productId: string, variantLabel: string) => void;
  onAddRelated: (p: { id: string; name: string; image: string; price: number }) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export function MiniCart({
  open,
  onClose,
  items,
  totalDA,
  lang,
  isRtl,
  primaryColor,
  priceFormat,
  relatedProducts,
  onSetQty,
  onRemove,
  onAddRelated,
  onCheckout,
  onContinueShopping,
}: MiniCartProps): React.ReactElement | null {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[75] flex"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "Panier", "سلة المشتريات")}
    >
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`${isRtl ? "mr-auto" : "ml-auto"} h-full w-[min(26rem,100vw)] bg-white shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" aria-hidden />
            {t(lang, "Panier", "سلة المشتريات")}
            <span className="text-sm font-bold text-gray-400">({items.reduce((a, i) => a + i.qty, 0)})</span>
          </h3>
          <button type="button" onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer" aria-label={t(lang, "Fermer", "إغلاق")}>
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-200 mb-3" aria-hidden />
              <p className="text-sm text-gray-500">{t(lang, "Votre panier est vide", "سلتك فارغة")}</p>
              <button type="button" onClick={onContinueShopping} className="mt-4 text-sm font-bold cursor-pointer" style={{ color: primaryColor }}>
                {t(lang, "Continuer mes achats", "تابع التسوق")}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((it) => (
                <li key={it.productId + "|" + it.variantLabel} className="flex gap-3 p-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    {it.image ? <img src={it.image} alt={it.name} width={64} height={64} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-2">{it.name}</p>
                    {it.variantLabel && <p className="text-xs text-gray-500 mt-0.5 truncate">{it.variantLabel}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => onSetQty(it.productId, it.variantLabel, it.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 text-gray-500 cursor-pointer" aria-label={t(lang, "Diminuer", "تقليل")}>
                          <Minus className="w-3.5 h-3.5" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{it.qty}</span>
                        <button type="button" onClick={() => onSetQty(it.productId, it.variantLabel, it.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 text-gray-500 cursor-pointer" aria-label={t(lang, "Augmenter", "زيادة")}>
                          <Plus className="w-3.5 h-3.5" aria-hidden />
                        </button>
                      </div>
                      <span className="text-sm font-black" style={{ color: primaryColor }}>
                        {formatPrice(it.price * it.qty, priceFormat, lang)}
                      </span>
                    </div>
                  </div>
                  <button type="button" onClick={() => onRemove(it.productId, it.variantLabel)} className="p-1.5 self-start rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer" aria-label={t(lang, "Supprimer", "حذف")}>
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Produits associés */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-gray-100 p-4">
              <h4 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">
                {t(lang, "Souvent achetés ensemble", "يُشترى غالباً معها")}
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {relatedProducts.slice(0, 3).map((p) => (
                  <button key={p.id} type="button" onClick={() => onAddRelated(p)} className="group text-start cursor-pointer">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-1.5">
                      {p.image ? <img src={p.image} alt={p.name} width={120} height={120} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : null}
                    </div>
                    <p className="text-[11px] font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                    <p className="text-[11px] font-black" style={{ color: primaryColor }}>{formatPrice(p.price, priceFormat, lang)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied : total + commande */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">{t(lang, "Sous-total", "المجموع الفرعي")}</span>
              <span className="text-xl font-black text-gray-900">{formatPrice(totalDA, priceFormat, lang)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {t(lang, "Commander maintenant", "اطلب الآن")}
              {isRtl ? <ArrowRight className="w-4 h-4 rotate-180" aria-hidden /> : <ArrowRight className="w-4 h-4" aria-hidden />}
            </button>
            <button type="button" onClick={onContinueShopping} className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-800 cursor-pointer">
              {t(lang, "Continuer mes achats", "تابع التسوق")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
