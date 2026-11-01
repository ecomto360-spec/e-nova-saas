/**
 * Ouvre (ou réutilise) LA fenêtre unique de la boutique.
 *
 * Pourquoi : chaque clic sur « Voir la boutique » ouvrait un nouvel onglet.
 * Avec un nom de fenêtre fixe, tous les boutons « Boutique » du dashboard
 * réutilisent la MÊME fenêtre : on la ramène au premier plan (focus) et on
 * ne la recharge que si l'URL cible est différente (ou si `forceReload`
 * est demandé, ex. après une modification/publication).
 *
 * La page boutique (/store/*) pose `window.name = STORE_WINDOW_NAME` au
 * chargement (voir StorefrontView) pour que la réutilisation survive aux
 * rechargements et navigations internes.
 */
export const STORE_WINDOW_NAME = "enova-store-window";

/** Vrai si deux URLs pointent vers le même chemin de boutique. */
function sameStorePath(a: string, b: string): boolean {
  try {
    return new URL(a).pathname === new URL(b).pathname;
  } catch {
    return a === b;
  }
}

/**
 * @param url URL cible (relative ou absolue)
 * @param options.forceReload recharge la fenêtre même si l'URL est identique
 *   (à utiliser après une modification/publication pour rafraîchir l'aperçu).
 */
export function openStoreWindow(url: string, options?: { forceReload?: boolean }): void {
  const target = url.startsWith("http") ? url : window.location.origin + url;
  const existing = window.open("", STORE_WINDOW_NAME);
  if (!existing) {
    // Popup bloquée : fallback navigation dans l'onglet courant.
    window.location.href = target;
    return;
  }
  try {
    const href = existing.location.href;
    if (
      href === "about:blank" ||
      options?.forceReload ||
      !sameStorePath(href, target)
    ) {
      existing.location.href = target;
    }
  } catch {
    // Fenêtre cross-origin ou fermée : on (re)pointe l'URL.
    existing.location.href = target;
  }
  existing.focus();
}
