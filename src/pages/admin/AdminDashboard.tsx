import React, { useEffect, useState } from 'react';
import { Users, Store, Activity, ShieldAlert, LogOut, Loader2, CreditCard, CheckCircle, XCircle, Eye, X, Check, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ImageUploader from '../../components/admin/ImageUploader';
import MediaManager from '../../components/admin/MediaManager';

interface Tenant {
  id: string;
  storeName: string;
  ownerEmail: string;
  plan: string;
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
  const [activeTab, setActiveTab] = useState<'tenants' | 'payments' | 'media'>('tenants');
  const [isLoading, setIsLoading] = useState(true);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mediaRefreshCount, setMediaRefreshCount] = useState(0);

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
          { id: "1", storeName: "Boutique Mode", ownerEmail: "contact@boutique-mode.dz", plan: "Professionnel", status: "active", createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
          { id: "2", storeName: "Tech Store", ownerEmail: "admin@tech-store.dz", plan: "Starter", status: "active", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
          { id: "3", storeName: "Maison & Déco", ownerEmail: "hello@maisondeco.dz", plan: "Essai Gratuit", status: "expired", createdAt: new Date(Date.now() - 40 * 86400000).toISOString() },
          { id: "4", storeName: "Cosmetics Beauty", ownerEmail: "beauty@cosmetics.dz", plan: "Professionnel", status: "active", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
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
          { id: "p2", tenantId: "2", tenantEmail: "admin@tech-store.dz", storeName: "Tech Store", plan: "Starter", planType: "starter", duration: "3 mois", amountDA: 8000, paymentMethod: "baridimob", status: "completed", createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
          { id: "p3", tenantId: "4", tenantEmail: "beauty@cosmetics.dz", storeName: "Cosmetics Beauty", plan: "Professionnel", planType: "pro", duration: "6 mois", amountDA: 14000, paymentMethod: "ccp", status: "pending", createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), receiptUrl: "https://via.placeholder.com/300x400.png?text=Re%C3%A7u+CCP" }
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

  const handleApprovePayment = async (payment: Payment) => {
    try {
      setActionLoading(payment.id);
      // 1. Update payment doc
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'completed',
        approvedAt: new Date().toISOString()
      });

      // 2. Update tenant doc
      const now = new Date();
      let expiresAt = new Date();
      if (payment.duration.includes("3 mois")) expiresAt.setMonth(now.getMonth() + 3);
      else if (payment.duration.includes("6 mois")) expiresAt.setMonth(now.getMonth() + 6);
      else if (payment.duration.includes("1 an")) expiresAt.setFullYear(now.getFullYear() + 1);
      else expiresAt.setMonth(now.getMonth() + 1);

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

  const handleLogout = () => {
    navigate('/admin');
  };

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
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Vue d'ensemble</h1>
            <p className="text-neutral-400 text-sm">Surveillez l'activité globale de la plateforme, les marchands et les abonnements.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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

        {/* Tab 1: Tenants */}
        {activeTab === 'tenants' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <h2 className="font-semibold">Derniers marchands</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#161616] text-neutral-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Boutique</th>
                    <th className="px-6 py-3 font-medium">Propriétaire</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">Date d'inscription</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                        <div className="flex justify-center mb-2"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        Chargement des données...
                      </td>
                    </tr>
                  ) : tenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                        Aucun marchand inscrit pour le moment.
                      </td>
                    </tr>
                  ) : (
                    tenants.map(tenant => (
                      <tr key={tenant.id} className="hover:bg-[#161616] transition-colors">
                        <td className="px-6 py-4 font-medium">{tenant.storeName}</td>
                        <td className="px-6 py-4 text-neutral-400">{tenant.ownerEmail}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-semibold capitalize">
                            {tenant.plan || 'pro'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${tenant.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            {tenant.status === 'active' ? 'Actif' : 'En attente'}
                          </span>
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
              <h2 className="font-semibold">Demandes d'abonnement & Historique des paiements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#161616] text-neutral-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Boutique & Email</th>
                    <th className="px-6 py-3 font-medium">Plan & Durée</th>
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

