const fs = require('fs');

function translate(file, replacements) {
    if(!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Ensure useLanguage is imported
    if (!content.includes('useLanguage')) {
        content = content.replace(/(import.*from.*["'].*["'];?)/, `$1\nimport { useLanguage } from "../contexts/LanguageContext";`);
        
        // Inject inside the main component
        content = content.replace(/export default function \w+\(\)\s*{/, `$&
  const { t, dir } = useLanguage();`);
        changed = true;
    }

    for (const [search, replace] of replacements) {
        if(content.includes(search)) {
           content = content.split(search).join(replace);
           changed = true;
        }
    }

    if(changed) fs.writeFileSync(file, content);
}

translate('src/pages/Themes.tsx', [
    ['>Thèmes de la boutique<', '>{t("store.themes")}<'],
    ['>Choisissez le design qui correspond le mieux à votre marque<', '>{t("store.themesSub")}<'],
    ['>Variantes<', '>{t("store.variants")}<'],
    ['>Boutique<', '>{t("store.storeFront")}<'],
    ['>Aperçu<', '>{t("store.preview")}<'],
    ['>Activer ce thème<', '>{t("store.activate")}<'],
    ['>Thème actuel<', '>{t("store.activeTheme")}<'],
    ['>Personnaliser<', '>{t("store.customize")}<']
]);

translate('src/pages/ShippingRates.tsx', [
    ['>Tarifs de livraison<', '>{t("delivery.title")}<'],
    ['>Gérer les tarifs de livraison pour toutes les wilayas<', '>{t("delivery.sub")}<'],
    ['>Livraison gratuite au-dessus d\'un montant<', '>{t("delivery.freeOver")}<'],
    ['>.Livraison gratuite uniquement pour les commandes dépassant le montant défini<', '>{t("delivery.freeOverSub")}<'],
    ['>Livraison gratuite pour toutes les commandes<', '>{t("delivery.freeAll")}<'],
    ['>.Une fois activé, la livraison sera 100% gratuite pour tous les clients quelle que soit la valeur de la commande<', '>{t("delivery.freeAllSub")}<'],
    ['>Désactivé<', '>{t("delivery.disabled")}<'],
    ['>wilaya 58<', '>{t("delivery.wilayas58")}<'],
    ['>wilaya 69<', '>{t("delivery.wilayas69")}<'],
    ['>Recommandé<', '>{t("delivery.recommended")}<'],
    ['>Système de wilayas<', '>{t("delivery.system")}<'],
    ['>Choisissez le nombre de wilayas à afficher dans votre boutique<', '>{t("delivery.systemSub")}<'],
    ['>wilayas - Compatible avec les transporteurs 58<', '>{t("delivery.compatible")}<'],
    ['>Inclut les wilayas originales prises en charge par tous les transporteurs en Algérie<', '>{t("delivery.compatibleSub")}<'],
    ['>Source des tarifs<', '>{t("delivery.source")}<'],
    ['>Appliquer les tarifs par défaut<', '>{t("delivery.applyDefault")}<'],
    ['>Durée de livraison (jours)<', '>{t("delivery.duration")}<'],
    ['>Prix livraison au bureau (DA)<', '>{t("delivery.deskPrice")}<'],
    ['>Prix livraison à domicile (DA)<', '>{t("delivery.homePrice")}<'],
    ['>Appliquer à tout<', '>{t("delivery.applyAll")}<'],
    ['>Afficher uniquement les actives<', '>{t("delivery.showActiveOnly")}<'],
    ['placeholder="...Rechercher une wilaya"', 'placeholder={t("delivery.search")}'],
    ['>Activé<', '>{t("delivery.active")}<'],
    ['>DURÉE (JOURS)<', '>{t("delivery.durationCol")}<'],
    ['>LIVRAISON AU BUREAU<', '>{t("delivery.deskCol")}<'],
    ['>LIVRAISON À DOMICILE<', '>{t("delivery.homeCol")}<'],
    ['>WILAYA<', '>{t("delivery.wilayaCol")}<']
]);

translate('src/pages/ShippingCarriers.tsx', [
    ['>Lier les transporteurs<', '>{t("carriers.title")}<'],
    ['>.Liez votre boutique aux transporteurs pour envoyer et suivre les commandes. Vous pouvez lier plusieurs transporteurs et choisir le plus adapté pour chaque commande<', '>{t("carriers.sub")}<'],
    ['>liés sur 51<', '>{t("carriers.linked")}<'],
    ['>Voir la vidéo importante<', '>{t("carriers.watchVideo")}<'],
    ['placeholder="...Rechercher un transporteur"', 'placeholder={t("carriers.search")}'],
    ['>Transporteurs disponibles<', '>{t("carriers.available")}<'],
    ['>Lier<', '>{t("carriers.link")}<']
]);

