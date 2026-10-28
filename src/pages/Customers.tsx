import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  Search, 
  Download, 
  Shield, 
  Users, 
  UserPlus, 
  ShieldBan,
  ShieldCheck,
  Info,
  X,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Plus,
  ShoppingBag,
  Edit2,
  Trash2,
  StickyNote,
  Save,
  Package,
  AlertCircle,
  CheckCircle2,
  Truck,
  RotateCcw,
  Ban,
  Filter
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { banPhoneNumber, unbanPhoneNumber, normalizePhoneForBlacklist } from "../lib/blacklist";
import { computeEcoTrackScore } from "../lib/ecotrack";
import { EcoTrackBadge } from "../components/common/EcoTrackBadge";
import { getWhatsAppUrl } from "../lib/whatsapp";
import { ALGERIAN_WILAYAS } from "../data/landingData";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { formatDateTime } from "../lib/date";

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "En attente" | "Confirmée" | "Expédiée" | "Livrée" | "Annulée" | "Retournée" | "Échouée";
  itemsSummary?: string;
  notes?: string;
  shippingCost?: number;
  address?: string;
  wilaya?: string;
  commune?: string;
}

export interface CustomerAggregated {
  id: string; // phone number as ID
  name: string;
  phone: string;
  wilaya: string;
  commune?: string;
  address?: string;
  notes?: string;
  orderCount: number;
  totalSpent: number;
  multipleIdentities: number;
  ip: string;
  isBanned: boolean;
  lastOrderDate: any;
  orders: CustomerOrder[];
}

export default function Customers() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [customers, setCustomers] = useState<CustomerAggregated[]>(() => {
    try {
      const custLocal = localStorage.getItem("dzbuild_customers");
      if (custLocal) {
        const parsed = JSON.parse(custLocal);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      
      const ordersLocal = localStorage.getItem("dzbuild_local_orders");
      if (ordersLocal) {
        const orders = JSON.parse(ordersLocal);
        if (Array.isArray(orders) && orders.length > 0) {
          const map = new Map<string, CustomerAggregated>();
          orders.forEach((o: any) => {
            const phone = (o.phone || o.customerPhone || "").trim();
            if (!phone) return;
            const norm = normalizePhoneForBlacklist(phone);
            const name = o.client || o.customerName || o.name || "Client";
            const wilaya = o.wilaya || "Alger - 16";
            const commune = o.commune || "";
            const address = o.address || "";
            const total = Number(o.total) || 0;
            const orderObj: CustomerOrder = {
              id: o.id || o.reference || `ord_${Math.random()}`,
              orderNumber: o.orderNumber || o.reference || "#1000",
              date: (o.createdAt || o.date) ? formatDateTime(o.createdAt || o.date, false) : "Récemment",
              total,
              status: o.status || "En attente",
              itemsSummary: o.itemsSummary || "Article",
              notes: o.notes || "",
              shippingCost: o.shippingCost,
              address,
              wilaya,
              commune
            };

            if (map.has(norm)) {
              const ex = map.get(norm)!;
              ex.orderCount += 1;
              ex.totalSpent += total;
              if (commune && !ex.commune) ex.commune = commune;
              if (address && !ex.address) ex.address = address;
              ex.orders.push(orderObj);
            } else {
              map.set(norm, {
                id: norm,
                name,
                phone,
                wilaya,
                commune,
                address,
                notes: "",
                orderCount: 1,
                totalSpent: total,
                multipleIdentities: 0,
                ip: "41.189.42.9",
                isBanned: false,
                lastOrderDate: o.createdAt || o.date,
                orders: [orderObj]
              });
            }
          });
          return Array.from(map.values());
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"clients" | "blacklist">("clients");
  const [search, setSearch] = useState("");
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<CustomerAggregated | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Edit Customer Modal State
  const [customerToEdit, setCustomerToEdit] = useState<CustomerAggregated | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWilaya, setEditWilaya] = useState("");
  const [editCommune, setEditCommune] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

  // Delete Customer State
  const [customerToDelete, setCustomerToDelete] = useState<CustomerAggregated | null>(null);
  const [deleteAssociatedOrders, setDeleteAssociatedOrders] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Edit Order inside Customer Details
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<CustomerOrder["status"]>("En attente");
  const [editOrderNotes, setEditOrderNotes] = useState("");
  const [editOrderTotal, setEditOrderTotal] = useState<number>(0);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Delete Order Confirmation
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);

  // New Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWilaya, setNewWilaya] = useState("16 - Alger");
  const [newCommune, setNewCommune] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;
    
    const customerMap = new Map<string, CustomerAggregated>();

    // 1. Seed from localStorage
    try {
      const custLocal = localStorage.getItem("dzbuild_customers");
      if (custLocal) {
        const parsed = JSON.parse(custLocal);
        if (Array.isArray(parsed)) {
          parsed.forEach((c: any) => {
            const norm = normalizePhoneForBlacklist(c.phone || c.id);
            if (norm) customerMap.set(norm, { ...c, orders: c.orders || [] });
          });
        }
      }

      const ordersLocal = localStorage.getItem("dzbuild_local_orders");
      if (ordersLocal) {
        const orders = JSON.parse(ordersLocal);
        if (Array.isArray(orders)) {
          orders.forEach((o: any) => {
            const phone = (o.phone || o.customerPhone || "").trim();
            if (!phone) return;
            const norm = normalizePhoneForBlacklist(phone);
            const name = o.client || o.customerName || o.name || "Client";
            const wilaya = o.wilaya || "Alger - 16";
            const commune = o.commune || "";
            const address = o.address || "";
            const total = Number(o.total) || 0;
            const orderObj: CustomerOrder = {
              id: o.id || o.reference || `ord_${Math.random()}`,
              orderNumber: o.orderNumber || o.reference || "#1000",
              date: (o.createdAt || o.date) ? formatDateTime(o.createdAt || o.date, false) : "Récemment",
              total,
              status: o.status || "En attente",
              itemsSummary: o.itemsSummary || "Article",
              notes: o.notes || "",
              shippingCost: o.shippingCost,
              address,
              wilaya,
              commune
            };

            if (customerMap.has(norm)) {
              const ex = customerMap.get(norm)!;
              if (commune && !ex.commune) ex.commune = commune;
              if (address && !ex.address) ex.address = address;
              const hasOrd = ex.orders.some(ord => ord.id === orderObj.id || ord.orderNumber === orderObj.orderNumber);
              if (!hasOrd) ex.orders.push(orderObj);
            } else {
              customerMap.set(norm, {
                id: norm,
                name,
                phone,
                wilaya,
                commune,
                address,
                notes: "",
                orderCount: 1,
                totalSpent: total,
                multipleIdentities: 0,
                ip: "41.189.42.9",
                isBanned: false,
                lastOrderDate: o.createdAt || o.date,
                orders: [orderObj]
              });
            }
          });
        }
      }
    } catch {}

    if (customerMap.size > 0) {
      setCustomers(Array.from(customerMap.values()));
    }

    // 2. Remote Firestore sync with fast timeout race
    const fetchRemote = async () => {
      try {
        const qCust = query(collection(db, "customers"), where("userId", "==", user.uid));
        const q1 = query(collection(db, "orders"), where("userId", "==", user.uid));
        const q2 = query(collection(db, "tenants", user.uid, "orders"));
        const qBlacklist = query(collection(db, "blacklist"), where("userId", "==", user.uid));

        const [snapCust, snap1, snap2, snapBlacklist] = await Promise.all([
          getDocs(qCust).catch(() => null),
          getDocs(q1).catch(() => null),
          getDocs(q2).catch(() => null),
          getDocs(qBlacklist).catch(() => null)
        ]);

        const blacklistedPhoneMap = new Map<string, any>();
        if (snapBlacklist) {
          snapBlacklist.forEach(docSnap => {
            const data = docSnap.data();
            if (data.phone) blacklistedPhoneMap.set(data.phone, data);
          });
        }

        if (snapCust) {
          snapCust.forEach(docSnap => {
            const data = docSnap.data();
            const phone = (data.phone || "").trim();
            if (!phone) return;
            const norm = normalizePhoneForBlacklist(phone);
            const prev = customerMap.get(norm);
            customerMap.set(norm, {
              id: norm,
              name: data.name || (prev?.name || "Client"),
              phone: data.phone,
              wilaya: data.wilaya || (prev?.wilaya || "Alger - 16"),
              commune: data.commune || (prev?.commune || ""),
              address: data.address || (prev?.address || ""),
              notes: data.notes || (prev?.notes || ""),
              orderCount: Number(data.orderCount) || (prev?.orderCount || 1),
              totalSpent: Number(data.totalSpent) || (prev?.totalSpent || 0),
              multipleIdentities: 0,
              ip: data.ip || "41.189.42.9",
              isBanned: blacklistedPhoneMap.has(norm),
              lastOrderDate: data.lastOrderDate || new Date().toISOString(),
              orders: prev?.orders || []
            });
          });
        }

        const processOrderDoc = (docSnap: any) => {
          const data = docSnap.data();
          const phone = (data.phone || data.customerPhone || "").trim();
          if (!phone) return;
          
          const normalized = normalizePhoneForBlacklist(phone);
          const name = data.client || data.customerName || data.name || "Client";
          const wilaya = data.wilaya || "Alger - 16";
          const commune = data.commune || "";
          const address = data.address || "";
          const total = Number(data.total) || 0;
          const isBanned = blacklistedPhoneMap.has(normalized);
          const orderObj: CustomerOrder = {
            id: docSnap.id,
            orderNumber: data.orderNumber || `#${docSnap.id.slice(0, 5).toUpperCase()}`,
            date: (data.createdAt || data.date) ? formatDateTime(data.createdAt || data.date, false) : "Récemment",
            total,
            status: data.status || "En attente",
            itemsSummary: data.itemsSummary || data.productName || "Article",
            notes: data.notes || "",
            shippingCost: data.shippingCost,
            address,
            wilaya,
            commune
          };

          if (customerMap.has(normalized)) {
            const existing = customerMap.get(normalized)!;
            existing.orderCount = Math.max(existing.orderCount, 1);
            if (isBanned) existing.isBanned = true;
            if (commune && !existing.commune) existing.commune = commune;
            if (address && !existing.address) existing.address = address;
            const exists = existing.orders.some(o => 
              o.id === orderObj.id || 
              (o.orderNumber && orderObj.orderNumber && o.orderNumber.replace(/^[#\s]+/, '') === orderObj.orderNumber.replace(/^[#\s]+/, '')) ||
              (data.reference && (o as any).reference === data.reference)
            );
            if (!exists) existing.orders.push(orderObj);
            customerMap.set(normalized, existing);
          } else {
            customerMap.set(normalized, {
              id: normalized,
              name,
              phone,
              wilaya,
              commune,
              address,
              notes: "",
              orderCount: 1,
              totalSpent: total,
              multipleIdentities: 0,
              ip: data.ip || "41.189.42.9",
              isBanned,
              lastOrderDate: data.createdAt || data.date,
              orders: [orderObj]
            });
          }
        };

        if (snap1) snap1.forEach(processOrderDoc);
        if (snap2) snap2.forEach(processOrderDoc);

        const list = Array.from(customerMap.values()).sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0));
        setCustomers(list);
        try {
          localStorage.setItem("dzbuild_customers", JSON.stringify(list));
        } catch {}
      } catch (err) {
        // Ignore offline errors
      } finally {
        setLoading(false);
      }
    };

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.race([fetchRemote(), timeoutPromise]);
    setLoading(false);
  };

  const handleOpenEditCustomer = (cust: CustomerAggregated) => {
    setCustomerToEdit(cust);
    setEditName(cust.name);
    setEditPhone(cust.phone);
    setEditWilaya(cust.wilaya);
    setEditCommune(cust.commune || "");
    setEditAddress(cust.address || "");
    setEditNotes(cust.notes || "");
  };

  const handleSaveCustomerEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit || !editName.trim() || !editPhone.trim()) return;

    setIsUpdatingCustomer(true);
    const oldNorm = normalizePhoneForBlacklist(customerToEdit.phone);
    const newNorm = normalizePhoneForBlacklist(editPhone);

    const updatedCust: CustomerAggregated = {
      ...customerToEdit,
      id: newNorm || customerToEdit.id,
      name: editName.trim(),
      phone: editPhone.trim(),
      wilaya: editWilaya,
      commune: editCommune.trim(),
      address: editAddress.trim(),
      notes: editNotes.trim()
    };

    const nextCustomers = customers.map(c => 
      (normalizePhoneForBlacklist(c.phone) === oldNorm) ? updatedCust : c
    );

    setCustomers(nextCustomers);
    if (selectedCustomerForDetails && normalizePhoneForBlacklist(selectedCustomerForDetails.phone) === oldNorm) {
      setSelectedCustomerForDetails(updatedCust);
    }

    try {
      localStorage.setItem("dzbuild_customers", JSON.stringify(nextCustomers));
      window.dispatchEvent(new CustomEvent("customers_updated", { detail: nextCustomers }));

      // Also update name & address on matching local orders
      const ordersLocal = localStorage.getItem("dzbuild_local_orders");
      if (ordersLocal) {
        const ords = JSON.parse(ordersLocal);
        const updatedOrds = ords.map((o: any) => {
          if (normalizePhoneForBlacklist(o.phone) === oldNorm) {
            return {
              ...o,
              client: updatedCust.name,
              phone: updatedCust.phone,
              wilaya: updatedCust.wilaya,
              commune: updatedCust.commune,
              address: updatedCust.address
            };
          }
          return o;
        });
        localStorage.setItem("dzbuild_local_orders", JSON.stringify(updatedOrds));
      }
    } catch {}

    // Firestore async update
    if (user && newNorm) {
      try {
        const custRef = doc(db, "customers", `${user.uid}_${newNorm}`);
        await setDoc(custRef, {
          userId: user.uid,
          name: updatedCust.name,
          phone: updatedCust.phone,
          normalizedPhone: newNorm,
          wilaya: updatedCust.wilaya,
          commune: updatedCust.commune,
          address: updatedCust.address,
          notes: updatedCust.notes,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore customer update notice:", err);
      }
    }

    setIsUpdatingCustomer(false);
    setCustomerToEdit(null);
    showToast("Informations du client mises à jour avec succès");
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);

    const norm = normalizePhoneForBlacklist(customerToDelete.phone);
    const nextList = customers.filter(c => normalizePhoneForBlacklist(c.phone) !== norm);
    setCustomers(nextList);

    if (selectedCustomerForDetails && normalizePhoneForBlacklist(selectedCustomerForDetails.phone) === norm) {
      setSelectedCustomerForDetails(null);
    }

    try {
      localStorage.setItem("dzbuild_customers", JSON.stringify(nextList));
      window.dispatchEvent(new CustomEvent("customers_updated", { detail: nextList }));

      if (deleteAssociatedOrders) {
        const ordersLocal = localStorage.getItem("dzbuild_local_orders");
        if (ordersLocal) {
          const ords = JSON.parse(ordersLocal);
          const filteredOrds = ords.filter((o: any) => normalizePhoneForBlacklist(o.phone) !== norm);
          localStorage.setItem("dzbuild_local_orders", JSON.stringify(filteredOrds));
        }
      }
    } catch {}

    if (user && norm) {
      try {
        await deleteDoc(doc(db, "customers", `${user.uid}_${norm}`));
        if (deleteAssociatedOrders && customerToDelete.orders) {
          for (const ord of customerToDelete.orders) {
            try {
              await deleteDoc(doc(db, "orders", ord.id));
              await deleteDoc(doc(db, "tenants", user.uid, "orders", ord.id));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn("Firestore delete notice:", err);
      }
    }

    setIsDeletingCustomer(false);
    setCustomerToDelete(null);
    setDeleteAssociatedOrders(false);
    showToast("Client supprimé avec succès");
  };

  // Edit an order directly
  const handleOpenEditOrder = (ord: CustomerOrder) => {
    setEditingOrder(ord);
    setEditOrderStatus(ord.status);
    setEditOrderNotes(ord.notes || "");
    setEditOrderTotal(ord.total);
  };

  const handleSaveOrderEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder || !selectedCustomerForDetails) return;

    setIsUpdatingOrder(true);
    const updatedOrder: CustomerOrder = {
      ...editingOrder,
      status: editOrderStatus,
      notes: editOrderNotes.trim(),
      total: Number(editOrderTotal) || 0
    };

    const updatedOrdersList = selectedCustomerForDetails.orders.map(o => 
      o.id === editingOrder.id ? updatedOrder : o
    );

    const newTotalSpent = updatedOrdersList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const updatedCustomer: CustomerAggregated = {
      ...selectedCustomerForDetails,
      orders: updatedOrdersList,
      totalSpent: newTotalSpent
    };

    setSelectedCustomerForDetails(updatedCustomer);
    setCustomers(prev => prev.map(c => 
      normalizePhoneForBlacklist(c.phone) === normalizePhoneForBlacklist(updatedCustomer.phone) ? updatedCustomer : c
    ));

    // Update localStorage
    try {
      const ordersLocal = localStorage.getItem("dzbuild_local_orders");
      if (ordersLocal) {
        const ords = JSON.parse(ordersLocal);
        const mapped = ords.map((o: any) => o.id === editingOrder.id ? { ...o, ...updatedOrder } : o);
        localStorage.setItem("dzbuild_local_orders", JSON.stringify(mapped));
      }
      localStorage.setItem("dzbuild_customers", JSON.stringify(customers));
    } catch {}

    // Firestore async
    if (user) {
      try {
        await updateDoc(doc(db, "orders", editingOrder.id), {
          status: updatedOrder.status,
          notes: updatedOrder.notes,
          total: updatedOrder.total,
          updatedAt: serverTimestamp()
        });
      } catch (_) {}
    }

    setIsUpdatingOrder(false);
    setEditingOrder(null);
    showToast("Commande et note mises à jour avec succès");
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete || !selectedCustomerForDetails) return;

    const filteredOrders = selectedCustomerForDetails.orders.filter(o => o.id !== orderToDelete.id);
    const newTotalSpent = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const updatedCustomer: CustomerAggregated = {
      ...selectedCustomerForDetails,
      orderCount: Math.max(0, filteredOrders.length),
      totalSpent: newTotalSpent,
      orders: filteredOrders
    };

    setSelectedCustomerForDetails(updatedCustomer);
    setCustomers(prev => prev.map(c => 
      normalizePhoneForBlacklist(c.phone) === normalizePhoneForBlacklist(updatedCustomer.phone) ? updatedCustomer : c
    ));

    try {
      const ordersLocal = localStorage.getItem("dzbuild_local_orders");
      if (ordersLocal) {
        const ords = JSON.parse(ordersLocal);
        const filtered = ords.filter((o: any) => o.id !== orderToDelete.id);
        localStorage.setItem("dzbuild_local_orders", JSON.stringify(filtered));
      }
    } catch {}

    if (user) {
      try {
        await deleteDoc(doc(db, "orders", orderToDelete.id));
        await deleteDoc(doc(db, "tenants", user.uid, "orders", orderToDelete.id));
      } catch (_) {}
    }

    setOrderToDelete(null);
    showToast("Commande supprimée");
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
      
      const updatedList = customers.map(c => {
        if (normalizePhoneForBlacklist(c.phone) === normalized) {
          return { ...c, isBanned: nextStatus };
        }
        return c;
      });

      setCustomers(updatedList);
      try {
        localStorage.setItem("dzbuild_customers", JSON.stringify(updatedList));
      } catch {}

      if (selectedCustomerForDetails && normalizePhoneForBlacklist(selectedCustomerForDetails.phone) === normalized) {
        setSelectedCustomerForDetails(prev => prev ? { ...prev, isBanned: nextStatus } : null);
      }
      showToast(nextStatus ? "Client ajouté à la liste noire" : "Client retiré de la liste noire");
    } catch (err) {
      console.error("Erreur mise à jour statut de bannissement:", err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    setIsSavingCustomer(true);
    const normalized = normalizePhoneForBlacklist(newPhone);
    const newRecord: CustomerAggregated = {
      id: normalized || `cust_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      wilaya: newWilaya,
      commune: newCommune.trim(),
      address: newAddress.trim(),
      notes: newNotes.trim(),
      orderCount: 0,
      totalSpent: 0,
      multipleIdentities: 0,
      ip: "41.189.42.9",
      isBanned: false,
      lastOrderDate: new Date().toISOString(),
      orders: []
    };

    const nextList = [newRecord, ...customers.filter(c => normalizePhoneForBlacklist(c.phone) !== normalized)];
    setCustomers(nextList);
    try {
      localStorage.setItem("dzbuild_customers", JSON.stringify(nextList));
      window.dispatchEvent(new CustomEvent("customers_updated", { detail: nextList }));
    } catch {}

    if (user && normalized) {
      try {
        const custRef = doc(db, "customers", `${user.uid}_${normalized}`);
        await setDoc(custRef, {
          userId: user.uid,
          name: newRecord.name,
          phone: newRecord.phone,
          normalizedPhone: normalized,
          wilaya: newRecord.wilaya,
          commune: newRecord.commune,
          address: newRecord.address,
          notes: newRecord.notes,
          orderCount: 0,
          totalSpent: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore sync background notice:", err);
      }
    }

    setIsSavingCustomer(false);
    setIsNewCustomerModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewCommune("");
    setNewAddress("");
    setNewNotes("");
    showToast("Client ajouté avec succès");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ["Nom", "Téléphone", "Wilaya", "Commune", "Adresse", "Notes", "Commandes", "Total Dépensé (DA)", "Statut"];
    const rows = filteredCustomers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.wilaya}"`,
      `"${c.commune || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.orderCount,
      c.totalSpent,
      c.isBanned ? "Banni" : "Actif"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clients_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c => {
    if (activeTab === "blacklist" && !c.isBanned) return false;
    if (activeTab === "clients" && c.isBanned) return false;
    
    if (search) {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || 
             c.phone.includes(s) || 
             c.wilaya.toLowerCase().includes(s) ||
             (c.commune && c.commune.toLowerCase().includes(s)) ||
             (c.address && c.address.toLowerCase().includes(s)) ||
             (c.notes && c.notes.toLowerCase().includes(s));
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name.substring(0, 1).toUpperCase() || "C";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 left-5 z-50 px-4 py-3 rounded-xl text-white text-sm font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-yellow-500" />
            Base Clients & Coordonnées
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gérez vos clients, modifiez leurs coordonnées, ajoutez des notes et gérez leurs commandes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter un client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Total clients enregistrés</p>
            <h3 className="text-2xl font-bold text-white">{customers.length}</h3>
          </div>
        </div>
        
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Clients acheteurs</p>
            <h3 className="text-2xl font-bold text-white">
               {customers.filter(c => c.orderCount > 0).length}
            </h3>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
            <ShieldBan className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Clients sur liste noire</p>
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === "clients" ? "bg-[#1e1e24] border border-neutral-700 text-yellow-500" : "bg-transparent text-neutral-400 hover:text-white"}`}
            >
              <Users className="w-4 h-4" /> Clients actifs <span className="bg-neutral-800 text-white px-2 py-0.5 rounded-full text-xs">{customers.filter(c => !c.isBanned).length}</span>
            </button>
            <button 
              onClick={() => setActiveTab("blacklist")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === "blacklist" ? "bg-[#1e1e24] border border-neutral-700 text-yellow-500" : "bg-transparent text-neutral-400 hover:text-white"}`}
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
                placeholder="Rechercher par nom, téléphone, wilaya, note..."
                className="w-full md:w-80 bg-[#1e1e24] border border-neutral-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-yellow-500 transition-colors"
              />
           </div>
           <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-800 text-white text-sm font-semibold transition-colors cursor-pointer"
           >
              <Download className="w-4 h-4" /> Exporter CSV
           </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
             <thead className="bg-[#16161a] border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
               <tr>
                 <th className="px-5 py-4">Client</th>
                 <th className="px-5 py-4">Téléphone & Contact</th>
                 <th className="px-5 py-4">Coordonnées & Lieu</th>
                 <th className="px-5 py-4">Commandes</th>
                 <th className="px-5 py-4">Total Achats</th>
                 <th className="px-5 py-4">Note interne</th>
                 <th className="px-5 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-neutral-800/70">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-neutral-500">
                      Chargement de la base clients...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-neutral-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      Aucun client trouvé pour le moment
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-[#16161a]/60 transition-colors">
                      {/* Client */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center font-bold text-base shrink-0">
                              {getInitials(customer.name)}
                           </div>
                           <div>
                             <span className="font-bold text-white block">{customer.name}</span>
                             <span className="text-xs text-neutral-500">Client enregistré</span>
                           </div>
                        </div>
                      </td>

                      {/* Téléphone & Contact */}
                      <td className="px-5 py-4">
                         <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-2">
                              <span className="font-bold text-white tracking-wide">{customer.phone}</span>
                              <button
                                onClick={() => copyToClipboard(customer.phone)}
                                title="Copier le numéro"
                                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedPhone === customer.phone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <a
                                href={getWhatsAppUrl(customer.phone, `Bonjour ${customer.name}, nous vous contactons concernant votre commande.`)}
                                target="_blank"
                                rel="noreferrer"
                                title="Contacter sur WhatsApp"
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer border border-emerald-500/20"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`tel:${customer.phone}`}
                                title="Appeler directement"
                                className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer border border-blue-500/20"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                           </div>
                           {customer.phone && (
                             <div>
                               <EcoTrackBadge 
                                 score={computeEcoTrackScore(customer.phone, customer.orders || [], customer.isBanned)} 
                               />
                             </div>
                           )}
                         </div>
                      </td>

                      {/* Coordonnées & Lieu */}
                      <td className="px-5 py-4">
                         <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-white">
                               <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                               <span>{customer.wilaya}</span>
                               {customer.commune && <span className="text-neutral-400 font-normal">({customer.commune})</span>}
                            </div>
                            {customer.address && (
                              <span className="text-xs text-neutral-400 truncate max-w-xs pl-5" title={customer.address}>
                                {customer.address}
                              </span>
                            )}
                         </div>
                      </td>

                      {/* Commandes */}
                      <td className="px-5 py-4">
                         <button 
                          onClick={() => setSelectedCustomerForDetails(customer)}
                          className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/25 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                         >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {customer.orderCount} commande{customer.orderCount > 1 ? 's' : ''}
                         </button>
                      </td>

                      {/* Total des achats */}
                      <td className="px-5 py-4 font-bold text-white">
                         {customer.totalSpent.toLocaleString()} DA
                      </td>

                      {/* Note interne */}
                      <td className="px-5 py-4">
                         {customer.notes ? (
                           <div className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 max-w-[150px] truncate" title={customer.notes}>
                             <StickyNote className="w-3 h-3 shrink-0" />
                             <span className="truncate">{customer.notes}</span>
                           </div>
                         ) : (
                           <span className="text-xs text-neutral-600">-</span>
                         )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                         <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => setSelectedCustomerForDetails(customer)} 
                              title="Voir fiche & commandes"
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20 cursor-pointer"
                            >
                               <Info className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenEditCustomer(customer)} 
                              title="Modifier les coordonnées du client"
                              className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 cursor-pointer"
                            >
                               <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleBan(customer)}
                              title={customer.isBanned ? "Débannir ce client" : "Bannir ce client"}
                              className={`p-2 rounded-lg flex items-center justify-center transition-colors border cursor-pointer ${
                                customer.isBanned
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                              }`}
                            >
                               {customer.isBanned ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => setCustomerToDelete(customer)} 
                              title="Supprimer ce client"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 cursor-pointer"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#16161a] flex items-center justify-between text-xs text-neutral-400">
           <span>Total de {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''} répertorié{filteredCustomers.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Modal: Fiche Client Complète, Notes & Gestion des Commandes */}
      {selectedCustomerForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center font-bold text-lg">
                  {getInitials(selectedCustomerForDetails.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedCustomerForDetails.name}
                  </h3>
                  <p className="text-xs text-neutral-400">Fiche client détaillée, notes et historique des commandes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditCustomer(selectedCustomerForDetails)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Modifier client
                </button>
                <button 
                  onClick={() => setSelectedCustomerForDetails(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Facteur de confiance EcoTrack */}
              {selectedCustomerForDetails.phone && (
                <EcoTrackBadge 
                  variant="card"
                  score={computeEcoTrackScore(
                    selectedCustomerForDetails.phone, 
                    selectedCustomerForDetails.orders || [], 
                    selectedCustomerForDetails.isBanned
                  )} 
                />
              )}

              {/* Coordonnées */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-yellow-500" /> Numéro de téléphone
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white tracking-wide">{selectedCustomerForDetails.phone}</span>
                    <div className="flex items-center gap-1">
                      <a
                        href={getWhatsAppUrl(selectedCustomerForDetails.phone, `Bonjour ${selectedCustomerForDetails.name}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors border border-emerald-500/20 flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                      <a
                        href={`tel:${selectedCustomerForDetails.phone}`}
                        className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors border border-blue-500/20 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Appeler
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-yellow-500" /> Localisation & Adresse
                  </span>
                  <div className="text-sm font-bold text-white">
                    {selectedCustomerForDetails.wilaya} {selectedCustomerForDetails.commune ? `• ${selectedCustomerForDetails.commune}` : ""}
                  </div>
                  <p className="text-xs text-neutral-400">
                    {selectedCustomerForDetails.address || "Aucune adresse spécifique renseignée"}
                  </p>
                </div>
              </div>

              {/* Note interne du client */}
              <div className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-yellow-500 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" /> Note interne sur le client
                  </span>
                  <button 
                    onClick={() => handleOpenEditCustomer(selectedCustomerForDetails)}
                    className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    {selectedCustomerForDetails.notes ? "Modifier la note" : "Ajouter une note"}
                  </button>
                </div>
                <p className="text-sm text-neutral-300 italic">
                  {selectedCustomerForDetails.notes ? `« ${selectedCustomerForDetails.notes} »` : "Aucune note interne sur ce client pour le moment."}
                </p>
              </div>

              {/* Purchase Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl text-center">
                  <span className="text-xs text-neutral-400 font-medium block mb-1">Commandes</span>
                  <span className="text-xl font-black text-white">{selectedCustomerForDetails.orderCount}</span>
                </div>
                <div className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl text-center">
                  <span className="text-xs text-neutral-400 font-medium block mb-1">Total Dépensé</span>
                  <span className="text-xl font-black text-yellow-500">{selectedCustomerForDetails.totalSpent.toLocaleString()} DA</span>
                </div>
                <div className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl text-center">
                  <span className="text-xs text-neutral-400 font-medium block mb-1">Statut Client</span>
                  <span className={`text-sm font-bold ${selectedCustomerForDetails.isBanned ? "text-red-400" : "text-emerald-400"}`}>
                    {selectedCustomerForDetails.isBanned ? "Banni" : "Actif & Fiable"}
                  </span>
                </div>
              </div>

              {/* Commandes du client avec gestion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-yellow-500" />
                    Historique des commandes ({selectedCustomerForDetails.orders?.length || 0})
                  </h4>
                </div>

                {(!selectedCustomerForDetails.orders || selectedCustomerForDetails.orders.length === 0) ? (
                  <div className="bg-[#16161a] border border-neutral-800 p-6 rounded-xl text-center text-neutral-500 text-sm">
                    Aucune commande enregistrée pour ce client
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomerForDetails.orders.map((ord, i) => (
                      <div key={i} className="bg-[#16161a] border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{ord.orderNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ord.status === 'Livrée' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ord.status === 'Confirmée' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              ord.status === 'Expédiée' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              ord.status === 'Annulée' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {ord.status}
                            </span>
                            <span className="text-xs text-neutral-500">{ord.date}</span>
                          </div>
                          <p className="text-xs text-neutral-300 font-medium">{ord.itemsSummary || "Commande boutique"}</p>
                          {ord.notes && (
                            <p className="text-xs text-amber-300/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 w-fit">
                              Note: {ord.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="text-base font-bold text-yellow-500">
                            {Number(ord.total).toLocaleString()} DA
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditOrder(ord)}
                              title="Modifier la commande et ajouter une note"
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" /> Modifier / Note
                            </button>
                            <button
                              onClick={() => setOrderToDelete(ord)}
                              title="Supprimer la commande"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-neutral-800 bg-[#16161a] flex items-center justify-between">
              <button 
                onClick={() => setCustomerToDelete(selectedCustomerForDetails)}
                className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Supprimer ce client
              </button>
              <button 
                onClick={() => setSelectedCustomerForDetails(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors cursor-pointer text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modifier Client & Notes */}
      {customerToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Edit2 className="w-5 h-5 text-amber-400" />
                Modifier les informations du client
              </div>
              <button 
                onClick={() => setCustomerToEdit(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdits} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Nom et Prénom *
                </label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Numéro de téléphone *
                </label>
                <input 
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Wilaya
                  </label>
                  <select
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    {ALGERIAN_WILAYAS.map(w => (
                      <option key={w.code} value={`${w.code < 10 ? `0${w.code}` : w.code} - ${w.name}`}>
                        {w.code < 10 ? `0${w.code}` : w.code} - {w.name} ({w.arName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Commune
                  </label>
                  <input 
                    type="text"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    placeholder="Ex: Kouba"
                    className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Adresse de livraison complète
                </label>
                <textarea 
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Ex: Cité 500 logements, Rue 12..."
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Note interne sur le client
                </label>
                <textarea 
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ex: Client VIP, rappeler le soir, livreur habituel..."
                  className="w-full bg-[#16161a] border border-amber-500/30 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCustomerToEdit(null)}
                  className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCustomer}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingCustomer ? "Enregistrement..." : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Commande & Note de commande */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShoppingBag className="w-5 h-5 text-yellow-500" />
                Modifier la commande {editingOrder.orderNumber}
              </div>
              <button 
                onClick={() => setEditingOrder(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdits} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Statut de la commande
                </label>
                <select
                  value={editOrderStatus}
                  onChange={(e) => setEditOrderStatus(e.target.value as any)}
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500 cursor-pointer font-bold"
                >
                  <option value="En attente">En attente</option>
                  <option value="Confirmée">Confirmée</option>
                  <option value="Expédiée">Expédiée</option>
                  <option value="Livrée">Livrée</option>
                  <option value="Annulée">Annulée</option>
                  <option value="Retournée">Retournée</option>
                  <option value="Échouée">Échouée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Montant total (DA)
                </label>
                <input 
                  type="number"
                  required
                  value={editOrderTotal}
                  onChange={(e) => setEditOrderTotal(Number(e.target.value))}
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Note sur la commande
                </label>
                <textarea 
                  rows={3}
                  value={editOrderNotes}
                  onChange={(e) => setEditOrderNotes(e.target.value)}
                  placeholder="Ex: Client a demandé une livraison express le matin..."
                  className="w-full bg-[#16161a] border border-amber-500/30 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingOrder}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingOrder ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Customer Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Supprimer le client</h3>
            </div>

            <p className="text-sm text-neutral-300">
              Êtes-vous sûr de vouloir supprimer le client <strong className="text-white">« {customerToDelete.name} » ({customerToDelete.phone})</strong> de votre base clients ?
            </p>

            <label className="flex items-center gap-2 text-xs text-neutral-300 bg-[#16161a] p-3 rounded-xl border border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAssociatedOrders}
                onChange={(e) => setDeleteAssociatedOrders(e.target.checked)}
                className="w-4 h-4 rounded text-yellow-500 focus:ring-0 focus:outline-none"
              />
              <span>Supprimer également toutes les commandes ({customerToDelete.orderCount}) associées à ce client</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleConfirmDeleteCustomer}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeletingCustomer ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Order Modal */}
      {orderToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer la commande"
          message={`Êtes-vous sûr de vouloir supprimer la commande ${orderToDelete.orderNumber} ?`}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleConfirmDeleteOrder}
          onCancel={() => setOrderToDelete(null)}
        />
      )}

      {/* Modal: Ajouter un nouveau client manuellement */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <UserPlus className="w-5 h-5 text-yellow-500" />
                Ajouter un client à la base
              </div>
              <button 
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Nom et Prénom *
                </label>
                <input 
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Samir Benali"
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Numéro de téléphone *
                </label>
                <input 
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: 0550123456"
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Wilaya
                  </label>
                  <select
                    value={newWilaya}
                    onChange={(e) => setNewWilaya(e.target.value)}
                    className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    {ALGERIAN_WILAYAS.map(w => (
                      <option key={w.code} value={`${w.code < 10 ? `0${w.code}` : w.code} - ${w.name}`}>
                        {w.code < 10 ? `0${w.code}` : w.code} - {w.name} ({w.arName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Commune
                  </label>
                  <input 
                    type="text"
                    value={newCommune}
                    onChange={(e) => setNewCommune(e.target.value)}
                    placeholder="Ex: Bab Ezzouar"
                    className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Adresse complète
                </label>
                <textarea 
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Ex: Cité 500 logements, Bâtiment 4, Porte 12"
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Note interne
                </label>
                <textarea 
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Note particulière sur le client..."
                  className="w-full bg-[#16161a] border border-neutral-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingCustomer ? "Enregistrement..." : "Enregistrer le client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
