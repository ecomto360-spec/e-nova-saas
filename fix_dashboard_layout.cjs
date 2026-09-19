const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Ensure new icons are imported
const newIcons = ['PieChart', 'MapPin', 'Clock', 'Lock', 'Copy', 'Plus', 'ListTodo', 'Share2', 'ChevronDown', 'Store'];
for (const icon of newIcons) {
  if (!content.includes(icon + ',')) {
     content = content.replace('XCircle, Package as PackageIcon } from "lucide-react";', `XCircle, Package as PackageIcon, ${icon} } from "lucide-react";`);
  }
}

// Ensure navigate is imported for buttons if we use it, or we can use Link.
// Let's use Link.

// Create the new layout for the bottom of the page
const chartsAndBelowOld = /\{\/\* Charts Area \*\/\}[\s\S]*?\)\;\n\}/;

const chartsAndBelowNew = `      {/* Charts Area */}
      {!loadingOrders && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1 */}
            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 h-80 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-semibold text-neutral-400">Les heures où vos clients achètent le plus</h3>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Commandes</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> Impressions</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="commandes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCommandes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                     <p className="text-sm text-neutral-400">Aucune donnée pour cette période</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2 */}
            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 h-80 flex flex-col">
              <div className="flex justify-end items-start mb-6">
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Visiteurs uniques</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Pages vues</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> Commandes</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} width={40} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="revenus" stroke="#eab308" strokeWidth={3} dot={{r:4, fill: '#eab308', strokeWidth:0}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-400">Aucune donnée pour cette période</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Three Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <PieChart className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">Commandes par statut</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
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
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Lien de votre boutique */}
              <div className="rounded-2xl bg-yellow-500 p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Store className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-bold text-black">Lien de votre boutique</h3>
                  </div>
                  <p className="text-black/80 text-sm mb-4">Partagez ce lien avec vos clients</p>
                  
                  <div className="flex items-center gap-2 bg-yellow-400/50 rounded-xl p-1 border border-yellow-400">
                    <div className="flex-1 px-3 text-black/80 text-sm truncate select-all">
                      {tenantData?.storeUrl ? \`\${window.location.host}/store/\${tenantData.storeUrl}\` : "URL non configurée"}
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(\`\${window.location.origin}/store/\${tenantData?.storeUrl || ''}\`)}
                      className="w-10 h-10 flex items-center justify-center bg-yellow-500 rounded-lg shadow-sm hover:bg-yellow-400 transition-colors text-black"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Guide de configuration */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Rocket className="w-5 h-5 text-white" />
                  <h3 className="text-base font-semibold text-white">Guide de configuration</h3>
                </div>
                
                <div className="bg-[#16161a] rounded-xl p-4 border border-neutral-800 flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0">
                    <ListTodo className="w-5 h-5 text-black" />
                  </div>
                  <p className="text-sm text-white font-medium">Complétez ces étapes pour lancer votre boutique</p>
                </div>
                
                <Link to="/settings" className="w-full bg-yellow-500 text-black px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
                  <ListTodo className="w-4 h-4" />
                  Continuer la configuration de votre boutique
                </Link>
              </div>

              {/* Tip DZBuild */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#2a2a24] to-[#1e1e24] p-6 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-sm font-bold text-yellow-500">DZBuild</h3>
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-500 ml-auto cursor-pointer" />
                </div>
                <p className="text-sm text-white font-medium mb-4 leading-relaxed">
                  Ajoutez un <span className="text-yellow-500">prix barré</span> au-dessus du prix de vente. 
                  Les clients achètent plus quand ils perçoivent une économie.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700 text-neutral-400 text-xs">
                  <span className="w-3 h-3 flex items-center justify-center border border-neutral-500 rounded-sm scale-[0.6]"><MapPin className="w-3 h-3" /></span>
                  Tarification
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}`;

content = content.replace(chartsAndBelowOld, chartsAndBelowNew);

// Make sure Sparkles is imported
if (!content.includes('Sparkles,')) {
   content = content.replace('HelpCircle,', 'HelpCircle, Sparkles,');
}

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Updated Dashboard layout");
