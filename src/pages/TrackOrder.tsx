import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dbPublic } from "../lib/firebase";
import { doc, getDoc, query as fsQuery, where, collection as fsCollection, getDocs } from "firebase/firestore";
import {
  Loader2, Package, MapPin, Truck, CheckCircle2, Clock,
  XCircle, RotateCcw, Building2, PackageCheck, SearchX
} from "lucide-react";

/**
 * Page publique de suivi de commande (/track/:code).
 * code = référence (ORD-…) ou trackingCode de la commande.
 * Franchise (sans marque vendeur), arabe par défaut, statuts Enova.
 */
type TrackPhase = "loading" | "found" | "notfound";

const STATUS_STEPS: Array<{ key: string; labelAr: string; labelFr: string; icon: typeof Clock }> = [
  { key: "En attente", labelAr: "في انتظار التأكيد", labelFr: "En attente", icon: Clock },
  { key: "Confirmée", labelAr: "مؤكدة", labelFr: "Confirmée", icon: CheckCircle2 },
  { key: "Expédiée", labelAr: "تم الشحن", labelFr: "Expédiée", icon: Package },
  { key: "En livraison", labelAr: "في الطريق إليك", labelFr: "En livraison", icon: Truck },
  { key: "Au bureau de livraison", labelAr: "في مكتب التوصيل", labelFr: "Au bureau de livraison", icon: Building2 },
  { key: "Livrée", labelAr: "تم التوصيل", labelFr: "Livrée", icon: PackageCheck }
];

const STATUS_END: Array<{ key: string; labelAr: string; labelFr: string; icon: typeof XCircle; tone: string }> = [
  { key: "Échec", labelAr: "فشل التوصيل", labelFr: "Échec de livraison", icon: XCircle, tone: "text-red-500" },
  { key: "Retour", labelAr: "تم الإرجاع", labelFr: "Retournée", icon: RotateCcw, tone: "text-amber-500" }
];

interface TrackedOrder {
  client?: string;
  wilaya?: string;
  commune?: string;
  itemsSummary?: string;
  items?: Array<{ name?: string; quantity?: number; image?: string }>;
  total?: number;
  status?: string;
  trackingCode?: string;
  reference?: string;
  date?: string;
}

export default function TrackOrder() {
  const { code } = useParams<{ code: string }>();
  const [phase, setPhase] = useState<TrackPhase>("loading");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    if (!code) return;
    let mounted = true;
    (async () => {
      try {
        // par trackingCode / référence (index single-field)
        let found: TrackedOrder | null = null;
        for (const field of ["trackingCode", "reference"]) {
          const snap = await getDocs(fsQuery(fsCollection(dbPublic, "orders"), where(field, "==", code))).catch(() => null);
          if (snap && !snap.empty) {
            found = snap.docs[0].data() as TrackedOrder;
            break;
          }
        }
        if (!found) {
          const snap = await getDoc(doc(dbPublic, "orders", code)).catch(() => null);
          if (snap && snap.exists()) found = snap.data() as TrackedOrder;
        }
        if (!mounted) return;
        if (found) { setOrder(found); setPhase("found"); }
        else setPhase("notfound");
      } catch {
        if (mounted) setPhase("notfound");
      }
    })();
    return () => { mounted = false; };
  }, [code]);

  const t = {
    titleAr: "تتبع طلبك",
    notFoundAr: "لم نعثر على هذا الطلب",
    notFoundMsgAr: "تحقق من رقم التتبع الموجود في رسالة WhatsApp أو تأكيد طلبك.",
    statusAr: "حالة الطلب",
    totalAr: "المبلغ (الدفع عند الاستلام)",
    destinationAr: "وجهة التوصيل",
    dateAr: "تاريخ الطلب"
  };

  const currentStatus = order?.status || "";
  const endStatus = STATUS_END.find((s) => s.key === currentStatus);
  const activeIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const firstItem = order?.items?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c192b] to-[#2d2a3f] flex items-start sm:items-center justify-center p-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full" dir="rtl">
        <div className="bg-[#1c192b] text-white px-6 py-5 text-center">
          <Truck className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <h1 className="text-lg font-black">{t.titleAr}</h1>
          {order?.reference && <p className="text-[11px] text-white/50 font-mono mt-1" dir="ltr">{order.reference}</p>}
        </div>

        <div className="p-6 space-y-5">
          {phase === "loading" && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          )}

          {phase === "notfound" && (
            <div className="text-center py-8 space-y-3">
              <SearchX className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-sm font-black text-gray-800">{t.notFoundAr}</p>
              <p className="text-xs text-gray-500">{t.notFoundMsgAr}</p>
            </div>
          )}

          {phase === "found" && order && (
            <>
              {/* Récap produit */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                {firstItem?.image ? (
                  <img src={firstItem.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="w-14 h-14 rounded-xl bg-[#1c192b]/10 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-[#1c192b]" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{firstItem?.name || order.itemsSummary || "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">x{firstItem?.quantity || 1}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-base font-black text-gray-900">{(order.total || 0).toLocaleString("fr-FR")}</p>
                  <p className="text-[10px] text-gray-400">DA</p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{order.wilaya} {order.commune ? `— ${order.commune}` : ""}</span>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-black text-gray-800 mb-3">{t.statusAr} : <span className="text-amber-600">{currentStatus}</span></p>
                {endStatus ? (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                    <endStatus.icon className={`w-6 h-6 ${endStatus.tone}`} />
                    <p className={`text-sm font-black ${endStatus.tone}`}>{endStatus.labelAr}</p>
                  </div>
                ) : (
                  <ol className="relative border-r-2 border-gray-100 mr-3 space-y-5">
                    {STATUS_STEPS.map((step, i) => {
                      const Icon = step.icon;
                      const done = activeIdx >= 0 && i < activeIdx;
                      const active = i === activeIdx;
                      return (
                        <li key={step.key} className="pr-6 relative">
                          <span className={`absolute -right-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                            active ? "bg-amber-500 border-amber-500 text-white shadow-md"
                            : done ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-gray-200 text-gray-300"
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <p className={`text-sm font-bold ${active ? "text-gray-900" : done ? "text-emerald-600" : "text-gray-400"}`}>
                            {step.labelAr}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <span className="text-[10px] text-gray-400">e-nova · suivi de commande</span>
        </div>
      </div>
    </div>
  );
}
