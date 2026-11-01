/**
 * Types partagés des extensions (page /dashboard/extensions).
 *
 * Étape 1/5 — « Order Automation (WhatsApp) » : structure extensible pour
 * accueillir d'autres apps (une entrée dans le registre = une carte).
 * Les réglages détaillés (étapes suivantes) enrichiront
 * ExtensionSettingsSnapshot sans casser cette page.
 */

/** État affiché sur la carte d'une extension. */
export type ExtensionStatus = "inactive" | "active" | "not_connected";

/**
 * Aperçu (léger) des réglages d'une extension, lu depuis sa collection
 * Firestore (une seul champ `enabled` + `connectionStatus` pour le badge).
 * Écrit par la page de réglages (étape 2).
 */
export interface ExtensionSettingsSnapshot {
  enabled?: boolean;
  connectionStatus?: "connected" | "disconnected" | "pending";
}

/** Définition d'une extension dans le registre. */
export interface ExtensionDefinition {
  /** identifiant stable, ex. "whatsapp-order-automation" */
  id: string;
  /** icône affichée sur la carte */
  icon: "whatsapp";
  /** route de la page de réglages */
  route: string;
  /** clé i18n du nom */
  nameKey: string;
  /** clé i18n de la description */
  descriptionKey: string;
  /** collection Firestore des réglages (doc id = uid du propriétaire) */
  settingsCollection: "whatsapp_settings";
}
