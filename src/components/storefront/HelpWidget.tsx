/**
 * T1 — Widget d'aide flottant (référence).
 * Bouton flottant + panneau : canaux (WhatsApp/Telegram/téléphone), questions
 * fréquentes, textes libres, message de bienvenue (délai + fréquence).
 * Position gauche/droite, RTL/LTR, aucune donnée session-dépendante.
 */

import React, { useEffect, useRef, useState } from "react";
import { X, MessageCircle, Send, Phone, ChevronDown, HelpCircle, MessageSquare } from "lucide-react";
import type { BilingualText } from "../../types/storefront";
import type { StoreHelpWidgetSettings } from "../../types/storefrontSections";
import { formatPrice } from "../../lib/storefrontCart";

const txt = (b: BilingualText | null | undefined, lang: "fr" | "ar"): string => (b ? (lang === "ar" ? b.ar : b.fr) : "");

function sessionKey(id: string): string {
  return `help_welcome_${id}`;
}

function shouldShowWelcome(w: StoreHelpWidgetSettings): boolean {
  try {
    if (w.welcome.frequency === "always") return true;
    const key = sessionKey(String(w.title.fr || "default"));
    if (w.welcome.frequency === "oncePerSession") {
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
      return true;
    }
    // oncePerDay
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(key);
    if (last === today) return false;
    localStorage.setItem(key, today);
    return true;
  } catch {
    return true;
  }
}

export function HelpWidget({
  settings,
  lang,
  isRtl,
  storeSlug,
  productName,
  productPrice,
  whatsappNumber,
}: {
  settings: StoreHelpWidgetSettings;
  lang: "fr" | "ar";
  isRtl: boolean;
  storeSlug: string;
  productName?: string;
  productPrice?: number;
  /** Numéro WhatsApp de secours (réglages boutique) si aucun canal configuré. */
  whatsappNumber?: string;
}): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!settings.enabled || !settings.welcome.text.fr) return;
    if (!shouldShowWelcome(settings)) return;
    const t1 = window.setTimeout(() => setBubble(true), Math.max(0, settings.welcome.delaySeconds) * 1000);
    const t2 = window.setTimeout(() => setBubble(false), Math.max(0, settings.welcome.delaySeconds) * 1000 + 7000);
    timers.current = [t1, t2];
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, [settings]);

  if (!settings.enabled) return null;

  const channels = settings.channels.length > 0
    ? settings.channels
    : whatsappNumber
      ? [{ id: "wa", type: "whatsapp" as const, label: { fr: "WhatsApp", ar: "واتساب" }, value: whatsappNumber }]
      : [];

  const waLink = (value: string): string => {
    const num = value.replace(/[^0-9]/g, "");
    const productLine = settings.includeProductNameInWaMessage && productName
      ? `${productName}${productPrice ? ` (${formatPrice(productPrice, "space", lang)})` : ""} — `
      : "";
    const msg = encodeURIComponent(
      lang === "ar"
        ? `مرحباً، أريد معلومات عن: ${productLine || "منتجاتكم"}`
        : `Bonjour, je souhaite des informations sur : ${productLine || "vos produits"}`
    );
    return `https://wa.me/${num}?text=${msg}`;
  };

  const side = settings.position === "left" ? "start" : "end";
  const icon =
    settings.buttonIcon === "help" ? <HelpCircle className="w-6 h-6" aria-hidden />
    : settings.buttonIcon === "chat" ? <MessageSquare className="w-6 h-6" aria-hidden />
    : <MessageCircle className="w-6 h-6" aria-hidden />;

  return (
    <>
      {/* Bulle de bienvenue */}
      {bubble && !open && (
        <div
          className={`fixed bottom-24 ${side === "end" ? "end-5" : "start-5"} z-[70] max-w-[260px] bg-white shadow-2xl rounded-2xl rounded-be-none p-4 border border-gray-100 animate-[fadeIn_0.3s_ease-out]`}
          dir={isRtl ? "rtl" : "ltr"}
          role="status"
        >
          <p className="text-sm text-gray-700 leading-relaxed">{txt(settings.welcome.text, lang)}</p>
          <button
            type="button"
            onClick={() => setBubble(false)}
            className="absolute top-2 end-2 p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
            aria-label={lang === "ar" ? "إغلاق" : "Fermer"}
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-5 ${side === "end" ? "end-5" : "start-5"} z-[70] w-14 h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center`}
        style={{ backgroundColor: settings.buttonColor }}
        aria-label={txt(settings.title, lang)}
        aria-expanded={open}
      >
        {open ? <X className="w-6 h-6" aria-hidden /> : icon}
      </button>

      {/* Panneau */}
      {open && (
        <div
          className={`fixed bottom-24 ${side === "end" ? "end-5" : "start-5"} z-[70] w-[min(22rem,calc(100vw-2.5rem))] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden`}
          dir={isRtl ? "rtl" : "ltr"}
          role="dialog"
          aria-label={txt(settings.title, lang)}
        >
          <div className="p-5 text-white" style={{ backgroundColor: settings.buttonColor }}>
            <h3 className="font-black text-lg">{txt(settings.title, lang)}</h3>
            <p className="text-sm text-white/85 mt-0.5">{txt(settings.subtitle, lang)}</p>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Canaux */}
            {channels.length > 0 && (
              <div className="space-y-2">
                {channels.map((c) => (
                  <a
                    key={c.id}
                    href={c.type === "whatsapp" ? waLink(c.value) : c.type === "phone" ? `tel:${c.value}` : `https://t.me/${c.value.replace(/^@/, "")}`}
                    target={c.type === "whatsapp" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors text-start"
                  >
                    <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                      {c.type === "whatsapp" ? <MessageCircle className="w-5 h-5" aria-hidden /> : c.type === "phone" ? <Phone className="w-5 h-5" aria-hidden /> : <Send className="w-5 h-5" aria-hidden />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-900 truncate">{txt(c.label, lang)}</span>
                      <span className="block text-xs text-gray-500 truncate" dir="ltr">{c.value}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}

            {/* FAQ */}
            {settings.faqs.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-2">
                  {lang === "ar" ? "أسئلة شائعة" : "Questions fréquentes"}
                </h4>
                <FaqMini items={settings.faqs} lang={lang} />
              </div>
            )}

            {/* Textes libres */}
            {settings.freeTexts.filter((ft) => txt(ft, lang)).length > 0 && (
              <div className="space-y-2">
                {settings.freeTexts.filter((ft) => txt(ft, lang)).slice(0, 6).map((ft, i) => (
                  <p key={i} className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{txt(ft, lang)}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FaqMini({
  items,
  lang,
}: {
  items: StoreHelpWidgetSettings["faqs"];
  lang: "fr" | "ar";
}): React.ReactElement {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-1.5">
      {items.slice(0, 30).map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : f.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-start hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-sm font-semibold text-gray-800">{txt(f.question, lang)}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {isOpen && <p className="px-3 pb-3 text-sm text-gray-600 leading-relaxed">{txt(f.answer, lang)}</p>}
          </div>
        );
      })}
    </div>
  );
}
