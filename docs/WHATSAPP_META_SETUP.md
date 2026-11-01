# Order Automation (WhatsApp) — Configuration Meta & variables d'environnement

## 1. Variables d'environnement Vercel (serveur uniquement)

À définir dans **Vercel → Project → Settings → Environment Variables** :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `WHATSAPP_TOKEN` | Pour l'envoi réel | Jeton d'accès permanent (ou temporaire) de la Cloud API. **Jamais côté client.** |
| `WHATSAPP_PHONE_NUMBER_ID` | Pour l'envoi réel | Identifiant du numéro WhatsApp Business (Meta → WhatsApp Manager → API Setup). |
| `WHATSAPP_APP_SECRET` | Pour le webhook | Secret de l'application (Meta → App settings → Basic). Vérifie la signature `X-Hub-Signature-256`. |
| `WHATSAPP_VERIFY_TOKEN` | Pour le webhook | Chaîne libre (ex. `enova-verif-2026`) à coller lors de l'abonnement au webhook. |
| `APP_URL` | Recommandé | URL publique du site (ex. `https://e-nova-saas.vercel.app`) pour les liens des messages. |

⚠️ **Sans `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`, l'extension fonctionne en
mode simulation** : toute la chaîne (délais, heures calmes, boutons, conversion,
compteurs) est exécutable et testable, mais aucun message réel n'est envoyé —
les messages sont marqués « simulés » dans le dashboard.

## 2. Créer l'application Meta

1. <https://developers.facebook.com> → **My Apps → Create App** → type **Business**.
2. Ajouter le produit **WhatsApp**.
3. **API Setup** : noter le *Phone number ID* et générer un *Access token*
   temporaire. Pour un jeton permanent : System User dans Meta Business Manager
   (Business Settings → System Users → Add → rôle Admin → générer le token avec
   les permissions `whatsapp_business_messaging`, `whatsapp_business_management`).
4. Ajouter le numéro d'affichage (*display phone number*) — peut être le numéro
   de test fourni par Meta au début.

## 3. Webhook (statuts + réponses clients)

1. Meta → App → **WhatsApp → Configuration** :
   - **Callback URL** : `https://e-nova-saas.vercel.app/api/webhooks/whatsapp`
   - **Verify token** : la valeur de `WHATSAPP_VERIFY_TOKEN`
   - Cliquer **Verify and save** (l'endpoint répond au challenge GET).
2. S'abonner au champ **messages** (obligatoire) dans *Webhook fields*.
3. Renseigner `WHATSAPP_APP_SECRET` dans Vercel : chaque requête POST est
   vérifiée par HMAC-SHA256 (`X-Hub-Signature-256`) — les requêtes non signées
   correctement sont rejetées (401).

Le webhook gère : statuts `sent / delivered / read / failed` (badge du
dashboard), les réponses boutons (Confirmer / Modifier / Non merci), le
désabonnement **STOP**, l'idempotence par identifiant de message, et le texte
libre (→ tâche marchand).

## 4. Templates (conformité Meta)

| Usage | Catégorie Meta | À soumettre |
|---|---|---|
| Relance panier abandonné | **Marketing** | Oui, avant tout envoi hors fenêtre 24 h |
| Confirmation de commande validée | **Utility** | Oui, avant tout envoi hors fenêtre 24 h |
| Notifications de statut (expédiée, livrée…) | **Utility** | Oui |

- Soumettre les templates dans **WhatsApp Manager → Message templates** avec la
  catégorie correcte (un template soumis en mauvaise catégorie est rejeté).
- L'envoi actuel utilise des **messages texte** : ils passent sans template
  dans la **fenêtre de 24 h** qui suit la dernière réponse du client. Pour
  contacter un client hors fenêtre, créer un template approuvé et brancher son
  nom dans le code (`whatsappServer.ts → waSendText`, section template).
- **Tant qu'aucun template n'est approuvé, n'envoyez que dans la fenêtre 24 h**
  (c'est le comportement par défaut de la Cloud API).

## 5. Ordonnanceur (délais 5/10/30/60 min, heures calmes, rappel 4 h)

Les envois sont traités par `/api/whatsapp/process` :
- **Cron Vercel quotidien** à 03:07 UTC (`vercel.json → crons`). ⚠️ Le plan
  *Hobby* de Vercel n'accepte qu'**un cron par jour maximum** — une planification
  plus fréquente (`*/10`) fait **échouer le déploiement**. En pratique, le
  traitement en temps réel repose sur le trafic (piggyback ci-dessous) et sur
  le bouton **« Traiter maintenant »** (réglages de l'extension) : le cron
  quotidien sert de filet de sécurité (paniers dus pendant une période sans
  visiteurs). Sur un plan **Pro**, la planification peut être passée à
  `*/10 * * * *`.
- **Piggyback** : chaque POST `/api/abandoned-carts/track` (formulaire boutique)
  déclenche un cycle en arrière-plan (garde-fou : 1 cycle/minute max).
- **Manuel** : réglages de l'extension → *Traitement immédiat*.

## 6. Consentement & STOP (conformité)

- Mention sous le formulaire de commande : « En saisissant votre numéro, vous
  acceptez d'être contacté par WhatsApp au sujet de votre commande ». Une
  **case à cocher obligatoire** peut être activée dans les réglages — le
  consentement (texte + date + session) est stocké avec le panier.
- **STOP** : un client répondant « STOP » (ou l'équivalent arabe) est
  désinscrit — aucun nouvel envoi. Les paniers « contactés / récupérés /
  refusés » et les téléphones ayant déjà commandé ne sont jamais relancés.

## 7. Collections Firestore utilisées

- `whatsapp_settings/{uid}` — réglages du vendeur.
- `whatsapp_messages/{id}` — journal complet (envois + réponses).
- `whatsapp_unsubscribes/{tenant}_{tel}` — désinscriptions STOP.
- `abandoned_carts` — champs ajoutés : `waStatus`, `waSentAt`, `waToken`,
  `consentText`, `consentChecked`, statut `refused`.
- `orders` — champs ajoutés : `source` (« WhatsApp – panier abandonné »),
  `whatsappConfirmed`, `confirmedAt`, `trackingCode`, `waConfirmSent`,
  `waLastStatusSent`.
