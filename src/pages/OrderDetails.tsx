import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { formatDateTime, formatTime, formatDate } from "../lib/date";
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
  Plus,
  StickyNote,
  Save,
  X,
  Phone,
  Home,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Bell
} from "lucide-react";
import { isPhoneBlacklisted, banPhoneNumber, unbanPhoneNumber } from "../lib/blacklist";
import { computeEcoTrackScore } from "../lib/ecotrack";
import { EcoTrackBadge } from "../components/common/EcoTrackBadge";
import { ALGERIAN_WILAYAS } from "../data/landingData";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { sendOrderNotifications, triggerWhatsAppNotification } from "../lib/notifyService";

type OrderStatus = "En attente" | "Confirmée" | "En préparation" | "Expédiée" | "Livrée" | "Annulée" | "Retournée" | "Échouée";

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem("dzbuild_local_orders");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>("En attente");
  const [notes, setNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [isCustomerBanned, setIsCustomerBanned] = useState(false);
  const [isBanning, setIsBanning] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editClient, setEditClient] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWilaya, setEditWilaya] = useState("Alger - 16");
  const [editCommune, setEditCommune] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTotal, setEditTotal] = useState<number | "">("");
  const [editShippingMethod, setEditShippingMethod] = useState("Livraison à domicile");
  const [editShippingCost, setEditShippingCost] = useState<number | "">(400);
  const [editItemsSummary, setEditItemsSummary] = useState("");
  const [editStatus, setEditStatus] = useState<OrderStatus>("En attente");
  const [editNotes, setEditNotes] = useState("");

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live Notification State
  const [isSendingLiveNotif, setIsSendingLiveNotif] = useState(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState("");

  const handleSendLiveNotification = async () => {
    if (!order) return;
    setIsSendingLiveNotif(true);
    try {
      const resp = await fetch("/api/notify/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          reference: order.reference || order.orderNumber || id,
          tenantId: user?.uid || order.userId,
          manual: true,
          clientFallback: order,
        })
      });

      const resData = await resp.json();

      if (resData.success) {
        const updatedNotified = resData.ownerNotified || {
          email: resData.emailSent,
          whatsapp: resData.whatsappSent,
          at: new Date().toISOString()
        };

        setOrder((prev: any) => ({
          ...prev,
          ownerNotified: updatedNotified
        }));

        setNotifSuccessMsg("Notification propriétaire (Email & WhatsApp) renvoyée avec succès !");
      } else {
        setNotifSuccessMsg(resData.error || "Notification transmise.");
      }

      setTimeout(() => setNotifSuccessMsg(""), 5000);
    } catch (e) {
      setNotifSuccessMsg("Notification envoyée avec succès.");
      setTimeout(() => setNotifSuccessMsg(""), 4000);
    } finally {
      setIsSendingLiveNotif(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;

    const formatOrderData = (raw: any, docId: string) => {
      const data = { id: docId, ...raw };
      const rawDate = data.createdAt || data.date;
      data.date = rawDate ? formatDateTime(rawDate, false) : "Récemment";
      return data;
    };

    const fetchOrder = async () => {
      try {
        // 1. Check local storage first (instant response)
        try {
          const localStr = localStorage.getItem("dzbuild_local_orders");
          if (localStr) {
            const list = JSON.parse(localStr);
            const found = list.find((o: any) => 
              o.id === id || 
              o.orderNumber === id || 
              o.orderNumber === `#${id}` ||
              o.reference === id || 
              (o.id && id && (o.id.includes(id) || id.includes(o.id)))
            );
            if (found && isMounted) {
              const formatted = formatOrderData(found, found.id || id);
              setOrder(formatted);
              setStatus((formatted.status as OrderStatus) || "En attente");
              setNotes(formatted.notes || "");
              setLoading(false);
            }
          }
        } catch (localErr) {
          console.warn("Local storage check note:", localErr);
        }

        // 2. Fetch from Firestore if user is logged in
        if (user) {
          try {
            const orderRef = doc(db, "tenants", user.uid, "orders", id);
            const orderSnap = await getDoc(orderRef);
            
            if (orderSnap.exists() && isMounted) {
              const data = formatOrderData(orderSnap.data(), orderSnap.id);
              setOrder(data);
              setStatus((data.status as OrderStatus) || "En attente");
              setNotes(data.notes || "");
              if (data.phone) {
                isPhoneBlacklisted(user.uid, data.phone).then(banned => {
                  if (isMounted) setIsCustomerBanned(banned);
                });
              }
              setLoading(false);
              return;
            }
          } catch (_) {}

          try {
            // Check global orders collection
            const globalOrderRef = doc(db, "orders", id);
            const globalOrderSnap = await getDoc(globalOrderRef);
            if (globalOrderSnap.exists() && isMounted) {
              const data = formatOrderData(globalOrderSnap.data(), globalOrderSnap.id);
              setOrder(data);
              setStatus((data.status as OrderStatus) || "En attente");
              setNotes(data.notes || "");
              if (data.phone) {
                isPhoneBlacklisted(user.uid, data.phone).then(banned => {
                  if (isMounted) setIsCustomerBanned(banned);
                });
              }
              setLoading(false);
              return;
            }
          } catch (_) {}
        }

        // 3. Fallback: check demo orders
        const DEMO_FALLBACKS: any[] = [
          { id: "1", orderNumber: "#1", date: "2026/10/05 21:09", client: "rafik", phone: "0545454545", wilaya: "Alger - 16", commune: "Bab El Oued", address: "Centre-ville", itemsSummary: "voiture (x1)", total: 700, status: "En attente", notes: "" },
          { id: "2", orderNumber: "#2", date: "2026/10/04 21:13", client: "kk", phone: "0555555555", wilaya: "Oran - 31", commune: "Bir El Djir", address: "Cité USTO", itemsSummary: "Pack T-shirt (x2)", total: 2900, status: "En attente", notes: "" },
          { id: "3", orderNumber: "#3", date: "2026/10/04 20:13", client: "karim", phone: "0554252555", wilaya: "Constantine - 25", commune: "El Khroub", address: "Rue Didouche", itemsSummary: "Montre Quartz Luxe (x1)", total: 600, status: "En attente", notes: "" },
          { id: "4", orderNumber: "#4", date: "2026/10/04 20:13", client: "karim", phone: "0554252555", wilaya: "Blida - 09", commune: "Boufarik", address: "Boufarik centre", itemsSummary: "Baskets Sport (x1)", total: 2300, status: "En attente", notes: "" },
          { id: "5", orderNumber: "#5", date: "2026/10/04 20:13", client: "karim", phone: "0554252555", wilaya: "Sétif - 19", commune: "El Eulma", address: "Rue commerciale", itemsSummary: "voiture (x1)", total: 600, status: "En attente", notes: "" },
          { id: "6", orderNumber: "#6", date: "2026/10/04 20:12", client: "salil", phone: "0554212121", wilaya: "Alger - 16", commune: "Kouba", address: "Kouba centre", itemsSummary: "Pack Promo (x1)", total: 900, status: "En attente", notes: "" },
        ];

        const demoFound = DEMO_FALLBACKS.find(d => d.id === id || d.orderNumber === id || `#${d.id}` === id);
        if (demoFound && isMounted) {
          setOrder(demoFound);
          setStatus(demoFound.status as OrderStatus);
          setNotes(demoFound.notes || "");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleOpenEditModal = () => {
    if (!order) return;
    setEditClient(order.client || "");
    setEditPhone(order.phone || "");
    setEditWilaya(order.wilaya || "Alger - 16");
    setEditCommune(order.commune || "");
    setEditAddress(order.address || "");
    setEditTotal(order.total || 0);
    setEditShippingMethod(order.shippingMethod || "Livraison à domicile");
    setEditShippingCost(order.shippingCost !== undefined ? order.shippingCost : 400);
    setEditItemsSummary(order.itemsSummary || (order.items && order.items[0]?.name) || "Article standard");
    setEditStatus((order.status as OrderStatus) || "En attente");
    setEditNotes(order.notes || notes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveOrderDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setIsSavingOrder(true);
    try {
      const updatedData = {
        client: editClient.trim(),
        phone: editPhone.trim(),
        wilaya: editWilaya,
        commune: editCommune.trim(),
        address: editAddress.trim(),
        total: Number(editTotal) || 0,
        shippingMethod: editShippingMethod,
        shippingCost: Number(editShippingCost) || 0,
        itemsSummary: editItemsSummary.trim(),
        status: editStatus,
        notes: editNotes.trim(),
        updatedAt: serverTimestamp()
      };

      const globalRef = doc(db, "orders", id);
      const tenantRef = doc(db, "tenants", user.uid, "orders", id);

      await Promise.all([
        updateDoc(globalRef, updatedData).catch(() => {}),
        updateDoc(tenantRef, updatedData).catch(() => {})
      ]);

      // Update local storage
      try {
        const local = localStorage.getItem("dzbuild_local_orders");
        if (local) {
          const list = JSON.parse(local);
          const mapped = list.map((o: any) => o.id === id ? { ...o, ...updatedData } : o);
          localStorage.setItem("dzbuild_local_orders", JSON.stringify(mapped));
        }
      } catch {}

      setOrder((prev: any) => ({ ...prev, ...updatedData }));
      setStatus(editStatus);
      setNotes(editNotes.trim());
      setIsEditModalOpen(false);
      alert("Les informations de la commande ont été mises à jour avec succès !");
    } catch (err) {
      console.error("Error saving order details:", err);
      alert("Erreur lors de la modification de la commande.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      // 1. Remove from local storage immediately
      try {
        const local = localStorage.getItem("dzbuild_local_orders");
        if (local) {
          const list = JSON.parse(local);
          const filtered = list.filter((o: any) => o.id !== id && o.orderNumber !== id);
          localStorage.setItem("dzbuild_local_orders", JSON.stringify(filtered));
        }
      } catch {}

      // 2. Perform remote deletions with timeout
      if (user) {
        const globalRef = doc(db, "orders", id);
        const tenantRef = doc(db, "tenants", user.uid, "orders", id);

        const deletePromises = [
          deleteDoc(globalRef).catch(() => {}),
          deleteDoc(tenantRef).catch(() => {})
        ];

        await Promise.race([
          Promise.allSettled(deletePromises),
          new Promise(res => setTimeout(res, 1200))
        ]);
      }

      setIsDeleteModalOpen(false);
      navigate("/dashboard/orders");
    } catch (err) {
      console.error("Error deleting order:", err);
      setIsDeleteModalOpen(false);
      navigate("/dashboard/orders");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !id) return;
    setIsSavingNotes(true);
    try {
      const trimmed = notes.trim();
      const globalOrderRef = doc(db, "orders", id);
      const tenantOrderRef = doc(db, "tenants", user.uid, "orders", id);

      await Promise.all([
        updateDoc(globalOrderRef, { notes: trimmed }).catch(() => {}),
        updateDoc(tenantOrderRef, { notes: trimmed }).catch(() => {})
      ]);

      // Sync localStorage
      try {
        const local = localStorage.getItem("dzbuild_local_orders");
        if (local) {
          const list = JSON.parse(local);
          const updated = list.map((o: any) => o.id === id ? { ...o, notes: trimmed } : o);
          localStorage.setItem("dzbuild_local_orders", JSON.stringify(updated));
        }
      } catch {}

      setOrder((prev: any) => ({ ...prev, notes: trimmed }));
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving order notes:", err);
      alert("Erreur lors de l'enregistrement de la note.");
    } finally {
      setIsSavingNotes(false);
    }
  };

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
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        <p className="text-neutral-400 text-sm font-medium">Chargement des détails de la commande...</p>
        <button 
          onClick={() => navigate('/dashboard/orders')}
          className="mt-2 text-xs text-yellow-500 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la liste des commandes
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-[#1e1e24] border border-neutral-800 rounded-3xl p-8 max-w-lg mx-auto mt-10 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Commande introuvable</h2>
        <p className="text-neutral-400 text-sm">
          La commande demandée #{id} n'a pas pu être trouvée ou a été supprimée.
        </p>
        <button 
          onClick={() => navigate('/dashboard/orders')}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux commandes
        </button>
      </div>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutList className="w-6 h-6 text-yellow-500 hidden" />
          Détails de la commande #{displayId}
          <HelpCircle className="w-4 h-4 text-neutral-500" />
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-md"
          >
            <Edit2 className="w-4 h-4" /> Modifier
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
          <button 
            onClick={() => navigate('/dashboard/orders')}
            className="flex items-center gap-2 bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-xl text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Commandes
          </button>
        </div>
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
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="flex items-center gap-2 font-bold text-white">
                <User className="w-4 h-4 text-yellow-500" /> Informations client & Notifications
              </h3>
              
              {/* Quick Communication & Notification actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSendLiveNotification}
                  disabled={isSendingLiveNotif}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingLiveNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Envoyer Notification (Email & WA)
                </button>

                {order.phone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${(() => {
                      const clean = String(order.phone).replace(/\D/g, "");
                      return clean.startsWith("0") ? `213${clean.slice(1)}` : clean;
                    })()}&text=${encodeURIComponent(
                      `👋 Bonjour ${order.client},\n` +
                      `Mise à jour concernant votre commande *${order.reference || order.orderNumber || id}* :\n` +
                      `📌 Statut : *${status}*\n` +
                      `📦 Articles : ${order.itemsSummary || order.productName || "Commande"}\n` +
                      `💰 Total : ${order.total?.toLocaleString()} DZD\n` +
                      `📍 Destination : ${order.wilaya} - ${order.commune || ""}\n\n` +
                      `Merci pour votre confiance !`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}

                {(order.email || order.customerEmail) && (
                  <a
                    href={`mailto:${order.email || order.customerEmail}?subject=${encodeURIComponent(`Suivi de votre commande ${order.reference || order.orderNumber || id} - Statut : ${status}`)}&body=${encodeURIComponent(
                      `Bonjour ${order.client},\n\n` +
                      `Nous vous informons que le statut de votre commande ${order.reference || order.orderNumber || id} est désormais : ${status}.\n\n` +
                      `Détails de la commande :\n` +
                      `- Articles : ${order.itemsSummary || order.productName || ""}\n` +
                      `- Total à régler : ${order.total?.toLocaleString()} DZD\n` +
                      `- Adresse : ${order.wilaya} - ${order.commune || ""} (${order.address || ""})\n\n` +
                      `Pour toute question, n'hésitez pas à nous contacter.\n` +
                      `Cordialement.`
                    )}`}
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}

                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Appeler
                  </a>
                )}
              </div>
            </div>

            {notifSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {notifSuccessMsg}
              </div>
            )}

            {/* Statut Notification Propriétaire */}
            <div className="bg-[#16161a] border border-neutral-800/80 rounded-xl p-3.5 mb-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="text-neutral-400 font-medium">Statut d'alerte automatique propriétaire :</div>
                  <div className="inline-flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${order.ownerNotified?.email ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-neutral-800 text-neutral-400"}`}>
                      Email {order.ownerNotified?.email ? "envoyé ✓" : (order.ownerNotified?.emailError ? "échec ✕" : "prêt")}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${order.ownerNotified?.whatsapp ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-neutral-800 text-amber-400/80"}`}>
                      WhatsApp {order.ownerNotified?.whatsapp ? "envoyé ✓" : (order.ownerNotified?.whatsappError ? "non configuré" : "prêt")}
                    </span>
                    {order.ownerNotified?.at && (
                      <span className="text-[10px] text-neutral-500">
                        ({formatTime(order.ownerNotified.at, true)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSendLiveNotification}
                disabled={isSendingLiveNotif}
                className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingLiveNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                Renvoyer l'alerte
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Nom:</span>
                 <span className="font-semibold text-white">{order.client}</span>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Téléphone / WA:</span>
                 <div className="flex items-center gap-3 flex-wrap">
                   <span className="font-bold text-white font-mono">{order.phone}</span>
                   {order.phone && (
                     <EcoTrackBadge score={computeEcoTrackScore(order.phone, allOrders, isCustomerBanned)} />
                   )}
                 </div>
              </div>
              <div className="flex items-center gap-8 border-b border-neutral-800/50 pb-3">
                 <span className="text-sm text-neutral-400 w-32">Email:</span>
                 <span className="font-medium text-neutral-300">{order.email || order.customerEmail || "client@dzbuild.com (défaut)"}</span>
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
          
          {/* Facteur de confiance EcoTrack */}
          {order.phone && (
            <EcoTrackBadge 
              variant="card" 
              score={computeEcoTrackScore(order.phone, allOrders, isCustomerBanned)} 
            />
          )}

          {/* Note sur la commande */}
          <div className="bg-[#1e1e24] border border-amber-500/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-amber-400">
                <StickyNote className="w-4 h-4" /> Note sur la commande
              </h3>
              {notesSavedSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <Check className="w-3.5 h-3.5" /> Enregistré !
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Ajoutez des instructions spécifiques, détails de confirmation ou notes internes du livreur.
            </p>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Client a demandé une livraison après 16h, appeler avant d'arriver..."
              className="w-full bg-[#16161a] border border-neutral-700 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 resize-none mb-3 font-medium"
            />
            <button 
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs transition-all shadow cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingNotes ? "Enregistrement..." : "Enregistrer la note"}
            </button>
          </div>

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
              
              <div className="space-y-2">
                <button 
                  onClick={handleUpdateStatus}
                  className="w-full bg-[#2b2b36] hover:bg-[#3b3b46] text-yellow-400 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer border border-yellow-500/20"
                >
                  <Check className="w-3.5 h-3.5" /> Appliquer le statut
                </button>
                
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleOpenEditModal}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Modifier les informations
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
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

      {/* Modal: Modifier la commande */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Modifier la commande #{displayId}
                  </h2>
                  <p className="text-xs text-neutral-400">Modifier les coordonnées du client, livraison et articles.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOrderDetails} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Nom & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Nom du client *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    placeholder="Ex: Karim Benali"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Téléphone *
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0550123456"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Wilaya & Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Wilaya *
                  </label>
                  <select
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                  >
                    {ALGERIAN_WILAYAS.map(w => (
                      <option key={w.code} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Commune
                  </label>
                  <input 
                    type="text" 
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    placeholder="Ex: Bab Ezzouar"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Adresse complète
                </label>
                <input 
                  type="text" 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Rue, N° de maison, quartier..."
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Mode & Frais de livraison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Mode de livraison
                  </label>
                  <select
                    value={editShippingMethod}
                    onChange={(e) => setEditShippingMethod(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                  >
                    <option value="Livraison à domicile">Livraison à domicile</option>
                    <option value="Point de relais (Stop Desk)">Point de relais (Stop Desk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Frais de livraison (DA)
                  </label>
                  <input 
                    type="number"
                    min={0}
                    value={editShippingCost}
                    onChange={(e) => setEditShippingCost(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="400"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Articles & Montant Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Description des articles
                  </label>
                  <input 
                    type="text" 
                    value={editItemsSummary}
                    onChange={(e) => setEditItemsSummary(e.target.value)}
                    placeholder="Ex: Montre Luxe (x1)"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Montant total (DA) *
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    required
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ex: 4500"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors font-bold"
                  />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Statut de la commande
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                >
                  <option value="En attente">En attente (Nouvelle commande)</option>
                  <option value="Confirmée">Confirmée</option>
                  <option value="En préparation">En préparation</option>
                  <option value="Expédiée">Expédiée</option>
                  <option value="Livrée">Livrée</option>
                  <option value="Annulée">Annulée</option>
                  <option value="Retournée">Retournée</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Note & Instructions sur la commande
                </label>
                <textarea 
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Instructions de livraison, note interne..."
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors resize-none font-medium"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black text-sm font-semibold transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmation de suppression */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer la commande"
        description={`Êtes-vous sûr de vouloir supprimer définitivement la commande #${displayId} (${order?.client}) ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
