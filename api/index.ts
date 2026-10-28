// Fonction Vercel (CommonJS grâce à api/package.json) : route /api/* vers l'app Express.
//
// Pourquoi ce fichier existe :
//  - Vercel ne traite PAS "api/[...path].ts" comme un catch-all hors Next.js : il faut
//    un rewrite explicite "/api/(.*)" -> "/api" dans vercel.json (déjà en place).
//  - api/package.json force la compilation CommonJS : sans lui, le "type": "module"
//    du package.json racine produisait un bundle ESM qui crashe sur __dirname
//    (FUNCTION_INVOCATION_FAILED en production).
//
// L'import est dynamique et englobé dans un try/catch : en cas d'erreur
// d'initialisation, la fonction renvoie l'erreur en JSON (diagnostic direct)
// au lieu d'un FUNCTION_INVOCATION_FAILED opaque.
export default async function handler(req: any, res: any) {
  try {
    // Vercel réécrit l'URL vers /api : on restaure le chemin original si fourni.
    const original: unknown = req.headers["x-vercel-original-path"];
    if (typeof original === "string" && original.charAt(0) === "/") {
      const qi = req.url.indexOf("?");
      req.url = original + (qi >= 0 ? req.url.slice(qi) : "");
    }

    const { getApp } = await import("../server.js");
    const app = await getApp();
    return app(req, res);
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
