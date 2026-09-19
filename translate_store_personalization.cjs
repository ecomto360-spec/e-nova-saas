const fs = require('fs');

function replaceInFile(path, replacements) {
    if(!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    let changed = false;

    // Check if useLanguage needs to be imported
    if (!content.includes('useLanguage') && !content.includes('import { useLanguage }')) {
        content = content.replace(/(import.*from.*["'].*["'];?)/, `$1\nimport { useLanguage } from "../contexts/LanguageContext";`);
        
        // Inject inside the main component
        content = content.replace(/export default function \w+\(\)\s*{/, `$&
  const { t, dir } = useLanguage();`);
        changed = true;
    }

    for (const [search, replace] of replacements) {
        if(content.includes(search)) {
           content = content.replace(search, replace);
           changed = true;
        }
    }

    if(changed) fs.writeFileSync(path, content);
}

replaceInFile('src/pages/StorePersonalization.tsx', [
    ['"Thèmes de la boutique"', '{t("store.themes")}'],
    ['"Choisissez le design qui correspond le mieux à votre marque"', '{t("store.themesSub")}'],
    ['"Variantes"', '{t("store.variants")}'],
    ['"Boutique"', '{t("store.storeFront")}'],
    ['"Aperçu"', '{t("store.preview")}'],
    ['"Activer ce thème"', '{t("store.activate")}'],
    ['"Thème actuel"', '{t("store.activeTheme")}'],
    ['"Personnaliser"', '{t("store.customize")}'],
    ['"...Rechercher une section"', '{t("store.searchSection")}'],
    ['"Langue de la boutique"', '{t("store.lang")}'],
    ['"En-tête et Logo"', '{t("store.headerLogo")}'],
    ['"Couleurs et Police"', '{t("store.colorsFonts")}'],
    ['"Barre de recherche"', '{t("store.searchBar")}'],
    ['"Barre d\'annonce"', '{t("store.announcement")}'],
    ['"Section Hero"', '{t("store.heroSection")}'],
    ['"Catégories"', '{t("store.categories")}'],
    ['"Bannière promotionnelle"', '{t("store.promoBanner")}'],
    ['"Produits vedettes"', '{t("store.featuredProducts")}'],
    ['"Infos de la marque"', '{t("store.brandInfo")}'],
    ['"Badges de confiance"', '{t("store.trustBadges")}'],
    ['"Voir la boutique"', '{t("store.viewStore")}'],
    ['"Produit"', '{t("store.product")}'],
    ['"Commande"', '{t("store.order")}'],
    ['"Accueil"', '{t("store.home")}']
]);
