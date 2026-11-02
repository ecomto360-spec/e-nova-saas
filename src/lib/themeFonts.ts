/**
 * T3 — Polices Google Fonts par thème (titres + corps, arabes inclus).
 * ---------------------------------------------------------------------------
 * Charge à la demande les familles utilisées par le thème actif et fournit
 * les piles CSS correspondantes. Aucune police n'est chargée si la famille
 * n'est pas dans la liste blanche (pas de requête externe inutile).
 */

/** Familles officiellement prises en charge (toutes avec support arabe). */
export const SUPPORTED_GOOGLE_FONTS: string[] = [
  "Cairo",
  "Tajawal",
  "Almarai",
  "Amiri",
  "Changa",
  "El Messiri",
  "Reem Kufi",
  "Rubik",
  "Noto Kufi Arabic",
  "Lemonada",
  "Marhey",
  "Aref Ruqaa",
  "Baloo Bhaijaan 2",
  "IBM Plex Sans Arabic",
];

const loaded = new Set<string>();

/**
 * Injecte (une seule fois) un <link> Google Fonts pour les familles données.
 * Ne fait rien côté serveur ou si la famille est inconnue.
 */
export function ensureGoogleFonts(families: Array<string | undefined | null>): void {
  if (typeof document === "undefined") return;
  const wanted = families
    .filter((f): f is string => Boolean(f) && (f as string).trim() !== "")
    .map((f) => f.trim())
    .filter((f) => SUPPORTED_GOOGLE_FONTS.some((k) => k.toLowerCase() === f.toLowerCase()))
    .map((f) => SUPPORTED_GOOGLE_FONTS.find((k) => k.toLowerCase() === f.toLowerCase()) as string)
    .filter((f) => !loaded.has(f));
  if (wanted.length === 0) return;
  wanted.forEach((f) => loaded.add(f));
  const href =
    "https://fonts.googleapis.com/css2?" +
    wanted.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`).join("&") +
    "&display=swap";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.enovaFont = "1";
  document.head.appendChild(link);
}

/** Pile CSS de repli pour une famille (arabe d'abord, latin en repli). */
export function fontStack(family?: string | null): string {
  const f = (family || "").trim();
  if (!f) return "'Segoe UI', Tahoma, Arial, sans-serif";
  const known = SUPPORTED_GOOGLE_FONTS.find((k) => k.toLowerCase() === f.toLowerCase());
  if (known) return `'${known}', 'Segoe UI', Tahoma, Arial, sans-serif`;
  // Familles génériques historiques ("sans", "serif", "mono"…)
  const g = f.toLowerCase();
  if (g === "serif") return "Georgia, 'Times New Roman', 'Amiri', serif";
  if (g === "mono") return "'Courier New', monospace";
  return "'Segoe UI', Tahoma, Arial, sans-serif";
}
