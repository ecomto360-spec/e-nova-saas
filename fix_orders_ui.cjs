const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

// 1. Add new state for the view
if (!content.includes('const [viewingOrder, setViewingOrder] = useState<OrderItem | null>(null);')) {
  content = content.replace(
    'const [isModalOpen, setIsModalOpen] = useState(false);',
    'const [isModalOpen, setIsModalOpen] = useState(false);\n  const [viewingOrder, setViewingOrder] = useState<OrderItem | null>(null);'
  );
}

// 2. Add icons
if (!content.includes('ArrowLeft')) {
   content = content.replace('MessageCircle,', 'MessageCircle, ArrowLeft, Shield, MapPin, Search, PackageOpen, LayoutList, CheckCircle, Package, Truck, Home,')
}

// 3. Update the actions column logic
const oldActions = `                          {/* Edit */}
                          <button
                            onClick={() => handleOpenModal(order)}
                            title="Modifier la commande"
                            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>`;
const newActions = `                          {/* View */}
                          <button
                            onClick={() => setViewingOrder(order)}
                            title="Voir les détails"
                            className="px-3 py-1.5 rounded-lg bg-[#2b2b36] hover:bg-[#3b3b46] text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold mr-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Voir
                          </button>
                          
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenModal(order)}
                            title="Modifier la commande"
                            className="p-2 rounded-lg text-neutral-400 hover:text-white bg-[#1e1e24] hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>`;

if (content.includes(oldActions)) {
   content = content.replace(oldActions, newActions);
}

// 4. Create Order details view
const fullViewCode = `  if (viewingOrder) {
    const badge = getStatusBadge(viewingOrder.status);
    const StatusIcon = badge.icon;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a2a32] flex items-center justify-center">
              <LayoutList className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Détails de la commande #{viewingOrder.orderNumber}
                <button className="text-neutral-500 hover:text-white transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setViewingOrder(null)}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-[#1e1e24] px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Commandes
          </button>
        </div>

        {/* Status Timeline */}
        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-8 relative overflow-hidden">
           <div className="absolute top-1/2 left-16 right-16 h-0.5 bg-neutral-800 -translate-y-1/2 z-0"></div>
           
           <div className="relative z-10 flex justify-between items-center w-full max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                   <Clock className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-bold text-yellow-500">Nouvelle commande</span>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-[#16161a] border-2 border-neutral-700 text-neutral-500 flex items-center justify-center">
                   <CheckCircle className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-medium text-neutral-500">Confirmée</span>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-[#16161a] border-2 border-neutral-700 text-neutral-500 flex items-center justify-center">
                   <Package className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-medium text-neutral-500">Préparation</span>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-[#16161a] border-2 border-neutral-700 text-neutral-500 flex items-center justify-center">
                   <Truck className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-medium text-neutral-500">Expédition</span>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-[#16161a] border-2 border-neutral-700 text-neutral-500 flex items-center justify-center">
                   <Home className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-medium text-neutral-500">Livraison</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {/* Client Info */}
              <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-6">
                 <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
                    <User className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-white">Informations client</h3>
                 </div>
                 
                 <div className="grid grid-cols-[150px_1fr] gap-y-4 text-sm">
                    <div className="text-neutral-500">Nom:</div>
                    <div className="text-white font-medium">{viewingOrder.client}</div>
                    
                    <div className="text-neutral-500">Téléphone:</div>
                    <div className="text-white font-medium">{viewingOrder.phone}</div>
                    
                    <div className="text-neutral-500">Probabilité de<br/>fausse commande:</div>
                    <div className="flex items-center gap-2">
                       <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold">0</span>
                       <span className="text-emerald-500 text-xs">Sûr</span>
                    </div>
                    
                    <div className="text-neutral-500 flex items-center h-full">Statut de<br/>bannissement:</div>
                    <div className="flex items-center gap-3">
                       <span className="text-emerald-500 flex items-center gap-1 text-xs font-medium"><CheckCircle2 className="w-4 h-4"/> Non banni</span>
                       <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors">
                         <Slash className="w-3 h-3" /> Bannir
                       </button>
                    </div>
                 </div>
              </div>
              
              {/* Delivery Address */}
              <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-6">
                 <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
                    <MapPin className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-white">Adresse de livraison</h3>
                 </div>
                 
                 <div className="grid grid-cols-[150px_1fr] gap-y-4 text-sm">
                    <div className="text-neutral-500">Wilaya:</div>
                    <div className="text-white font-medium">{viewingOrder.wilaya}</div>
                    
                    <div className="text-neutral-500">Commune:</div>
                    <div className="text-white font-medium">{viewingOrder.commune || "-"}</div>
                    
                    <div className="text-neutral-500">Adresse:</div>
                    <div className="text-white font-medium">{viewingOrder.address || "-"}</div>
                    
                    <div className="text-neutral-500">Type de livraison:</div>
                    <div className="text-white font-medium flex items-center gap-2">
                      Livraison à domicile
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-6">
                 <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
                    <RotateCw className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-white">Changer le statut</h3>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="relative">
                      <select className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm appearance-none outline-none focus:border-yellow-500">
                        <option value="En attente" selected={viewingOrder.status === 'En attente'}>En attente</option>
                        <option value="Confirmée" selected={viewingOrder.status === 'Confirmée'}>Confirmée</option>
                        <option value="Expédiée" selected={viewingOrder.status === 'Expédiée'}>Expédiée</option>
                        <option value="Livrée" selected={viewingOrder.status === 'Livrée'}>Livrée</option>
                        <option value="Annulée" selected={viewingOrder.status === 'Annulée'}>Annulée</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           handleOpenModal(viewingOrder);
                           setViewingOrder(null);
                         }}
                         className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                       >
                         <Edit2 className="w-3.5 h-3.5" /> Modifier la commande
                       </button>
                       <button 
                         onClick={() => {
                           setOrderToDelete(viewingOrder);
                           setViewingOrder(null);
                         }}
                         className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                       >
                         <Trash2 className="w-3.5 h-3.5" /> Supprimer
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
        
        {/* Products */}
        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-6">
           <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">Produits</h3>
              </div>
              <div className="flex gap-2">
                <button className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter un produit
                </button>
                <button className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل المتغيرات
                </button>
              </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-neutral-300">
               <thead className="text-xs text-neutral-500 border-b border-neutral-800">
                 <tr>
                   <th className="px-2 py-3 font-medium">Produit</th>
                   <th className="px-2 py-3 font-medium text-center">Prix</th>
                   <th className="px-2 py-3 font-medium text-center">Quantité</th>
                   <th className="px-2 py-3 font-medium text-right">Sous-total</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-800/70">
                 <tr>
                    <td className="px-2 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0 border border-neutral-700">
                            <ImageIcon className="w-5 h-5 text-neutral-500" />
                          </div>
                          <div>
                            <div className="font-semibold text-white mb-1">{viewingOrder.itemsSummary || "Produit standard"}</div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#16161a] border border-neutral-800 text-[10px]">
                               couleur: noir <div className="w-2 h-2 rounded-full bg-black border border-neutral-700"></div>
                            </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-2 py-4 text-center font-medium text-white">
                      {(viewingOrder.total - 475).toLocaleString()} DA
                    </td>
                    <td className="px-2 py-4">
                       <div className="flex items-center justify-center">
                          <div className="flex items-center bg-[#16161a] border border-neutral-800 rounded-lg overflow-hidden">
                             <button className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 transition-colors">-</button>
                             <div className="w-8 h-8 flex items-center justify-center font-medium text-white border-x border-neutral-800 text-xs">1</div>
                             <button className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 transition-colors">+</button>
                          </div>
                       </div>
                    </td>
                    <td className="px-2 py-4 text-right font-bold text-white">
                      {(viewingOrder.total - 475).toLocaleString()} DA
                    </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
                 <Calculator className="w-5 h-5 text-yellow-500" />
                 <h3 className="text-sm font-semibold text-white">Informations de la commande</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-neutral-400">Sous-total:</span>
                   <span className="text-white">{(viewingOrder.total - 475).toLocaleString()} DA</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-neutral-400">Livraison:</span>
                   <span className="text-white">475 DA</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                   <span className="text-base font-bold text-white">Total:</span>
                   <span className="text-xl font-black text-yellow-500">{viewingOrder.total.toLocaleString()} DA</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
                 <Clock className="w-5 h-5 text-yellow-500" />
                 <h3 className="text-sm font-semibold text-white">Historique</h3>
              </div>
              <div className="space-y-4 text-sm">
                 <div className="grid grid-cols-[120px_1fr] gap-2">
                   <span className="text-neutral-500">N° commande:</span>
                   <span className="text-white font-medium">#{viewingOrder.orderNumber} ORD-29005-20260908</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-2">
                   <span className="text-neutral-500">Date de commande:</span>
                   <span className="text-white font-medium">{viewingOrder.date} - 20:45</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-2">
                   <span className="text-neutral-500">Dernière mise à jour:</span>
                   <span className="text-white font-medium">{viewingOrder.date} - 20:45</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }
`;

const replacePoint = `  return (
    <div className="space-y-6">`;

if (content.includes(replacePoint) && !content.includes('if (viewingOrder) {')) {
  content = content.replace(replacePoint, fullViewCode + '\n' + replacePoint);
}

// 5. Add required extra imports
if (!content.includes('Slash,')) {
   content = content.replace('X,', 'X, Slash, RotateCw, Calculator,')
}


fs.writeFileSync('src/pages/Orders.tsx', content);
console.log("Updated order view logic");
