/**
 * T1 — Carte produit du niveau de la référence.
 * Badge (Vedette / -X% / Épuisé), catégorie, nom, prix + ancien prix barré,
 * bouton « Choisir les options » (action configurable T2), ajout rapide au
 * survol, image lazy sans layout shift (ratio fixe + dimensions), RTL/LTR.
 */

import React from "react";
import { ShoppingCart, Eye } from "lucide-react";
import type { ProductCardSettings } from "../../../types/storefrontSections";
import type { StorefrontProductLite } from "./sectionTypes";
import { t } from "./sectionTypes";
import { formatPrice } from "../../../lib/storefrontCart";

interface ProductCardV2Props {
  product: StorefrontProductLite;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  card: ProductCardSettings;
  priceFormat: "plain" | "comma" | "space";
  onChooseOptions: (p: StorefrontProductLite) => void;
  onOpenProduct: (p: StorefrontProductLite) => void;
  onQuickAdd: (p: StorefrontProductLite) => void;
  /** T3 — variante visuelle du thème actif. */
  themeCard?: "standard" | "compact" | "editorial" | "bold";
}

export function ProductCardV2({
  product,
  lang,
  isRtl,
  primaryColor,
  card,
  priceFormat,
  onChooseOptions,
  onOpenProduct,
  onQuickAdd,
  themeCard = "standard",
}: ProductCardV2Props): React.ReactElement {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;
  const soldOut = product.stock <= 0;
  const image = product.images[0] || "";
  const borderRadius = card.cardBorders === "square" ? "rounded-none" : card.cardBorders === "pill" ? "rounded-3xl" : "rounded-xl";
  const secondImage = product.images[1] || "";

  /* T3 — variantes de thème :
     standard : ratio 1:1 (référence) ; compact : 1:1 serré, bouton discret ;
     editorial : portrait 3:4 + 2e image au survol (mode/lookbook) ;
     bold : 1:1, bords marqués, badge prix plein. */
  const aspectClass =
    themeCard === "editorial"
      ? "aspect-[3/4]"
      : themeCard === "compact"
        ? "aspect-square"
        : "aspect-square";
  const padClass = themeCard === "compact" ? "p-2.5 gap-1.5" : themeCard === "bold" ? "p-4 gap-2" : "p-3.5 gap-2";
  const frameClass =
    themeCard === "bold"
      ? "border-2 border-gray-900/90 shadow-[0_2px_0_rgba(0,0,0,0.9)] hover:shadow-[0_6px_0_rgba(0,0,0,0.9)] hover:-translate-y-0.5"
      : themeCard === "editorial"
        ? "border-0 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
        : "border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)]";

  const buttonLabel = card.buttonText
    ? lang === "ar"
      ? card.buttonText.ar
      : card.buttonText.fr
    : card.buttonAction === "orderNow"
      ? t(lang, "Commander maintenant", "اطلب الآن")
      : card.buttonAction === "addToCart"
        ? t(lang, "Ajouter au panier", "أضف إلى السلة")
        : t(lang, "Choisir les options", "اختر الخيارات");

  return (
    <div
      className={`group relative flex flex-col bg-white ${frameClass} ${borderRadius} overflow-hidden transition-all duration-300 ${padClass}`}
    >
      {/* Image (ratio 1:1, lazy, dimensions fixes -> zéro layout shift) */}
      <div className={`relative w-full overflow-hidden bg-gray-50 ${aspectClass}`}>
      <button
        type="button"
        onClick={() => onOpenProduct(product)}
        className="absolute inset-0 w-full h-full text-start cursor-pointer"
        aria-label={lang === "ar" ? product.nameAr : product.name}
      >
        {image ? (
          <>
            <img
              src={image}
              alt={lang === "ar" ? product.nameAr : product.name}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover transition-all duration-500 ${secondImage && themeCard === "editorial" ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
            />
            {secondImage && themeCard === "editorial" && (
              <img
                src={secondImage}
                alt=""
                aria-hidden
                width={400}
                height={400}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-10 h-10" aria-hidden />
          </div>
        )}

        {/* Badges */}
        {card.showBadge && soldOut && (
          <span className="absolute top-2 start-2 px-2.5 py-1 rounded-lg bg-gray-800/90 text-white text-[11px] font-bold z-10">
            {t(lang, "Épuisé", "نفذ")}
          </span>
        )}
        {card.showBadge && !soldOut && discount > 0 && (
          <span className="absolute top-2 start-2 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[11px] font-bold z-10">
            -{discount}%
          </span>
        )}
        {card.showBadge && !soldOut && discount === 0 && product.isFeatured && (
          <span className="absolute top-2 start-2 px-2.5 py-1 rounded-lg text-white text-[11px] font-bold z-10" style={{ backgroundColor: primaryColor }}>
            {t(lang, "Vedette", "مميز")}
          </span>
        )}

      </button>

      {/* Ajout rapide au survol (desktop) — voisin du bouton image (HTML valide) */}
      {card.quickAddOnHover && !soldOut && (
        <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden sm:block">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="w-full py-2 rounded-lg bg-gray-900/90 hover:bg-gray-900 text-white text-xs font-bold backdrop-blur-sm flex items-center justify-center gap-1.5 cursor-pointer"
            aria-label={t(lang, "Ajout rapide au panier", "إضافة سريعة إلى السلة")}
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden />
            {t(lang, "Ajout rapide", "إضافة سريعة")}
          </button>
        </div>
      )}
      </div>

      {/* Contenu */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1">
        {card.showCategoryName && product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 truncate">
            {product.category}
          </span>
        )}
        <button
          type="button"
          onClick={() => onOpenProduct(product)}
          className="text-start text-sm sm:text-[15px] font-bold text-gray-900 hover:text-gray-600 leading-snug line-clamp-2 min-h-[2.6em] cursor-pointer"
        >
          {lang === "ar" ? product.nameAr : product.name}
        </button>

        <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
          {card.showPrice && (
            <span className="enova-price-now text-base sm:text-lg font-black" style={{ color: primaryColor }}>
              {formatPrice(product.price, priceFormat, lang)}
            </span>
          )}
          {card.showOldPrice && product.oldPrice && product.oldPrice > product.price && (
            <span className="enova-price-old text-xs sm:text-sm text-gray-400 line-through">
              {formatPrice(product.oldPrice, priceFormat, lang)}
            </span>
          )}
        </div>

        {!card.hideAddToCartButton && (
          <button
            type="button"
            disabled={soldOut}
            onClick={() => (card.buttonAction === "chooseOptions" ? onChooseOptions(product) : onQuickAdd(product))}
            className={`mt-2 w-full flex items-center justify-center gap-2 ${card.buttonStyle === "roundIcon" ? "py-2.5 rounded-full" : "py-2.5 rounded-lg"} text-white text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
            style={{ backgroundColor: primaryColor }}
          >
            {card.buttonStyle === "roundIcon" ? <ShoppingCart className="w-4 h-4" aria-hidden /> : null}
            {soldOut ? t(lang, "Épuisé", "نفذ المنتج") : buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Fiche produit absente (sécurité) — jamais de bloc vide muet. */
export function ProductCardV2Fallback(): React.ReactElement {
  return (
    <div className="p-6 text-center text-gray-400 text-sm">—</div>
  );
}
