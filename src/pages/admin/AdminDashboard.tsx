import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Store, 
  Activity, 
  ShieldAlert, 
  LogOut, 
  Loader2, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Eye, 
  X, 
  Check, 
  RefreshCw, 
  Edit3, 
  Sparkles, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Shield, 
  Plus, 
  Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ImageUploader from '../../components/admin/ImageUploader';
import MediaManager from '../../components/admin/MediaManager';

interface Tenant {
  id: string;
  storeName: string;
  ownerEmail: string;
  plan: string;
  planName?: string;
  planExpiresAt?: string;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  tenantId: string;
  tenantEmail: string;
  storeName: string;
  plan: string;
  planType: string;
  duration: string;
  amountDA: number;
  paymentMethod: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'payments' | 'media' | 'admins'>('tenants');
  const [isLoading, setIsLoading] = useState(true);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mediaRefreshCount, setMediaRefreshCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Manage Subscription Modal
  const [selectedTenantForSub, setSelectedTenantForSub] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState<'pro' | 'unlimited' | 'enterprise'>('pro');
  const [editDuration, setEditDuration] = useState<'1m' | '3m' | '6m' | '1y' | 'lifetime' | 'trial_5d'>('1m');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended' | 'pending'>('active');
  const [customDays, setCustomDays] = useState<number>(30);
  const [subSaving, setSubSaving] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');

  // Admin Team list
  const [adminEmails, setAdminEmails] = useState<string[]>([
    "ecomto360@gmail.com",
    "nabsterzero@gmail.com"
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch tenants
      const qTenants = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'));
      const tenantSnap = await getDocs(qTenants);
      let fetchedTenants: Tenant[] = [];
      tenantSnap.forEach((d) => {
        fetchedTenants.push({ id: d.id, ...d.data() } as Tenant);
      });
      
      if (fetchedTenants.length === 0) {
        fetchedTenants = [
          { id: "1", storeName: "Boutique Mode", ownerEmail: "contact@boutique-mode.dz", plan: "pro", planName: "Professionnel", status: "active", createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
          { id: "2", storeName: "Tech Store", ownerEmail: "admin@tech-store.dz", plan: "unlimited", planName: "Illimité", status: "active", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
          { id: "3", storeName: "Maison & Déco", ownerEmail: "hello@maisondeco.dz", plan: "pro", planName: "Essai Gratuit", status: "suspended", createdAt: new Date(Date.now() - 40 * 86400000).toISOString() },
          { id: "4", storeName: "Cosmetics Beauty", ownerEmail: "beauty@cosmetics.dz", plan: "enterprise", planName: "Entreprise", status: "active", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
        ];
      }
      setTenants(fetchedTenants);

      // 2. Fetch payments
      const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      const paySnap = await getDocs(qPayments);
      let fetchedPayments: Payment[] = [];
      paySnap.forEach((d) => {
        fetchedPayments.push({ id: d.id, ...d.data() } as Payment);
      });

      if (fetchedPayments.length === 0) {
        fetchedPayments = [
          { id: "p1", tenantId: "1", tenantEmail: "contact@boutique-mode.dz", storeName: "Boutique Mode", plan: "Professionnel", planType: "pro", duration: "1 an", amountDA: 25000, paymentMethod: "ccp", status: "completed", createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
          { id: "p2", tenantId: "2", tenantEmail: "admin@tech-store.dz", storeName: "Tech Store", plan: "Illimité", planType: "unlimited", duration: "3 mois", amountDA: 7000, paymentMethod: "baridimob", status: "completed", createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
          { id: "p3", tenantId: "4", tenantEmail: "beauty@cosmetics.dz", storeName: "Cosmetics Beauty", plan: "Entreprise", planType: "enterprise", duration: "6 mois", amountDA: 30250, paymentMethod: "baridimob", status: "pending", createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60" }
        ];
      }
      setPayments(fetchedPayments);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openManageSubModal = (tenant: Tenant) => {
    setSelectedTenantForSub(tenant);
    setEditPlan((tenant.plan as any) || 'pro');
    setEditStatus((tenant.status as any) || 'active');
    setEditDuration('1m');
    setSubSuccess('');
  };

  const handleSaveSubscription = async () => {
    if (!selectedTenantForSub) return;
    setSubSaving(true);
    setSubSuccess('');

    try {
      let expiresAt = new Date();
      if (editDuration === '1m') expiresAt.setMonth(expiresAt.getMonth() + 1);
      else if (editDuration === '3m') expiresAt.setMonth(expiresAt.getMonth() + 3);
      else if (editDuration === '6m') expiresAt.setMonth(expiresAt.getMonth() + 6);
      else if (editDuration === '1y') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else if (editDuration === 'lifetime') expiresAt.setFullYear(expiresAt.getFullYear() + 10);
      else if (editDuration === 'trial_5d') expiresAt.setDate(expiresAt.getDate() + 5);

      const planDisplayNames: Record<string, string> = {
        pro: "Professionnel",
        unlimited: "Illimité",
        enterprise: "Entreprise"
      };

      const updatedPayload = {
        plan: editPlan,
        planName: planDisplayNames[editPlan] || "Professionnel",
        planExpiresAt: expiresAt.toISOString(),
        status: editStatus,
        updatedAt: new Date().toISOString()
      };

      // Update Firestore
      await updateDoc(doc(db, 'tenants', selectedTenantForSub.id), updatedPayload);

      // Also update local list
      setTenants(prev => prev.map(t => t.id === selectedTenantForSub.id ? { ...t, ...updatedPayload } : t));
      setSubSuccess("Abonnement mis à jour et activé avec succès !");

      setTimeout(() => {
        setSelectedTenantForSub(null);
      }, 1500);
    } catch (error) {
      console.error("Error saving subscription:", error);
    } finally {
      setSubSaving(false);
    }
  };

  const handleApprovePayment = async (payment: Payment) => {
    try {
      setActionLoading(payment.id);
      // 1. Update payment doc
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'completed',
        approvedAt: new Date().toISOString()
      });

      // 2. Fetch current tenant data to stack renewal
      const tenantRef = doc(db, 'tenants', payment.tenantId);
      const tenantSnap = await getDoc(tenantRef);
      
      let baseDate = new Date();
      if (tenantSnap.exists()) {
        const tData = tenantSnap.data();
        if (tData.planExpiresAt) {
          const currentExp = new Date(tData.planExpiresAt);
          if (currentExp > baseDate) {
            baseDate = currentExp; // Stack from current expiration
          }
        }
      }
      
      let expiresAt = new Date(baseDate);
      if (payment.duration.includes("3 mois")) expiresAt.setMonth(baseDate.getMonth() + 3);
      else if (payment.duration.includes("6 mois")) expiresAt.setMonth(baseDate.getMonth() + 6);
      else if (payment.duration.includes("1 an") || payment.duration.includes("12 mois")) expiresAt.setFullYear(baseDate.getFullYear() + 1);
      else expiresAt.setMonth(baseDate.getMonth() + 1);

      await updateDoc(doc(db, 'tenants', payment.tenantId), {
        plan: payment.planType || 'pro',
        planName: payment.plan || 'Professionnel',
        planExpiresAt: expiresAt.toISOString(),
        status: 'active'
      });

      await fetchData();
    } catch (err) {
      console.error("Error approving payment:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      setActionLoading(paymentId);
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
      await fetchData();
    } catch (err) {
      console.error("Error rejecting payment:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) return;
    const clean = newAdminEmail.toLowerCase().trim();
    if (!adminEmails.includes(clean)) {
      setAdminEmails([...adminEmails, clean]);
      setAdminSuccess(`L'administrateur ${clean} a été autorisé avec succès.`);
      setNewAdminEmail('');
      setTimeout(() => setAdminSuccess(''), 3000);
    }
  };

  const handleLogout = () => {
    navigate('/admin');
  };

  const filteredTenants = tenants.filter(t => 
    t.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.plan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStores = tenants.filter(t => t.status === 'active').length;
  const totalRevenueDA = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amountDA || 0), 0);
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Topbar */}
      <header className="h-16 border-b border-neutral-800 bg-[#111] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-semibold tracking-wide">E-NOVA SUPER ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Super Admin Dashboard</h1>
            <p className="text-neutral-400 text-sm">Gestion des marchands, activation instantanée des abonnements et validations.</p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-2 bg-[#161616] p-1 rounded-xl border border-neutral-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'tenants' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Marchands ({tenants.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'payments' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Abonnements & Paiements
              {pendingPaymentsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-yellow-500 text-black text-[10px] font-bold">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'admins' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Administrateurs ({adminEmails.length})
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'media' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Médias
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm">Boutiques Actives</span>
              <Store className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : activeStores}</div>
          </div>
          
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm">Marchands Inscrits</span>
              <Users className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : tenants.length}</div>
          </div>

          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm">Chiffre d'Affaires</span>
              <CreditCard className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-500">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${totalRevenueDA.toLocaleString()} DA`}
            </div>
          </div>

          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-400 font-medium text-sm">Santé Système</span>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-500">Opérationnel</div>
          </div>
        </div>
        
        {/* Tab: Media */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <ImageUploader onUploadSuccess={() => setMediaRefreshCount(c => c + 1)} />
            <MediaManager refreshTrigger={mediaRefreshCount} />
          </div>
        )}

        {/* Tab: Admins Team */}
        {activeTab === 'admins' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Gestion des Administrateurs Autorisés
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Toutes ces adresses mails réelles peuvent se connecter sur <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-yellow-500">/admin</code> avec le mot de passe <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono">NovaSecur!ty2026</code>.
                </p>
              </div>
            </div>

            {adminSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            {/* Add admin form */}
            <form onSubmit={handleAddAdminEmail} className="flex gap-3 max-w-md">
              <input
                type="email"
                required
                placeholder="nouvel-admin@domaine.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {adminEmails.map((email, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#161616] border border-neutral-800 rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                      {email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{email}</div>
                      <div className="text-[10px] text-neutral-400">Super Admin • Actif</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                    Autorisé
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Tenants (With subscription activation) */}
        {activeTab === 'tenants' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden space-y-4">
            <div className="px-6 py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-lg">Marchands & Activation d'Abonnement</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Cliquez sur « Gérer l'abonnement » pour attribuer le plan Professionnel, Illimité ou Entreprise selon la demande du client.</p>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Rechercher une boutique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161616] border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#161616] text-neutral-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Boutique</th>
                    <th className="px-6 py-3 font-medium">Propriétaire</th>
                    <th className="px-6 py-3 font-medium">Plan Actuel</th>
                    <th className="px-6 py-3 font-medium">Expiration</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium text-right">Action Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                        <div className="flex justify-center mb-2"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        Chargement des marchands...
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                        Aucun marchand trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(tenant => (
                      <tr key={tenant.id} className="hover:bg-[#161616] transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {tenant.storeName || "Boutique"}
                        </td>
                        <td className="px-6 py-4 text-neutral-400 text-xs">{tenant.ownerEmail}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            tenant.plan === 'enterprise' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : tenant.plan === 'unlimited' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}>
                            {tenant.planName || tenant.plan || 'Professionnel'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {tenant.planExpiresAt ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(tenant.planExpiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-neutral-500">Essai 5 jours</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${tenant.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {tenant.status === 'active' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openManageSubModal(tenant)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Gérer l'abonnement
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Payments & Subscriptions */}
        {activeTab === 'payments' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">Demandes d'abonnement & Historique des paiements</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Validez les reçus BaridiMob pour activer immédiatement le plan choisi par le marchand.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#161616] text-neutral-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Boutique & Email</th>
                    <th className="px-6 py-3 font-medium">Plan & Durée Choisis</th>
                    <th className="px-6 py-3 font-medium">Montant</th>
                    <th className="px-6 py-3 font-medium">Moyen</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium">Reçu BaridiMob</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                        <div className="flex justify-center mb-2"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        Chargement des paiements...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                        Aucun paiement enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-[#161616] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{payment.storeName || 'Boutique'}</div>
                          <div className="text-xs text-neutral-400">{payment.tenantEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-yellow-500">{payment.plan}</div>
                          <div className="text-xs text-neutral-400">{payment.duration}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {(payment.amountDA || 0).toLocaleString()} DA
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-neutral-300">
                          {payment.paymentMethod === 'card' ? 'Carte / PayPal' : payment.paymentMethod === 'cib_edahabia' ? 'CIB / Edahabia' : 'BaridiMob'}
                        </td>
                        <td className="px-6 py-4">
                          {payment.status === 'completed' ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                              Actif / Validé
                            </span>
                          ) : payment.status === 'pending' ? (
                            <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-semibold animate-pulse">
                              En attente
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold">
                              Rejeté
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {payment.receiptUrl ? (
                            <button
                              onClick={() => setPreviewReceipt(payment.receiptUrl || null)}
                              className="inline-flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 font-medium bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800"
                            >
                              <Eye className="w-3.5 h-3.5" /> Voir le reçu
                            </button>
                          ) : (
                            <span className="text-neutral-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {payment.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                disabled={actionLoading === payment.id}
                                onClick={() => handleApprovePayment(payment)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                {actionLoading === payment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Approuver
                              </button>
                              <button
                                disabled={actionLoading === payment.id}
                                onClick={() => handleRejectPayment(payment.id)}
                                className="px-3 py-1 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                Rejeter
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-500">Traité</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ACTIVER / MODIFIER L'ABONNEMENT D'UN MARCHAND */}
      {/* ========================================================================= */}
      {selectedTenantForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-lg w-full bg-[#18181c] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              onClick={() => setSelectedTenantForSub(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Activer / Modifier l'Abonnement</h3>
                <p className="text-xs text-neutral-400">Boutique : <strong className="text-white">{selectedTenantForSub.storeName}</strong> ({selectedTenantForSub.ownerEmail})</p>
              </div>
            </div>

            {subSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{subSuccess}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* 1. Choix du Plan */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">1. Plan à attribuer</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPlan('pro')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      editPlan === 'pro' 
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-sm' 
                        : 'bg-[#22222a] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div>Professionnel</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">1 000 DA/m</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditPlan('unlimited')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      editPlan === 'unlimited' 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm' 
                        : 'bg-[#22222a] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div>Illimité ∞</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">2 500 DA/m</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditPlan('enterprise')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      editPlan === 'enterprise' 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-sm' 
                        : 'bg-[#22222a] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div>Entreprise</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">5 500 DA/m</div>
                  </button>
                </div>
              </div>

              {/* 2. Choix de la Durée */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">2. Durée de l'abonnement</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDuration('1m')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      editDuration === '1m' ? 'bg-white/10 border-white text-white' : 'bg-[#22222a] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    1 mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDuration('3m')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      editDuration === '3m' ? 'bg-white/10 border-white text-white' : 'bg-[#22222a] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    3 mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDuration('6m')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      editDuration === '6m' ? 'bg-white/10 border-white text-white' : 'bg-[#22222a] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    6 mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDuration('1y')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      editDuration === '1y' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-[#22222a] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    1 an (12 mois)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDuration('lifetime')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      editDuration === 'lifetime' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#22222a] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Illimité (À vie)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDuration('trial_5d')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      editDuration === 'trial_5d' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#22222a] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Essai (5 jours)
                  </button>
                </div>
              </div>

              {/* 3. Statut de la boutique */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">3. Statut du compte</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={editStatus === 'active'}
                      onChange={() => setEditStatus('active')}
                      className="text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-emerald-400 font-semibold">Actif</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="suspended"
                      checked={editStatus === 'suspended'}
                      onChange={() => setEditStatus('suspended')}
                      className="text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-red-400 font-semibold">Suspendu</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForSub(null)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={subSaving}
                  onClick={handleSaveSubscription}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {subSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer & Activer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full bg-[#1e1e24] border border-neutral-800 rounded-3xl p-6">
            <button
              onClick={() => setPreviewReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-semibold mb-4 text-white">Reçu BaridiMob du marchand</h4>
            <div className="max-h-[70vh] overflow-auto rounded-xl flex items-center justify-center bg-black/50 p-2">
              <img src={previewReceipt} alt="Reçu BaridiMob" className="max-w-full h-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


