// ============================================================================
// FONCTION VERCEL /api — CommonJS PUR, ZÉRO TypeScript, ZÉRO import dynamique.
// ----------------------------------------------------------------------------
// Pourquoi ce design "blindé" :
//   • Aucun fichier .ts dans api/ -> Vercel n'a RIEN à compiler (plus aucun
//     risque lié au tsconfig, à la résolution de typescript, au bundling
//     ESM/CJS ou au "type" du package.json).
//   • Aucun import() dynamique -> le packaging Vercel (nft) trace les
//     require() STATIQUES de manière 100 % fiable.
//   • Le serveur Express vient d'un bundle esbuild DÉJÀ construit et testé :
//       1) ../dist/server.cjs          (regénéré à CHAQUE déploiement par
//                                        `npm run build` -> toujours à jour)
//       2) ../api-lib/server-bundle.cjs (copie commitée dans le dépôt -> filet
//                                        de sécurité si le build s'exécute
//                                        après la construction de la fonction)
//   • Sonde /api/__ping traitée SANS AUCUN require : elle doit répondre même
//     si tout le reste du monde est cassé.
//
// Maintenance : si server.ts change, régénérer api-lib/server-bundle.cjs via :
//   npm run build && cp dist/server.cjs api-lib/server-bundle.cjs
// (Le chemin 1 ../dist/server.cjs est utilisé en priorité et est régénéré
//  automatiquement à chaque déploiement — la copie n'est qu'un filet.)
// ============================================================================

module.exports = async function handler(req, res) {
  // ---- Sonde indépendante (aucune dépendance) -------------------------------
  // Le rewrite Vercel "/api/(.*) -> /api" remplace req.url par "/api" :
  // le chemin original est fourni via l'en-tête x-vercel-original-path.
  var probe = String(req.headers["x-vercel-original-path"] || req.url || "");
  if (probe.indexOf("/api/__ping") === 0) {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ pong: true, node: process.version }));
    return;
  }

  try {
    // ---- Restauration du chemin original de la requête ----------------------
    var original = req.headers["x-vercel-original-path"];
    if (typeof original === "string" && original.charAt(0) === "/") {
      var qi = req.url.indexOf("?");
      req.url = original + (qi >= 0 ? req.url.slice(qi) : "");
    }

    // ---- Chargement de l'app Express (bundle pré-construit) -----------------
    var bundle = null;
    var source = "dist/server.cjs";
    try {
      bundle = require("../dist/server.cjs");
    } catch (e1) {
      // Filet de sécurité : copie commitée dans le dépôt.
      source = "api-lib/server-bundle.cjs";
      bundle = require("../api-lib/server-bundle.cjs");
    }

    var getApp = bundle.getApp || (bundle.default && bundle.default.getApp);
    if (typeof getApp !== "function") {
      throw new Error("getApp introuvable dans le bundle serveur (" + source + ")");
    }

    var app = await getApp();
    if (typeof app !== "function") {
      throw new Error("getApp() n'a pas renvoyé une app Express (" + source + ")");
    }
    return app(req, res);
  } catch (err) {
    // Toute erreur d'initialisation est renvoyée en JSON lisible (jamais un
    // crash muet) pour pouvoir diagnostiquer sans accès aux logs Vercel.
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: "Erreur d'initialisation de la fonction API",
        source: typeof source !== "undefined" ? source : null,
        detail: String((err && err.stack) || err),
      })
    );
  }
};
