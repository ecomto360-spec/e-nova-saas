/**
 * Cache local du tenant (données de boutique du compte connecté) — côté
 * DASHBOARD uniquement.
 *
 * Lot 14 — pourquoi ce module : les anciennes clés `dzbuild_store_name` /
 * `dzbuild_tenant_data` étaient écrites SANS version NI propriétaire. Un
 * navigateur où s'était connecté un ancien compte continuait de servir ces
 * clés à n'importe qui : AuthGuard laissait entrer dans le dashboard et
 * TenantContext affichait une boutique « fantôme » qui n'appartient pas au
 * compte courant.
 *
 * Règles :
 *  - une SEULE clé versionnée : `enova:v1:tenant` = JSON { uid, data } ;
 *  - le cache n'est valable QUE pour l'uid qui l'a écrit ;
 *  - chaque lecture/écriture supprime les anciennes clés non versionnées
 *    (nettoyage automatique au chargement, exigé par la procédure Lot 14) ;
 *  - la page publique /store/:slug n'utilise JAMAIS ce cache : elle lit
 *    uniquement le slug de l'URL, côté serveur (voir StorefrontView).
 */
const KEY = "enova:v1:tenant";
const LEGACY_KEYS = ["dzbuild_tenant_data", "dzbuild_store_name"];

export interface CachedTenant {
  uid: string;
  data: Record<string, unknown> & { storeName?: string };
}

function localStorageSafe(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    // Navigation privée stricte / SSR : non bloquant.
    return null;
  }
}

/** Supprime les anciennes clés non versionnées (à chaque lecture/écriture). */
function purgeLegacyKeys(): void {
  const ls = localStorageSafe();
  if (!ls) return;
  for (const k of LEGACY_KEYS) {
    try {
      ls.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Lit le cache tenant.
 * - sans `uid` : renvoie le cache tel quel (peinture instantanée du header
 *   pendant que l'authentification se résout) ;
 * - avec `uid` : ne renvoie le cache QUE s'il a été écrit pour CE compte.
 *   Un cache d'un autre compte est ignoré (et purgé avec les clés legacy).
 */
export function readTenantCache(uid?: string | null): CachedTenant["data"] | null {
  const ls = localStorageSafe();
  if (!ls) return null;
  let cached: CachedTenant | null = null;
  try {
    cached = JSON.parse(ls.getItem(KEY) || "null") as CachedTenant | null;
  } catch {
    cached = null;
  }
  purgeLegacyKeys();
  if (!cached || typeof cached !== "object" || typeof cached.uid !== "string" || !cached.data) {
    return null;
  }
  if (uid != null && cached.uid !== uid) {
    // Cache d'un autre compte : inutilisable.
    return null;
  }
  return cached.data;
}

/** Écrit le cache pour CE compte et purge les anciennes clés. */
export function writeTenantCache(uid: string, data: Record<string, unknown>): void {
  const ls = localStorageSafe();
  if (!ls) return;
  try {
    ls.setItem(KEY, JSON.stringify({ uid, data }));
  } catch {
    /* quota / mode privé : non bloquant */
  }
  purgeLegacyKeys();
}

/** Vide tout le cache tenant (déconnexion, compte sans boutique). */
export function clearTenantCache(): void {
  const ls = localStorageSafe();
  if (!ls) return;
  try {
    ls.removeItem(KEY);
  } catch {
    /* ignore */
  }
  purgeLegacyKeys();
}
