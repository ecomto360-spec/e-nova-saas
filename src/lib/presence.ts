import { auth } from "./firebase";

/**
 * LOT A — Présence « En ligne maintenant » (membres).
 * Heartbeat léger toutes les 60 s UNIQUEMENT quand l'onglet est actif.
 * Écrit user_presence/{uid} via le serveur (/api/admin/v1/heartbeat) avec le
 * token Firebase vérifié côté serveur — la collection n'est jamais écrite
 * directement depuis le navigateur.
 */

let started = false;
let timer: number | null = null;

function detectDevice(): { device: string; os: string } {
  const ua = navigator.userAgent || "";
  const os = /Windows/i.test(ua) ? "Windows"
    : /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Mac OS X/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux" : "—";
  const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  return { device, os };
}

async function beat(storeName: string): Promise<void> {
  if (document.visibilityState !== "visible") return;
  try {
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken(/* forceRefresh */ false).catch(() => null);
    if (!idToken) return;
    const { device, os } = detectDevice();
    const res = await fetch("/api/admin/v1/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ device, os, storeName, page: location.pathname.slice(0, 120) })
    });
    // Compte suspendu par un administrateur : déconnexion forcée immédiate.
    if (res.status === 403) {
      stopPresenceHeartbeat();
      try { await auth.signOut(); } catch { /* ignore */ }
      window.location.href = "/login?suspended=1";
    }
  } catch {
    /* silencieux : la présence est best-effort */
  }
}

/** Démarre le heartbeat (singleton — appelé une fois par le Header du dashboard). */
export function startPresenceHeartbeat(getStoreName: () => string): void {
  if (started) return;
  started = true;
  const run = () => { void beat(getStoreName()); };
  run();
  timer = window.setInterval(run, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
}

export function stopPresenceHeartbeat(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  started = false;
}
