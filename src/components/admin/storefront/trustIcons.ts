import type { LucideIcon } from "lucide-react";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Phone,
  Clock,
  Star,
  Package,
  CheckCircle2,
} from "lucide-react";
import type { TrustIconId } from "../../../types/storefront";

export interface TrustIconOption {
  id: TrustIconId;
  label: string;
  Icon: LucideIcon;
}

/** Liste des icônes proposées pour les items de la barre de réassurance. */
export const TRUST_ICON_OPTIONS: TrustIconOption[] = [
  { id: "truck", label: "Livraison", Icon: Truck },
  { id: "shield", label: "Paiement à la livraison", Icon: ShieldCheck },
  { id: "rotate", label: "Retours / Échange", Icon: RotateCcw },
  { id: "phone", label: "Support client", Icon: Phone },
  { id: "clock", label: "Rapidité", Icon: Clock },
  { id: "star", label: "Qualité / Avis", Icon: Star },
  { id: "package", label: "Colis soigné", Icon: Package },
  { id: "check", label: "Garantie", Icon: CheckCircle2 },
];

const TRUST_ICON_MAP: Record<TrustIconId, LucideIcon> = {
  truck: Truck,
  shield: ShieldCheck,
  rotate: RotateCcw,
  phone: Phone,
  clock: Clock,
  star: Star,
  package: Package,
  check: CheckCircle2,
};

/** Composant d'icône pour un identifiant de réassurance (fallback : camion). */
export function getTrustIcon(id: TrustIconId): LucideIcon {
  return TRUST_ICON_MAP[id] ?? Truck;
}
