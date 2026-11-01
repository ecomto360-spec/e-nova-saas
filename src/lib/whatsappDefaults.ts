/**
 * Valeurs par défaut des messages WhatsApp — partagées client/serveur
 * (aucune dépendance serveur : ce fichier est sûr dans le bundle navigateur).
 */

export const WA_DEFAULT_MESSAGE_AR =
  "مرحباً {nom} 👋\nلقد بدأت طلباً في متجر {boutique} :\n📦 {produits}\n💰 الإجمالي : {total} دج (الدفع عند الاستلام)\n📍 {wilaya}\n\nهل تريد تأكيد طلبك ؟\n🔗 {lien}";

export const WA_DEFAULT_MESSAGE_FR =
  "Bonjour {nom} 👋\nVous avez commencé une commande chez {boutique} :\n📦 {produits}\n💰 Total : {total} DA (paiement à la livraison)\n📍 {wilaya}\n\nSouhaitez-vous confirmer votre commande ?\n🔗 {lien}";

export const WA_ORDER_CONFIRM_AR =
  "مرحباً {nom} 👋\nتم تسجيل طلبك في متجر {boutique} ✅\n📦 {produits}\n💰 الإجمالي : {total} دج\n📍 {wilaya}\n\nيرجى تأكيد طلبك :\n🔗 {lien}";

export const WA_ORDER_CONFIRM_FR =
  "Bonjour {nom} 👋\nVotre commande chez {boutique} a bien été enregistrée ✅\n📦 {produits}\n💰 Total : {total} DA\n📍 {wilaya}\n\nMerci de confirmer votre commande :\n🔗 {lien}";

export const WA_ORDER_STATUS_AR: Record<string, string> = {
  "Confirmée": "تم تأكيد طلبك ✅",
  "Expédiée": "تم شحن طلبك 🚚",
  "En livraison": "طلبك في الطريق إليك 🚚",
  "Au bureau de livraison": "طلبك وصل إلى مكتب التوصيل 🏢 يمكنك استلامه الآن.",
  "Livrée": "تم توصيل طلبك بنجاح 🎉 شكراً لثقتك!",
  "Échec": "تعذر توصيل طلبك ❌ يرجى التواصل معنا.",
  "Retour": "تم إرجاع طلبك إلى المتجر ↩️"
};

export const WA_ORDER_STATUS_FR: Record<string, string> = {
  "Confirmée": "Votre commande est confirmée ✅",
  "Expédiée": "Votre commande a été expédiée 🚚",
  "En livraison": "Votre commande est en cours de livraison 🚚",
  "Au bureau de livraison": "Votre commande est arrivée au bureau de livraison 🏢 vous pouvez la récupérer.",
  "Livrée": "Votre commande a été livrée avec succès 🎉 merci de votre confiance !",
  "Échec": "La livraison de votre commande a échoué ❌ merci de nous contacter.",
  "Retour": "Votre commande a été retournée au magasin ↩️"
};
