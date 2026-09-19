const fs = require('fs');
let content = fs.readFileSync('src/pages/Customers.tsx', 'utf8');

// Add new imports for the modal
if (!content.includes('ShieldAlert')) {
  content = content.replace(
    '  ChevronRight\n} from "lucide-react";',
    '  ChevronRight,\n  ShieldAlert,\n  X,\n  Calculator,\n  Clock,\n  FileText\n} from "lucide-react";'
  );
}

// Add state for selectedCustomerForDetails
if (!content.includes('selectedCustomerForDetails')) {
  content = content.replace(
    'const [search, setSearch] = useState("");',
    'const [search, setSearch] = useState("");\n  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<CustomerAggregated | null>(null);'
  );
}

// Add onClick to Info button
content = content.replace(
  '<button className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors border border-blue-500/20">',
  '<button onClick={() => setSelectedCustomerForDetails(customer)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors border border-blue-500/20 cursor-pointer">'
);

// Add modal JSX at the end before final </div>
const modalJsx = `
      {/* Modal: Détails Probabilité Fausse Commande */}
      {selectedCustomerForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldAlert className="w-5 h-5 text-yellow-500" />
                Détails de la probabilité de fausse commande
              </div>
              <button 
                onClick={() => setSelectedCustomerForDetails(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              
              {/* Circular Score */}
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-emerald-500 flex flex-col items-center justify-center bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <span className="text-4xl font-bold text-emerald-500">0</span>
                  <span className="text-sm font-semibold text-emerald-500">Sûr</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-[#24242b] border border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-bold text-white mb-1">{selectedCustomerForDetails.orderCount}</span>
                  <span className="text-[10px] text-neutral-400 font-medium mb-1 leading-tight">Commandes réussies</span>
                  <span className="text-[10px] text-emerald-500 font-bold">-2 par commande</span>
                </div>
                <div className="bg-[#24242b] border border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-bold text-white mb-1">0</span>
                  <span className="text-[10px] text-neutral-400 font-medium mb-1 leading-tight">Commandes annulées</span>
                  <span className="text-[10px] text-yellow-500 font-bold">+5 par commande</span>
                </div>
                <div className="bg-[#24242b] border border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-bold text-white mb-1">0</span>
                  <span className="text-[10px] text-neutral-400 font-medium mb-1 leading-tight">Commandes retournées</span>
                  <span className="text-[10px] text-red-500 font-bold">+8 par commande</span>
                </div>
                <div className="bg-[#24242b] border border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-bold text-white mb-1">0</span>
                  <span className="text-[10px] text-neutral-400 font-medium mb-1 leading-tight">Livraison refusée</span>
                  <span className="text-[10px] text-red-500 font-bold">+15 par refus</span>
                </div>
                <div className="bg-[#24242b] border border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-bold text-white mb-1">{selectedCustomerForDetails.isBanned ? '1' : '0'}</span>
                  <span className="text-[10px] text-neutral-400 font-medium mb-1 leading-tight">Fois banni</span>
                  <span className="text-[10px] text-red-500 font-bold">+20 par ban</span>
                </div>
                <div className="bg-[#24242b] border border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center justify-center">
                  <span className="text-xl font-bold text-white mb-1">0</span>
                  <span className="text-[10px] text-neutral-400 font-medium mb-1 leading-tight">Remboursements</span>
                  <span className="text-[10px] text-red-500 font-bold">+30 par remboursement</span>
                </div>
              </div>

              {/* Détail du calcul */}
              <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                  <Calculator className="w-4 h-4" />
                  Détail du calcul du score
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#1a2221] border border-emerald-900/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white font-medium text-sm">
                      <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      طلبات ناجحة (تم التسليم)
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-neutral-400 text-sm">{selectedCustomerForDetails.orderCount} × -2</span>
                      <span className="text-emerald-500 font-bold">{selectedCustomerForDetails.orderCount * -2}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#1a2221] border border-emerald-500 rounded-xl p-4">
                    <span className="text-white font-bold">Total final (0-100)</span>
                    <span className="text-emerald-500 font-bold text-lg">0</span>
                  </div>
                </div>
              </div>

              {/* Journal des événements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                  <Clock className="w-4 h-4" />
                  Journal des événements
                </div>
                
                <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-1 shrink-0 border border-emerald-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">Commande livrée avec succès ✔</h4>
                        <p className="text-neutral-400 text-xs mb-1">innov • Commande #{selectedCustomerForDetails.phone.substring(0,6)}</p>
                        <p className="text-neutral-500 text-xs">
                           {selectedCustomerForDetails.lastOrderDate ? new Date(selectedCustomerForDetails.lastOrderDate).toLocaleDateString('fr-FR', {
                             day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
                           }) : "Récemment"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-emerald-500 font-bold text-sm mb-1">-2</span>
                      <span className="text-neutral-500 text-xs font-medium">0 &rarr; 0</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-neutral-800 bg-[#16161a] flex justify-end">
              <button 
                onClick={() => setSelectedCustomerForDetails(null)}
                className="bg-neutral-600 hover:bg-neutral-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
`;

if (!content.includes('Détails de la probabilité de fausse commande')) {
  content = content.replace(
    '    </div>\n  );\n}\n',
    modalJsx + '    </div>\n  );\n}\n'
  );
}

fs.writeFileSync('src/pages/Customers.tsx', content);
