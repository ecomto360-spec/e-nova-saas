import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { dbPublic } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  CheckCircle2, Pencil, XCircle, Loader2, ShieldCheck, Package,
  MapPin, Truck, MessageCircle, AlertTriangle, PartyPopper
} from "lucide-react";

/**
 * Page publique de conversion WhatsApp d'un panier abandonné (/wa/:cartId?t=token).
 * Le client y arrive depuis le lien du message WhatsApp et peut :
 *   ✅ Confirmer sa commande (création d'une commande réelle, vérifiée serveur)
 *   ✏️ Modifier / Appeler (le vendeur est notifié, panier « Contacté »)
 *   ❌ Refuser (panier « Refusé », plus aucun envoi)
 * Vérification avant création : produit actif, stock, prix/frais actuels —
 * si le total a changé, le client voit le nouveau montant avant de confirmer.
 */
interface WaCartDoc {
  client?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  items?: Array<{ name?: string; quantity?: number; price?: number; image?: string; variants?: Record<string, string> }>;
  itemsSummary?: string;
  total?: number;
  shipping?: number;
  lang?: string;
  status?: string;
  waToken?: string;
  orderId?: string;
  storeName?: string;
}

type Phase = "loading" | "ready" | "confirming" | "price_changed" | "done" | "closed" | "error";

export default function WaCartAction() {
  const { cartId } = useParams<{ cartId: string }>();
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [cart, setCart] = useState<WaCartDoc | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<{ orderId?: string; currentTotal?: number; currentPrice?: number; currentShipping?: number; message?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cartId) return;
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(dbPublic, "abandoned_carts", cartId));
        if (!mounted) return;
        if (!snap.exists()) { setPhase("error"); return; }
        const data = snap.data() as WaCartDoc;
        setCart(data);
        if (String(data.waToken || "") !== token) { setPhase("error"); return; }
        if (data.status === "recovered" && data.orderId) { setPhase("closed"); setResult({ orderId: data.orderId }); return; }
        if (data.status === "refused") { setPhase("closed"); return; }
        setPhase("ready");
      } catch {
        if (mounted) setPhase("error");
      }
    })();
    return () => { mounted = false; };
  }, [cartId, token]);

  const lang = cart?.lang === "fr" ? "fr" : "ar";
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const callAction = async (action: "confirm" | "modify" | "decline", acceptNewPrice = false) => {
    if (!cartId) return;
    setBusy(true);
    try {
      const r = await fetch("/api/whatsapp/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, token, action, acceptNewPrice })
      });
      const j = await r.json().catch(() => ({ ok: false }) as Record<string, unknown>);
      if (action !== "confirm") {
        setPhase("closed");
        return;
      }
      if (j.ok === true) {
        setResult({ orderId: String(j.orderId || ""), currentTotal: Number(j.currentTotal) || undefined });
        setPhase("done");
      } else if (j.reason === "price_changed") {
        setResult({
          currentTotal: Number(j.currentTotal) || 0,
          currentPrice: Number(j.currentPrice) || 0,
          currentShipping: Number(j.currentShipping) || 0
        });
        setPhase("price_changed");
      } else if (j.reason === "already") {
        setResult({ orderId: String(j.orderId || "") });
        setPhase("closed");
      } else {
        setResult({ message: String(j.reason || j.error || "error") });
        setPhase("error");
      }
    } catch {
      setResult({ message: "network" });
      setPhase("error");
    } finally {
      setBusy(false);
    }
  };

  const t = {
    title: isAr ? "طلبك في انتظار التأكيد" : "Votre commande en attente de confirmation",
    hello: isAr ? `مرحباً ${cart?.client || ""}` : `Bonjour ${cart?.client || ""}`,
    started: isAr ? "لقد بدأت هذا الطلب في متجرنا :" : "Vous avez commencé cette commande dans notre boutique :",
    delivery: isAr ? "التوصيل" : "Livraison",
    home: isAr ? "إلى المنزل" : "À domicile",
    desk: isAr ? "مكتب التوصيل (Stop Desk)" : "Bureau de livraison (Stop Desk)",
    fees: isAr ? "رسوم التوصيل" : "Frais de livraison",
    total: isAr ? "الإجمالي للدفع عند الاستلام" : "Total à payer à la livraison",
    confirm: isAr ? "✅ تأكيد طلبي" : "✅ Confirmer ma commande",
    modify: isAr ? "✏️ تعديل / اتصال" : "✏️ Modifier / Appeler",
    decline: isAr ? "❌ لا شكراً" : "❌ Non merci",
    confirmMsg: isAr ? "سيتم إنشاء طلبك رسمياً وتأكيده فوراً." : "Votre commande sera créée et confirmée immédiatement.",
    modifyMsg: isAr ? "سنتصل بك قريباً لإكمال طلبك. يمكنك أيضاً الاتصال بنا مباشرة." : "Nous vous rappellerons pour finaliser votre commande. Vous pouvez aussi nous appeler directement.",
    declinedMsg: isAr ? "تم رفض الطلب. لن نرسل لك تذكيرات أخرى. شكراً لك." : "Commande refusée. Vous ne recevrez plus de relances. Merci.",
    doneTitle: isAr ? "🎉 تم تأكيد طلبك بنجاح!" : "🎉 Votre commande est confirmée !",
    doneMsg: isAr ? "سنتواصل معك لتأكيد التوصيل. شكراً لثقتك!" : "Nous vous contacterons pour la livraison. Merci de votre confiance !",
    track: isAr ? "تتبع طلبك" : "Suivre ma commande",
    priceChanged: isAr ? "⚠️ لقد تغير السعر منذ زيارتك" : "⚠️ Le prix a changé depuis votre visite",
    newTotal: isAr ? "المبلغ الجديد" : "Nouveau montant",
    acceptNew: isAr ? "أؤكد بالمبلغ الجديد" : "Je confirme avec le nouveau montant",
    closed: isAr ? "تمت معالجة هذا الطلب مسبقاً." : "Cette demande a déjà été traitée.",
    invalid: isAr ? "رابط غير صالح أو منتهي الصلاحية." : "Lien invalide ou expiré.",
    unavailable: isAr ? "عذراً، هذا المنتج لم يعد متوفراً." : "Désolé, ce produit n'est plus disponible.",
    oos: isAr ? "عذراً، نفدت الكمية من هذا المنتج." : "Désolé, ce produit est en rupture de stock."
  };

  const firstItem = cart?.items?.[0];
  const itemsTotal = cart?.total ?? 0;

  const card = (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full">
      {/* En-tête */}
      <div className="bg-[#1c192b] text-white px-6 py-5 text-center">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#25D366]" />
        <h1 className="text-lg font-black">{t.title}</h1>
      </div>

      <div className="p-6 space-y-4" dir={dir}>
        <p className="text-sm text-gray-700 font-bold">{t.hello}</p>
        <p className="text-xs text-gray-500">{t.started}</p>

        {/* Produit */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
          {firstItem?.image ? (
            <img src={firstItem.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ) : (
            <span className="w-14 h-14 rounded-xl bg-[#1c192b]/10 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-[#1c192b]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">{firstItem?.name || cart?.itemsSummary || "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">x{firstItem?.quantity || 1}</p>
          </div>
        </div>

        {/* Destination + frais */}
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{cart?.wilaya} {cart?.commune ? `— ${cart.commune}` : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{t.delivery} : {(Number(cart?.shipping) || 0).toLocaleString("fr-FR")} DA</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-[#1c192b] text-white rounded-2xl px-4 py-3">
          <span className="text-xs font-bold">{t.total}</span>
          <span className="text-lg font-black">{itemsTotal.toLocaleString("fr-FR")} DA</span>
        </div>

        {/* Boutons */}
        {phase === "ready" && (
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => callAction("confirm")}
              disabled={busy}
              className="w-full h-13 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {t.confirm}
            </button>
            <p className="text-[10px] text-center text-gray-400">{t.confirmMsg}</p>
            <button
              onClick={() => callAction("modify")}
              disabled={busy}
              className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <Pencil className="w-4 h-4" />
              {t.modify}
            </button>
            <button
              onClick={() => callAction("decline")}
              disabled={busy}
              className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              {t.decline}
            </button>
          </div>
        )}

        {phase === "price_changed" && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">{t.priceChanged}</p>
                <p className="mt-1">{t.newTotal} : <strong>{(result.currentTotal || 0).toLocaleString("fr-FR")} DA</strong></p>
              </div>
            </div>
            <button
              onClick={() => callAction("confirm", true)}
              disabled={busy}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {t.acceptNew}
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="text-center py-4 space-y-3">
            <PartyPopper className="w-12 h-12 mx-auto text-emerald-500" />
            <p className="text-sm font-black text-gray-900">{t.doneTitle}</p>
            <p className="text-xs text-gray-500">{t.doneMsg}</p>
            {result.orderId && (
              <Link
                to={`/track/${encodeURIComponent(result.orderId)}`}
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-[#1c192b] text-white rounded-xl font-bold text-xs"
              >
                <Truck className="w-4 h-4" />
                {t.track}
              </Link>
            )}
          </div>
        )}

        {phase === "closed" && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-sm text-gray-700 font-bold">{t.closed}</p>
            {result.orderId && (
              <Link to={`/track/${encodeURIComponent(result.orderId)}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c192b] text-white rounded-xl font-bold text-xs">
                <Truck className="w-4 h-4" />
                {t.track}
              </Link>
            )}
          </div>
        )}

        {phase === "error" && (
          <div className="text-center py-6 space-y-2">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
            <p className="text-sm text-gray-700 font-bold">
              {result.message === "product_unavailable" ? t.unavailable : result.message === "out_of_stock" ? t.oos : t.invalid}
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] text-gray-400">e-nova · WhatsApp</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c192b] to-[#2d2a3f] flex items-center justify-center p-4">
      {phase === "loading" ? (
        <div className="text-white flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
        </div>
      ) : card}
    </div>
  );
}
