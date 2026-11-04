/**
 * T6 — Sections riches des thèmes Bio & Naturel / Vitrine Entreprise /
 * Services Professionnels : chiffres clés, cartes services, galerie
 * réalisations, processus, forfaits, bande CTA, formulaire devis/RDV (leads),
 * équipe. Composants autonomes, RTL/LTR, bilingues, responsive, images lazy.
 */

import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Check, TrendingUp, Award, Users, Building2, Wrench, Sparkles, ClipboardList, CalendarCheck, Search, Handshake, ShieldCheck, ThumbsUp } from "lucide-react";
import type { BilingualText } from "../../../types/storefront";
import type { CtaBannerSection, ContactFormSection, GallerySection, PricingSection, ProcessSection, ServicesCardsSection, StatsSection, TeamSection } from "../../../types/storefrontSections";
import { createLead } from "../../../lib/leadService";

const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  trending: TrendingUp, award: Award, users: Users, building: Building2, wrench: Wrench,
  sparkles: Sparkles, clipboard: ClipboardList, calendar: CalendarCheck, search: Search,
  handshake: Handshake, shield: ShieldCheck, thumbsup: ThumbsUp, phone: Phone,
};

/* ----------------------------- CHIFFRES CLÉS ------------------------------- */

export function StatsSectionView({ section, lang, isRtl, primaryColor }: {
  section: StatsSection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title ? (
          <h2 className="text-center text-2xl sm:text-3xl font-black text-gray-900 mb-10">{txt(section.title)}</h2>
        ) : null}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {section.items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-6 text-center">
              <div className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: primaryColor }}>{it.value}</div>
              <div className="mt-2 text-xs sm:text-sm font-semibold text-gray-600 leading-snug">{txt(it.label)}</div>
            </div>
          ))}
        </div>
        {section.clients && section.clients.length > 0 ? (
          <div className="mt-10 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 opacity-70">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {lang === "ar" ? "يثقون بنا" : "Ils nous font confiance"}
            </span>
            {section.clients.map((c, i) => (
              <span key={i} className="text-sm font-black text-gray-500 tracking-wide">{txt(c)}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------ CARTES SERVICES ---------------------------- */

export function ServicesCardsSectionView({ section, lang, isRtl, primaryColor }: {
  section: ServicesCardsSection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title)}</h2>
          {section.subtitle ? <p className="mt-3 text-sm sm:text-base text-gray-600">{txt(section.subtitle)}</p> : null}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {section.cards.map((c) => {
            const Icon = c.icon ? ICONS[c.icon] : null;
            return (
              <article key={c.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-shadow">
                {c.image ? (
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img src={c.image} alt={txt(c.title)} loading="lazy" decoding="async" width={640} height={480}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}14` }}>
                    {Icon ? <Icon className="w-12 h-12" style={{ color: primaryColor }} /> : <Sparkles className="w-12 h-12" style={{ color: primaryColor }} />}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-black text-gray-900 leading-snug">{txt(c.title)}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{txt(c.text)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- GALERIE RÉALISATIONS -------------------------- */

export function GallerySectionView({ section, lang, isRtl, primaryColor }: {
  section: GallerySection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title)}</h2>
          {section.subtitle ? <p className="mt-3 text-sm sm:text-base text-gray-600">{txt(section.subtitle)}</p> : null}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {section.items.map((it) => (
            <figure key={it.id} className="group relative rounded-3xl overflow-hidden bg-gray-100">
              <div className="aspect-square overflow-hidden">
                <img src={it.image} alt={txt(it.title)} loading="lazy" decoding="async" width={800} height={800}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
              </div>
              {it.tag ? (
                <span className="absolute top-3 start-3 text-[11px] font-bold text-white px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }}>
                  {txt(it.tag)}
                </span>
              ) : null}
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                <div className="text-white font-bold text-sm leading-snug">{txt(it.title)}</div>
                {it.text ? <div className="text-white/80 text-xs mt-1 leading-snug">{txt(it.text)}</div> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- PROCESSUS -------------------------------- */

export function ProcessSectionView({ section, lang, isRtl, primaryColor }: {
  section: ProcessSection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title)}</h2>
          {section.subtitle ? <p className="mt-3 text-sm sm:text-base text-gray-600">{txt(section.subtitle)}</p> : null}
        </div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {section.steps.map((st, i) => {
            const Icon = st.icon ? ICONS[st.icon] : null;
            return (
              <li key={st.id} className="relative rounded-3xl border border-gray-100 bg-gray-50/60 p-6 text-center">
                <span className="absolute top-4 end-4 text-4xl font-black opacity-10 text-gray-900" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${primaryColor}18` }}>
                  {Icon ? <Icon className="w-7 h-7" style={{ color: primaryColor }} /> : <ClipboardList className="w-7 h-7" style={{ color: primaryColor }} />}
                </div>
                <h3 className="mt-4 font-black text-gray-900">{txt(st.title)}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{txt(st.text)}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------- FORFAITS -------------------------------- */

export function PricingSectionView({ section, lang, isRtl, primaryColor }: {
  section: PricingSection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title)}</h2>
          {section.subtitle ? <p className="mt-3 text-sm sm:text-base text-gray-600">{txt(section.subtitle)}</p> : null}
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {section.plans.map((pl) => (
            <article key={pl.id} className={`relative flex flex-col rounded-3xl p-7 border ${pl.highlighted ? "bg-white border-2 shadow-[0_14px_40px_rgba(0,0,0,0.10)]" : "bg-white/70 border-gray-200"}`}
              style={pl.highlighted ? { borderColor: primaryColor } : undefined}>
              {pl.highlighted ? (
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 text-[11px] font-black text-white px-3 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor }}>
                  {lang === "ar" ? "الأكثر طلباً" : "Le plus demandé"}
                </span>
              ) : null}
              <h3 className="font-black text-lg text-gray-900">{txt(pl.name)}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums" style={{ color: primaryColor }}>{pl.price}</span>
                {pl.period ? <span className="text-xs text-gray-500 font-semibold">{txt(pl.period)}</span> : null}
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {pl.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                    <span>{txt(f)}</span>
                  </li>
                ))}
              </ul>
              {pl.buttonText ? (
                <a href="#contact" className="mt-6 inline-flex justify-center items-center px-5 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={pl.highlighted ? { backgroundColor: primaryColor, color: "#fff" } : { backgroundColor: "#f3f4f6", color: "#111827" }}>
                  {txt(pl.buttonText)}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- BANDE CTA -------------------------------- */

export function CtaBannerSectionView({ section, lang, isRtl, primaryColor, whatsappUrl }: {
  section: CtaBannerSection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string; whatsappUrl?: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="relative py-16 sm:py-20 overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {section.image ? (
        <>
          <img src={section.image} alt="" aria-hidden loading="lazy" decoding="async" width={1600} height={500}
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(11,31,58,${0.82})` }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />
      )}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-4xl font-black text-white">{txt(section.title)}</h2>
        <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl mx-auto">{txt(section.text)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={section.buttonLink || "#contact"} className="px-7 py-3.5 rounded-xl text-sm font-black shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: primaryColor, color: "#fff" }}>
            {txt(section.buttonText)}
          </a>
          {section.whatsappText && whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="px-7 py-3.5 rounded-xl text-sm font-black bg-white text-gray-900 shadow-lg transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> {txt(section.whatsappText)}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- ÉQUIPE (avatars initiales) -------------------- */

export function TeamSectionView({ section, lang, isRtl, primaryColor }: {
  section: TeamSection; lang: "fr" | "ar"; isRtl: boolean; primaryColor: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title)}</h2>
          {section.subtitle ? <p className="mt-3 text-sm sm:text-base text-gray-600">{txt(section.subtitle)}</p> : null}
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {section.image ? (
            <div className="rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <img src={section.image} alt={txt(section.title)} loading="lazy" decoding="async" width={1200} height={900}
                className="w-full aspect-[4/3] object-cover" />
            </div>
          ) : null}
          <ul className="space-y-4">
            {section.members.map((m) => (
              <li key={m.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <span className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: primaryColor }} aria-hidden>{m.initials}</span>
                <div>
                  <div className="font-black text-gray-900 text-sm">{txt(m.name)}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{txt(m.role)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------- FORMULAIRE DEVIS / RENDEZ-VOUS ---------------------- */

export function ContactFormSectionView({ section, lang, isRtl, primaryColor, tenantId, slug, themeId, whatsappPhone }: {
  section: ContactFormSection;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  tenantId?: string;
  slug?: string;
  themeId?: string;
  whatsappPhone?: string;
}) {
  const txt = (b: BilingualText) => (lang === "ar" ? b.ar : b.fr);
  const [form, setForm] = useState({ name: "", phone: "", email: "", need: "", date: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const isAppointment = section.kind === "appointment";
  const field = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent min-h-[44px]";
  const waLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(lang === "ar" ? "مرحباً، أرغب في طلب عرض سعر" : "Bonjour, je souhaite une demande de devis")}`
    : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError(lang === "ar" ? "الرجاء إدخال الاسم ورقم الهاتف" : "Merci d'indiquer votre nom et votre téléphone");
      return;
    }
    setError("");
    setSending(true);
    try {
      if (tenantId) {
        await createLead({
          tenantId, slug, themeId, kind: section.kind,
          name: form.name, phone: form.phone, email: form.email,
          need: form.need || (section.services && section.services[0] ? txt(section.services[0]) : ""),
          preferredDate: form.date, message: form.message,
        });
      }
      setDone(true);
    } catch {
      setError(lang === "ar" ? "تعذر الإرسال، حاول مرة أخرى أو تواصل معنا عبر واتساب" : "Envoi impossible, réessayez ou contactez-nous sur WhatsApp");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-12 sm:py-16 bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{txt(section.title)}</h2>
          {section.subtitle ? <p className="mt-3 text-sm sm:text-base text-gray-600">{txt(section.subtitle)}</p> : null}
        </div>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
            <h3 className="font-black text-gray-900">{txt(section.formTitle)}</h3>
            {done ? (
              <div className="mt-6 rounded-2xl p-5 text-center" style={{ backgroundColor: `${primaryColor}12` }}>
                <Check className="w-10 h-10 mx-auto" style={{ color: primaryColor }} />
                <p className="mt-3 font-bold text-gray-900">{txt(section.successText)}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 grid sm:grid-cols-2 gap-4">
                <input className={field} placeholder={txt(section.nameLabel)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required />
                <input className={field} placeholder={txt(section.phoneLabel)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel" required dir="ltr" />
                <input className={field} placeholder={txt(section.emailLabel)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} inputMode="email" autoComplete="email" dir="ltr" />
                <select className={field} value={form.need} onChange={(e) => setForm({ ...form, need: e.target.value })}>
                  <option value="">{txt(section.needLabel)}</option>
                  {(section.services || []).map((sv, i) => (
                    <option key={i} value={txt(sv)}>{txt(sv)}</option>
                  ))}
                </select>
                {isAppointment && section.dateLabel ? (
                  <input className={field} type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label={txt(section.dateLabel)} />
                ) : null}
                <textarea className={`${field} sm:col-span-2`} rows={4} placeholder={txt(section.messageLabel)} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                {error ? <p className="sm:col-span-2 text-sm font-semibold text-red-600">{error}</p> : null}
                <button type="submit" disabled={sending} className="sm:col-span-2 inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-black shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}>
                  <Send className="w-4 h-4 rtl:-scale-x-100" />{sending ? (lang === "ar" ? "جارٍ الإرسال…" : "Envoi…") : txt(section.submitText)}
                </button>
              </form>
            )}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl bg-white border border-gray-100 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                <div className="text-sm text-gray-700">{txt(section.info.address)}</div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                <div className="text-sm text-gray-700">{txt(section.info.hours)}</div>
              </div>
              {section.info.phone ? (
                <a href={`tel:${section.info.phone}`} className="flex items-start gap-3 min-h-[44px]">
                  <Phone className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-sm font-bold text-gray-800" dir="ltr">{section.info.phone}</span>
                </a>
              ) : null}
              {section.info.email ? (
                <a href={`mailto:${section.info.email}`} className="flex items-start gap-3 min-h-[44px]">
                  <Mail className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-sm font-bold text-gray-800" dir="ltr">{section.info.email}</span>
                </a>
              ) : null}
            </div>
            {section.showWhatsApp && waLink ? (
              <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-3xl px-6 py-5 text-white font-black text-sm shadow-md bg-[#25D366] hover:opacity-90 transition-opacity">
                <MessageCircle className="w-5 h-5" />
                {lang === "ar" ? "تواصل عبر واتساب" : "Discuter sur WhatsApp"}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
