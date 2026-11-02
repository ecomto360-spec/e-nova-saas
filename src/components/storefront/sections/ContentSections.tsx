/**
 * T1 — Sections de contenu : avis clients, FAQ accordéon, bannière promo,
 * infos de la marque. Composants autonomes, RTL/LTR, accessibles.
 */

import React, { useState } from "react";
import { ChevronDown, Star, Quote, MapPin, Facebook, Instagram, MessageCircle, Truck, Package, RotateCcw, Phone, Clock, Star as StarIcon, Check, Music2 } from "lucide-react";
import type { BilingualText } from "../../../types/storefront";
import type { BrandInfoSection, FaqSection, PromoBannerSection, ReviewsSection, StoreReview, TrustSection } from "../../../types/storefrontSections";
import type { SectionViewProps } from "./sectionTypes";
import { t } from "./sectionTypes";

const txt = (b: BilingualText | null | undefined, lang: "fr" | "ar"): string => (b ? (lang === "ar" ? b.ar : b.fr) : "");

/* ------------------------------ AVIS CLIENTS ------------------------------ */

function Stars({ rating, color }: { rating: number; color: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? "fill-current" : "fill-none opacity-30"}`} style={{ color }} aria-hidden />
      ))}
    </div>
  );
}

export function ReviewsSectionView({
  section,
  lang,
  isRtl,
  primaryColor,
  productReviews,
  isPublicView = true,
}: {
  section: ReviewsSection;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  productReviews: StoreReview[];
  isPublicView?: boolean;
}): React.ReactElement | null {
  const all = [...section.manualReviews, ...(section.includeProductReviews ? productReviews : [])].slice(0, section.maxItems);
  // Boutique publique sans aucun avis : la section entière est masquée
  // (pas de « bientôt » sur une vraie boutique). L'éditeur garde le placeholder.
  if (all.length === 0 && isPublicView) return null;
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title, lang)}</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2">{txt(section.subtitle, lang)}</p>
        </div>
        {all.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">{t(lang, "Les avis arriveront bientôt.", "آراء الزبائن قريباً.")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {all.map((r) => (
              <figure key={r.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} color="#f59e0b" />
                  <Quote className="w-6 h-6 text-gray-200" aria-hidden />
                </div>
                <blockquote className="text-sm text-gray-700 leading-relaxed flex-1">« {txt(r.text, lang)} »</blockquote>
                <figcaption className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{r.author}</span>
                  {r.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" aria-hidden />
                      {r.city}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ----------------------------------- */

export function FaqSectionView({ section, lang, isRtl }: { section: FaqSection; lang: "fr" | "ar"; isRtl: boolean }): React.ReactElement {
  const [open, setOpen] = useState<string | null>(section.items[0]?.id ?? null);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title, lang)}</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2">{txt(section.subtitle, lang)}</p>
        </div>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
          {section.items.map((item) => {
            const isOpen = open === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-start hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-[15px] font-bold text-gray-900">{txt(item.question, lang)}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{txt(item.answer, lang)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- BANNIÈRE PROMO -------------------------------- */

export function PromoBannerSectionView({
  section,
  lang,
  isRtl,
  primaryColor,
}: {
  section: PromoBannerSection;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
}): React.ReactElement {
  return (
    <section id={`section-${section.id}`} className="py-10 sm:py-14" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[320px] flex items-center">
          {section.image ? (
            <img src={section.image} alt="" className="absolute inset-0 w-full h-full object-cover" width={1600} height={600} loading="lazy" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(0,0,0,0.75) 100%)` }}
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-black/35" aria-hidden />
          <div className="relative z-10 p-8 sm:p-14 max-w-2xl text-white">
            <h2 className="text-2xl sm:text-4xl font-black leading-tight">{txt(section.title, lang)}</h2>
            <p className="mt-3 text-sm sm:text-lg text-white/85 leading-relaxed">{txt(section.description, lang)}</p>
            <a
              href={section.buttonLink || "#products"}
              className="inline-flex items-center mt-6 px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 transition-colors"
              style={{ color: primaryColor }}
            >
              {txt(section.buttonText, lang)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------- INFOS DE LA MARQUE ---------------------------- */

export function BrandInfoSectionView({
  section,
  lang,
  isRtl,
  storeName,
  logoUrl,
  stats,
}: {
  section: BrandInfoSection;
  lang: "fr" | "ar";
  isRtl: boolean;
  storeName: string;
  logoUrl: string;
  stats: { products: number; orders: number; reviews: number };
}): React.ReactElement {
  const socials: Array<{ url: string; label: string; icon: React.ReactElement }> = [];
  if (section.whatsapp) socials.push({ url: `https://wa.me/${section.whatsapp.replace(/[^0-9]/g, "")}`, label: "WhatsApp", icon: <MessageCircle className="w-5 h-5" aria-hidden /> });
  if (section.facebook) socials.push({ url: section.facebook, label: "Facebook", icon: <Facebook className="w-5 h-5" aria-hidden /> });
  if (section.instagram) socials.push({ url: section.instagram, label: "Instagram", icon: <Instagram className="w-5 h-5" aria-hidden /> });
  if (section.tiktok) socials.push({ url: section.tiktok, label: "TikTok", icon: <Music2 className="w-5 h-5" aria-hidden /> });

  const statItems = [
    { value: stats.products, label: t(lang, "Produits", "منتج") },
    { value: stats.orders, label: t(lang, "Commandes livrées", "طلب موصَل") },
    { value: stats.reviews, label: t(lang, "Avis clients", "تقييم") },
  ];

  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title, lang)}</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">{txt(section.description, lang)}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 mt-5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-white hover:border-transparent transition-colors"
                    style={{ ["--hover-bg" as string]: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#111827")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
          {section.showStats && (
            <div className="flex md:flex-col gap-3 md:gap-4">
              {statItems.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-6 py-4 text-center min-w-[7rem]">
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">{s.value}</div>
                  <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- BADGES DE CONFIANCE -------------------------- */

const TRUST_ICONS: Record<TrustSection["items"][number]["icon"], React.ReactElement> = {
  truck: <Truck className="w-7 h-7" aria-hidden />,
  shield: <Check className="w-7 h-7" aria-hidden />,
  rotate: <RotateCcw className="w-7 h-7" aria-hidden />,
  phone: <Phone className="w-7 h-7" aria-hidden />,
  clock: <Clock className="w-7 h-7" aria-hidden />,
  star: <StarIcon className="w-7 h-7" aria-hidden />,
  package: <Package className="w-7 h-7" aria-hidden />,
  check: <Check className="w-7 h-7" aria-hidden />,
};

export function TrustSectionView({
  section,
  lang,
  isRtl,
  primaryColor,
}: {
  section: TrustSection;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
}): React.ReactElement {
  return (
    <section id={`section-${section.id}`} className="py-10 sm:py-12 bg-white border-y border-gray-100" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {section.items.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + "18", color: primaryColor }}>
              {TRUST_ICONS[item.icon]}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">{txt(item.title, lang)}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">{txt(item.subtitle, lang)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
