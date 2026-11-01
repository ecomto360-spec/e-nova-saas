/**
 * Registre des extensions — « Apps & Intégrations ».
 *
 * Pour ajouter une future extension : ajouter une entrée ici (type
 * ExtensionDefinition) + sa section de traductions dans src/i18n/translations.ts
 * + sa route dans src/App.tsx. La grille de src/pages/Extensions.tsx se
 * construit automatiquement à partir de ce registre.
 */
import type { ExtensionDefinition, ExtensionSettingsSnapshot, ExtensionStatus } from "../types/extensions";

export const EXTENSIONS: ExtensionDefinition[] = [
  {
    id: "whatsapp-order-automation",
    icon: "whatsapp",
    route: "/dashboard/extensions/whatsapp",
    nameKey: "extensions.whatsapp.name",
    descriptionKey: "extensions.whatsapp.description",
    settingsCollection: "whatsapp_settings",
  },
];

/**
 * Calcule l'état affiché sur la carte à partir de l'aperçu des réglages.
 * - pas de réglages                       -> Inactive
 * - réglages mais numéro non connecté     -> Non connecté
 * - connecté + activé                     -> Active
 * - connecté mais désactivé               -> Inactive
 */
export function resolveExtensionStatus(settings?: ExtensionSettingsSnapshot | null): ExtensionStatus {
  if (!settings) return "inactive";
  if (settings.connectionStatus !== "connected") return "not_connected";
  return settings.enabled ? "active" : "inactive";
}
