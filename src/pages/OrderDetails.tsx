import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { 
  ArrowLeft, 
  HelpCircle, 
  User, 
  MapPin, 
  Package, 
  AlertCircle, 
  RotateCw,
  CheckCircle,
  Clock,
  Truck,
  PackageCheck,
  Ban,
  Check,
  Edit2,
  Trash2, LayoutList,
  Copy,
  Plus
} from "lucide-react";
import { isPhoneBlacklisted, banPhoneNumber, unbanPhoneNumber } from "../lib/blacklist";

type OrderStatus = "En attente" | "Confirmée" | "En préparation" | "Expédiée" | "Livrée" | "Annulée" | "Retournée" | "Échouée";

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>("En attente");
  const [isCustomerBanned, setIsCustomerBanned] = useState(false);
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    
    const formatOrderData = (docSnap: any) => {
      const data = { id: docSnap.id, ...docSnap.data() } as any;
      if (data.createdAt?.toDate) {
        const d = data.createdAt.toDate();
        const pad = (n: number) => String(n).padStart(2, "0");
        data.date = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else if (data.createdAt && typeof data.createdAt === "string") {
        const d = new Date(data.createdAt);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          data.date = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      }
      return data;
    };

    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, "tenants", user.uid, "orders", id);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const data = formatOrderData(orderSnap);
          setOrder(data);
          setStatus(data.status as OrderStatus);
          if (data.phone) {
            const banned = await isPhoneBlacklisted(user.uid, data.phone);
            setIsCustomerBanned(banned);
          }
        } else {
          // Check global orders collection just in case
          const globalOrderRef = doc(db, "orders", id);
          const globalOrderSnap = await getDoc(globalOrderRef);
          if (globalOrderSnap.exists()) {
            const data = formatOrderData(globalOrderSnap);
            setOrder(data);
            setStatus(data.status as OrderStatus);
            if (data.phone) {
              const banned = await isPhoneBlacklisted(user.uid, data.phone);
              setIsCustomerBanned(banned);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id, user]);

  const handleToggleBan = async () => {
    if (!user || !order?.phone) return;
    setIsBanning(true);
    try {
      if (isCustomerBanned) {
        await unbanPhoneNumber(user.uid, order.phone);
        setIsCustomerBanned(false);
        alert(`Le numéro ${order.phone} a été retiré de la liste noire.`);
      } else {
        await banPhoneNumber(user.uid, order.phone, order.client, "Banni depuis la commande");
        setIsCustomerBanned(true);
        alert(`Le client ${order.phone} a été banni avec succès !`);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut de bannissement:", err);
      alert("Erreur lors de la mise à jour du statut de bannissement.");
    } finally {
      setIsBanning(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!user || !id) return;
    try {
      // Check if global exists
      const globalOrderRef = doc(db, "orders", id);
      const globalOrderSnap = await getDoc(globalOrderRef);
      
      const orderRef = doc(db, "tenants", user.uid, "orders", id);
      const orderSnap = await getDoc(orderRef);
      
      if (globalOrderSnap.exists()) {
         await updateDoc(globalOrderRef, { status });
      }
      
      if (orderSnap.exists()) {
         await updateDoc(orderRef, { status });
      } else if (!globalOrderSnap.exists()) {
         // If neither exist, something is wrong
         console.warn("Order not found in either collection for update");
      }
      
      setOrder((prev: any) => ({ ...prev, status }));
      alert("Statut mis à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <div className="text-white text-center py-20">Chargement...</div>;
  }

  if (!order) {
    return <div className="text-white text-center py-20">Commande introuvable</div>;
  }
  
  const displayId = order.orderNumber || order.id.substring(0, 5);
  
  const timelineSteps = [
    { label: "Nouvelle commande", status: "En attente", icon: Clock },
    { label: "Confirmée", status: "Confirmée", icon: CheckCircle },
    { label: "Préparation", status: "En préparation", icon: Package },
    { label: "Expédition", status: "Expédiée", icon: Truck },
    { label: "Livraison", status: "Livrée", icon: PackageCheck }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutList className="w-6 h-6 text-yellow-500 hidden" />
          Détails de la commande #{displayId}
          <HelpCircle className="w-4 h-4 text-neutral-500" />
        </h1>
        <button 
          onClick={() => navigate('/dashboard/orders')}
          className="flex items-center gap-2 bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Commandes
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6 flex justify-between items-center relative overflow-hidden">
         <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-neutral-800 -z-0 -translate-y-1/2"></div>
         {timelineSteps.map((step, idx) => {
            const isCurrent = order.status === step.status;
            const isPast = timelineSteps.findIndex(s => s.status === order.status) > idx;
            const Icon = step.icon;
            
            return (
              <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500' : isPast ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#16161a] border-2 border-neutral-800 text-neutral-600'}`}>
                   <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? 'text-yellow-500' : isPast ? 'text-emerald-500' : 'text-neutral-500'}`}>{step.label}</span>
              </div>
            );
         })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Informations client */}
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <User className="w-4 h-4 text-yellow-500" /> Informations client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Nom:</span>
                 <span className="font-semibold text-white">{order.client}</span>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Téléphone:</span>
                 <span className="font-bold text-white">{order.phone}</span>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Probabilité de fausse commande:</span>
                 <div className="flex items-center gap-2">
                   <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold">Sûr</span>
                   <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs text-neutral-400">0</span>
                 </div>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Statut de bannissement:</span>
                 <div className="flex items-center gap-3">
                   {isCustomerBanned ? (
                     <span className="text-red-400 bg-red-500/10 border border-red-500/20 text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Banni
                     </span>
                   ) : (
                     <span className="text-emerald-500 text-sm font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Non banni
                     </span>
                   )}
                   <button 
                     onClick={handleToggleBan}
                     disabled={isBanning}
                     className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${
                       isCustomerBanned
                         ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                         : "bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                     }`}
                   >
                      <Ban className="w-3 h-3" /> {isCustomerBanned ? "Débannir" : "Bannir"}
                   </button>
                 </div>
              </div>
            </div>
          </div>

          {/* Adresse de livraison */}
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <MapPin className="w-4 h-4 text-yellow-500" /> Adresse de livraison
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Wilaya:</span>
                 <span className="font-semibold text-white">{order.wilaya}</span>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Commune:</span>
                 <span className="font-semibold text-white">{order.commune || "N/A"}</span>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Adresse:</span>
                 <span className="font-semibold text-white">{order.address || "N/A"}</span>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Type de livraison:</span>
                 <span className="font-semibold text-white">{order.shippingMethod || "Livraison à domicile"}</span>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="flex items-center gap-2 font-bold text-white">
                <Package className="w-4 h-4 text-yellow-500" /> Produits
              </h3>
              <div className="flex items-center gap-2">
                <button className="bg-[#2b2b36] hover:bg-[#3b3b46] text-blue-400 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#3b3b46]">
                   <AlertCircle className="w-3.5 h-3.5" /> Ajouter un produit
                </button>
                <button className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-yellow-500/20">
                   <Edit2 className="w-3.5 h-3.5" /> Modifier les variables
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="text-xs text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="pb-3 font-medium">Produit</th>
                    <th className="pb-3 font-medium text-center">Prix</th>
                    <th className="pb-3 font-medium text-center">Quantité</th>
                    <th className="pb-3 font-medium text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {((order.items && order.items.length > 0) ? order.items : [{
                    name: order.itemsSummary || order.productName || "Article commandé",
                    price: order.total - (order.shippingCost || 400),
                    quantity: 1,
                    image: order.image || order.productImage || ""
                  }]).map((item: any, idx: number) => {
                    const itemImg = item.image || order.image || order.productImage || "";
                    return (
                      <tr key={idx}>
                        <td className="py-4 flex gap-3 items-center">
                          <div className="w-12 h-12 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                            {itemImg ? (
                              <img 
                                src={itemImg} 
                                alt={item.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fb = parent.querySelector('.detail-fallback');
                                    if (fb) (fb as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`detail-fallback w-full h-full items-center justify-center text-yellow-500/70 ${itemImg ? 'hidden' : 'flex'}`}>
                              <Package className="w-5 h-5" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            {item.variants && Object.entries(item.variants).map(([k, v]) => (
                              <div key={k} className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                                 <span className="w-2 h-2 rounded-full bg-yellow-500"></span> {k}: {v as string}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-center text-white">{Number(item.price || 0).toLocaleString()} DA</td>
                        <td className="py-4 text-center">
                          <div className="inline-flex items-center gap-2 bg-[#16161a] border border-neutral-800 rounded-lg p-1">
                            <span className="text-white text-sm font-semibold px-2">{item.quantity || 1}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-bold text-white">{((Number(item.price || 0)) * (Number(item.quantity || 1))).toLocaleString()} DA</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Informations de la commande Totals */}
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
             <h3 className="flex items-center gap-2 font-bold text-white mb-5">
               <AlertCircle className="w-4 h-4 text-yellow-500" /> Informations de la commande
             </h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center border-b border-neutral-800/50 pb-4">
                 <span className="text-white font-semibold">Sous-total:</span>
                 <span className="text-white font-semibold">{(order.total - (order.shippingCost || 400)).toLocaleString()} DA</span>
               </div>
               <div className="flex justify-between items-center border-b border-neutral-800/50 pb-4">
                 <span className="text-white font-semibold">Livraison:</span>
                 <span className="text-white font-semibold">{order.shippingCost || 400} DA</span>
               </div>
               <div className="flex justify-between items-center pt-2">
                 <span className="text-xl font-bold text-white">Total:</span>
                 <span className="text-xl font-bold text-yellow-500">{order.total.toLocaleString()} DA</span>
               </div>
             </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Changer le statut */}
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <RotateCw className="w-4 h-4 text-yellow-500" /> Changer le statut
            </h3>
            <div className="space-y-4">
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full bg-[#16161a] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="En attente">En attente</option>
                <option value="Confirmée">Confirmée</option>
                <option value="En préparation">En préparation</option>
                <option value="Expédiée">Expédiée</option>
                <option value="Livrée">Livrée</option>
                <option value="Annulée">Annulée</option>
                <option value="Retournée">Retournée</option>
              </select>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleUpdateStatus}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Modifier la commande
                </button>
                <button 
                  className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Informations de la commande */}
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-5">
              <Clock className="w-4 h-4 text-yellow-500" /> Informations de la commande
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-neutral-400">N° commande:</span>
                <span className="font-bold text-white text-right break-all">#{order.reference || order.id}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-neutral-400">Date de commande:</span>
                <span className="font-bold text-white text-right">{order.date}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-neutral-400">Dernière mise à jour:</span>
                <span className="font-bold text-white text-right">{order.date}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
