import { useState, useEffect, FormEvent } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX, 
  Crown, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Copy, 
  MessageCircle, 
  ExternalLink,
  Users,
  DollarSign,
  ArrowUpDown,
  Check
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

export interface Customer {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  wilaya: string;
  commune: string;
  address?: string;
  orders: number;
  totalSpent: number;
  status: "active" | "vip" | "prospect" | "inactive";
  notes?: string;
  date: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

const INITIAL_DEMO_CUSTOMERS = [
  {
    name: "Amine Benali",
    email: "amine.benali@email.com",
    phone: "0555123456",
    wilaya: "Alger - 16",
    commune: "Bab El Oued",
    address: "14 Rue Didouche Mourad",
    orders: 3,
    totalSpent: 15500,
    status: "vip" as const,
    notes: "Client régulier, préfère la livraison à domicile l'après-midi.",
    date: "15/08/2026"
  },
  {
    name: "Sarah Mansouri",
    email: "sarah.m@email.com",
    phone: "0770987654",
    wilaya: "Oran - 31",
    commune: "Bir El Djir",
    address: "Cité USTO, Bâtiment 4",
    orders: 1,
    totalSpent: 12000,
    status: "active" as const,
    notes: "Commande souvent des vêtements pour femmes.",
    date: "10/08/2026"
  },
  {
    name: "Karim Slimani",
    email: "karim99@email.com",
    phone: "0661234567",
    wilaya: "Constantine - 25",
    commune: "El Khroub",
    address: "Lotissement 120 Logements",
    orders: 5,
    totalSpent: 45900,
    status: "vip" as const,
    notes: "Excellent client, très réactif aux appels de confirmation.",
    date: "01/08/2026"
  },
  {
    name: "Yacine Merbah",
    email: "yacine.merbah@email.com",
    phone: "0550112233",
    wilaya: "Blida - 09",
    commune: "Boufarik",
    address: "Centre-ville, face à la mairie",
    orders: 2,
    totalSpent: 8200,
    status: "active" as const,
    notes: "Paiement toujours en espèces à la livraison.",
    date: "25/07/2026"
  }
];

export default function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "spent-desc" | "spent-asc" | "orders-desc">("date-desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmation Modals State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWilaya, setFormWilaya] = useState("Alger - 16");
  const [formCommune, setFormCommune] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formOrders, setFormOrders] = useState<number | "">(0);
  const [formTotalSpent, setFormTotalSpent] = useState<number | "">(0);
  const [formStatus, setFormStatus] = useState<"active" | "vip" | "prospect" | "inactive">("active");
  const [formNotes, setFormNotes] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      loadCustomers();
    } else {
      setCustomers([]);
      setLoading(false);
    }
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "customers"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const loaded: Customer[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          wilaya: data.wilaya || "Alger - 16",
          commune: data.commune || "",
          address: data.address || "",
          orders: Number(data.orders) || 0,
          totalSpent: Number(data.totalSpent) || 0,
          status: data.status || "active",
          notes: data.notes || "",
          date: data.date || "Récemment",
          userId: data.userId,
          avatar: getInitials(data.name || "")
        });
      });

      // If user has 0 customers in database and never seeded before, seed initial demo records
      const hasSeeded = localStorage.getItem(`customers_seeded_${user.uid}`);
      if (loaded.length === 0 && !hasSeeded) {
        localStorage.setItem(`customers_seeded_${user.uid}`, "true");
        const seededList: Customer[] = [];
        for (const item of INITIAL_DEMO_CUSTOMERS) {
          const docRef = await addDoc(collection(db, "customers"), {
            ...item,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
          seededList.push({
            id: docRef.id,
            ...item,
            userId: user.uid,
            avatar: getInitials(item.name)
          });
        }
        setCustomers(seededList);
      } else {
        setCustomers(loaded);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      showToast("Erreur lors du chargement des clients", "error");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return "CL";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleOpenModal = (customer?: Customer) => {
    setFormError("");
    setOpenDropdownId(null);
    if (customer) {
      setEditingCustomer(customer);
      setFormName(customer.name);
      setFormEmail(customer.email);
      setFormPhone(customer.phone);
      setFormWilaya(customer.wilaya);
      setFormCommune(customer.commune);
      setFormAddress(customer.address || "");
      setFormOrders(customer.orders);
      setFormTotalSpent(customer.totalSpent);
      setFormStatus(customer.status);
      setFormNotes(customer.notes || "");
    } else {
      setEditingCustomer(null);
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormWilaya("Alger - 16");
      setFormCommune("");
      setFormAddress("");
      setFormOrders(0);
      setFormTotalSpent(0);
      setFormStatus("active");
      setFormNotes("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormError("");
  };

  const handleSaveCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formName.trim()) {
      setFormError("Veuillez saisir le nom complet du client.");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("Veuillez saisir un numéro de téléphone.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const customerData = {
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      wilaya: formWilaya,
      commune: formCommune.trim(),
      address: formAddress.trim(),
      orders: Number(formOrders) || 0,
      totalSpent: Number(formTotalSpent) || 0,
      status: formStatus,
      notes: formNotes.trim(),
      userId: user.uid,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingCustomer) {
        const customerRef = doc(db, "customers", editingCustomer.id);
        await updateDoc(customerRef, customerData);
        
        setCustomers(customers.map(c => 
          c.id === editingCustomer.id 
            ? { 
                ...c, 
                ...customerData, 
                avatar: getInitials(formName) 
              } 
            : c
        ));
        showToast("Client modifié avec succès");
      } else {
        const docRef = await addDoc(collection(db, "customers"), {
          ...customerData,
          date: formattedDate,
          createdAt: serverTimestamp()
        });

        const newCustomer: Customer = {
          id: docRef.id,
          ...customerData,
          date: formattedDate,
          avatar: getInitials(formName)
        };

        setCustomers([newCustomer, ...customers]);
        showToast("Nouveau client ajouté");
      }

      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving customer:", err);
      setFormError(err.message || "Erreur lors de l'enregistrement du client.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "customers", customerToDelete.id));
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== customerToDelete.id));
      showToast(`Client "${customerToDelete.name}" supprimé avec succès`);
      setCustomerToDelete(null);
    } catch (err) {
      console.error("Error deleting customer:", err);
      showToast("Erreur lors de la suppression du client", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);

    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "customers", id));
      }
      setCustomers(customers.filter(c => !selectedIds.includes(c.id)));
      showToast(`${selectedIds.length} client(s) supprimé(s)`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error("Error in bulk delete:", err);
      showToast("Erreur lors de la suppression groupée", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
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
    if (customers.length === 0) {
      showToast("Aucun client à exporter", "error");
      return;
    }

    const dataToExport = selectedIds.length > 0
      ? customers.filter(c => selectedIds.includes(c.id))
      : customers;

    const headers = ["Nom complet", "Email", "Téléphone", "Wilaya", "Commune", "Adresse", "Commandes", "Total Dépensé (DZD)", "Statut", "Date d'ajout", "Notes"];
    
    const rows = dataToExport.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${c.wilaya.replace(/"/g, '""')}"`,
      `"${c.commune.replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      c.orders,
      c.totalSpent,
      `"${c.status}"`,
      `"${c.date}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `clients_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${dataToExport.length} client(s) exporté(s) en CSV`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copié dans le presse-papier`);
  };

  // Filter and Sort Customers
  const filteredCustomers = customers.filter(c => {
    const matchSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.commune.toLowerCase().includes(search.toLowerCase()) ||
      c.wilaya.toLowerCase().includes(search.toLowerCase());

    const matchWilaya = wilayaFilter === "all" || c.wilaya === wilayaFilter;

    let matchStatus = true;
    if (statusFilter !== "all") {
      matchStatus = c.status === statusFilter;
    }

    return matchSearch && matchWilaya && matchStatus;
  }).sort((a, b) => {
    if (sortBy === "spent-desc") return b.totalSpent - a.totalSpent;
    if (sortBy === "spent-asc") return a.totalSpent - b.totalSpent;
    if (sortBy === "orders-desc") return b.orders - a.orders;
    return 0; // default date order
  });

  // Calculate quick metrics
  const totalClientsCount = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersCount = customers.reduce((sum, c) => sum + (c.orders || 0), 0);
  const vipCount = customers.filter(c => c.status === "vip").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
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
            <Users className="w-7 h-7 text-yellow-500" />
            Clients
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gérez votre base de clients, suivez leur historique d'achats et contactez-les facilement.
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
            Ajouter un client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Total clients</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalClientsCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Chiffre d'affaires</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-neutral-500">DA</span></p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Clients VIP</p>
            <p className="text-xl font-bold text-white mt-0.5">{vipCount}</p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">Commandes totales</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalOrdersCount}</p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] overflow-hidden shadow-xl">
        
        {/* Filters and Search Bar */}
        <div className="p-4 bg-[#1e1e24] border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher des clients (nom, email, téléphone, ville)..." 
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-neutral-200 focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="vip">VIP</option>
              <option value="prospect">Prospect</option>
              <option value="inactive">Inactif</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-neutral-200 focus:border-yellow-500 focus:outline-none"
            >
              <option value="date-desc">Plus récents</option>
              <option value="spent-desc">Plus dépensé</option>
              <option value="spent-asc">Moins dépensé</option>
              <option value="orders-desc">Plus de commandes</option>
            </select>

            {/* Bulk delete button if items selected */}
            {selectedIds.length > 0 && (
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <p className="text-sm text-neutral-400">Chargement de la liste des clients...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Aucun client trouvé</h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-4">
              {search || wilayaFilter !== "all" || statusFilter !== "all" 
                ? "Aucun résultat ne correspond à vos critères de recherche." 
                : "Commencez par ajouter votre premier client à votre boutique."}
            </p>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un client
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
                      checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900 cursor-pointer" 
                    />
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Client</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Contact</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Localisation</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-center">Commandes</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-right">Total dépensé</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-center">Statut</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {filteredCustomers.map((customer) => {
                  const isSelected = selectedIds.includes(customer.id);
                  const isMenuOpen = openDropdownId === customer.id;

                  return (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-[#16161a]/60 transition-colors ${isSelected ? "bg-yellow-500/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(customer.id)}
                          className="rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900 cursor-pointer" 
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                            customer.status === "vip" 
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                              : "bg-neutral-800 text-yellow-500 border border-neutral-700"
                          }`}>
                            {customer.avatar || getInitials(customer.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate">{customer.name}</span>
                              {customer.status === "vip" && (
                                <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-neutral-500">Ajouté le {customer.date}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-neutral-300 group">
                              <Phone className="h-3.5 w-3.5 text-neutral-500" />
                              <a 
                                href={`tel:${customer.phone}`}
                                className="hover:text-yellow-400 transition-colors"
                              >
                                {customer.phone}
                              </a>
                              <button 
                                onClick={() => copyToClipboard(customer.phone, "Téléphone")}
                                title="Copier le numéro"
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-white transition-opacity"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400 group">
                              <Mail className="h-3 w-3 text-neutral-500" />
                              <a 
                                href={`mailto:${customer.email}`} 
                                className="truncate max-w-[150px] hover:text-yellow-400 transition-colors"
                              >
                                {customer.email}
                              </a>
                              <button 
                                onClick={() => copyToClipboard(customer.email, "Email")}
                                title="Copier l'email"
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-white transition-opacity"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-neutral-200 font-medium text-xs">
                            <MapPin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <span>{customer.wilaya}</span>
                          </div>
                          <span className="text-xs text-neutral-400 ml-5 truncate max-w-[140px]">
                            {customer.commune || (customer.address ? customer.address : "-")}
                          </span>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#16161a] border border-neutral-800 font-bold text-white text-xs">
                          {customer.orders}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold text-white text-sm">
                            {customer.totalSpent.toLocaleString()} <span className="text-xs text-yellow-500 font-semibold">DA</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          customer.status === "vip"
                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            : customer.status === "active"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : customer.status === "prospect"
                            ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        }`}>
                          {customer.status === "vip" && "VIP"}
                          {customer.status === "active" && "Actif"}
                          {customer.status === "prospect" && "Prospect"}
                          {customer.status === "inactive" && "Inactif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Direct Quick Action: WhatsApp */}
                          {customer.phone && (
                            <a
                              href={getWhatsAppUrl(customer.phone, `Bonjour ${customer.name}, nous vous contactons concernant vos commandes.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contacter sur WhatsApp"
                              className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Direct Quick Action: Edit */}
                          <button
                            onClick={() => handleOpenModal(customer)}
                            title="Modifier le client"
                            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Direct Quick Action: Delete */}
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            title="Supprimer le client"
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

      {/* Modal: Create & Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#16161a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingCustomer ? "Modifier le client" : "Ajouter un client"}
                  </h2>
                  <p className="text-xs text-neutral-400">Coordonnées et informations de livraison.</p>
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
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Nom complet <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Karim Slimani"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Numéro de téléphone <span className="text-red-400">*</span>
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

              {/* Email and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Adresse Email
                  </label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: client@email.com"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Statut client
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors"
                  >
                    <option value="active">Actif (Régulier)</option>
                    <option value="vip">VIP (Fidèle)</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              {/* Location: Wilaya & Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Wilaya
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
                    Commune / Ville
                  </label>
                  <input 
                    type="text" 
                    value={formCommune}
                    onChange={(e) => setFormCommune(e.target.value)}
                    placeholder="Ex: Bab El Oued, USTO..."
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Address details */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Adresse exacte de livraison
                </label>
                <input 
                  type="text" 
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ex: Cité 500 Logements, Bâtiment C N°12"
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Financials & Orders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Nombre de commandes
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formOrders}
                    onChange={(e) => setFormOrders(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                    Total dépensé (DA)
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formTotalSpent}
                    onChange={(e) => setFormTotalSpent(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1.5">
                  Notes internes (Préférences, retours...)
                </label>
                <textarea 
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes privées sur ce client..."
                  className="w-full rounded-xl border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Actions */}
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
                      {editingCustomer ? "Mettre à jour" : "Créer le client"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Confirmation de suppression d'un client */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Supprimer le client"
        description={`Êtes-vous sûr de vouloir supprimer définitivement le client "${customerToDelete?.name}" ? Toutes ses informations seront supprimées.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteCustomer}
        onClose={() => setCustomerToDelete(null)}
      />

      {/* Modal: Confirmation de suppression groupée */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title="Supprimer la sélection"
        description={`Êtes-vous sûr de vouloir supprimer définitivement les ${selectedIds.length} clients sélectionnés ? Cette action est irréversible.`}
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
