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

replaceInFile('src/pages/Dashboard.tsx', [
    ['"! Bonjour,"', '{t("dashboard.greeting")}'],
    ['"Voici le résumé des performances de votre boutique aujourd\'hui"', '{t("dashboard.summary")}'],
    ['"Une nouvelle ère pour le e-commerce en Algérie avec E-Nova Copilot"', '{t("dashboard.copilotBanner")}'],
    ['"...Écrivez à Copilot en arabe ou en français, il fait le travail à votre place"', '{t("dashboard.copilotSub")}'],
    ['"Aujourd\'hui"', '{t("dashboard.ranges.today")}'],
    ['"Hier"', '{t("dashboard.ranges.yesterday")}'],
    ['"jours 7"', '{t("dashboard.ranges.days7")}'],
    ['"jours 30"', '{t("dashboard.ranges.days30")}'],
    ['"Ce mois"', '{t("dashboard.ranges.thisMonth")}'],
    ['"Mois dernier"', '{t("dashboard.ranges.lastMonth")}'],
    ['"Cette année"', '{t("dashboard.ranges.thisYear")}'],
    ['"Analytiques avancées"', '{t("dashboard.advancedAnalytics")}'],
    ['"Panier moyen"', '{t("dashboard.avgCart")}'],
    ['"Revenus"', '{t("dashboard.revenue")}'],
    ['"Livrées"', '{t("dashboard.delivered")}'],
    ['"Commandes"', '{t("dashboard.orders")}'],
    ['"Conversion"', '{t("dashboard.conversion")}'],
    ['"Pages vues"', '{t("dashboard.pageViews")}'],
    ['"Visiteurs"', '{t("dashboard.visitors")}'],
    ['"Visiteurs uniques"', '{t("dashboard.visitorsUnique")}'],
    ['"Annulées"', '{t("dashboard.canceled")}'],
    ['".vs période préc"', '{t("dashboard.vsLastPeriod")}'],
    ['"Les heures où vos clients achètent le plus"', '{t("dashboard.chartTitle")}'],
    ['"Top wilayas"', '{t("dashboard.topWilayas")}'],
    ['"Principales wilayas"', '{t("dashboard.mainWilayas")}'],
    ['"Top produits"', '{t("dashboard.topProducts")}'],
    ['"Commandes par statut"', '{t("dashboard.ordersByStatus")}'],
]);
