import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Copy, Check, Phone, MapPin, User, Package, StickyNote, Pencil, Trash2,
  Send, Clock, CheckCircle2, Loader2, ShoppingCart, History, MessageCircle
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { copyToClipboard } from "../../lib/clipboard";
import {
  AbandonedCart, CartNote, CART_NOTE_MAX_LENGTH,
  addCartNote, updateCartNote, deleteCartNote
} from "../../lib/abandonedCartService";
import { auth, db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { WhatsAppIcon } from "./WhatsAppIcon";

/** Message WhatsApp (extension) lié au panier, pour le journal d'activité. */
interface WaMessageLite {
  id: string;
  kind: string;
  direction: string;
  status: string;
  sentAt: string;
}

interface CartDetailsModalProps {
  /** Panier VIVANT (mis à jour par les listeners de la page). */
  cart: AbandonedCart;
  focusNotes?: boolean;
  onClose: () => void;
  onConvert: (cart: AbandonedCart) => void;
  onMarkContacted: (cart: AbandonedCart) => void;
  converting: boolean;
  /** Brouillon de note conservé en mémoire tant que la page est ouverte. */
  draft: string;
  onDraftChange: (value: string) => void;
  onToast: (message?: string) => void;
}

/** Convertit Timestamp Firestore | ISO | Date en millisecondes. */
function toMs(v: unknown): number {
  try {
    if (!v) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "object") {
      const obj = v as { toMillis?: () => number; seconds?: number; _seconds?: number };
      if (typeof obj.toMillis === "function") return obj.toMillis();
      if (typeof obj.seconds === "number") return obj.seconds * 1000;
      if (typeof obj._seconds === "number") return obj._seconds * 1000;
    }
    const t = new Date(v as string).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

/** Bouton copier avec retour visuel ✓ (~1,5 s) + toast parent. */
function CopyButton({
  value, ariaLabel, onToast, className = "", iconSize = "w-3.5 h-3.5"
}: {
  value: string;
  ariaLabel: string;
  onToast: (msg?: string) => void;
  className?: string;
  iconSize?: string;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const disabled = !value;

  const handleCopy = async () => {
    if (disabled || copied) return;
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      onToast();
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      onToast(t("cartDetails.copyFailed"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-label={ariaLabel}
      title={disabled ? "" : ariaLabel}
      className={`inline-flex items-center justify-center p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        copied
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10"
      } ${className}`}
    >
      {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
    </button>
  );
}

export default function CartDetailsModal({
  cart, focusNotes = false, onClose, onConvert, onMarkContacted, converting,
  draft, onDraftChange, onToast
}: CartDetailsModalProps) {
  const { t, language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const locale = language === "ar" ? "ar-DZ" : "fr-FR";
  const modalRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  // --- Notes ---
  const notes: CartNote[] = Array.isArray(cart.notes) ? cart.notes : [];
  const [savingNote, setSavingNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  // --- Journal WhatsApp (extension) ---
  const [waMessages, setWaMessages] = useState<WaMessageLite[]>([]);
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);

  const isRecovered = cart.status === "recovered" || cart.recovered;
  const isContacted = cart.status === "contacted" || cart.status === "relanced" || (cart.relanceCount && cart.relanceCount > 0);

  // Date/heure « 1 nov. 2026, 17:05 »
  const fmtDateTime = (v: unknown): string => {
    const ms = toMs(v);
    if (!ms) return "—";
    try {
      const d = new Date(ms);
      const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
      const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
      return `${date}, ${time}`;
    } catch {
      return new Date(ms).toLocaleString();
    }
  };

  // Focus + Échap + scroll conditionnel vers les notes
  useEffect(() => {
    modalRef.current?.focus();
    if (focusNotes) {
      window.setTimeout(() => notesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusNotes, onClose]);

  // Chargement de l'historique WhatsApp du panier (si extension active)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "whatsapp_messages"), where("cartId", "==", cart.id)));
        if (!alive) return;
        const list: WaMessageLite[] = [];
        snap.forEach((d) => {
          const v = d.data() as Record<string, unknown>;
          list.push({
            id: d.id,
            kind: String(v.kind || ""),
            direction: String(v.direction || "out"),
            status: String(v.status || ""),
            sentAt: String(v.sentAt || "")
          });
        });
        list.sort((a, b) => toMs(b.sentAt) - toMs(a.sentAt));
        setWaMessages(list);
      } catch {
        if (alive) setWaMessages([]);
      }
    })();
    return () => { alive = false; };
  }, [cart.id]);

  // Adresse formatée « wilaya – commune, adresse »
  const locationValue = [cart.wilaya, cart.commune].filter(Boolean).join(" – ") + (cart.address ? `, ${cart.address}` : "");
  const phoneDigits = (cart.phone || "").replace(/\D/g, "");
  const phoneIntl = phoneDigits ? `+213${phoneDigits.replace(/^0/, "").replace(/^213/, "")}` : "";
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits.replace(/^0/, "").replace(/^213/, "")}` : "";

  // « Tout copier » : texte formaté selon la langue
  const buildCopyAll = (): string => {
    const products = (cart.items && cart.items.length > 0)
      ? cart.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")
      : cart.itemsSummary || "";
    if (language === "ar") {
      return [
        `الاسم : ${cart.client || ""}`,
        `الهاتف : ${cart.phone || ""}`,
        locationValue ? `الموقع : ${locationValue}` : "",
        products ? `المنتجات : ${products}` : "",
        `الإجمالي : ${(cart.total || 0).toLocaleString("fr-FR")} دج`
      ].filter(Boolean).join("\n");
    }
    return [
      `Nom : ${cart.client || ""}`,
      `Téléphone : ${cart.phone || ""}`,
      locationValue ? `Emplacement : ${locationValue}` : "",
      products ? `Produits : ${products}` : "",
      `Total : ${(cart.total || 0).toLocaleString("fr-FR")} DA`
    ].filter(Boolean).join("\n");
  };

  // --- Actions notes ---
  const submitNote = async () => {
    if (!draft.trim() || savingNote) return;
    setSavingNote(true);
    setNoteError(null);
    try {
      const user = auth.currentUser;
      await addCartNote(
        cart.id,
        draft,
        { id: user?.uid || "merchant", name: user?.displayName || user?.email?.split("@")[0] || "Marchand" },
        cart.tenantId
      );
      onDraftChange("");
    } catch (e) {
      setNoteError(String((e as Error)?.message || e).includes("EMPTY_NOTE") ? t("cartDetails.noteEmpty") : String((e as Error)?.message || e));
    } finally {
      setSavingNote(false);
    }
  };

  const saveEdit = async (noteId: string) => {
    if (!editText.trim()) return;
    setSavingNote(true);
    setNoteError(null);
    try {
      await updateCartNote(cart.id, noteId, editText, cart.tenantId);
      setEditingId(null);
      setEditText("");
    } catch (e) {
      setNoteError(String((e as Error)?.message || e));
    } finally {
      setSavingNote(false);
    }
  };

  const removeNote = async (noteId: string) => {
    if (!window.confirm(t("cartDetails.confirmDeleteNote"))) return;
    setDeletingId(noteId);
    setNoteError(null);
    try {
      await deleteCartNote(cart.id, noteId, cart.tenantId);
    } catch (e) {
      setNoteError(String((e as Error)?.message || e));
    } finally {
      setDeletingId(null);
    }
  };

  // --- Journal d'activité (plus récent en haut) ---
  const journal = useMemo(() => {
    type Entry = { key: string; at: number; label: string; tone: string };
    const entries: Entry[] = [];
    const push = (key: string, at: number, label: string, tone: string) => {
      if (at > 0) entries.push({ key, at, label, tone });
    };

    push("created", toMs(cart.createdAt) || toMs(cart.date), t("cartDetails.jCreated"), "bg-amber-400");
    const createdMs = toMs(cart.createdAt) || toMs(cart.date);
    const updatedMs = toMs(cart.updatedAt);
    if (updatedMs > createdMs + 60000) push("updated", updatedMs, t("cartDetails.jUpdated"), "bg-neutral-500");

    const contactedMs = toMs(cart.contactedAt) || toMs(cart.lastRelancedAt);
    if (contactedMs) {
      push("contacted", contactedMs, t("cartDetails.jContacted") + (cart.relanceCount && cart.relanceCount > 1 ? ` (${cart.relanceCount}×)` : ""), "bg-blue-400");
    }

    const waStatusSuffix: Record<string, string> = {
      read: ` · ${language === "ar" ? "مقروء" : "lu"}`,
      replied: ` · ${language === "ar" ? "مُجاب" : "répondu"}`,
      delivered: ` · ${language === "ar" ? "تم التوصيل" : "livré"}`,
      failed: ` · ${language === "ar" ? "فشل" : "échec"}`
    };
    for (const m of waMessages) {
      const at = toMs(m.sentAt);
      if (!at) continue;
      if (m.direction === "in") {
        push(`wa_${m.id}`, at, t("cartDetails.jWaAnswered"), "bg-emerald-400");
      } else if (m.kind === "cart_reminder") {
        push(`wa_${m.id}`, at, t("cartDetails.jWaReminder"), "bg-[#25D366]");
      } else {
        push(`wa_${m.id}`, at, t("cartDetails.jWaSent") + (waStatusSuffix[m.status] || ""), "bg-[#25D366]");
      }
    }

    for (const n of notes) {
      push(`note_add_${n.id}`, toMs(n.createdAt), `${t("cartDetails.jNoteAdded")}${n.authorName ? ` — ${n.authorName}` : ""}`, "bg-yellow-400");
      if (toMs(n.updatedAt) > toMs(n.createdAt) + 1000) {
        push(`note_mod_${n.id}`, toMs(n.updatedAt), t("cartDetails.jNoteModified"), "bg-yellow-600");
      }
    }

    const recoveredMs = toMs(cart.recoveredAt);
    if (isRecovered) {
      push("converted", recoveredMs || updatedMs, t("cartDetails.jConverted") + (cart.orderId ? ` (${cart.orderId})` : ""), "bg-emerald-500");
    }

    entries.sort((a, b) => b.at - a.at);
    return entries;
  }, [cart, notes, waMessages, t, language, isRecovered]);

  const shipping = Number(cart.shipping) || 0;
  const subtotal = Number(cart.subtotal) || (shipping > 0 ? Math.max(0, (cart.total || 0) - shipping) : (cart.total || 0));

  const cardClass = "p-4 rounded-xl bg-[#16161a] border border-neutral-800";
  const cardTitle = "flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wide mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("cartDetails.title")}
        tabIndex={-1}
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-[#1e1e24] shadow-2xl p-5 sm:p-6 text-white outline-none"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{t("cartDetails.title")}</h3>
              <p className="text-xs text-neutral-400 font-mono truncate" dir="ltr">{cart.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("cartDetails.close")}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : 2 colonnes (1 sur mobile) */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* ============ Colonne 1 ============ */}
          <div className="space-y-4">
            {/* A. Informations client */}
            <section className={cardClass} aria-label={t("cartDetails.clientInfo")}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className={cardTitle + " mb-0"}><User className="w-4 h-4 text-amber-400" />{t("cartDetails.clientInfo")}</h4>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(buildCopyAll());
                    onToast(ok ? undefined : t("cartDetails.copyFailed"));
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t("cartDetails.copyAll")}</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Nom */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="text-neutral-400 shrink-0">{t("cartDetails.name")}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-bold text-white truncate" dir="auto" title={cart.client || ""}>{cart.client || "—"}</span>
                    <CopyButton value={cart.client || ""} ariaLabel={t("cartDetails.copyName")} onToast={onToast} />
                  </div>
                </div>

                {/* Téléphone + menu copier */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="text-neutral-400 shrink-0">{t("cartDetails.phone")}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0 relative">
                    <a
                      href={`tel:${cart.phone || ""}`}
                      className="font-mono font-bold text-amber-400 hover:underline truncate"
                      dir="ltr"
                    >
                      {cart.phone || "—"}
                    </a>
                    {cart.phone ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setPhoneMenuOpen((v) => !v)}
                          aria-label={t("cartDetails.copyPhone")}
                          aria-expanded={phoneMenuOpen}
                          title={t("cartDetails.copyPhone")}
                          className="inline-flex items-center justify-center p-1 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {phoneMenuOpen && (
                          <>
                            <button
                              type="button"
                              aria-label="fermer menu"
                              tabIndex={-1}
                              onClick={() => setPhoneMenuOpen(false)}
                              className="fixed inset-0 z-[60] cursor-default"
                            />
                            <div className="absolute z-[61] top-full mt-1 end-0 w-44 rounded-xl border border-neutral-700 bg-[#1e1e24] shadow-xl overflow-hidden" role="menu">
                              <button
                                type="button"
                                role="menuitem"
                                onClick={async () => {
                                  setPhoneMenuOpen(false);
                                  const ok = await copyToClipboard(cart.phone || "");
                                  onToast(ok ? undefined : t("cartDetails.copyFailed"));
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 cursor-pointer text-start"
                              >
                                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                <span dir="ltr">{t("cartDetails.copyPhoneRaw")}</span>
                              </button>
                              {phoneIntl && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={async () => {
                                    setPhoneMenuOpen(false);
                                    const ok = await copyToClipboard(phoneIntl);
                                    onToast(ok ? undefined : t("cartDetails.copyFailed"));
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 cursor-pointer text-start"
                                >
                                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                                  <span dir="ltr">{t("cartDetails.copyPhoneIntl")} ({phoneIntl})</span>
                                </button>
                              )}
                              {waLink && (
                                <a
                                  role="menuitem"
                                  href={waLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setPhoneMenuOpen(false)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[#25D366] hover:bg-neutral-800 cursor-pointer text-start"
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5" />
                                  <span>{t("cartDetails.openWhatsApp")}</span>
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Emplacement */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-400 shrink-0">{t("cartDetails.location")}</span>
                  </div>
                  <div className="flex items-start gap-1 min-w-0 text-end">
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate" dir="auto" title={locationValue}>
                        {[cart.wilaya, cart.commune].filter(Boolean).join(" – ") || "—"}
                      </span>
                      {cart.address && (
                        <span className="text-neutral-400 block truncate" dir="auto" title={cart.address}>{cart.address}</span>
                      )}
                    </div>
                    <CopyButton value={locationValue} ariaLabel={t("cartDetails.copyLocation")} onToast={onToast} className="mt-0.5" />
                  </div>
                </div>
              </div>
            </section>

            {/* B. Contenu du panier */}
            <section className={cardClass} aria-label={t("cartDetails.cartContent")}>
              <h4 className={cardTitle}><Package className="w-4 h-4 text-amber-400" />{t("cartDetails.cartContent")}</h4>
              <div className="space-y-2">
                {cart.items && cart.items.length > 0 ? (
                  cart.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 py-2 border-b border-neutral-800 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-neutral-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate" dir="auto">{item.name}</p>
                          {item.variants && Object.keys(item.variants).length > 0 && (
                            <p className="text-[10px] text-neutral-400 truncate" dir="auto">
                              {Object.entries(item.variants).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </p>
                          )}
                          <p className="text-[10px] text-neutral-500 font-mono" dir="ltr">
                            {(item.price || 0).toLocaleString("fr-FR")} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-neutral-200 text-xs shrink-0" dir="ltr">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString("fr-FR")} DZD
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-300" dir="auto">{cart.itemsSummary || "—"}</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800 space-y-1 text-xs">
                {shipping > 0 && (
                  <div className="flex justify-between text-neutral-400">
                    <span>{t("cartDetails.subtotal")}</span>
                    <span dir="ltr">{subtotal.toLocaleString("fr-FR")} DZD</span>
                  </div>
                )}
                {shipping > 0 && (
                  <div className="flex justify-between text-neutral-400">
                    <span>{t("cartDetails.shipping")}</span>
                    <span dir="ltr">{shipping.toLocaleString("fr-FR")} DZD</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-neutral-300">{t("cartDetails.total")}</span>
                  <span className="text-base font-black text-emerald-400" dir="ltr">
                    {(cart.total || 0).toLocaleString("fr-FR")} DZD
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ============ Colonne 2 ============ */}
          <div className="space-y-4">
            {/* C. Journal d'activité */}
            <section className={cardClass} aria-label={t("cartDetails.journal")}>
              <h4 className={cardTitle}><History className="w-4 h-4 text-amber-400" />{t("cartDetails.journal")}</h4>
              {journal.length === 0 ? (
                <p className="text-xs text-neutral-400">{t("cartDetails.journalEmpty")}</p>
              ) : (
                <ol className="relative border-s border-neutral-700 ms-2.5 ps-4 space-y-3.5 max-h-64 overflow-y-auto pe-1">
                  {journal.map((entry) => (
                    <li key={entry.key} className="relative">
                      <span className={`absolute -start-[21px] top-1 w-2.5 h-2.5 rounded-full ${entry.tone} ring-4 ring-[#16161a]`} />
                      <p className="text-xs text-neutral-200 leading-snug" dir="auto">{entry.label}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5" dir="ltr">{fmtDateTime(entry.at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* D. Notes */}
            <section ref={notesRef} className={cardClass} aria-label={t("cartDetails.notes")}>
              <h4 className={cardTitle}>
                <StickyNote className="w-4 h-4 text-amber-400" />
                {t("cartDetails.notes")}
                {notes.length > 0 && (
                  <span className="ms-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 text-[10px] font-bold">
                    {notes.length}
                  </span>
                )}
              </h4>

              {/* Saisie */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={draft}
                  maxLength={CART_NOTE_MAX_LENGTH}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      submitNote();
                    }
                  }}
                  placeholder={t("cartDetails.writeNote")}
                  aria-label={t("cartDetails.writeNote")}
                  className="w-full rounded-xl border border-neutral-700 bg-[#111114] p-3 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-y"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-500">{t("cartDetails.ctrlEnter")}</span>
                  <button
                    type="button"
                    onClick={submitNote}
                    disabled={!draft.trim() || savingNote}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StickyNote className="w-3.5 h-3.5" />}
                    <span>{t("cartDetails.addNote")}</span>
                  </button>
                </div>
                {noteError && <p className="text-[11px] text-red-400">{noteError}</p>}
              </div>

              {/* Liste (récentes en haut) */}
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pe-1">
                {notes.length === 0 && (
                  <p className="text-[11px] text-neutral-500 text-center py-2">{t("cartDetails.noNotes")}</p>
                )}
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-neutral-800 bg-[#111114] p-3">
                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editText}
                          maxLength={CART_NOTE_MAX_LENGTH}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                              e.preventDefault();
                              saveEdit(note.id);
                            }
                          }}
                          aria-label={t("cartDetails.edit")}
                          className="w-full rounded-lg border border-neutral-700 bg-[#16161a] p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-y"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); setEditText(""); }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-neutral-400 hover:text-white cursor-pointer"
                          >
                            {t("cartDetails.cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(note.id)}
                            disabled={!editText.trim() || savingNote}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            {t("cartDetails.save")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-neutral-100 whitespace-pre-wrap leading-relaxed break-words" dir="auto">{note.text}</p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-[10px] text-neutral-500 truncate" dir="auto">
                            {t("cartDetails.noteBy").replace("{author}", note.authorName || "—")} • <span dir="ltr">{fmtDateTime(note.createdAt)}</span>
                            {toMs(note.updatedAt) > toMs(note.createdAt) + 1000 && (
                              <span className="text-yellow-500/80 ms-1">· {t("cartDetails.edited")}</span>
                            )}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                              aria-label={t("cartDetails.edit")}
                              title={t("cartDetails.edit")}
                              className="p-1.5 text-neutral-500 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeNote(note.id)}
                              disabled={deletingId === note.id}
                              aria-label={t("cartDetails.delete")}
                              title={t("cartDetails.delete")}
                              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {deletingId === note.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Pied : Fermer | Convertir | Contacté */}
        <div className="pt-4 border-t border-neutral-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {t("cartDetails.close")}
          </button>

          {isRecovered ? (
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
              {t("cartDetails.recoveredDone")}
            </span>
          ) : (
            <button
              onClick={() => onConvert(cart)}
              disabled={converting}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t("cartDetails.convert")}
            </button>
          )}

          {isContacted || isRecovered ? (
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <MessageCircle className="w-4 h-4" />
              {t("cartDetails.contactedDone")}
            </span>
          ) : (
            <button
              onClick={() => onMarkContacted(cart)}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              {t("cartDetails.markContacted")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
