// Fonction Vercel catch-all : route TOUTES les requêtes /api/* vers l'app Express.
// Vercel donne la priorité au filesystem (fonctions du dossier api/) sur les rewrites,
// donc cette fonction capte /api/... AVANT le rewrite SPA (-> /index.html) de vercel.json.
// Le reste du site (SPA + assets) continue d'être servi par le build Vite statique.
import type { Request, Response } from "express";
import { getApp } from "../server.js";

export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req, res);
}
