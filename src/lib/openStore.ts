/**
 * Ouvre (ou réutilise) LA fenêtre unique de la boutique.
 *
 * Pourquoi : chaque clic sur « Voir la boutique » ouvrait un nouvel onglet.
 * Avec un nom de fenêtre fixe, tous les boutons « Boutique » du dashboard
 * réutilisent la MÊME fenêtre.
 *
 * RÈGLE (Lot 14) : la fenêtre est TOUJOURS rechargée (navigation forcée),
 * même si l'URL cible est identique. Un clic sur « Voir la boutique » est
 * une demande explicite de données à jour : on ne se contente JAMAIS de
 * focaliser un onglet qui affiche un rendu datant d'avant les dernières
 * modifications (produits créés/désactivés, nouveau déploiement).
 *
 * La page boutique (/store/*) pose `window.name = STORE_WINDOW_NAME` au
 * chargement (voir StorefrontView) pour que la réutilisation survive aux
 * rechargements et navigations internes.
 *
 * Cette fenêtre ne transporte AUCUN état du dashboard : ni sessionStorage
 * (aucune page de l'app n'y lit ni n'y écrit), ni localStorage (la boutique
 * publique n'utilise jamais les clés du dashboard). Seul `window.name`
 * (constant) sert à retrouver la fenêtre.
 */
export const STORE_WINDOW_NAME = "enova-store-window";

/**
 * @param url URL cible (relative ou absolue)
 * @param _options conservé pour compatibilité des appelants ; la fenêtre est
 *   désormais TOUJOURS rechargée (l'ancienne option `forceReload` est donc
 *   implicite en permanence).
 */
export function openStoreWindow(url: string, _options?: { forceReload?: boolean }): void {
  const target = url.startsWith("http") ? url : window.location.origin + url;
  const existing = window.open("", STORE_WINDOW_NAME);
  if (!existing) {
    // Popup bloquée : fallback navigation dans l'onglet courant.
    window.location.href = target;
    return;
  }
  try {
    // Navigation forcée = rechargement complet, même si l'URL est identique.
    // (L'écriture de location.href est permise même si la fenêtre affiche
    // actuellement une page d'un autre origine — seule la lecture est interdite.)
    existing.location.href = target;
  } catch {
    // Ne devrait pas se produire (voir ci-dessus) : on tente quand même.
    existing.location.href = target;
  }
  existing.focus();
}
