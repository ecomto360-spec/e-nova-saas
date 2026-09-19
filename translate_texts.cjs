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

// Common patterns: >Text< or "Text"
translate('src/pages/Dashboard.tsx', [
    ['>! Bonjour, ', '>{t("dashboard.greeting")}, '],
    ['>Voici le résumé des performances de votre boutique aujourd\'hui<', '>{t("dashboard.summary")}<'],
    ['>Une nouvelle ère pour le e-commerce en Algérie avec E-Nova Copilot<', '>{t("dashboard.copilotBanner")}<'],
    ['>...Écrivez à Copilot en arabe ou en français, il fait le travail à votre place : il<', '>{t("dashboard.copilotSub")}<'],
    ['>Aujourd\'hui<', '>{t("dashboard.ranges.today")}<'],
    ['>Hier<', '>{t("dashboard.ranges.yesterday")}<'],
    ['>jours 7<', '>{t("dashboard.ranges.days7")}<'],
    ['>jours 30<', '>{t("dashboard.ranges.days30")}<'],
    ['>Ce mois<', '>{t("dashboard.ranges.thisMonth")}<'],
    ['>Mois dernier<', '>{t("dashboard.ranges.lastMonth")}<'],
    ['>Cette année<', '>{t("dashboard.ranges.thisYear")}<'],
    ['>Analytiques avancées<', '>{t("dashboard.advancedAnalytics")}<'],
    ['>Panier moyen<', '>{t("dashboard.avgCart")}<'],
    ['>Revenus<', '>{t("dashboard.revenue")}<'],
    ['>Livrées<', '>{t("dashboard.delivered")}<'],
    ['>Commandes<', '>{t("dashboard.orders")}<'],
    ['>Conversion<', '>{t("dashboard.conversion")}<'],
    ['>Pages vues<', '>{t("dashboard.pageViews")}<'],
    ['>Visiteurs<', '>{t("dashboard.visitors")}<'],
    ['>Visiteurs uniques<', '>{t("dashboard.visitorsUnique")}<'],
    ['>Annulées<', '>{t("dashboard.canceled")}<'],
    ['>.vs période préc<', '>{t("dashboard.vsLastPeriod")}<'],
    ['>Les heures où vos clients achètent le plus<', '>{t("dashboard.chartTitle")}<'],
    ['>Top wilayas<', '>{t("dashboard.topWilayas")}<'],
    ['>Principales wilayas<', '>{t("dashboard.mainWilayas")}<'],
    ['>Top produits<', '>{t("dashboard.topProducts")}<'],
    ['>Commandes par statut<', '>{t("dashboard.ordersByStatus")}<']
]);

translate('src/pages/StorePersonalization.tsx', [
    ['>Thèmes de la boutique<', '>{t("store.themes")}<'],
    ['>Choisissez le design qui correspond le mieux à votre marque<', '>{t("store.themesSub")}<'],
    ['>Variantes<', '>{t("store.variants")}<'],
    ['>Boutique<', '>{t("store.storeFront")}<'],
    ['>Aperçu<', '>{t("store.preview")}<'],
    ['>Activer ce thème<', '>{t("store.activate")}<'],
    ['>Thème actuel<', '>{t("store.activeTheme")}<'],
    ['>Personnaliser<', '>{t("store.customize")}<'],
    ['placeholder="...Rechercher une section"', 'placeholder={t("store.searchSection")}'],
    ['>Langue de la boutique<', '>{t("store.lang")}<'],
    ['>En-tête et Logo<', '>{t("store.headerLogo")}<'],
    ['>Couleurs et Police<', '>{t("store.colorsFonts")}<'],
    ['>Barre de recherche<', '>{t("store.searchBar")}<'],
    ['>Barre d\'annonce<', '>{t("store.announcement")}<'],
    ['>Section Hero<', '>{t("store.heroSection")}<'],
    ['>Catégories<', '>{t("store.categories")}<'],
    ['>Bannière promotionnelle<', '>{t("store.promoBanner")}<'],
    ['>Produits vedettes<', '>{t("store.featuredProducts")}<'],
    ['>Infos de la marque<', '>{t("store.brandInfo")}<'],
    ['>Badges de confiance<', '>{t("store.trustBadges")}<'],
    ['>Voir la boutique<', '>{t("store.viewStore")}<'],
    ['>Produit<', '>{t("store.product")}<'],
    ['>Commande<', '>{t("store.order")}<'],
    ['>Accueil<', '>{t("store.home")}<']
]);

translate('src/pages/Categories.tsx', [
    ['>Gestion des catégories<', '>{t("categories.title")}<'],
    ['>Ajoutez et modifiez les catégories de produits pour organiser votre boutique<', '>{t("categories.sub")}<'],
    ['>Ajouter une catégorie<', '>{t("categories.add")}<'],
    ['>Sous-catégories uniquement dans la catégorie parente<', '>{t("categories.subcategoriesOnly")}<'],
    ['>Les sous-catégories seront masquées sur la page d\'accueil<', '>{t("categories.subcategoriesInfo")}<'],
    ['>Tous les statuts<', '>{t("categories.allStatuses")}<'],
    ['placeholder="...Rechercher une catégorie par nom"', 'placeholder={t("categories.search")}'],
    ['>.Aucune catégorie trouvée<', '>{t("categories.notFound")}<']
]);

translate('src/pages/Products.tsx', [
    ['>Produits<', '>{t("products.title")}<'],
    ['>.Gérez votre catalogue de produits, fixez vos prix et suivez vos stocks<', '>{t("products.sub")}<'],
    ['>Ajouter un produit<', '>{t("products.add")}<'],
    ['>Valeur d\'inventaire<', '>{t("products.inventoryValue")}<'],
    ['>Stock critique (≤5)<', '>{t("products.criticalStock")}<'],
    ['>alertes<', '>{t("products.alerts")}<'],
    ['>Produits actifs<', '>{t("products.activeProducts")}<'],
    ['>en ligne<', '>{t("products.online")}<'],
    ['>Total catalogue<', '>{t("products.totalCatalog")}<'],
    ['>produits<', '>{t("products.productsCount")}<'],
    ['>Tout sélectionner<', '>{t("products.selectAll")}<'],
    ['>En vedette<', '>{t("products.featured")}<'],
    ['>Tout le stock<', '>{t("products.allStock")}<'],
    ['>Tous les statuts<', '>{t("products.allStatuses")}<'],
    ['>Toutes les catégories<', '>{t("products.allCategories")}<'],
    ['placeholder="...Rechercher un produit"', 'placeholder={t("products.search")}'],
    ['>Afficher<', '>{t("products.display")}<'],
    ['>Précédent<', '>{t("products.prev")}<'],
    ['>Suivant<', '>{t("products.next")}<'],
]);

translate('src/pages/Orders.tsx', [
    ['>Commandes<', '>{t("orders.title")}<'],
    ['>.Gérez vos commandes reçues, mettez à jour les statuts et organisez vos expéditions<', '>{t("orders.sub")}<'],
    ['>Créer une commande<', '>{t("orders.create")}<'],
    ['>Exporter<', '>{t("orders.export")}<'],
    ['>Encaissé (Livrées)<', '>{t("orders.cashed")}<'],
    ['>En cours de livraison<', '>{t("orders.delivering")}<'],
    ['>À confirmer<', '>{t("orders.toConfirm")}<'],
    ['>Total commandes<', '>{t("orders.total")}<'],
    ['>Tous<', '>{t("orders.all")}<'],
    ['>En attente<', '>{t("orders.pending")}<'],
    ['>Confirmée<', '>{t("orders.confirmed")}<'],
    ['>Expédiée<', '>{t("orders.shipped")}<'],
    ['>Livrée<', '>{t("orders.delivered")}<'],
    ['>Annulée<', '>{t("orders.canceled")}<'],
    ['>Retournée<', '>{t("orders.returned")}<'],
    ['>Toutes les wilayas<', '>{t("orders.allWilayas")}<'],
    ['placeholder="...Rechercher par n° commande, client, téléphone, commune"', 'placeholder={t("orders.search")}'],
    ['>Voir<', '>{t("orders.view")}<']
]);

translate('src/pages/AbandonedCarts.tsx', [
    ['>Paniers abandonnés<', '>{t("abandoned.title")}<'],
    ['>Paramètres de relance<', '>{t("abandoned.recoverySettings")}<'],
    ['>Valeur Récupérée<', '>{t("abandoned.recoveredValue")}<'],
    ['>Paniers Récupérés<', '>{t("abandoned.recoveredCarts")}<'],
    ['>Total Paniers Abandonnés<', '>{t("abandoned.totalAbandoned")}<'],
    ['>Filtres<', '>{t("abandoned.filters")}<'],
    ['placeholder="...Rechercher par client ou email"', 'placeholder={t("abandoned.search")}'],
    ['>ACTION<', '>{t("abandoned.action")}<'],
    ['>DATE<', '>{t("abandoned.date")}<'],
    ['>MONTANT<', '>{t("abandoned.amount")}<'],
    ['>CLIENT<', '>{t("abandoned.client")}<'],
    ['>Relancer<', '>{t("abandoned.remind")}<']
]);

translate('src/pages/Customers.tsx', [
    ['>Clients<', '>{t("customers.title")}<'],
    ['>Suivez vos nouveaux clients et gérez la liste noire<', '>{t("customers.sub")}<'],
    ['>Total clients<', '>{t("customers.total")}<'],
    ['>Nouveaux cette semaine<', '>{t("customers.newThisWeek")}<'],
    ['>Bannis<', '>{t("customers.banned")}<'],
    ['>Liste noire<', '>{t("customers.blacklist")}<'],
    ['placeholder="Rechercher par nom, téléphone ou lieu..."', 'placeholder={t("customers.search")}'],
    ['>Exporter CSV<', '>{t("customers.exportCSV")}<'],
    ['>Client<', '>{t("customers.client")}<'],
    ['>Téléphone<', '>{t("customers.phone")}<'],
    ['>Lieu<', '>{t("customers.location")}<'],
    ['>Commandes<', '>{t("customers.orders")}<'],
    ['>Total des achats<', '>{t("customers.totalPurchases")}<'],
    ['>Identités multiples<', '>{t("customers.multipleIds")}<'],
    ['>Probabilité de fausse commande<', '>{t("customers.fakeProb")}<'],
    ['>Actions<', '>{t("customers.actions")}<'],
    ['>Sûr<', '>{t("customers.safe")}<']
]);

translate('src/pages/DeliverySettings.tsx', [
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

translate('src/pages/Carriers.tsx', [
    ['>Lier les transporteurs<', '>{t("carriers.title")}<'],
    ['>.Liez votre boutique aux transporteurs pour envoyer et suivre les commandes. Vous pouvez lier plusieurs transporteurs et choisir le plus adapté pour chaque commande<', '>{t("carriers.sub")}<'],
    ['>liés sur 51<', '>{t("carriers.linked")}<'],
    ['>Voir la vidéo importante<', '>{t("carriers.watchVideo")}<'],
    ['placeholder="...Rechercher un transporteur"', 'placeholder={t("carriers.search")}'],
    ['>Transporteurs disponibles<', '>{t("carriers.available")}<'],
    ['>Lier<', '>{t("carriers.link")}<']
]);

