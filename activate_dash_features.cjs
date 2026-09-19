const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Add showHowTo state
if (!content.includes('const [showHowTo, setShowHowTo] = useState(false);')) {
  content = content.replace(
    'const [loadingOrders, setLoadingOrders] = useState(true);',
    'const [loadingOrders, setLoadingOrders] = useState(true);\n  const [showHowTo, setShowHowTo] = useState(false);'
  );
}

// 2. Add ChevronUp import if missing
if (!content.includes('ChevronUp,')) {
    content = content.replace('ChevronDown,', 'ChevronDown, ChevronUp,');
}

// 3. Add advancedStats useMemo
const advancedStatsString = `  const advancedStats = useMemo(() => {
    const statusCounts = {};
    const productsCounts = {};
    const wilayasCounts = {};

    stats.currentOrders.forEach(o => {
      // Status
      statusCounts[o.status || 'Nouveau'] = (statusCounts[o.status || 'Nouveau'] || 0) + 1;
      
      // Wilaya
      const wilaya = o.wilaya || (o.shippingAddress && o.shippingAddress.wilaya);
      if (wilaya) {
        wilayasCounts[wilaya] = (wilayasCounts[wilaya] || 0) + 1;
      }

      // Products
      if (Array.isArray(o.items)) {
         o.items.forEach((item) => {
            const name = item.name || item.productName || 'Produit inconnu';
            productsCounts[name] = (productsCounts[name] || 0) + (item.quantity || 1);
         });
      }
    });

    const topStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topProducts = Object.entries(productsCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topWilayas = Object.entries(wilayasCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    
    const recentOrders = [...stats.currentOrders].sort((a, b) => parseOrderDate(b).getTime() - parseOrderDate(a).getTime()).slice(0, 5);

    return { topStatuses, topProducts, topWilayas, recentOrders };
  }, [stats.currentOrders]);`;

if (!content.includes('const advancedStats = useMemo(')) {
  content = content.replace(
    'const kpis = [',
    advancedStatsString + '\n\n  const kpis = ['
  );
}


// 4. Replace Three Cards and Bottom Left Column
const oldCardsAndLeft = `<div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <p className="text-sm text-neutral-400">Aucune commande dans cette période</p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <PackageIcon className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">Top produits</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                  <PackageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm text-neutral-400">Aucune vente dans cette période</p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 text-neutral-500 border-b border-dashed border-neutral-500 pb-1">
                     <h3 className="text-sm font-medium">Principales wilayas</h3>
                   </div>
                   <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-yellow-500" />
                     <h3 className="text-sm font-medium text-white">Top wilayas</h3>
                   </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-sm text-neutral-400">Aucune commande dans cette période</p>
              </div>
            </div>
          </div>

          {/* Bottom Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commandes récentes */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-neutral-400" />
                    <h3 className="text-base font-semibold text-white">Commandes récentes</h3>
                  </div>
                  <Link to="/orders" className="bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors">
                    Voir tout
                  </Link>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 rounded-3xl bg-[#2a2a32] flex items-center justify-center mb-4 shadow-inner">
                    <Lock className="w-6 h-6 text-neutral-500" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Pas encore de commandes</h4>
                  <p className="text-sm text-neutral-400 mb-6">Partagez le lien de votre boutique et commencez à vendre</p>
                  <div className="flex items-center gap-3">
                    <Link to="/products/new" className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-yellow-400 transition-colors">
                      <Plus className="w-4 h-4" />
                      Ajouter un produit
                    </Link>
                    <button className="border border-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-neutral-800 transition-colors" onClick={() => {
                       navigator.clipboard.writeText(\`\${window.location.origin}/store/\${tenantData?.storeUrl || ''}\`);
                    }}>
                      <Share2 className="w-4 h-4" />
                      Partager le lien
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment utiliser */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full border border-neutral-400"></div>
                  </div>
                  <h3 className="text-base font-medium text-white">Comment utiliser la plateforme</h3>
                </div>
                <ChevronDown className="w-5 h-5 text-neutral-500" />
              </div>`;

const newCardsAndLeft = `<div className="flex-1 flex flex-col">
                {advancedStats.topStatuses.length > 0 ? (
                  <div className="space-y-4">
                    {advancedStats.topStatuses.map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300">{status}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-400">Aucune commande dans cette période</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <PackageIcon className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">Top produits</h3>
              </div>
              <div className="flex-1 flex flex-col">
                {advancedStats.topProducts.length > 0 ? (
                   <div className="space-y-4">
                    {advancedStats.topProducts.map(([product, count]) => (
                      <div key={product} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300 truncate max-w-[150px]" title={product}>{product}</span>
                        <span className="text-sm font-medium text-white">{count} vendus</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                      <PackageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-400">Aucune vente dans cette période</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 text-neutral-500 border-b border-dashed border-neutral-500 pb-1">
                     <h3 className="text-sm font-medium">Principales wilayas</h3>
                   </div>
                   <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-yellow-500" />
                     <h3 className="text-sm font-medium text-white">Top wilayas</h3>
                   </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                {advancedStats.topWilayas.length > 0 ? (
                  <div className="space-y-4">
                    {advancedStats.topWilayas.map(([wilaya, count]) => (
                      <div key={wilaya} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300 truncate max-w-[150px]">{wilaya}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-400">Aucune commande dans cette période</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commandes récentes */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-neutral-400" />
                    <h3 className="text-base font-semibold text-white">Commandes récentes</h3>
                  </div>
                  <Link to="/orders" className="bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors">
                    Voir tout
                  </Link>
                </div>
                
                <div className="flex-1 flex flex-col">
                  {advancedStats.recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs font-medium text-neutral-500 border-b border-neutral-800">
                            <th className="pb-3 font-medium">Référence</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Client</th>
                            <th className="pb-3 font-medium">Montant</th>
                            <th className="pb-3 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {advancedStats.recentOrders.map(order => (
                             <tr key={order.id} className="text-sm hover:bg-neutral-800/20 transition-colors">
                               <td className="py-4 text-white font-medium">{order.reference || order.id.slice(-6).toUpperCase()}</td>
                               <td className="py-4 text-neutral-400">{parseOrderDate(order).toLocaleDateString()}</td>
                               <td className="py-4 text-neutral-300">{order.customer?.name || order.shippingAddress?.fullName || 'Client'}</td>
                               <td className="py-4 text-white font-medium">{order.total} DA</td>
                               <td className="py-4">
                                 <span className={\`px-2.5 py-1 rounded-full text-xs font-medium \${
                                    order.status === 'Livrée' ? 'bg-emerald-500/10 text-emerald-500' :
                                    order.status === 'Annulée' || order.status === 'Échouée' ? 'bg-red-500/10 text-red-500' :
                                    order.status === 'En cours' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                 }\`}>
                                   {order.status || 'Nouveau'}
                                 </span>
                               </td>
                             </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 rounded-3xl bg-[#2a2a32] flex items-center justify-center mb-4 shadow-inner">
                        <Lock className="w-6 h-6 text-neutral-500" />
                      </div>
                      <h4 className="text-white font-semibold mb-2">Pas encore de commandes</h4>
                      <p className="text-sm text-neutral-400 mb-6">Partagez le lien de votre boutique et commencez à vendre</p>
                      <div className="flex items-center gap-3">
                        <Link to="/products/new" className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-yellow-400 transition-colors">
                          <Plus className="w-4 h-4" />
                          Ajouter un produit
                        </Link>
                        <button className="border border-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-neutral-800 transition-colors" onClick={() => {
                           navigator.clipboard.writeText(\`\${window.location.origin}/store/\${tenantData?.storeUrl || ''}\`);
                        }}>
                          <Share2 className="w-4 h-4" />
                          Partager le lien
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment utiliser */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] overflow-hidden">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 transition-colors"
                  onClick={() => setShowHowTo(!showHowTo)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full border border-neutral-400"></div>
                    </div>
                    <h3 className="text-base font-medium text-white">Comment utiliser la plateforme</h3>
                  </div>
                  {showHowTo ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
                </div>
                {showHowTo && (
                   <div className="px-5 pb-5 pt-2 border-t border-neutral-800 text-sm text-neutral-400 space-y-4">
                     <p>Bienvenue sur votre tableau de bord ! Voici quelques étapes pour bien démarrer :</p>
                     <ul className="list-disc pl-5 space-y-2">
                       <li>Allez dans <strong>Paramètres</strong> pour configurer vos méthodes de livraison et de paiement.</li>
                       <li>Personnalisez l'apparence de votre boutique via <strong>Personnaliser la boutique</strong>.</li>
                       <li>Ajoutez vos premiers articles dans <strong>Produits</strong>.</li>
                       <li>Partagez le lien de votre boutique et commencez à recevoir des commandes !</li>
                     </ul>
                   </div>
                )}
              </div>`;

content = content.replace(oldCardsAndLeft, newCardsAndLeft);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Updated advanced stats logic");
