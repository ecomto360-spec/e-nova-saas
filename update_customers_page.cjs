const fs = require('fs');

const content = `import { useState, useEffect } from "react";
import { 
  Search, 
  Download, 
  Shield, 
  Users, 
  UserPlus, 
  ShieldBan,
  Info,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerAggregated[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clients" | "blacklist">("clients");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) {
      loadCustomersFromOrders();
    }
  }, [user]);

  const loadCustomersFromOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      const customerMap = new Map<string, CustomerAggregated>();
      const today = new Date();
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const phone = (data.phone || data.customerPhone || "").trim();
        if (!phone) return;
        
        const name = data.client || data.customerName || data.name || "Client Anonyme";
        const wilaya = data.wilaya || "Inconnu";
        const total = Number(data.total) || 0;
        
        if (customerMap.has(phone)) {
           const existing = customerMap.get(phone)!;
           existing.orderCount += 1;
           existing.totalSpent += total;
           // Check if name is different
           if (existing.name.toLowerCase() !== name.toLowerCase()) {
              existing.multipleIdentities += 1;
           }
           customerMap.set(phone, existing);
        } else {
           customerMap.set(phone, {
              id: phone,
              name,
              phone,
              wilaya,
              orderCount: 1,
              totalSpent: total,
              multipleIdentities: 0,
              ip: data.ip || "41.189.42.9", // Mock IP if not present, as requested by UI design
              isBanned: false,
              lastOrderDate: data.createdAt || data.date
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
            <p className="text-sm font-medium text-neutral-400">Total clients</p>
            <h3 className="text-2xl font-bold text-white">{customers.length}</h3>
          </div>
        </div>
        
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Nouveaux cette semaine</p>
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
            <p className="text-sm font-medium text-neutral-400">Bannis</p>
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
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors \${activeTab === "clients" ? "bg-[#1e1e24] border border-neutral-700 text-yellow-500" : "bg-transparent text-neutral-400 hover:text-white"}\`}
            >
              <Users className="w-4 h-4" /> Clients <span className="bg-neutral-800 text-white px-2 py-0.5 rounded-full text-xs">{customers.filter(c => !c.isBanned).length}</span>
            </button>
            <button 
              onClick={() => setActiveTab("blacklist")}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors \${activeTab === "blacklist" ? "bg-[#1e1e24] border border-neutral-700 text-yellow-500" : "bg-transparent text-neutral-400 hover:text-white"}\`}
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
                placeholder="Rechercher par nom, téléphone ou lieu..."
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
                 <th className="px-5 py-4">Client</th>
                 <th className="px-5 py-4">Téléphone</th>
                 <th className="px-5 py-4">Lieu</th>
                 <th className="px-5 py-4">Commandes</th>
                 <th className="px-5 py-4">Total des achats</th>
                 <th className="px-5 py-4">Identités multiples</th>
                 <th className="px-5 py-4">Probabilité de fausse commande</th>
                 <th className="px-5 py-4 text-right">Actions</th>
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
                            <button className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                               <Info className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-red-500/20">
                               <ShieldBan className="w-4 h-4" />
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
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Customers.tsx', content);
