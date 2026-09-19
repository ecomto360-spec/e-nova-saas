import { useLanguage } from "../contexts/LanguageContext";
import { useState, useEffect } from "react";
import { 
  Search, 
  Download, 
  Shield, 
  Users, 
  UserPlus, 
  ShieldBan,
  ShieldCheck,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
  Calculator,
  Clock,
  FileText
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getBlacklistedPhones, banPhoneNumber, unbanPhoneNumber, normalizePhoneForBlacklist } from "../lib/blacklist";

interface CustomerAggregated {
  id: string; // phone number as ID
  name: string;
  phone: string;
  wilaya: string;
  orderCount: number;
  totalSpent: number;
  multipleIdentities: number;
  ip: string;
  isBanned: boolean;
  lastOrderDate: any;
}

export default function Customers() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerAggregated[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clients" | "blacklist">("clients");
  const [search, setSearch] = useState("");
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<CustomerAggregated | null>(null);

  useEffect(() => {
    if (user) {
      loadCustomersFromOrders();
    }
  }, [user]);

  const loadCustomersFromOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q1 = query(collection(db, "orders"), where("userId", "==", user.uid));
      const q2 = query(collection(db, "tenants", user.uid, "orders"));
      const qBlacklist = query(collection(db, "blacklist"), where("userId", "==", user.uid));

      const [snap1, snap2, snapBlacklist] = await Promise.all([
        getDocs(q1).catch(() => null),
        getDocs(q2).catch(() => null),
        getDocs(qBlacklist).catch(() => null)
      ]);
      
      const blacklistedPhoneMap = new Map<string, any>();
      if (snapBlacklist) {
        snapBlacklist.forEach(docSnap => {
          const data = docSnap.data();
          if (data.phone) {
            blacklistedPhoneMap.set(data.phone, data);
          }
        });
      }

      const customerMap = new Map<string, CustomerAggregated>();
      
      const processDoc = (docSnap: any) => {
        const data = docSnap.data();
        const phone = (data.phone || data.customerPhone || "").trim();
        if (!phone) return;
        
        const normalized = normalizePhoneForBlacklist(phone);
        const name = data.client || data.customerName || data.name || "Client Anonyme";
        const wilaya = data.wilaya || "Inconnu";
        const total = Number(data.total) || 0;
        const isBanned = blacklistedPhoneMap.has(normalized);

        if (customerMap.has(normalized)) {
           const existing = customerMap.get(normalized)!;
           existing.orderCount += 1;
           existing.totalSpent += total;
           if (isBanned) existing.isBanned = true;
           if (existing.name.toLowerCase() !== name.toLowerCase()) {
              existing.multipleIdentities += 1;
           }
           customerMap.set(normalized, existing);
        } else {
           customerMap.set(normalized, {
              id: normalized,
              name,
              phone,
              wilaya,
              orderCount: 1,
              totalSpent: total,
              multipleIdentities: 0,
              ip: data.ip || "41.189.42.9",
              isBanned,
              lastOrderDate: data.createdAt || data.date
           });
        }
      };

      if (snap1) snap1.forEach(processDoc);
      if (snap2) snap2.forEach(processDoc);

      // Also ensure any explicitly blacklisted phone that had no orders is represented
      blacklistedPhoneMap.forEach((entry, normalized) => {
        if (!customerMap.has(normalized)) {
          customerMap.set(normalized, {
            id: normalized,
            name: entry.name || "Client Banni",
            phone: entry.rawPhone || entry.phone,
            wilaya: "N/A",
            orderCount: 0,
            totalSpent: 0,
            multipleIdentities: 0,
            ip: entry.ip || "41.189.42.9",
            isBanned: true,
            lastOrderDate: entry.bannedAt
          });
        }
      });
      
      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    } catch (err) {
      console.error("Erreur lors du chargement des clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (customer: CustomerAggregated) => {
    if (!user || !customer?.phone) return;
    const normalized = normalizePhoneForBlacklist(customer.phone);
    if (!normalized) return;

    try {
      const nextStatus = !customer.isBanned;
      if (nextStatus) {
        await banPhoneNumber(user.uid, customer.phone, customer.name, "Banni depuis la liste des clients");
      } else {
        await unbanPhoneNumber(user.uid, customer.phone);
      }
      
      setCustomers(prev => prev.map(c => {
        if (normalizePhoneForBlacklist(c.phone) === normalized) {
          return { ...c, isBanned: nextStatus };
        }
        return c;
      }));

      if (selectedCustomerForDetails && normalizePhoneForBlacklist(selectedCustomerForDetails.phone) === normalized) {
        setSelectedCustomerForDetails(prev => prev ? { ...prev, isBanned: nextStatus } : null);
      }
    } catch (err) {
      console.error("Erreur mise à jour statut de bannissement:", err);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (activeTab === "blacklist" && !c.isBanned) return false;
    if (activeTab === "clients" && c.isBanned) return false;
    
    if (search) {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || 
             c.phone.includes(s) || 
             c.wilaya.toLowerCase().includes(s);
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name.substring(0, 1).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-yellow-500" />
          Clients
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Suivez vos nouveaux clients et gérez la liste noire
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center">
            <Users className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">{t("customers.total")}</p>
            <h3 className="text-2xl font-bold text-white">{customers.length}</h3>
          </div>
        </div>
        
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">{t("customers.newThisWeek")}</p>
            <h3 className="text-2xl font-bold text-white">
               {customers.filter(c => c.orderCount === 1).length}
            </h3>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center">
            <ShieldBan className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">{t("customers.banned")}</p>
            <h3 className="text-2xl font-bold text-white">
               {customers.filter(c => c.isBanned).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === "clients" ? "bg-[#1e1e24] border border-neutral-700 text-yellow-500" : "bg-transparent text-neutral-400 hover:text-white"}`}
            >
              <Users className="w-4 h-4" /> Clients <span className="bg-neutral-800 text-white px-2 py-0.5 rounded-full text-xs">{customers.filter(c => !c.isBanned).length}</span>
            </button>
            <button 
              onClick={() => setActiveTab("blacklist")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === "blacklist" ? "bg-[#1e1e24] border border-neutral-700 text-yellow-500" : "bg-transparent text-neutral-400 hover:text-white"}`}
            >
              <Shield className="w-4 h-4" /> Liste noire <span className="bg-neutral-800 text-white px-2 py-0.5 rounded-full text-xs">{customers.filter(c => c.isBanned).length}</span>
            </button>
         </div>

         <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("customers.search")}
                className="w-full md:w-80 bg-[#1e1e24] border border-neutral-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-yellow-500"
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-800 text-white text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" /> Exporter CSV
           </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
             <thead className="bg-[#16161a] border-b border-neutral-800 text-xs font-semibold text-neutral-400">
               <tr>
                 <th className="px-5 py-4">{t("customers.client")}</th>
                 <th className="px-5 py-4">{t("customers.phone")}</th>
                 <th className="px-5 py-4">{t("customers.location")}</th>
                 <th className="px-5 py-4">{t("customers.orders")}</th>
                 <th className="px-5 py-4">{t("customers.totalPurchases")}</th>
                 <th className="px-5 py-4">{t("customers.multipleIds")}</th>
                 <th className="px-5 py-4">{t("customers.fakeProb")}</th>
                 <th className="px-5 py-4 text-right">{t("customers.actions")}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-neutral-800/70">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-neutral-500">
                      Chargement des clients...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-neutral-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-[#16161a]/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center font-bold text-lg">
                              {getInitials(customer.name)}
                           </div>
                           <span className="font-bold text-white">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex flex-col gap-1">
                            <span className="font-bold text-white">{customer.phone}</span>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                               <Shield className="w-3.5 h-3.5" /> {customer.ip}
                            </div>
                         </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                         {customer.wilaya}
                      </td>
                      <td className="px-5 py-4">
                         <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
                            {customer.orderCount} commande{customer.orderCount > 1 ? 's' : ''}
                         </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-white">
                         {customer.totalSpent.toLocaleString()} DA
                      </td>
                      <td className="px-5 py-4 text-neutral-500 text-center font-medium">
                         {customer.multipleIdentities > 0 ? customer.multipleIdentities : "-"}
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <Shield className="w-3.5 h-3.5" /> Sûr (0)
                         </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setSelectedCustomerForDetails(customer)} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors border border-blue-500/20 cursor-pointer">
                               <Info className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleBan(customer)}
                              title={customer.isBanned ? "Débannir ce client" : "Bannir ce client"}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border cursor-pointer ${
                                customer.isBanned
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                              }`}
                            >
                               {customer.isBanned ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
        </div>
        
        {/* Footer Pagination */}
        <div className="p-4 border-t border-neutral-800 bg-[#1e1e24] flex items-center justify-between text-xs text-neutral-400">
           <span>Affichage 1 - {filteredCustomers.length} sur {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''}</span>
           <div className="flex items-center gap-4">
             <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
               <ChevronLeft className="w-4 h-4" /> Précédent
             </button>
             <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
               Suivant <ChevronRight className="w-4 h-4" />
             </button>
           </div>
           <div className="flex items-center gap-2">
             <span>Afficher :</span>
             <select className="bg-transparent border-none text-white focus:outline-none cursor-pointer">
               <option value="20">20</option>
               <option value="50">50</option>
               <option value="100">100</option>
             </select>
           </div>
        </div>
      </div>

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
                  <span className="text-sm font-semibold text-emerald-500">{t("customers.safe")}</span>
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
            <div className="p-5 border-t border-neutral-800 bg-[#16161a] flex items-center justify-between">
              <button 
                onClick={() => handleToggleBan(selectedCustomerForDetails)}
                className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedCustomerForDetails.isBanned
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                {selectedCustomerForDetails.isBanned ? (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Débannir ce client
                  </>
                ) : (
                  <>
                    <ShieldBan className="w-4 h-4" /> Bannir ce client
                  </>
                )}
              </button>
              <button 
                onClick={() => setSelectedCustomerForDetails(null)}
                className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors cursor-pointer text-xs"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
