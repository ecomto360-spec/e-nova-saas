// Logique réelle de la fonction Vercel : restaure le chemin original de la
// requête (le rewrite "/api/(.*) -> /api" le remplace par /api), puis délègue
// à l'app Express, chargée dynamiquement pour capter toute erreur de module.
export default async function run(req: any, res: any): Promise<void> {
  const original: unknown = req.headers["x-vercel-original-path"];
  if (typeof original === "string" && original.charAt(0) === "/") {
    const qi = req.url.indexOf("?");
    req.url = original + (qi >= 0 ? req.url.slice(qi) : "");
  }

  const { getApp } = await import("../server.js");
  const app = await getApp();
  return app(req, res);
}
