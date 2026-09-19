const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

const previewModal = `
      {/* Modal: Order Preview */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <LayoutList className="w-5 h-5 text-neutral-400" />
                Aperçu de la commande <span className="text-yellow-500">#{previewOrder.id.substring(0, 5)}</span>
                <HelpCircle className="w-4 h-4 text-neutral-500" />
              </div>
              <button 
                onClick={() => setPreviewOrder(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto bg-[#16161a]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Left Column (Info) */}
                <div className="md:col-span-2 space-y-5">
                  
                  {/* Informations client */}
                  <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                      <User className="w-4 h-4 text-yellow-500" /> Informations client
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Nom</span>
                        <div className="flex items-center gap-2">
                           <span className="font-semibold text-white">{previewOrder.client}</span>
                           <Copy className="w-3.5 h-3.5 text-neutral-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(previewOrder.client, "Nom")} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Téléphone</span>
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-yellow-500">{previewOrder.phone}</span>
                           <a href={\`tel:\${previewOrder.phone}\`} className="bg-emerald-500/20 text-emerald-500 p-1 rounded hover:bg-emerald-500/30">
                             <Phone className="w-3.5 h-3.5" />
                           </a>
                           <Copy className="w-3.5 h-3.5 text-neutral-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(previewOrder.phone, "Téléphone")} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Probabilité de fausse commande</span>
                        <div className="flex items-center gap-2">
                           <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-xs font-bold">Sûr</span>
                           <span className="text-xs text-neutral-500 bg-neutral-800 px-2 rounded">0</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-sm text-neutral-400">Statut de bannissement</span>
                        <div className="flex items-center gap-2">
                           <span className="text-emerald-500 text-sm font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Non banni
                           </span>
                           <button className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 hover:bg-red-600 cursor-pointer">
                              <Ban className="w-3 h-3" /> Bannir
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                      <MapPin className="w-4 h-4 text-yellow-500" /> Adresse de livraison
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Wilaya</span>
                        <span className="font-semibold text-white">{previewOrder.wilaya}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Commune</span>
                        <span className="font-semibold text-white">{previewOrder.commune || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Adresse</span>
                        <div className="flex items-center gap-2">
                           <span className="font-semibold text-white">{previewOrder.address || "N/A"}</span>
                           <Copy className="w-3.5 h-3.5 text-neutral-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(previewOrder.address, "Adresse")} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-sm text-neutral-400">Mode de livraison</span>
                        <span className="text-emerald-500 text-sm font-semibold flex items-center gap-1">
                           <Home className="w-3.5 h-3.5" /> {previewOrder.shippingMethod || "Livraison à domicile"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Détails de la commande */}
                  <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                      <AlertCircle className="w-4 h-4 text-yellow-500" /> Détails de la commande
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Date de commande</span>
                        <span className="font-semibold text-white">{previewOrder.date}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Total</span>
                        <span className="font-bold text-yellow-500 text-lg">{previewOrder.total.toLocaleString()} DA</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <span className="text-sm text-neutral-400">Frais de livraison</span>
                        <span className="font-semibold text-white">{previewOrder.shippingCost || 400} DA</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-sm text-neutral-400">N° commande</span>
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 text-sm">
                              {previewOrder.orderNumber}
                           </span>
                           <Copy className="w-3.5 h-3.5 text-neutral-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(previewOrder.orderNumber, "N° commande")} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column (Actions & Items) */}
                <div className="space-y-5">
                  
                  {/* Update Status */}
                  <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                      <RotateCw className="w-4 h-4 text-yellow-500" /> Mettre à jour le statut
                    </h3>
                    <div className="space-y-3">
                      <select 
                        defaultValue={previewOrder.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as OrderStatus;
                          handleBulkStatusChange(newStatus, [previewOrder.id]);
                          setPreviewOrder(prev => prev ? {...prev, status: newStatus} : null);
                        }}
                        className="w-full bg-[#16161a] border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Confirmée">Confirmée</option>
                        <option value="En préparation">En préparation</option>
                        <option value="Expédiée">Expédiée</option>
                        <option value="Livrée">Livrée</option>
                        <option value="Annulée">Annulée</option>
                        <option value="Retournée">Retournée</option>
                      </select>
                      <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm">
                        <Check className="w-4 h-4" /> Mettre à jour le statut
                      </button>
                    </div>
                  </div>

                  {/* Produits commandés */}
                  <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 font-bold text-yellow-500 mb-4 text-sm">
                      <Package className="w-4 h-4" /> Produits commandés
                    </h3>
                    <div className="space-y-3">
                      {previewOrder.items && previewOrder.items.length > 0 ? (
                        previewOrder.items.map((item, idx) => (
                          <div key={idx} className="bg-[#16161a] border border-neutral-800 rounded-xl p-3 flex gap-3">
                            <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0">
                               <img src={item.image || "https://placehold.co/100"} alt="Produit" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                                  <span className="font-bold text-yellow-500 text-xs ml-2 shrink-0">{item.price.toLocaleString()} DA</span>
                               </div>
                               {item.variants && Object.entries(item.variants).map(([k, v]) => (
                                  <span key={k} className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> {k}: {v}
                                  </span>
                               ))}
                               <span className="text-xs text-neutral-500 mt-1">Quantité : {item.quantity}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-500 text-sm italic">Aucun détail de produit</div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 bg-[#1e1e24] flex items-center gap-3">
              <button 
                onClick={() => setPreviewOrder(null)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
              >
                Fermer
              </button>
              <button 
                onClick={() => {
                  setPreviewOrder(null);
                  handleOpenModal(previewOrder);
                }}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
              >
                <Edit2 className="w-4 h-4" /> Modifier
              </button>
              <button 
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
              >
                Imprimer
              </button>
              <button 
                onClick={() => window.location.href = \`/dashboard/orders/\${previewOrder.id}\`}
                className="flex-1 bg-[#2b2b36] hover:bg-[#3b3b46] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
              >
                Voir les détails complets
              </button>
            </div>
          </div>
        </div>
      )}
`;

const insertIndex = content.lastIndexOf('</div>\n  );\n}');
let newContent = content.substring(0, insertIndex) + previewModal + content.substring(insertIndex);
fs.writeFileSync('src/pages/Orders.tsx', newContent);
