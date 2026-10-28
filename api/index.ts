// Entrée Vercel MINIMALE — aucun import au niveau du module.
// Objectif : aucune erreur ne peut se produire au CHARGEMENT de ce fichier.
// Tout le chargement réel est différé dans le handler et capturé, afin que
// n'importe quelle erreur d'initialisation soit renvoyée en JSON (diagnostic)
// plutôt qu'un FUNCTION_INVOCATION_FAILED muet.
export default async function handler(req: any, res: any): Promise<void> {
  // Sonde indépendante du serveur Express : prouve que la fonction vit.
  // (On teste aussi x-vercel-original-path car le rewrite Vercel remplace
  // req.url par /api avant l'invocation.)
  const probe = String(req.headers["x-vercel-original-path"] || req.url || "");
  if (probe.indexOf("/api/__ping") === 0) {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ pong: true, node: process.version }));
    return;
  }

  try {
    const mod: any = await import("./handler.js");
    // Interop robuste : selon le mode de compilation (CJS pur, node16, ESM),
    // le handler se trouve soit sur mod, mod.default, voire mod.default.default.
    const candidates = [mod, mod && mod.default, mod && mod.default && mod.default.default];
    let run: ((req: any, res: any) => Promise<void>) | null = null;
    for (const c of candidates) {
      if (typeof c === "function") { run = c; break; }
    }
    if (!run) throw new Error("Handler introuvable dans api/handler (interop)");
    return await run(req, res);
  } catch (err: unknown) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: "Erreur d'initialisation de la fonction API",
        detail: String((err && (err as Error).stack) || err),
      })
    );
  }
}
