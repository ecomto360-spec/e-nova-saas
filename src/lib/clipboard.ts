/**
 * Copie de texte dans le presse-papiers avec repli pour les contextes non
 * sécurisés (HTTP, navigateurs anciens, iframes sans permission).
 * Retourne true si la copie a réussi.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. API moderne (contexte sécurisé requis)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // on tente le repli ci-dessous
  }

  // 2. Repli : textarea temporaire + execCommand('copy')
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
