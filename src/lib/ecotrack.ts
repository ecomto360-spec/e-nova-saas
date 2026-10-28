import { normalizePhoneForBlacklist } from "./blacklist";

export interface EcoTrackScore {
  phone: string;
  totalOrders: number;
  deliveredCount: number;
  returnedCount: number;
  cancelledCount: number;
  pendingCount: number;
  deliveryRate: number; // 0 - 100
  trustLevel: "green" | "orange" | "red";
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  recommendation: string;
  isNewCustomer: boolean;
}

export function computeEcoTrackScore(
  phone: string,
  allOrders: any[],
  isBanned: boolean = false
): EcoTrackScore {
  const normPhone = normalizePhoneForBlacklist(phone);
  
  // Filter all orders matching this customer phone
  const customerOrders = (allOrders || []).filter(o => {
    if (!o.phone) return false;
    return normalizePhoneForBlacklist(o.phone) === normPhone;
  });

  const totalOrders = customerOrders.length;
  let deliveredCount = 0;
  let returnedCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;

  customerOrders.forEach(o => {
    const st = (o.status || "").toLowerCase();
    if (st.includes("livr") || st === "livrée" || st === "delivered") {
      deliveredCount++;
    } else if (st.includes("retour") || st === "retournée" || st === "returned") {
      returnedCount++;
    } else if (st.includes("annul") || st.includes("échou") || st === "annulée" || st === "cancelled" || st === "failed") {
      cancelledCount++;
    } else {
      pendingCount++;
    }
  });

  // Calculate delivery rate based on resolved orders
  const resolvedOrders = deliveredCount + returnedCount + cancelledCount;
  
  if (isBanned) {
    return {
      phone,
      totalOrders,
      deliveredCount,
      returnedCount,
      cancelledCount,
      pendingCount,
      deliveryRate: 0,
      trustLevel: "red",
      label: "Client sur Liste Noire (Bloqué)",
      badgeBg: "bg-red-500/15",
      badgeText: "text-red-400",
      badgeBorder: "border-red-500/30",
      recommendation: "Ce numéro est sur liste noire. Annulez ou exigez un prépaiement complet avant expédition.",
      isNewCustomer: false
    };
  }

  // 1. New Customer (no past resolved orders)
  if (resolvedOrders === 0) {
    return {
      phone,
      totalOrders: Math.max(totalOrders, 1),
      deliveredCount: 0,
      returnedCount: 0,
      cancelledCount: 0,
      pendingCount: Math.max(pendingCount, 1),
      deliveryRate: 100,
      trustLevel: "green",
      label: "Nouveau client (100% neutre)",
      badgeBg: "bg-emerald-500/15",
      badgeText: "text-emerald-400",
      badgeBorder: "border-emerald-500/30",
      recommendation: "Premier achat : Appelez le client pour confirmer les détails de livraison.",
      isNewCustomer: true
    };
  }

  // Delivery rate %
  const deliveryRate = Math.round((deliveredCount / (deliveredCount + returnedCount + (cancelledCount * 0.5))) * 100);
  const clampedRate = Math.min(100, Math.max(0, deliveryRate));

  // Determine Level: Green, Orange, Red
  if (returnedCount >= 2 || (resolvedOrders >= 2 && clampedRate < 50) || (deliveredCount === 0 && returnedCount >= 1)) {
    // RED : High Risk
    return {
      phone,
      totalOrders,
      deliveredCount,
      returnedCount,
      cancelledCount,
      pendingCount,
      deliveryRate: clampedRate,
      trustLevel: "red",
      label: `Risque élevé (${clampedRate}%)`,
      badgeBg: "bg-red-500/15",
      badgeText: "text-red-400",
      badgeBorder: "border-red-500/30",
      recommendation: `Attention ! ${returnedCount} retour(s) enregistré(s). Risque élevé de refus de colis à la livraison.`,
      isNewCustomer: false
    };
  }

  if (clampedRate < 80 || returnedCount === 1) {
    // ORANGE : Moderate Risk / Caution
    return {
      phone,
      totalOrders,
      deliveredCount,
      returnedCount,
      cancelledCount,
      pendingCount,
      deliveryRate: clampedRate,
      trustLevel: "orange",
      label: `Vigilance (${clampedRate}%)`,
      badgeBg: "bg-amber-500/15",
      badgeText: "text-amber-400",
      badgeBorder: "border-amber-500/30",
      recommendation: `Historique mitigé (${deliveredCount} livrée(s), ${returnedCount} retour(s)). Confirmation téléphonique recommandée.`,
      isNewCustomer: false
    };
  }

  // GREEN : High Trust
  return {
    phone,
    totalOrders,
    deliveredCount,
    returnedCount,
    cancelledCount,
    pendingCount,
    deliveryRate: clampedRate,
    trustLevel: "green",
    label: `Client fiable (${clampedRate}%)`,
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/30",
    recommendation: `Excellent client (${deliveredCount} commande(s) livrée(s) avec succès sans retour). Expédition en toute confiance.`,
    isNewCustomer: false
  };
}
