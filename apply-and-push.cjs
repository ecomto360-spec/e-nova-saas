#!/usr/bin/env node
/*
 * apply-and-push.cjs — Étape B du workflow (compatible Windows PowerShell 5.1)
 * ---------------------------------------------------------------------------
 * À placer À LA RACINE du projet (E:\SOFTWARE\Projet web\E nova), à côté du
 * fichier changes.json téléchargé en même temps depuis le workspace Arena.
 *
 * Usage (depuis la racine du projet) :
 *   node .\apply-and-push.cjs --dry     -> aperçu du plan, aucune modification
 *   node .\apply-and-push.cjs           -> applique + git add/commit/push
 *
 * Ce que fait le script :
 *   1. Lit changes.json : { commitMessage, files: { "<chemin>": "<contenu>" }, delete: ["<chemin>"] }
 *   2. Écrit chaque fichier en UTF-8 SANS BOM (retours à la ligne LF)
 *   3. Stage UNIQUEMENT ces fichiers (git add -A -- <chemins>, en mode littéral)
 *   4. git commit -m "<message>" puis git push origin main -> Vercel déploie
 *
 * Notes :
 *  - Les messages console sont en ASCII pur pour éviter tout mojibake sous
 *    Windows PowerShell 5.1 (codepage CP850/CP437).
 *  - Ce script et changes.json ne sont JAMAIS commités dans le dépôt :
 *    seuls les fichiers listés dans le manifeste sont stagés.
 *  - Les chemins absolus et les ".." sont refusés (sécurité).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname; // racine du projet = dossier où se trouve ce script
const MANIFEST = path.join(ROOT, 'changes.json');
const DRY = process.argv.includes('--dry');

function ok(m) { console.log('[+] ' + m); }
function info(m) { console.log('[i] ' + m); }
function die(m) { console.error('\n[X] ' + m); process.exit(1); }

// Exécute git avec les pathspecs en mode LITTÉRAL (indispensable pour les
// noms de fichiers contenant des caractères génériques comme [...].ts).
function git(args) {
  const r = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { GIT_LITERAL_PATHSPECS: '1' }),
  });
  if (r.error) die('Git introuvable. Installe "Git for Windows" ou vérifie le PATH. (' + r.error.message + ')');
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  if (r.status !== 0) {
    die('Commande git échouée : git ' + args.join(' ') + '\n----------------------------------------\n' + out);
  }
  return out;
}

// --- 1. Manifeste -----------------------------------------------------------
if (!fs.existsSync(MANIFEST)) {
  die('changes.json est introuvable à la racine du projet.\n' +
      'Télécharge-le depuis le workspace Arena et place-le à côté de apply-and-push.cjs.');
}
let mf;
try {
  mf = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
} catch (e) {
  die('changes.json est invalide (JSON malformé) : ' + e.message);
}

const commitMessage = String(mf.commitMessage || '').trim();
const files = mf.files || {};
const toDelete = Array.isArray(mf.delete) ? mf.delete : [];
if (!commitMessage) die('changes.json : le champ "commitMessage" est manquant.');
if (!Object.keys(files).length && !toDelete.length) die('changes.json : rien à appliquer (files et delete vides).');

// --- 2. Validation des chemins ----------------------------------------------
function safeRel(p) {
  if (typeof p !== 'string' || !p.trim()) die('Chemin invalide dans changes.json : ' + JSON.stringify(p));
  if (path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p)) die('Chemin absolu interdit : ' + p);
  const norm = path.normalize(p).replace(/\\/g, '/');
  if (norm.split('/').indexOf('..') !== -1) die('Chemin contenant ".." interdit : ' + p);
  if (norm === 'changes.json' || norm === 'apply-and-push.cjs') die('Chemin interdit (outil de déploiement) : ' + p);
  if (norm.indexOf('.git/') === 0 || norm === '.git') die('Chemin interdit (.git) : ' + p);
  return norm;
}
const writes = Object.keys(files).map(function (p) { return [safeRel(p), files[p]]; });
const deletes = toDelete.map(safeRel);

// --- 3. Vérifications git ---------------------------------------------------
const inside = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, encoding: 'utf8' });
if (inside.status !== 0) die('Ce dossier n\'est pas un dépôt git : ' + ROOT);
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'main') {
  die('Branche courante : "' + branch + '". Ce script pousse sur main.\n' +
      'Place-toi d\'abord sur main :  git checkout main');
}
const identCheck = spawnSync('git', ['config', 'user.email'], { cwd: ROOT, encoding: 'utf8' });
if (identCheck.status !== 0 || !String(identCheck.stdout || '').trim()) {
  die('Identite git non configuree sur ce PC (user.email absent).\n' +
      'Lance ces deux commandes une seule fois, puis relance le script :\n\n' +
      '  git config --global user.email "ton-email@exemple.com"\n' +
      '  git config --global user.name "Ton Nom"');
}
const remote = git(['remote', 'get-url', 'origin']);
info('Depot distant : ' + remote);

// --- 4. Plan ----------------------------------------------------------------
console.log('');
info('Projet   : ' + ROOT);
info('Branche  : main');
info('Plan     : ' + writes.length + ' fichier(s) à écrire, ' + deletes.length + ' à supprimer');
for (const [rel] of writes) console.log('    ecrit    : ' + rel);
for (const rel of deletes) console.log('    supprime : ' + rel);
info('Commit   : ' + commitMessage);
console.log('');
if (DRY) { info('Mode --dry : rien n\'a été modifié.'); process.exit(0); }

// --- 5. Écriture des fichiers (UTF-8 sans BOM) -------------------------------
for (const [rel, raw] of writes) {
  let content = String(raw).replace(/^\uFEFF/, ''); // retire un éventuel BOM
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, { encoding: 'utf8' }); // Node n'écrit jamais de BOM
  ok('ecrit : ' + rel + ' (' + Buffer.byteLength(content, 'utf8') + ' octets)');
}
for (const rel of deletes) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) { fs.unlinkSync(abs); ok('supprime : ' + rel); }
  else info('déjà absent : ' + rel);
}

// --- 6. Stage UNIQUEMENT les fichiers du manifeste ----------------------------
const stagePaths = writes.map(function (w) { return w[0]; }).concat(deletes);
for (let i = 0; i < stagePaths.length; i += 40) {
  git(['add', '-A', '--'].concat(stagePaths.slice(i, i + 40)));
}
const staged = git(['diff', '--cached', '--name-only']);
if (!staged) { info('Aucune différence après application — rien à committer.'); process.exit(0); }
info('Fichiers stages :\n    ' + staged.split('\n').join('\n    '));

// --- 7. Commit + push ---------------------------------------------------------
git(['commit', '-m', commitMessage]);
ok('Commit créé.');

info('git push origin main en cours...');
const pushOut = git(['push', 'origin', 'main']);
if (pushOut) console.log('    ' + pushOut.split('\n').join('\n    '));

console.log('');
ok('Pousse sur origin/main -- le deploiement Vercel demarre.');
info('Surveille https://e-nova-saas.vercel.app puis reponds "pousse" a l\'agent');
info('pour la verification en direct (Etape C).');
