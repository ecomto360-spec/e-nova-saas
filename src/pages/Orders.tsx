import { useState, useEffect, FormEvent } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Truck, 
  PackageCheck, 
  Clock, 
  Ban, 
  RotateCcw, 
  MessageCircle, 
  Check, 
  Copy,
  DollarSign
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { ALGERIAN_WILAYAS } from "../data/landingData";
import { getWhatsAppUrl } from "../lib/whatsapp";
import { ConfirmModal } from "../components/common/ConfirmModal";

export type OrderStatus = 
  | "En attente" 
  | "Confirmée" 
  | "Expédiée" 
  | "Livrée" 
  | "Annulée" 
  | "Retournée" 
  | "Échouée";

export interface OrderItem {
  id: string;
  orderNumber: string;
  date: string;
  client: string;
  phone: string;
  wilaya: string;
  commune: string;
  address?: string;
  itemsSummary?: string;
  total: number;
  status: OrderStatus;
  notes?: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

const ORDER_TABS: (string | "Tous")[] = [
  "Tous", 
  "En attente", 
  "Confirmée", 
  "Expédiée", 
  "Livrée", 
  "Annulée", 
  "Retournée"
];

const INITIAL_DEMO_ORDERS = [
  { orderNumber: "#1005", date: "19/08/2026 10:30", client: "Amine Benali", phone: "0555123456", wilaya: "Alger - 16", commune: "Bab El Oued", address: "14 Rue Didouche", itemsSummary: "Pack T-shirt (x2)", total: 4500, status: "En attente" as OrderStatus, notes: "Appeler avant 14h pour confirmer." },
  { orderNumber: "#1004", date: "18/08/2026 14:15", client: "Sarah Mansouri", phone: "0770987654", wilaya: "Oran - 31", commune: "Bir El Djir", address: "Cité USTO", itemsSummary: "Montre Quartz Luxe (x1)", total: 12000, status: "Confirmée" as OrderStatus, notes: "Livraison à domicile demandée." },
  { orderNumber: "#1003", date: "17/08/2026 09:45", client: "Karim Slimani", phone: "0661234567", wilaya: "Constantine - 25", commune: "El Khroub", address: "Centre-ville", itemsSummary: "Baskets Sport running (x1)", total: 8900, status: "Livrée" as OrderStatus, notes: "Paiement encaissé avec succès." },
  { orderNumber: "#1002", date: "16/08/2026 16:20", client: "Yacine Merbah", phone: "0550112233", wilaya: "Blida - 09", commune: "Boufarik", address: "Boufarik centre", itemsSummary: "Sacoche Cuir (x1)", total: 3200, status: "Annulée" as OrderStatus, notes: "Client injoignable après 3 tentatives." },
  { orderNumber: "#1001", date: "15/08/2026 11:10", client: "Lyes Kadi", phone: "0771445566", wilaya: "Sétif - 19", commune: "El Eulma", address: "Rue commerciale", itemsSummary: "Pack Promo Beauté (x3)", total: 25000, status: "Expédiée" as OrderStatus, notes: "Colis confié au transporteur express." },
];

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [selectedTab, setSelectedTab] = useState<string>("Tous");
  const [search, setSearch] = useState("");
  const [wilayaFilter, setWilayaFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmation Modals State
  const [orderToDelete, setOrderToDelete] = useState<OrderItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form Fields
  const [formClient, setFormClient] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWilaya, setFormWilaya] = useState("Alger - 16");
  const [formCommune, setFormCommune] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formItemsSummary, setFormItemsSummary] = useState("");
  const [formTotal, setFormTotal] = useState<number | "">("");
  const [formStatus, setFormStatus] = useState<OrderStatus>("En attente");
  const [formNotes, setFormNotes] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const loaded: OrderItem[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          orderNumber: data.orderNumber || `#${docSnap.id.slice(0, 5).toUpperCase()}`,
          date: data.date || "Récemment",
          client: data.client || data.name || "Client",
          phone: data.phone || "",
          wilaya: data.wilaya || "Alger - 16",
          commune: data.commune || "",
          address: data.address || "",
          itemsSummary: data.itemsSummary || data.productName || "Article boutique",
          total: Number(data.total) || 0,
          status: data.status || "En attente",
          notes: data.notes || "",
          userId: data.userId
        });
      });

      setOrders(loaded);
    } catch (err) {
      console.error("Error loading orders:", err);
      showToast("Erreur lors du chargement des commandes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (order?: OrderItem) => {
    setFormError("");
    if (order) {
      setEditingOrder(order);
      setFormClient(order.client);
      setFormPhone(order.phone);
      setFormWilaya(order.wilaya);
      setFormCommune(order.commune);
      setFormAddress(order.address || "");
      setFormItemsSummary(order.itemsSummary || "");
      setFormTotal(order.total);
      setFormStatus(order.status);
      setFormNotes(order.notes || "");
    } else {
      setEditingOrder(null);
      setFormClient("");
      setFormPhone("");
      setFormWilaya("Alger - 16");
      setFormCommune("");
      setFormAddress("");
      setFormItemsSummary("");
      setFormTotal("");
      setFormStatus("En attente");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setFormError("");
  };

  const handleSaveOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formClient.trim()) {
      setFormError("Veuillez renseigner le nom du client.");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("Veuillez renseigner le numéro de téléphone.");
      return;
    }
    if (formTotal === "" || Number(formTotal) < 0) {
      setFormError("Veuillez renseigner un montant total valide.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const orderData = {
      client: formClient.trim(),
      phone: formPhone.trim(),
      wilaya: formWilaya,
      commune: formCommune.trim(),
      address: formAddress.trim(),
      itemsSummary: formItemsSummary.trim() || "Commande standard",
      total: Number(formTotal),
      status: formStatus,
      notes: formNotes.trim(),
      userId: user.uid,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingOrder) {
        const orderRef = doc(db, "orders", editingOrder.id);
        await updateDoc(orderRef, orderData);

        setOrders(orders.map(o => 
          o.id === editingOrder.id 
            ? { ...o, ...orderData }
            : o
        ));
        showToast(`Commande ${editingOrder.orderNumber} mise à jour`);
      } else {
        const genOrderNum = `#${Math.floor(1000 + Math.random() * 9000)}`;
        const docRef = await addDoc(collection(db, "orders"), {
          ...orderData,
          orderNumber: genOrderNum,
          date: formattedDate,
          createdAt: serverTimestamp()
        });

        const newOrder: OrderItem = {
          id: docRef.id,
          ...orderData,
          orderNumber: genOrderNum,
          date: formattedDate
        };

        setOrders([newOrder, ...orders]);
        showToast(`Commande ${genOrderNum} créée`);
      }

      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving order:", err);
      setFormError(err.message || "Erreur lors de l'enregistrement de la commande.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "orders", orderToDelete.id));
      setOrders(orders.filter(o => o.id !== orderToDelete.id));
      setSelectedIds(selectedIds.filter(i => i !== orderToDelete.id));
      showToast(`Commande ${orderToDelete.orderNumber} supprimée`);
      setOrderToDelete(null);
    } catch (err) {
      console.error("Error deleting order:", err);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (order: OrderItem, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      showToast(`Statut mis à jour : ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("Impossible de mettre à jour le statut", "error");
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "orders", id));
      }
      setOrders(orders.filter(o => !selectedIds.includes(o.id)));
      showToast(`${selectedIds.length} commande(s) supprimée(s)`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error("Error bulk deleting orders:", err);
      showToast("Erreur lors de la suppression groupée", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: OrderStatus) => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await updateDoc(doc(db, "orders", id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      }
      setOrders(orders.map(o => selectedIds.includes(o.id) ? { ...o, status: newStatus } : o));
      showToast(`${selectedIds.length} commande(s) marquée(s) comme "${newStatus}"`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Error updating bulk status:", err);
      showToast("Erreur lors de la mise à jour groupée", "error");
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast("Aucune commande à exporter", "error");
      return;
    }

    const dataToExport = selectedIds.length > 0
      ? orders.filter(o => selectedIds.includes(o.id))
      : filteredOrders;

    const headers = ["N° Commande", "Date", "Client", "Téléphone", "Wilaya", "Commune", "Adresse", "Articles", "Total (DA)", "Statut", "Remarques"];
    const rows = dataToExport.map(o => [
      `"${o.orderNumber}"`,
      `"${o.date}"`,
      `"${o.client.replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${o.wilaya}"`,
      `"${o.commune.replace(/"/g, '""')}"`,
      `"${(o.address || "").replace(/"/g, '""')}"`,
      `"${(o.itemsSummary || "").replace(/"/g, '""')}"`,
      o.total,
      `"${o.status}"`,
      `"${(o.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `commandes_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${dataToExport.length} commande(s) exportée(s) en CSV`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copié`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case "En attente": 
        return { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Clock };
      case "Confirmée": 
        return { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: CheckCircle2 };
      case "Expédiée": 
        return { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: Truck };
      case "Livrée": 
        return { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: PackageCheck };
      case "Annulée": 
      case "Échouée": 
        return { cls: "bg-red-500/15 text-red-400 border-red-500/30", icon: Ban };
      case "Retournée": 
        return { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: RotateCcw };
      default: 
        return { cls: "bg-neutral-800 text-neutral-400 border-neutral-700", icon: Clock };
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchTab = selectedTab === "Tous" || o.status === selectedTab;
    const matchSearch = 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.client.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.toLowerCase().includes(search.toLowerCase()) ||
      o.commune.toLowerCase().includes(search.toLowerCase()) ||
      o.wilaya.toLowerCase().includes(search.toLowerCase());
    const matchWilaya = wilayaFilter === "all" || o.wilaya === wilayaFilter;

    return matchTab && matchSearch && matchWilaya;
  });

  // Metrics
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter(o => o.status === "En attente").length;
  const readyToShipCount = orders.filter(o => o.status === "Confirmée").length;
  const shippingCount = orders.filter(o => o.status === "Expédiée").length;
  const deliveredRevenue = orders
    .filter(o => o.status === "Livrée")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
          toast.type === "success" 
            ? "bg-emerald-950/90 text-emerald-300 border-emerald-800 backdrop-blur-md" 
            : "bg-red-950/90 text-red-300 border-red-800 backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-yellow-500" />
            Commandes
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gérez vos commandes reçues, mettez à jour les statuts et organisez vos expéditions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-[#1e1e24] px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Exporter {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/10 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Créer une commande
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neutral-800 text-white flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Total commandes</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalOrdersCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">À confirmer</p>
            <p className="text-xl font-bold text-yellow-400 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">En cours de livraison</p>
            <p className="text-xl font-bold text-purple-400 mt-0.5">{shippingCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Encaissé (Livrées)</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{deliveredRevenue.toLocaleString()} <span className="text-xs font-normal text-neutral-500">DA</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] overflow-hidden shadow-xl">
        
        {/* Status Tabs */}
        <div className="flex overflow-x-auto border-b border-neutral-800 px-4 bg-[#16161a]">
          {ORDER_TABS.map((tab) => {
            const count = tab === "Tous" 
              ? orders.length 
              : orders.filter(o => o.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTab === tab
                    ? "border-yellow-500 text-yellow-500 bg-yellow-500/5"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span>{tab}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedTab === tab ? "bg-yellow-500/20 text-yellow-400" : "bg-neutral-800 text-neutral-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 bg-[#1e1e24] border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par n° commande, client, téléphone, commune..." 
              className="w-full rounded-xl border border-neutral-700 bg-[#16161a] py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Wilaya Filter */}
            <select
              value={wilayaFilter}
              onChange={(e) => setWilayaFilter(e.target.value)}
              className="rounded-xl border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-neutral-200 focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">Toutes les wilayas</option>
              {ALGERIAN_WILAYAS.map(w => (
                <option key={w.code} value={w.name}>{w.name}</option>
              ))}
            </select>

            {/* Bulk Actions if items selected */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value as OrderStatus);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                  className="rounded-xl border border-neutral-700 bg-[#16161a] px-3 py-2 text-xs text-white font-medium focus:border-yellow-500 focus:outline-none"
                >
                  <option value="" disabled>Changer statut ({selectedIds.length})</option>
                  <option value="Confirmée">Marquer Confirmée</option>
                  <option value="Expédiée">Marquer Expédiée</option>
                  <option value="Livrée">Marquer Livrée</option>
                  <option value="Annulée">Marquer Annulée</option>
                </select>

                <button
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <p className="text-sm text-neutral-400">Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Aucune commande trouvée</h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-4">
              {search || wilayaFilter !== "all" || selectedTab !== "Tous"
                ? "Aucune commande ne correspond aux filtres actuels."
                : "Créez votre première commande manuelle ou recevez-en depuis vos landing pages."}
            </p>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Créer une commande
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-[#16161a] text-xs uppercase text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th scope="col" className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900 cursor-pointer" 
                    />
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">N° Commande</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Client & Contact</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Destination</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Articles</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Statut</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-right">Total</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {filteredOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const badge = getStatusBadge(order.status);
                  const StatusIcon = badge.icon;

                  return (
                    <tr 
                      key={order.id}
                      className={`hover:bg-[#16161a]/60 transition-colors ${isSelected ? "bg-yellow-500/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(order.id)}
                          className="rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900 cursor-pointer" 
                        />
                      </td>

                      {/* Order Number */}
                      <td className="px-4 py-4">
                        <span className="font-bold text-white font-mono bg-[#16161a] px-2.5 py-1 rounded-lg border border-neutral-700">
                          {order.orderNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-neutral-400">
                        {order.date}
                      </td>

                      {/* Client */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{order.client}</span>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5 group">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            <a href={`tel:${order.phone}`} className="hover:text-yellow-400 transition-colors">
                              {order.phone}
                            </a>
                            <button 
                              onClick={() => copyToClipboard(order.phone, "Téléphone")}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-white"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-neutral-200 font-medium text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
                            {order.wilaya}
                          </span>
                          <span className="text-xs text-neutral-400 ml-4 truncate max-w-[130px]">
                            {order.commune}
                          </span>
                        </div>
                      </td>

                      {/* Articles summary */}
                      <td className="px-4 py-4">
                        <span className="text-xs text-neutral-300 font-medium line-clamp-1 max-w-[150px]">
                          {order.itemsSummary || "1x Article"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <div className="relative inline-block group">
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${badge.cls}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {order.status}
                          </button>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-extrabold text-white text-sm">
                          {order.total.toLocaleString()} <span className="text-xs text-yellow-500 font-semibold">DA</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* WhatsApp */}
                          {order.phone && (
                            <a
                              href={getWhatsAppUrl(order.phone, `Bonjour ${order.client}, nous vous contactons concernant votre commande ${order.orderNumber}.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contacter sur WhatsApp"
                              className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenModal(order)}
                            title="Modifier la commande"
                            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setOrderToDelete(order)}
                            title="Supprimer"
                            className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingOrder ? `Modifier la commande ${editingOrder.orderNumber}` : "Créer une commande manuelle"}
                  </h2>
                  <p className="text-xs text-neutral-400">Informations client, livraison et détails des articles.</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOrder} className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Client and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Nom du client <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    placeholder="Ex: Amine Benali"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Téléphone <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ex: 0555 12 34 56"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Wilaya de livraison
                  </label>
                  <select
                    value={formWilaya}
                    onChange={(e) => setFormWilaya(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                  >
                    {ALGERIAN_WILAYAS.map((w) => (
                      <option key={w.code} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Commune
                  </label>
                  <input 
                    type="text" 
                    value={formCommune}
                    onChange={(e) => setFormCommune(e.target.value)}
                    placeholder="Ex: Bab El Oued"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Adresse exacte
                </label>
                <input 
                  type="text" 
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ex: Rue Didouche Mourad, Bâtiment 4"
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Items & Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Articles commandés
                  </label>
                  <input 
                    type="text" 
                    value={formItemsSummary}
                    onChange={(e) => setFormItemsSummary(e.target.value)}
                    placeholder="Ex: T-shirt Noir Taille L (x2)"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Montant Total (DA) <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    required
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ex: 4500"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors font-bold"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Statut de la commande
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                >
                  <option value="En attente">En attente (À confirmer)</option>
                  <option value="Confirmée">Confirmée (Prête à emballer)</option>
                  <option value="Expédiée">Expédiée (En livraison)</option>
                  <option value="Livrée">Livrée (Encaissée)</option>
                  <option value="Annulée">Annulée</option>
                  <option value="Retournée">Retournée</option>
                  <option value="Échouée">Échouée</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Notes & Instructions de livraison
                </label>
                <textarea 
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Instructions spécifiques pour le livreur ou l'équipe..."
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black text-sm font-semibold transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      {editingOrder ? "Mettre à jour" : "Créer la commande"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Confirmation de suppression d'une commande */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        title="Supprimer la commande"
        description={`Êtes-vous sûr de vouloir supprimer définitivement la commande ${orderToDelete?.orderNumber} (${orderToDelete?.client}) ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteOrder}
        onClose={() => setOrderToDelete(null)}
      />

      {/* Modal: Confirmation de suppression groupée */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title="Supprimer la sélection"
        description={`Êtes-vous sûr de vouloir supprimer définitivement les ${selectedIds.length} commandes sélectionnées ? Cette action est irréversible.`}
        confirmText="Tout supprimer"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  );
}
