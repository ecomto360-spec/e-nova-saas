/**
 * T1 — Page de commande du panier (modale plein écran).
 * Formulaire : nom, téléphone, email (optionnel), wilaya, commune, adresse,
 * notes ; méthode de livraison selon la wilaya (domicile / bureau) ;
 * récapitulatif complet ; bouton de confirmation. Réutilise la validation
 * téléphone et la liste des wilayas existantes. RTL/LTR, accessible.
 */

import React, { useMemo, useState } from "react";
import { X, Loader2, CheckCircle2, Truck, Building2, ShoppingBag } from "lucide-react";
import type { StoreCartItem } from "../../../lib/storefrontCart";
import { formatPrice } from "../../../lib/storefrontCart";
import { t } from "./sectionTypes";

export interface CartCheckoutTexts {
  pageTitle: string;
  personalInfo: string;
  address: string;
  deliveryMethod: string;
  summary: string;
  confirmButton: string;
  paymentMode: string;
  successMessage: string;
}

interface CartCheckoutModalProps {
  open: boolean;
  items: StoreCartItem[];
  subtotalDA: number;
  lang: "fr" | "ar";
  isRtl: boolean;
  primaryColor: string;
  priceFormat: "plain" | "comma" | "space";
  texts: CartCheckoutTexts;
  hideEmail: boolean;
  hideAddress: boolean;
  hideNotes: boolean;
  addressRequired: boolean;
  layout: "twoColumns" | "oneColumn";
  wilayas: Array<{ code: number; arName: string; name: string; homePrice?: number; officePrice?: number }>;
  communesForWilaya: (code: number) => string[];
  onValidatePhone: (phone: string) => { isValid: boolean; error?: string; errorAr?: string };
  onClose: () => void;
  onSubmit: (form: {
    name: string;
    phone: string;
    email: string;
    wilayaCode: number;
    commune: string;
    address: string;
    notes: string;
    deliveryType: "home" | "office";
    deliveryPrice: number;
  }) => Promise<boolean>;
}

export function CartCheckoutModal({
  open,
  items,
  subtotalDA,
  lang,
  isRtl,
  primaryColor,
  priceFormat,
  texts,
  hideEmail,
  hideAddress,
  hideNotes,
  addressRequired,
  layout,
  wilayas,
  communesForWilaya,
  onValidatePhone,
  onClose,
  onSubmit,
}: CartCheckoutModalProps): React.ReactElement | null {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [wilayaCode, setWilayaCode] = useState<number | "">("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "office">("home");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const communes = useMemo(() => (wilayaCode === "" ? [] : communesForWilaya(Number(wilayaCode))), [wilayaCode, communesForWilaya]);
  const wilaya = useMemo(() => (wilayaCode === "" ? null : wilayas.find((w) => w.code === Number(wilayaCode)) || null), [wilayaCode, wilayas]);
  const deliveryPrice = wilaya ? (deliveryType === "home" ? wilaya.homePrice ?? 600 : wilaya.officePrice ?? 400) : 0;
  const total = subtotalDA + deliveryPrice;

  // Panier vide SANS succès : rien à afficher. Avec succès : rester ouvert
  // (le panier est vidé par le parent juste après l'enregistrement).
  if (!open || (items.length === 0 && !success)) return null;

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors placeholder:text-gray-400";

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (submitting || success) return;
    if (!name.trim() || !phone.trim() || wilayaCode === "" || !commune.trim()) return;
    if (addressRequired && !address.trim()) return;
    const v = onValidatePhone(phone);
    if (!v.isValid) {
      setPhoneError(v.errorAr || v.error || "—");
      return;
    }
    setPhoneError("");
    setSubmitting(true);
    const ok = await onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      wilayaCode: Number(wilayaCode),
      commune: commune.trim(),
      address: address.trim(),
      notes: notes.trim(),
      deliveryType,
      deliveryPrice,
    });
    setSubmitting(false);
    if (ok) setSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-label={texts.pageTitle}>
      <div dir={isRtl ? "rtl" : "ltr"} className="min-h-full flex items-start sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:max-w-4xl rounded-none sm:rounded-3xl shadow-2xl overflow-hidden my-0 sm:my-8">
          {/* En-tête */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" aria-hidden />
              {texts.pageTitle}
            </h2>
            <button type="button" onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer" aria-label={t(lang, "Fermer", "إغلاق")}>
              <X className="w-5 h-5" aria-hidden />
            </button>
          </div>

          {success ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" aria-hidden />
              <h3 className="text-xl font-black text-gray-900 mb-2">{texts.successMessage}</h3>
              <p className="text-sm text-gray-500">
                {t(lang, "Nous vous appellerons pour confirmer la livraison.", "سنتصل بك لتأكيد التوصيل.")}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                {t(lang, "Retour à la boutique", "العودة إلى المتجر")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className={`grid gap-0 ${layout === "twoColumns" ? "lg:grid-cols-[1fr_380px]" : ""}`}>
              {/* Colonne formulaire */}
              <div className="p-6 space-y-6">
                <fieldset>
                  <legend className="text-sm font-black uppercase tracking-wide text-gray-400 mb-3">{texts.personalInfo}</legend>
                  <div className="space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder={t(lang, "Nom complet *", "الاسم الكامل *")} className={inputCls} aria-label={t(lang, "Nom complet", "الاسم الكامل")} />
                    <div>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" dir="ltr" placeholder={t(lang, "Téléphone *", "الهاتف *")} className={`${inputCls} ${phoneError ? "border-red-400" : ""}`} aria-label={t(lang, "Téléphone", "الهاتف")} />
                      {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
                    </div>
                    {!hideEmail && (
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" placeholder={t(lang, "Email (optionnel)", "البريد الإلكتروني (اختياري)")} className={inputCls} aria-label={t(lang, "Email", "البريد الإلكتروني")} />
                    )}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-black uppercase tracking-wide text-gray-400 mb-3">{texts.address}</legend>
                  <div className="space-y-3">
                    <select
                      value={wilayaCode}
                      onChange={(e) => {
                        setWilayaCode(e.target.value === "" ? "" : Number(e.target.value));
                        setCommune("");
                      }}
                      required
                      className={inputCls}
                      aria-label={t(lang, "Wilaya", "الولاية")}
                    >
                      <option value="">{t(lang, "Choisir la wilaya *", "اختر الولاية *")}</option>
                      {wilayas.map((w) => (
                        <option key={w.code} value={w.code}>
                          {String(w.code).padStart(2, "0")} — {lang === "ar" ? w.arName : w.name}
                        </option>
                      ))}
                    </select>
                    <select value={commune} onChange={(e) => setCommune(e.target.value)} required disabled={communes.length === 0} className={`${inputCls} disabled:opacity-50`} aria-label={t(lang, "Commune", "البلدية")}>
                      <option value="">{t(lang, "Choisir la commune *", "اختر البلدية *")}</option>
                      {communes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {!hideAddress && (
                      <input value={address} onChange={(e) => setAddress(e.target.value)} required={addressRequired} placeholder={t(lang, "Adresse précise", "العنوان بالتفصيل")} className={inputCls} aria-label={t(lang, "Adresse", "العنوان")} />
                    )}
                    {!hideNotes && (
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} placeholder={t(lang, "Notes (optionnel)", "ملاحظات (اختياري)")} className={inputCls} aria-label={t(lang, "Notes", "ملاحظات")} />
                    )}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-black uppercase tracking-wide text-gray-400 mb-3">{texts.deliveryMethod}</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("home")}
                      aria-pressed={deliveryType === "home"}
                      className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${deliveryType === "home" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Truck className={`w-5 h-5 mb-2 ${deliveryType === "home" ? "text-gray-900" : "text-gray-400"}`} aria-hidden />
                      <span className="block text-sm font-bold text-gray-900">{t(lang, "À domicile", "التوصيل إلى المنزل")}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{formatPrice(wilaya?.homePrice ?? 600, priceFormat, lang)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("office")}
                      aria-pressed={deliveryType === "office"}
                      className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${deliveryType === "office" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Building2 className={`w-5 h-5 mb-2 ${deliveryType === "office" ? "text-gray-900" : "text-gray-400"}`} aria-hidden />
                      <span className="block text-sm font-bold text-gray-900">{t(lang, "Bureau de livraison", "مكتب التوصيل")}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{formatPrice(wilaya?.officePrice ?? 400, priceFormat, lang)}</span>
                    </button>
                  </div>
                </fieldset>
              </div>

              {/* Colonne récapitulatif */}
              <aside className="bg-gray-50 border-t lg:border-t-0 lg:border-s border-gray-100 p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-400">{texts.summary}</h3>
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li key={it.productId + "|" + it.variantLabel} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                        {it.image ? <img src={it.image} alt={it.name} width={48} height={48} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{it.name}</p>
                        <p className="text-xs text-gray-500">
                          {it.qty} × {formatPrice(it.price, priceFormat, lang)}
                          {it.variantLabel ? ` · ${it.variantLabel}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-black text-gray-900 whitespace-nowrap">{formatPrice(it.price * it.qty, priceFormat, lang)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t(lang, "Sous-total", "المجموع الفرعي")}</span>
                    <span className="font-bold">{formatPrice(subtotalDA, priceFormat, lang)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t(lang, "Livraison", "التوصيل")}</span>
                    <span className="font-bold">{formatPrice(deliveryPrice, priceFormat, lang)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                    <span>{t(lang, "Total", "المجموع الكلي")}</span>
                    <span style={{ color: primaryColor }}>{formatPrice(total, priceFormat, lang)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden />
                  {texts.paymentMode}
                </div>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="w-full py-4 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                  {texts.confirmButton}
                </button>
              </aside>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
