import { useLanguage } from "../contexts/LanguageContext";
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
  X, Slash, RotateCw, Calculator, 
  Loader2, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Truck, 
  PackageCheck, 
  Clock, 
  Ban, 
  RotateCcw, 
  MessageCircle, ArrowLeft, Shield, PackageOpen, LayoutList, CheckCircle, Package, Home, 
  Check, 
  Copy,
  DollarSign,
  Eye, User,
  HelpCircle
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
  setDoc,
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { ALGERIAN_WILAYAS } from "../data/landingData";
import { getWhatsAppUrl } from "../lib/whatsapp";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../lib/phoneUtils";
import { getBlacklistedPhones, banPhoneNumber, unbanPhoneNumber, normalizePhoneForBlacklist } from "../lib/blacklist";

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
  shippingCost?: number;
  image?: string;
  productImage?: string;
  items?: any[];
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
  const { t, dir } = useLanguage();
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
  const [previewOrder, setPreviewOrder] = useState<OrderItem | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderItem | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmation Modals State
  const [orderToDelete, setOrderToDelete] = useState<OrderItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Products for order creation & enrichment
  const [productsList, setProductsList] = useState<any[]>([]);

  // Blacklist state
  const [bannedPhones, setBannedPhones] = useState<Set<string>>(new Set());
  const [isBanning, setIsBanning] = useState(false);

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
  const [formImage, setFormImage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

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
      // 1. Load products for lookup & selection
      const prodSnap = await getDocs(collection(db, "products")).catch(() => null);
      const prods: any[] = [];
      const prodMap = new Map<string, any>();
      const prodByName = new Map<string, any>();

      if (prodSnap) {
        prodSnap.docs.forEach(p => {
          const pData = { id: p.id, ...p.data() };
          prods.push(pData);
          prodMap.set(p.id, pData);
          if (pData.name) {
            prodByName.set(pData.name.toLowerCase().trim(), pData);
          }
        });
      }
      setProductsList(prods);

      // 2. Load orders
      const q1 = query(collection(db, "orders"), where("userId", "==", user.uid));
      const q2 = query(collection(db, "tenants", user.uid, "orders"));
      
      const [snap1, snap2] = await Promise.all([
        getDocs(q1).catch(() => null),
        getDocs(q2).catch(() => null)
      ]);

      const loadedMap = new Map<string, OrderItem>();

      const processDoc = (docSnap: any) => {
        const data = docSnap.data();
        let formattedDate = data.date || "Récemment";
        
        if (data.createdAt?.toDate) {
          const d = data.createdAt.toDate();
          const pad = (n: number) => String(n).padStart(2, "0");
          formattedDate = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else if (data.createdAt && typeof data.createdAt === "string") {
          const d = new Date(data.createdAt);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, "0");
            formattedDate = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          }
        }

        // Resolve product image intelligently
        let resolvedImage = data.image || data.productImage || "";
        let items = Array.isArray(data.items) ? data.items.map(it => ({ ...it })) : [];

        if (!resolvedImage && items.length > 0) {
          for (const it of items) {
            if (it.image) {
              resolvedImage = it.image;
              break;
            }
            if (it.productId && prodMap.has(it.productId)) {
              const p = prodMap.get(it.productId);
              resolvedImage = p.image || (p.images && p.images[0]) || "";
              it.image = resolvedImage;
              break;
            }
            const cleanItName = (it.name || "").toLowerCase().trim();
            if (cleanItName && prodByName.has(cleanItName)) {
              const p = prodByName.get(cleanItName);
              resolvedImage = p.image || (p.images && p.images[0]) || "";
              it.image = resolvedImage;
              break;
            }
          }
        }

        // If still no image, check productName or itemsSummary
        if (!resolvedImage) {
          const textToSearch = (data.productName || data.itemsSummary || "").toLowerCase().trim();
          for (const [pName, p] of prodByName.entries()) {
            if (textToSearch.includes(pName) || pName.includes(textToSearch)) {
              resolvedImage = p.image || (p.images && p.images[0]) || "";
              break;
            }
          }
        }

        // Inject image into items array if missing
        if (resolvedImage) {
          if (items.length === 0) {
            items = [{
              name: data.itemsSummary || data.productName || "Article boutique",
              price: Number(data.total) || 0,
              quantity: Number(data.quantity) || 1,
              image: resolvedImage
            }];
          } else {
            items = items.map(it => ({
              ...it,
              image: it.image || resolvedImage
            }));
          }
        }

        const item: OrderItem = {
          id: docSnap.id,
          orderNumber: data.orderNumber || `#${docSnap.id.slice(0, 5).toUpperCase()}`,
          date: formattedDate,
          client: data.client || data.customerName || data.name || "Client",
          phone: data.phone || data.customerPhone || "",
          wilaya: data.wilaya || "Alger - 16",
          commune: data.commune || "",
          address: data.address || "",
          itemsSummary: data.itemsSummary || data.productName || "Article boutique",
          total: Number(data.total) || 0,
          status: data.status || "En attente",
          notes: data.notes || "",
          userId: data.userId || user.uid,
          shippingCost: data.shippingCost || data.deliveryFee,
          image: resolvedImage,
          productImage: resolvedImage,
          items: items.length > 0 ? items : undefined
        };

        const key = data.reference || data.orderNumber || docSnap.id;
        if (!loadedMap.has(key)) {
          loadedMap.set(key, item);
        }
      };

      if (snap1) snap1.forEach(processDoc);
      if (snap2) snap2.forEach(processDoc);

      const loaded = Array.from(loadedMap.values());
      setOrders(loaded);

      // 3. Load blacklist
      const blacklistedSet = await getBlacklistedPhones(user.uid);
      setBannedPhones(blacklistedSet);
    } catch (err) {
      console.error("Error loading orders:", err);
      showToast("Erreur lors du chargement des commandes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (phone: string, clientName?: string) => {
    if (!user || !phone) return;
    const normalized = normalizePhoneForBlacklist(phone);
    if (!normalized) {
      showToast("Numéro de téléphone invalide.", "error");
      return;
    }

    setIsBanning(true);
    try {
      const isCurrentlyBanned = bannedPhones.has(normalized);
      if (isCurrentlyBanned) {
        await unbanPhoneNumber(user.uid, phone);
        setBannedPhones(prev => {
          const next = new Set(prev);
          next.delete(normalized);
          return next;
        });
        showToast(`Numéro ${phone} retiré de la liste noire.`, "success");
      } else {
        await banPhoneNumber(user.uid, phone, clientName, "Banni depuis la commande");
        setBannedPhones(prev => {
          const next = new Set(prev);
          next.add(normalized);
          return next;
        });
        showToast(`Le client ${phone} a été banni avec succès !`, "success");
      }
    } catch (err) {
      console.error("Erreur lors du bannissement:", err);
      showToast("Erreur lors de la mise à jour du bannissement.", "error");
    } finally {
      setIsBanning(false);
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
      setFormImage(order.image || order.productImage || (order.items && order.items[0]?.image) || "");
      setSelectedProductId("");
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
      setFormImage("");
      setSelectedProductId("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setFormError("");
    setFormImage("");
    setSelectedProductId("");
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    if (!productId) return;
    const prod = productsList.find(p => p.id === productId);
    if (prod) {
      if (!formItemsSummary || formItemsSummary === "Commande standard") {
        setFormItemsSummary(`1x ${prod.name}`);
      }
      if (formTotal === "" || formTotal === 0) {
        setFormTotal(prod.price || 0);
      }
      const pImg = prod.image || (prod.images && prod.images[0]) || "";
      if (pImg) {
        setFormImage(pImg);
      }
    }
  };

  const handleSaveOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formClient.trim()) {
      setFormError("Veuillez renseigner le nom du client.");
      return;
    }
    const phoneValidation = validatePhoneNumber(formPhone);
    if (!phoneValidation.isValid) {
      setFormError(phoneValidation.error || "Veuillez renseigner un numéro de téléphone valide.");
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
      image: formImage || "",
      productImage: formImage || "",
      items: [{
        name: formItemsSummary.trim() || "Commande standard",
        price: Number(formTotal),
        quantity: 1,
        image: formImage || ""
      }],
      updatedAt: serverTimestamp()
    };

    try {
      if (editingOrder) {
        const orderRef = doc(db, "orders", editingOrder.id);
        await updateDoc(orderRef, orderData);
        // Also update tenant collection if it exists
        try {
          await updateDoc(doc(db, "tenants", user.uid, "orders", editingOrder.id), orderData);
        } catch (_) {}

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
        // Also save to tenant subcollection
        try {
          await setDoc(doc(db, "tenants", user.uid, "orders", docRef.id), {
            ...orderData,
            orderNumber: genOrderNum,
            date: formattedDate,
            createdAt: serverTimestamp()
          });
        } catch (_) {}

        const newOrder: OrderItem = {
          id: docRef.id,
          ...orderData,
          orderNumber: genOrderNum,
          date: formattedDate
        };

        try {
          const alertPayload = {
            ...newOrder,
            createdAt: Date.now()
          };
          window.dispatchEvent(new CustomEvent("order_created", { detail: alertPayload }));
          localStorage.setItem("last_order_alert", JSON.stringify(alertPayload));
        } catch (evErr) {}

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

  const handleBulkStatusChange = async (newStatus: OrderStatus, idsToUpdate = selectedIds) => {
    if (idsToUpdate.length === 0) return;
    try {
      for (const id of idsToUpdate) {
        await updateDoc(doc(db, "orders", id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      }
      setOrders(orders.map(o => idsToUpdate.includes(o.id) ? { ...o, status: newStatus } : o));
      showToast(`${idsToUpdate.length} commande(s) marquée(s) comme "${newStatus}"`);
      if (idsToUpdate === selectedIds) setSelectedIds([]);
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
            <p className="text-xs text-neutral-400">{t("orders.total")}</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalOrdersCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("orders.toConfirm")}</p>
            <p className="text-xl font-bold text-yellow-400 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("orders.delivering")}</p>
            <p className="text-xl font-bold text-purple-400 mt-0.5">{shippingCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("orders.cashed")}</p>
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
              <option value="all">{t("orders.allWilayas")}</option>
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
              <tbody className="divide-y divide-neutral-800/70">
                {filteredOrders.map((order, index) => {
                  const isSelected = selectedIds.includes(order.id);
                  const badge = getStatusBadge(order.status);
                  
                  // Extract image: order.image, order.productImage, or first product item image
                  const firstProduct = order.items && order.items.length > 0 ? order.items[0] : null;
                  const imageUrl = order.image || order.productImage || firstProduct?.image || firstProduct?.imageUrl || "";
                  
                  // Format date and time
                  let dateStr = "";
                  let timeStr = "";
                  if (order.date) {
                    const parts = order.date.trim().split(' ');
                    dateStr = parts[0] || "";
                    timeStr = parts[1] || "";
                  } else {
                     dateStr = "N/A";
                  }
                  
                  // Display ID (just the short number or # + index)
                  const displayId = `#${index + 1}`;

                  return (
                    <tr 
                      key={order.id}
                      onClick={() => setPreviewOrder(order)}
                      className={`hover:bg-[#16161a]/60 transition-colors cursor-pointer ${isSelected ? "bg-yellow-500/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(order.id)}
                          className="rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900 cursor-pointer" 
                        />
                      </td>
                      
                      {/* Product Image & ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0 border border-neutral-700 relative flex items-center justify-center shadow-inner">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={firstProduct?.name || order.itemsSummary || "Produit"} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fb = parent.querySelector('.table-img-fallback');
                                    if (fb) (fb as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`table-img-fallback w-full h-full items-center justify-center text-yellow-500/70 ${imageUrl ? 'hidden' : 'flex'}`}>
                              <Package className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-base">
                             {displayId} <HelpCircle className="w-4 h-4 text-neutral-500" />
                          </div>
                        </div>
                      </td>
                      
                      {/* Client */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-base">{order.client}</span>
                          <span className="text-yellow-500 text-xs mt-0.5">{order.phone}</span>
                        </div>
                      </td>
                      
                      {/* Total */}
                      <td className="px-4 py-3 font-bold text-white text-base">
                        {order.total.toLocaleString()} DA
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                           className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all ${badge.cls}`}
                        >
                           {order.status}
                        </button>
                      </td>
                      
                      {/* Date & Heure */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col text-neutral-400 text-sm items-end">
                           <span className="font-medium text-white">{dateStr}</span>
                           {timeStr ? (
                             <span className="text-xs text-yellow-500 font-mono flex items-center gap-1 mt-0.5 font-semibold">
                               <Clock className="w-3 h-3 text-yellow-500/80" />
                               {timeStr}
                             </span>
                           ) : (
                             <span className="text-xs text-neutral-500 font-mono">--:--</span>
                           )}
                        </div>
                      </td>
                      
                      {/* Actions (View Full Details) - Desktop only hover or visible */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.location.href = `/dashboard/orders/${order.id}`}
                            title="Voir les détails complets"
                            className="px-4 py-1.5 rounded-lg bg-[#2b2b36] hover:bg-[#3b3b46] text-white flex items-center gap-2 transition-colors cursor-pointer text-xs font-semibold ml-auto"
                          >
                            <Eye
  className="w-4 h-4" /> Voir
                          </button>
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
                    maxLength={getPhoneMaxLength(formPhone)}
                    value={formPhone}
                    onChange={(e) => {
                      const cleaned = cleanAndLimitPhone(e.target.value);
                      setFormPhone(cleaned);
                      if (formError) setFormError("");
                    }}
                    placeholder="Ex: 0550252565 ou 213550252565"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">
                    10 chiffres commençant par 05, 06 ou 07 (ou indicatif ex: 213550252565)
                  </p>
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

              {/* Product selection from catalog */}
              {productsList.length > 0 && (
                <div className="pt-2 border-t border-neutral-800">
                  <label className="block text-sm font-medium text-yellow-500/90 mb-1.5 flex items-center justify-between">
                    <span>Associer un produit du catalogue (Optionnel)</span>
                    {formImage && (
                      <span className="text-xs text-neutral-400 font-normal">Image produit liée</span>
                    )}
                  </label>
                  <div className="flex gap-3 items-center">
                    {formImage ? (
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img src={formImage} alt="Aperçu" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className="flex-1 rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                    >
                      <option value="">-- Choisir un produit existant --</option>
                      {productsList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.price ? `(${Number(p.price).toLocaleString()} DA)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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

              {/* Image URL (Optional) */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Lien de l'image du produit (Optionnel)
                </label>
                <input 
                  type="url" 
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://... (URL de la photo)"
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                />
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
                  <option value="Annulée">{t("orders.canceled")}</option>
                  <option value="Retournée">{t("orders.returned")}</option>
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
                           <a href={`tel:${previewOrder.phone}`} className="bg-emerald-500/20 text-emerald-500 p-1 rounded hover:bg-emerald-500/30">
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
                           {previewOrder && bannedPhones.has(normalizePhoneForBlacklist(previewOrder.phone)) ? (
                              <span className="text-red-400 bg-red-500/10 border border-red-500/20 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5">
                                 <Ban className="w-3.5 h-3.5" /> Banni
                              </span>
                           ) : (
                              <span className="text-emerald-500 text-sm font-semibold flex items-center gap-1">
                                 <CheckCircle className="w-3.5 h-3.5" /> Non banni
                              </span>
                           )}
                           <button 
                             onClick={() => handleToggleBan(previewOrder.phone, previewOrder.client)}
                             disabled={isBanning}
                             className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 ${
                               previewOrder && bannedPhones.has(normalizePhoneForBlacklist(previewOrder.phone))
                                 ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                                 : "bg-red-500 text-white hover:bg-red-600"
                             }`}
                           >
                              <Ban className="w-3 h-3" /> {previewOrder && bannedPhones.has(normalizePhoneForBlacklist(previewOrder.phone)) ? "Débannir" : "Bannir"}
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
                        <span className="text-sm text-neutral-400">Date & Heure de commande</span>
                        <span className="font-semibold text-white flex items-center gap-1.5 font-mono text-sm">
                          <Clock className="w-3.5 h-3.5 text-yellow-500" />
                          {previewOrder.date}
                        </span>
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
                        <option value="En attente">{t("orders.pending")}</option>
                        <option value="Confirmée">{t("orders.confirmed")}</option>
                        <option value="En préparation">En préparation</option>
                        <option value="Expédiée">{t("orders.shipped")}</option>
                        <option value="Livrée">{t("orders.delivered")}</option>
                        <option value="Annulée">{t("orders.canceled")}</option>
                        <option value="Retournée">{t("orders.returned")}</option>
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
                      {((previewOrder.items && previewOrder.items.length > 0) ? previewOrder.items : [{
                        name: previewOrder.itemsSummary || "Produit commandé",
                        price: previewOrder.total,
                        quantity: 1,
                        image: previewOrder.image || previewOrder.productImage || ""
                      }]).map((item, idx) => {
                        const itemImg = item.image || previewOrder.image || previewOrder.productImage || "";
                        return (
                          <div key={idx} className="bg-[#16161a] border border-neutral-800 rounded-xl p-3 flex gap-3 items-center">
                            <div className="w-14 h-14 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                              {itemImg ? (
                                <img 
                                  src={itemImg} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      const fb = parent.querySelector('.preview-img-fallback');
                                      if (fb) (fb as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div className={`preview-img-fallback w-full h-full items-center justify-center text-yellow-500/70 ${itemImg ? 'hidden' : 'flex'}`}>
                                <Package className="w-6 h-6" />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center min-w-0">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                                  <span className="font-bold text-yellow-500 text-xs ml-2 shrink-0">{Number(item.price || 0).toLocaleString()} DA</span>
                               </div>
                               {item.variants && Object.entries(item.variants).map(([k, v]) => (
                                  <span key={k} className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> {k}: {v as string}
                                  </span>
                               ))}
                               <span className="text-xs text-neutral-500 mt-1">Quantité : {item.quantity || 1}</span>
                            </div>
                          </div>
                        );
                      })}
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
                onClick={() => window.location.href = `/dashboard/orders/${previewOrder.id}`}
                className="flex-1 bg-[#2b2b36] hover:bg-[#3b3b46] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
              >
                Voir les détails complets
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
