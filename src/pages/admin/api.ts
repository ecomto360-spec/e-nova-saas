/**
 * Client API Super Admin — wrapper fetch typé (cookies de session inclus).
 * Toutes les pages admin passent par ces helpers : jamais d'accès direct
 * Firestore côté client pour les données de la plateforme.
 */

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/admin/v1${path}`, { credentials: "include" });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || `Erreur ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiSend<T>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin/v1${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || `Erreur ${res.status}`);
  }
  return (await res.json().catch(() => ({}))) as T;
}

/** Télécharge un export CSV/JSON côté serveur (avec la session admin). */
export function apiDownload(path: string): void {
  window.open(`/api/admin/v1${path}`, "_blank");
}

export const fmtNum = (n: number | string | undefined | null): string => (Number(n) || 0).toLocaleString("fr-FR");
export const fmtDZD = (n: number | string | undefined | null): string => (Number(n) || 0).toLocaleString("fr-FR") + " DA";
export const fmtDate = (iso: string | undefined | null): string => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return "—"; }
};
export const fmtDateTime = (iso: string | undefined | null): string => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
};
export const fmtMonth = (m: string): string => {
  if (!/^\d{4}-\d{2}$/.test(m)) return m;
  try { return new Date(m + "-01").toLocaleDateString("fr-FR", { month: "short", year: "numeric" }); } catch { return m; }
};
