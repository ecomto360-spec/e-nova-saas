/**
 * T1 — Section « collection » : produits d'une catégorie, promotions,
 * nouveautés ou meilleures ventes, en carrousel ou grille.
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CollectionSection } from "../../../types/storefrontSections";
import type { ProductCardSettings } from "../../../types/storefrontSections";
import type { SectionViewProps, StorefrontProductLite } from "./sectionTypes";
import { ProductCardV2 } from "./ProductCardV2";
import { t } from "./sectionTypes";

interface CollectionViewProps extends SectionViewProps {
  section: CollectionSection;
  card: ProductCardSettings;
  priceFormat: "plain" | "comma" | "space";
  onQuickAdd: (p: StorefrontProductLite) => void;
  soldCounts?: Record<string, number>;
}

export function CollectionView({
  section,
  lang,
  isRtl,
  primaryColor,
  products,
  categories,
  card,
  priceFormat,
  onChooseOptions,
  onOpenProduct,
  onQuickAdd,
  soldCounts,
}: CollectionViewProps): React.ReactElement | null {
  const categoryName = section.source === "category" ? categories.find((c) => c.id === section.categoryId) : null;

  let list = [...products].filter((p) => p.stock >= 0);
  if (section.source === "onSale") list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
  else if (section.source === "category" && (section.categoryId || categoryName)) {
    const catName = categoryName ? (lang === "ar" ? categoryName.nameAr : categoryName.name) : null;
    const catId = section.categoryId;
    list = list.filter((p) => p.category === catName || (catId && p.category === catId));
  } else if (section.source === "bestSellers") {
    list.sort((a, b) => (soldCounts?.[b.id] ?? 0) - (soldCounts?.[a.id] ?? 0));
  } else if (section.source === "manual" && section.productIds) {
    // Produits choisis manuellement, dans l'ordre défini par le marchand.
    const order = new Map(section.productIds.map((id, i) => [id, i]));
    list = list.filter((p) => order.has(p.id)).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  // « nouveautés » : ordre du catalogue (les plus récents en premier).
  const items = list.slice(0, Math.max(1, section.maxItems));

  if (items.length === 0) return null;

  const title = lang === "ar" ? section.title.ar : section.title.fr;
  const subtitle = lang === "ar" ? section.subtitle.ar : section.subtitle.fr;

  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-end justify-between gap-4 mb-6 sm:mb-8 ${isRtl ? "flex-row" : ""}`}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">{subtitle}</p>
          </div>
          {section.style === "carousel" && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`collection-track-${section.id}`);
                  el?.scrollBy({ left: (isRtl ? 1 : -1) * 320, behavior: "smooth" });
                }}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label={t(lang, "Précédent", "السابق")}
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`collection-track-${section.id}`);
                  el?.scrollBy({ left: (isRtl ? -1 : 1) * 320, behavior: "smooth" });
                }}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label={t(lang, "Suivant", "التالي")}
              >
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </div>
          )}
        </div>

        {section.style === "carousel" ? (
          <div
            id={`collection-track-${section.id}`}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory"
          >
            {items.map((p) => (
              <div key={p.id} className="w-[70%] xs:w-[45%] sm:w-[30%] lg:w-[23%] shrink-0 snap-start">
                <ProductCardV2
                  product={p}
                  lang={lang}
                  isRtl={isRtl}
                  primaryColor={primaryColor}
                  card={card}
                  priceFormat={priceFormat}
                  onChooseOptions={onChooseOptions}
                  onOpenProduct={onOpenProduct}
                  onQuickAdd={onQuickAdd}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((p) => (
              <div key={p.id}>
              <ProductCardV2
                product={p}
                lang={lang}
                isRtl={isRtl}
                primaryColor={primaryColor}
                card={card}
                priceFormat={priceFormat}
                onChooseOptions={onChooseOptions}
                onOpenProduct={onOpenProduct}
                onQuickAdd={onQuickAdd}
              />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
