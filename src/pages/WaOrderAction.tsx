import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { dbPublic } from "../lib/firebase";
import { doc, getDoc, query as fsQuery, where, collection as fsCollection, getDocs } from "firebase/firestore";
import { CheckCircle2, XCircle, Loader2, Package, MapPin, Truck, MessageCircle, AlertTriangle, PartyPopper } from "lucide-react";

/**
 * Page publique de confirmation WhatsApp d'une COMMANDE validée
 * (/wa/order/:orderId?t=token) — récapitulatif + boutons
 * ✅ Confirmer | ❌ Refuser | 🚚 Suivre.
 */
interface WaOrderDoc {
  client?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  items?: Array<{ name?: string; quantity?: number; price?: number; image?: string }>;
  itemsSummary?: string;
  total?: number;
  shippingCost?: number;
  status?: string;
  trackingCode?: string;
  reference?: string;
  waToken?: string;
}

type Phase = "loading" | "ready" | "busy" | "done" | "refused" | "closed" | "error";

export default function WaOrderAction() {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [order, setOrder] = useState<WaOrderDoc | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [trackCode, setTrackCode] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;
    (async () => {
      try {
        let snap = await getDoc(doc(dbPublic, "orders", orderId)).catch(() => null);
        if (!snap || !snap.exists()) {
          const byRef = await getDocs(fsQuery(fsCollection(dbPublic, "orders"), where("reference", "==", orderId))).catch(() => null);
          if (byRef && !byRef.empty) snap = byRef.docs[0];
        }
        if (!mounted) return;
        if (!snap || !snap.exists()) { setPhase("error"); return; }
        const data = snap.data() as WaOrderDoc;
        setOrder(data);
        setTrackCode(String(data.trackingCode || data.reference || orderId));
        if (String(data.waToken || "") !== token) { setPhase("error"); return; }
        if (data.status && !["En attente"].includes(data.status)) { setPhase("closed"); return; }
        setPhase("ready");
      } catch {
        if (mounted) setPhase("error");
      }
    })();
    return () => { mounted = false; };
  }, [orderId, token]);

  const act = async (action: "confirm" | "decline") => {
    if (!orderId) return;
    setPhase("busy");
    try {
      const r = await fetch("/api/whatsapp/order-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token, action })
      });
      const j = await r.json().catch(() => ({ ok: false }) as Record<string, unknown>);
      if (j.ok === true) {
        if (action === "confirm") { if (j.trackingCode) setTrackCode(String(j.trackingCode)); setPhase("done"); }
        else setPhase("refused");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  };

  const isAr = true; // messages de confirmation de commande en arabe par défaut
  const t = {
    title: "تأكيد طلبك",
    hello: `مرحباً ${order?.client || ""}`,
    recorded: "تم تسجيل طلبك في متجرنا. يرجى تأكيده للمتابعة :",
    confirm: "✅ تأكيد طلبي",
    decline: "❌ إلغاء الطلب",
    track: "🚚 تتبع الطلب",
    doneTitle: "🎉 تم تأكيد طلبك!",
    doneMsg: "سنتواصل معك لتحديد موعد التوصيل. شكراً لثقتك!",
    refusedMsg: "تم إلغاء طلبك. يمكنك دائماً إعادة الطلب من متجرنا.",
    closed: "تمت معالجة هذا الطلب مسبقاً.",
    invalid: "رابط غير صالح أو منتهي الصلاحية.",
    total: "الإجمالي (الدفع عند الاستلام)"
  };

  const firstItem = order?.items?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c192b] to-[#2d2a3f] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full">
        <div className="bg-[#1c192b] text-white px-6 py-5 text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#25D366]" />
          <h1 className="text-lg font-black">{t.title}</h1>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          {phase === "loading" && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
            </div>
          )}

          {phase !== "loading" && (
            <>
              <p className="text-sm text-gray-700 font-bold">{t.hello}</p>
              <p className="text-xs text-gray-500">{t.recorded}</p>

              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                {firstItem?.image ? (
                  <img src={firstItem.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="w-14 h-14 rounded-xl bg-[#1c192b]/10 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-[#1c192b]" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{firstItem?.name || order?.itemsSummary || "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">x{firstItem?.quantity || 1}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{order?.wilaya} {order?.commune ? `— ${order.commune}` : ""}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#1c192b] text-white rounded-2xl px-4 py-3">
                <span className="text-xs font-bold">{t.total}</span>
                <span className="text-lg font-black">{(order?.total || 0).toLocaleString("fr-FR")} DA</span>
              </div>

              {(phase === "ready" || phase === "busy") && (
                <div className="space-y-2.5 pt-1">
                  <button
                    onClick={() => act("confirm")}
                    disabled={phase === "busy"}
                    className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                  >
                    {phase === "busy" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {t.confirm}
                  </button>
                  <button
                    onClick={() => act("decline")}
                    disabled={phase === "busy"}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    {t.decline}
                  </button>
                </div>
              )}

              {phase === "done" && (
                <div className="text-center py-4 space-y-3">
                  <PartyPopper className="w-12 h-12 mx-auto text-emerald-500" />
                  <p className="text-sm font-black text-gray-900">{t.doneTitle}</p>
                  <p className="text-xs text-gray-500">{t.doneMsg}</p>
                </div>
              )}

              {phase === "refused" && (
                <div className="text-center py-4 space-y-2">
                  <XCircle className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-700 font-bold">{t.refusedMsg}</p>
                </div>
              )}

              {phase === "closed" && (
                <p className="text-center text-sm text-gray-600 font-bold py-4">{t.closed}</p>
              )}

              {phase === "error" && (
                <div className="text-center py-4 space-y-2">
                  <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
                  <p className="text-sm text-gray-700 font-bold">{t.invalid}</p>
                </div>
              )}

              {trackCode && phase !== "error" && (
                <Link
                  to={`/track/${encodeURIComponent(trackCode)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#1c192b] text-white rounded-2xl font-bold text-sm"
                >
                  <Truck className="w-4 h-4" />
                  {t.track}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
