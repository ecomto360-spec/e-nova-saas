/**
 * Identifiant de build de l'application (dashboard + boutique publique).
 *
 * Objectif : vérifier en une seconde si un navigateur exécute bien le bundle
 * courant. La cause n°1 des « bugs fantômes » signalés jusqu'ici était un
 * onglet boutique resté ouvert depuis un déploiement précédent : il continue
 * d'exécuter l'ANCIEN code en mémoire tant qu'il n'est pas rechargé.
 *
 * Où le voir :
 *  - Console au démarrage :        [e-nova] bundle <BUNDLE_ID>
 *  - Attribut HTML :               <html data-enova-bundle="…">
 *  - Barre propriétaire boutique : petit libellé à droite
 *    (visible uniquement connecté)
 *
 * À METTRE À JOUR À CHAQUE LIVRAISON (format : lot<N>-<AAAA>-<MM>-<JJ>).
 */
export const BUNDLE_ID = "t3-themes-verticaux-2026-11-02";
