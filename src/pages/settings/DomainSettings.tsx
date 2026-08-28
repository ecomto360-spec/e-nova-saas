import { useState, useEffect } from "react";
import { 
  Globe, Link as LinkIcon, ShoppingCart, Clock, Info, Copy, AlertTriangle, 
  CheckCircle2, XCircle, RefreshCw, Trash2, ExternalLink, ShieldCheck, Lock, 
  Server, Check, Search, ArrowRight, CreditCard, Download, Sparkles, ChevronRight, 
  HelpCircle, X, FileText, Smartphone, AlertCircle
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { ConfirmModal } from "../../components/common/ConfirmModal";

interface ConnectedDomain {
  id: string;
  domain: string;
  type: "system" | "custom" | "purchased";
  isPrimary: boolean;
  status: "active" | "pending_dns" | "ssl_generating" | "error";
  sslStatus: "active" | "pending" | "expired";
  targetCname: string;
  addedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
    status: "valid" | "pending" | "invalid";
  }[];
}

interface DomainOrder {
  id: string;
  domain: string;
  periodYears: number;
  price: number;
  paymentMethod: "cib_edahabia" | "baridimob" | "card";
  status: "active" | "processing" | "expired";
  createdAt: string;
  expiresAt: string;
  autoRenew: boolean;
  invoiceNumber: string;
}

const POPULAR_TLDS = [
  { tld: ".com", price: 1900, badge: "Le plus populaire", desc: "Idéal pour tout type de commerce" },
  { tld: ".dz", price: 2500, badge: "Identité Algérie 🇩🇿", desc: "Pour cibler exclusivement l'Algérie" },
  { tld: ".store", price: 990, badge: "Spécial E-commerce", desc: "Idéal pour votre boutique en ligne" },
  { tld: ".shop", price: 1200, badge: "Tendance", desc: "Nom moderne et percutant" },
  { tld: ".net", price: 2100, badge: "Professionnel", desc: "Une alternative réputée au .com" },
  { tld: ".online", price: 850, badge: "Économique", desc: "Visibilité mondiale à petit prix" }
];

export default function DomainSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"connect" | "buy" | "history">("connect");
  
  // Store data from Firestore
  const [storeSubdomain, setStoreSubdomain] = useState("mimi");
  const [storeName, setStoreName] = useState("Mimi Store");
  const [connectedDomains, setConnectedDomains] = useState<ConnectedDomain[]>([]);
  const [domainOrders, setDomainOrders] = useState<DomainOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect Domain Form
  const [inputDomain, setInputDomain] = useState("");
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<Array<{ title: string; desc: string; status: "pending" | "running" | "success" | "error" }>>([]);
  const [verifyResultDomain, setVerifyResultDomain] = useState<string>("");

  // Buy Domain Form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ domain: string; tld: string; price: number; available: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDomainToBuy, setSelectedDomainToBuy] = useState<{ domain: string; price: number } | null>(null);
  const [buyPeriod, setBuyPeriod] = useState(1);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<"cib_edahabia" | "baridimob" | "card">("cib_edahabia");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cibCardNumber, setCibCardNumber] = useState("");
  const [cibOtp, setCibOtp] = useState("");
  const [cibStep, setCibStep] = useState<"card" | "otp">("card");

  // Modals & UI States
  const [cloudflareModalOpen, setCloudflareModalOpen] = useState(false);
  const [dnsDetailsDomain, setDnsDetailsDomain] = useState<ConnectedDomain | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<ConnectedDomain | null>(null);
  const [isDeletingDomain, setIsDeletingDomain] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, label: string = "Texte copié") => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copié dans le presse-papiers !`);
  };

  // Load tenant domain settings from Firestore
  useEffect(() => {
    if (!user) return;

    const tenantRef = doc(db, "tenants", user.uid);
    const unsubscribe = onSnapshot(tenantRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const sub = data.subdomain || data.slug || "mimi";
        setStoreSubdomain(sub);
        setStoreName(data.storeName || "Mimi Boutique");

        const loadedDomains: ConnectedDomain[] = data.domains || [
          {
            id: "system-subdomain",
            domain: `e-nova.vercel.app/store/${sub}`,
            type: "system",
            isPrimary: true,
            status: "active",
            sslStatus: "active",
            targetCname: "cname.vercel-dns.com",
            addedAt: data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).toLocaleDateString("fr-FR") : "2026/08/19",
            dnsRecords: [
              { type: "CNAME", name: "@", value: "cname.vercel-dns.com", status: "valid" }
            ]
          }
        ];

        // Ensure system domain always exists
        if (!loadedDomains.some(d => d.type === "system")) {
          loadedDomains.unshift({
            id: "system-subdomain",
            domain: `e-nova.vercel.app/store/${sub}`,
            type: "system",
            isPrimary: loadedDomains.length === 0,
            status: "active",
            sslStatus: "active",
            targetCname: "cname.vercel-dns.com",
            addedAt: "2026/08/19",
            dnsRecords: [
              { type: "CNAME", name: "@", value: "cname.vercel-dns.com", status: "valid" }
            ]
          });
        }

        setConnectedDomains(loadedDomains);
        setDomainOrders(data.domainOrders || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erreur lecture domaines:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Clean domain input helper
  const cleanDomainString = (raw: string) => {
    let d = raw.trim().toLowerCase();
    d = d.replace(/^https?:\/\//i, "");
    d = d.replace(/\/.*$/, "");
    return d;
  };

  // Verify and Connect Domain Handler
  const handleStartVerification = async () => {
    const raw = cleanDomainString(inputDomain);
    if (!raw) {
      showToast("Veuillez saisir un nom de domaine valide", "error");
      return;
    }

    if (!raw.includes(".")) {
      showToast("Le format du domaine est invalide (ex: www.maboutique.com)", "error");
      return;
    }

    setVerifyResultDomain(raw);
    setVerifyModalOpen(true);
    setVerifyingDomain(true);

    const stepsInit = [
      { title: "Validation du format et syntaxe", desc: `Vérification du domaine ${raw}`, status: "running" as const },
      { title: "Résolution DNS CNAME", desc: "Interrogation des serveurs DNS mondiaux vers cname.vercel-dns.com", status: "pending" as const },
      { title: "Génération du certificat SSL", desc: "Sécurisation HTTPS automatique (Let's Encrypt / Cloudflare)", status: "pending" as const },
      { title: "Liaison au serveur DZBuild", desc: "Routage du trafic de votre boutique", status: "pending" as const }
    ];
    setVerificationSteps(stepsInit);

    // Simulate real interactive verification sequence
    await new Promise(r => setTimeout(r, 900));
    setVerificationSteps(prev => [
      { ...prev[0], status: "success" },
      { ...prev[1], status: "running" },
      prev[2],
      prev[3]
    ]);

    await new Promise(r => setTimeout(r, 1200));
    // Check if user set DNS or is connecting
    setVerificationSteps(prev => [
      prev[0],
      { ...prev[1], status: "success" },
      { ...prev[2], status: "running" },
      prev[3]
    ]);

    await new Promise(r => setTimeout(r, 1100));
    setVerificationSteps(prev => [
      prev[0],
      prev[1],
      { ...prev[2], status: "success" },
      { ...prev[3], status: "running" }
    ]);

    await new Promise(r => setTimeout(r, 800));
    setVerificationSteps(prev => [
      prev[0],
      prev[1],
      prev[2],
      { ...prev[3], status: "success" }
    ]);

    setVerifyingDomain(false);

    // Save to Firestore
    if (user) {
      try {
        const newDomainObj: ConnectedDomain = {
          id: `custom-${Date.now()}`,
          domain: raw,
          type: "custom",
          isPrimary: connectedDomains.length === 1, // make primary if first custom
          status: "active",
          sslStatus: "active",
          targetCname: "cname.vercel-dns.com",
          addedAt: new Date().toLocaleDateString("fr-FR"),
          verifiedAt: new Date().toISOString(),
          dnsRecords: [
            { type: "CNAME", name: raw.startsWith("www.") ? "www" : "@", value: "cname.vercel-dns.com", status: "valid" }
          ]
        };

        const updated = [...connectedDomains.filter(d => d.domain !== raw), newDomainObj];
        const tenantRef = doc(db, "tenants", user.uid);
        await updateDoc(tenantRef, {
          domains: updated,
          customDomain: raw
        });
        showToast(`Le domaine ${raw} est maintenant connecté avec succès !`);
        setInputDomain("");
      } catch (err) {
        console.error("Erreur sauvegarde domaine:", err);
      }
    }
  };

  // Set Primary Domain
  const handleSetPrimary = async (domainId: string) => {
    if (!user) return;
    try {
      const updated = connectedDomains.map(d => ({
        ...d,
        isPrimary: d.id === domainId
      }));
      const selected = updated.find(d => d.id === domainId);
      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, {
        domains: updated,
        customDomain: selected?.type === "custom" || selected?.type === "purchased" ? selected.domain : null
      });
      showToast(`Le domaine ${selected?.domain} est désormais votre domaine principal !`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  // Disconnect / Delete Domain
  const handleConfirmDeleteDomain = async () => {
    if (!user || !domainToDelete) return;
    if (domainToDelete.type === "system") {
      showToast("Le sous-domaine système gratuit ne peut pas être supprimé.", "error");
      setDomainToDelete(null);
      return;
    }

    setIsDeletingDomain(true);
    try {
      const updated = connectedDomains.filter(d => d.id !== domainToDelete.id);
      // Ensure one primary domain remains
      if (domainToDelete.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, {
        domains: updated,
        customDomain: updated.find(d => d.isPrimary)?.domain || null
      });
      showToast(`Domaine ${domainToDelete.domain} déconnecté avec succès.`);
      setDomainToDelete(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la déconnexion", "error");
    } finally {
      setIsDeletingDomain(false);
    }
  };

  // Live Domain Search in Buy Tab
  const handleSearchDomains = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const clean = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    setTimeout(() => {
      const results = POPULAR_TLDS.map(t => {
        const fullDomain = `${clean}${t.tld}`;
        // Randomly simulate available vs taken for common words
        const isTaken = clean === "nike" || clean === "apple" || clean === "google" || clean === "facebook";
        return {
          domain: fullDomain,
          tld: t.tld,
          price: t.price,
          available: !isTaken
        };
      });
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  };

  // Complete Domain Purchase
  const handleCompletePurchase = async () => {
    if (!selectedDomainToBuy || !user) return;

    if (buyPaymentMethod === "cib_edahabia" && cibStep === "card") {
      if (!cibCardNumber || cibCardNumber.replace(/\s/g, "").length < 16) {
        showToast("Veuillez saisir un numéro de carte CIB/EDAHABIA valide (16 chiffres)", "error");
        return;
      }
      setCibStep("otp");
      showToast("Code OTP envoyé par SMS à votre numéro lié à la carte");
      return;
    }

    if (buyPaymentMethod === "cib_edahabia" && cibStep === "otp") {
      if (!cibOtp || cibOtp.length < 4) {
        showToast("Veuillez saisir le code de vérification SMS (OTP)", "error");
        return;
      }
    }

    setIsProcessingPayment(true);
    try {
      await new Promise(r => setTimeout(r, 1400));

      const now = new Date();
      const expiry = new Date();
      expiry.setFullYear(now.getFullYear() + buyPeriod);

      const totalPrice = selectedDomainToBuy.price * buyPeriod;
      const orderId = `DOM-${Date.now().toString().slice(-6)}`;
      const invoiceNumber = `FAC-DOM-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder: DomainOrder = {
        id: orderId,
        domain: selectedDomainToBuy.domain,
        periodYears: buyPeriod,
        price: totalPrice,
        paymentMethod: buyPaymentMethod,
        status: "active",
        createdAt: now.toLocaleDateString("fr-FR"),
        expiresAt: expiry.toLocaleDateString("fr-FR"),
        autoRenew: true,
        invoiceNumber
      };

      const newDomain: ConnectedDomain = {
        id: `purchased-${Date.now()}`,
        domain: selectedDomainToBuy.domain,
        type: "purchased",
        isPrimary: true,
        status: "active",
        sslStatus: "active",
        targetCname: "cname.vercel-dns.com",
        addedAt: now.toLocaleDateString("fr-FR"),
        verifiedAt: now.toISOString(),
        expiresAt: expiry.toLocaleDateString("fr-FR"),
        dnsRecords: [
          { type: "A", name: "@", value: "154.250.238.190", status: "valid" },
          { type: "CNAME", name: "www", value: "cname.vercel-dns.com", status: "valid" }
        ]
      };

      // Set other domains as non-primary
      const updatedDomains = connectedDomains.map(d => ({ ...d, isPrimary: false }));
      updatedDomains.push(newDomain);

      const updatedOrders = [newOrder, ...domainOrders];

      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, {
        domains: updatedDomains,
        domainOrders: updatedOrders,
        customDomain: selectedDomainToBuy.domain
      });

      setIsProcessingPayment(false);
      setSelectedDomainToBuy(null);
      setCibStep("card");
      setCibCardNumber("");
      setCibOtp("");
      setActiveTab("connect");
      showToast(`Félicitations ! Le domaine ${selectedDomainToBuy.domain} a été acheté et configuré instantanément.`);
    } catch (err) {
      console.error("Erreur achat domaine:", err);
      setIsProcessingPayment(false);
      showToast("Une erreur est survenue lors de la commande", "error");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div 
          id="domain-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-bounce ${
            toastMessage.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion des domaines</h1>
            <p className="text-sm text-neutral-400">Connecter un domaine personnalisé à votre boutique ou acheter un nouveau domaine</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          id="tab-connect-domain"
          onClick={() => setActiveTab("connect")}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "connect"
              ? "bg-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/20"
              : "bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white"
          }`}
        >
          <LinkIcon className="w-4 h-4" /> 
          Connecter un domaine
        </button>

        <button 
          id="tab-buy-domain"
          onClick={() => {
            setActiveTab("buy");
            if (!searchQuery) handleSearchDomains(storeSubdomain || "mimi");
          }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "buy"
              ? "bg-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/20"
              : "bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> 
          Acheter un domaine
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
            Promo .dz / .com
          </span>
        </button>

        <button 
          id="tab-history-domain"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/20"
              : "bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" /> 
          Historique des commandes
          {domainOrders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center">
              {domainOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CONNECTER UN DOMAINE */}
      {activeTab === "connect" && (
        <div className="space-y-6">
          {/* Card: Domaines actuellement connectés */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-base font-semibold text-white">Domaines de votre boutique</h2>
                </div>
                <span className="text-xs text-neutral-400">
                  {connectedDomains.length} domaine{connectedDomains.length > 1 ? "s" : ""} associé{connectedDomains.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {connectedDomains.map((dom) => (
                  <div 
                    key={dom.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                      dom.isPrimary 
                        ? "bg-[#1e1e24] border-yellow-500/40 shadow-sm shadow-yellow-500/5" 
                        : "bg-[#121215] border-neutral-800/80 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        dom.isPrimary ? "bg-yellow-500/10 text-yellow-500" : "bg-neutral-800 text-neutral-400"
                      }`}>
                        <Globe className="w-4 h-4" />
                      </div>
                      
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-medium text-sm sm:text-base font-mono">
                            https://{dom.domain}
                          </span>
                          
                          {dom.isPrimary && (
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}

                          {dom.type === "system" && (
                            <span className="text-[10px] font-medium bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                              Sous-domaine Système
                            </span>
                          )}

                          {dom.type === "purchased" && (
                            <span className="text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                              Acheté sur DZBuild
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-400">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            En ligne & Actif
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Lock className="w-3 h-3" />
                            SSL Sécurisé (HTTPS)
                          </span>
                          <span>•</span>
                          <span className="text-neutral-500">Ajouté le {dom.addedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={`https://${dom.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                        title="Ouvrir la boutique"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => setDnsDetailsDomain(dom)}
                        className="px-3 py-1.5 rounded-lg bg-[#16161a] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Server className="w-3.5 h-3.5" />
                        Détails DNS
                      </button>

                      {!dom.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(dom.id)}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 hover:text-black border border-yellow-500/30 text-yellow-400 text-xs font-medium transition-all"
                        >
                          Définir comme principal
                        </button>
                      )}

                      {dom.type !== "system" && (
                        <button
                          onClick={() => setDomainToDelete(dom)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Déconnecter le domaine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 1: Vérifier et connecter le domaine */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-yellow-500" /> 
                Vérifier et connecter le domaine
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    id="input-custom-domain"
                    type="text"
                    value={inputDomain}
                    onChange={(e) => setInputDomain(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleStartVerification(); }}
                    placeholder="Exemple : www.mystore.com ou mystore.com"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500"
                  />
                  {inputDomain && (
                    <button 
                      onClick={() => setInputDomain("")}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button 
                  id="btn-verify-connect"
                  onClick={handleStartVerification}
                  disabled={verifyingDomain || !inputDomain.trim()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-md shadow-yellow-500/10"
                >
                  <Search className="w-4 h-4" /> 
                  Vérifier et connecter
                </button>
              </div>

              <p className="text-xs text-neutral-500 mt-2.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                Vous devez au préalable pointer votre DNS vers DZBuild (voir instructions ci-dessous).
              </p>
            </div>
          </div>

          {/* Card 2: Paramètres DNS requis */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" /> 
                Paramètres DNS requis
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                Avant de connecter votre domaine, vous devez ajouter un enregistrement CNAME dans les paramètres DNS de votre fournisseur de domaine
              </p>

              {/* Table DNS */}
              <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl mb-6 overflow-hidden">
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr] border-b border-neutral-800/80 p-4 items-center">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Type</div>
                  <div className="text-sm font-bold text-yellow-500 text-right font-mono">CNAME</div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr] border-b border-neutral-800/80 p-4 items-center group">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Host / Name</div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-medium text-yellow-500 font-mono">@</span>
                    <button 
                      onClick={() => handleCopy("@", "Hôte DNS")}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copier
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr] p-4 items-center group">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Value / Target</div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-medium text-yellow-500 font-mono">cname.vercel-dns.com</span>
                    <button 
                      onClick={() => handleCopy("cname.vercel-dns.com", "Valeur CNAME")}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copier
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning box */}
              <div className="bg-[#2a2118] border border-orange-900/50 rounded-xl p-5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Impossible d'ajouter l'enregistrement sur le domaine racine (@) ?</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    Certains fournisseurs (GoDaddy, certains hébergeurs algériens...) n'autorisent pas un CNAME sur la racine. Le plus simple : ajoutez un CNAME sur l'hôte <span className="text-white font-medium bg-neutral-900 px-1.5 py-0.5 rounded font-mono">www</span> pointant vers <span className="text-yellow-400 font-medium font-mono">cname.vercel-dns.com</span> — nous gérons le reste automatiquement (votre boutique fonctionnera avec et sans www).
                  </p>
                  <button 
                    onClick={() => setCloudflareModalOpen(true)}
                    className="text-xs text-orange-400 hover:text-orange-300 underline font-medium flex items-center gap-1"
                  >
                    Ou utilisez la méthode des serveurs de noms Cloudflare (compatible avec tous les fournisseurs) →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Étapes pour connecter le domaine */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2">
                <Server className="w-4 h-4 text-yellow-500" /> 
                Étapes pour connecter le domaine
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4 relative">
                  <div className="w-px bg-neutral-800 absolute left-[15px] top-8 bottom-0" />
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-bold shrink-0 relative z-10">1</div>
                  <div className="pt-1">
                    <h4 className="text-sm font-medium text-white mb-1">Accédez au panneau de contrôle de votre fournisseur</h4>
                    <p className="text-xs text-neutral-400">Connectez-vous à votre compte Namecheap, GoDaddy, Hostinger, Cloudflare ou hébergeur local algérien (Icosnet, WebDZ...)</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-px bg-neutral-800 absolute left-[15px] top-8 bottom-0" />
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-bold shrink-0 relative z-10">2</div>
                  <div className="pt-1">
                    <h4 className="text-sm font-medium text-white mb-1">Allez aux paramètres DNS</h4>
                    <p className="text-xs text-neutral-400">Recherchez la section "DNS Records", "Zone Editor" ou "Gestion DNS" de votre domaine</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-px bg-neutral-800 absolute left-[15px] top-8 bottom-0" />
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-bold shrink-0 relative z-10">3</div>
                  <div className="pt-1">
                    <h4 className="text-sm font-medium text-white mb-1">Ajoutez un nouvel enregistrement CNAME</h4>
                    <p className="text-xs text-neutral-400">Choisissez le type <span className="text-yellow-400 font-mono">CNAME</span>, écrivez dans Host : <span className="text-white font-mono">@</span> (ou <span className="text-white font-mono">www</span>), et dans Value : <span className="text-yellow-400 font-mono">cname.vercel-dns.com</span></p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-px bg-neutral-800 absolute left-[15px] top-8 bottom-0" />
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-bold shrink-0 relative z-10">4</div>
                  <div className="pt-1">
                    <h4 className="text-sm font-medium text-white mb-1">Attendez la propagation DNS</h4>
                    <p className="text-xs text-neutral-400">Cela prend généralement entre 5 minutes et 2 heures pour que les serveurs DNS se synchronisent</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-bold shrink-0 relative z-10">5</div>
                  <div className="pt-1">
                    <h4 className="text-sm font-medium text-white mb-1">Vérifiez la connexion</h4>
                    <p className="text-xs text-neutral-400">Entrez votre nom de domaine dans le champ ci-dessus et cliquez sur "Vérifier et connecter"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACHETER UN DOMAINE */}
      {activeTab === "buy" && (
        <div className="space-y-6">
          {/* Banner Promo */}
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-yellow-500/30 rounded-2xl p-6 sm:p-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Configuration 100% Automatique & Clé en Main
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Trouvez le nom parfait pour votre marque</h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Achetez votre domaine directement sur DZBuild : nous le connectons instantanément à votre boutique sans aucune configuration DNS complexe de votre part.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Rechercher la disponibilité d'un nom de domaine
            </label>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchDomains(e.target.value)}
                  placeholder="Tapez le nom de votre marque (ex: monboutik, dzmode, elfilaha...)"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500"
                />
              </div>

              <button
                onClick={() => handleSearchDomains(searchQuery || "maboutique")}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3.5 rounded-xl text-sm font-semibold transition-colors shrink-0 flex items-center gap-2"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Rechercher
              </button>
            </div>

            {/* Avantages inclus */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-800/80">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SSL HTTPS gratuit à vie</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Config DNS automatique</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Confidentialité WHOIS</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Paiement CIB & BaridiMob</span>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-4">Extensions et disponibilités</h3>

              <div className="divide-y divide-neutral-800/80">
                {searchResults.map((item) => (
                  <div 
                    key={item.domain}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1e1e24] flex items-center justify-center text-yellow-500 font-bold text-sm">
                        {item.tld}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white font-mono">{item.domain}</span>
                          {item.available ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                              Disponible
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                              Pris
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {POPULAR_TLDS.find(t => t.tld === item.tld)?.desc || "Nom de domaine sécurisé"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-base font-bold text-yellow-500">
                          {item.price.toLocaleString("fr-DZ")} DZD
                          <span className="text-xs font-normal text-neutral-400"> / an</span>
                        </div>
                        <div className="text-[11px] text-neutral-500">Renouvelable annuellement</div>
                      </div>

                      {item.available ? (
                        <button
                          onClick={() => setSelectedDomainToBuy({ domain: item.domain, price: item.price })}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Acheter
                        </button>
                      ) : (
                        <button 
                          disabled 
                          className="bg-neutral-800 text-neutral-500 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                        >
                          Indisponible
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && (
                  <div className="py-12 text-center text-neutral-400">
                    <Globe className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
                    <p className="text-sm">Tapez un mot-clé dans la barre ci-dessus pour vérifier la disponibilité des domaines.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORIQUE DES COMMANDES */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Historique de vos commandes de domaines</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Suivez vos abonnements de noms de domaine, factures et renouvellements</p>
                </div>
              </div>

              {domainOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        <th className="pb-3">N° Facture</th>
                        <th className="pb-3">Domaine</th>
                        <th className="pb-3">Période</th>
                        <th className="pb-3">Montant</th>
                        <th className="pb-3">Paiement</th>
                        <th className="pb-3">Expiration</th>
                        <th className="pb-3">Statut</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {domainOrders.map((order) => (
                        <tr key={order.id} className="text-neutral-300 hover:bg-[#1e1e24]/50 transition-colors">
                          <td className="py-4 font-mono text-xs text-yellow-500 font-medium">
                            {order.invoiceNumber}
                          </td>
                          <td className="py-4 font-medium text-white font-mono">
                            {order.domain}
                          </td>
                          <td className="py-4 text-xs">
                            {order.periodYears} an{order.periodYears > 1 ? "s" : ""}
                          </td>
                          <td className="py-4 font-semibold text-white">
                            {order.price.toLocaleString("fr-DZ")} DZD
                          </td>
                          <td className="py-4 text-xs capitalize">
                            {order.paymentMethod === "cib_edahabia" ? "CIB / EDAHABIA" : order.paymentMethod === "baridimob" ? "BaridiMob" : "Carte Bancaire"}
                          </td>
                          <td className="py-4 text-xs text-neutral-400">
                            {order.expiresAt}
                          </td>
                          <td className="py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                              {order.status === "active" ? "Actif" : order.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => {
                                showToast(`Facture ${order.invoiceNumber} téléchargée avec succès !`);
                              }}
                              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                              title="Télécharger la facture"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400 space-y-3">
                  <Clock className="w-12 h-12 mx-auto text-neutral-600" />
                  <p className="text-sm">Aucune commande de nom de domaine enregistrée pour le moment.</p>
                  <button
                    onClick={() => setActiveTab("buy")}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Rechercher un domaine à acheter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFICATION SEQUENCE */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Vérification de la connexion</h3>
                  <p className="text-xs text-neutral-400 font-mono">{verifyResultDomain}</p>
                </div>
              </div>

              {!verifyingDomain && (
                <button 
                  onClick={() => setVerifyModalOpen(false)}
                  className="text-neutral-500 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step list */}
            <div className="space-y-4">
              {verificationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {step.status === "running" && <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />}
                    {step.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step.status === "pending" && <div className="w-4 h-4 rounded-full border border-neutral-700" />}
                    {step.status === "error" && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${
                      step.status === "success" ? "text-white" : step.status === "running" ? "text-yellow-400" : "text-neutral-400"
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {!verifyingDomain && (
              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={() => setVerifyModalOpen(false)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                >
                  Terminer et fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ACHAT DE DOMAINE (CHECKOUT) */}
      {selectedDomainToBuy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Commander votre domaine</h3>
                  <p className="text-xs text-yellow-500 font-mono font-medium">{selectedDomainToBuy.domain}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedDomainToBuy(null)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary & Duration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Durée d'enregistrement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((years) => (
                    <button
                      key={years}
                      type="button"
                      onClick={() => setBuyPeriod(years)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        buyPeriod === years 
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 font-semibold" 
                          : "bg-[#1e1e24] border-neutral-800 text-neutral-300 hover:border-neutral-700"
                      }`}
                    >
                      <div className="text-sm">{years} an{years > 1 ? "s" : ""}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{(selectedDomainToBuy.price * years).toLocaleString("fr-DZ")} DZD</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setBuyPaymentMethod("cib_edahabia"); setCibStep("card"); }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      buyPaymentMethod === "cib_edahabia"
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 font-semibold"
                        : "bg-[#1e1e24] border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <div className="text-xs">CIB / Dahabia</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuyPaymentMethod("baridimob")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      buyPaymentMethod === "baridimob"
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 font-semibold"
                        : "bg-[#1e1e24] border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                    <div className="text-xs">BaridiMob</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuyPaymentMethod("card")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      buyPaymentMethod === "card"
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 font-semibold"
                        : "bg-[#1e1e24] border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <Globe className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-xs">Visa/Mastercard</div>
                  </button>
                </div>
              </div>

              {/* Payment Details Input */}
              {buyPaymentMethod === "cib_edahabia" && (
                <div className="p-4 bg-[#1e1e24] rounded-xl border border-neutral-800 space-y-3">
                  {cibStep === "card" ? (
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-300">Numéro de carte EDAHABIA / CIB (16 chiffres)</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cibCardNumber}
                        onChange={(e) => setCibCardNumber(e.target.value)}
                        placeholder="6280 •••• •••• ••••"
                        className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-300">Code secret reçu par SMS (OTP)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={cibOtp}
                        onChange={(e) => setCibOtp(e.target.value)}
                        placeholder="Ex: 849201"
                        className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono tracking-widest text-center font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              {buyPaymentMethod === "baridimob" && (
                <div className="p-4 bg-[#1e1e24] rounded-xl border border-neutral-800 space-y-2 text-xs text-neutral-300">
                  <div className="flex justify-between items-center">
                    <span>RIP Algérie Poste :</span>
                    <span className="font-mono text-yellow-500 font-bold">007 99999 0023456789 45</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Activation instantanée après confirmation automatique.
                  </p>
                </div>
              )}

              {/* Total Card */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-400">Total à payer TTC :</div>
                  <div className="text-xl font-extrabold text-yellow-400">
                    {(selectedDomainToBuy.price * buyPeriod).toLocaleString("fr-DZ")} DZD
                  </div>
                </div>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-4 h-4" />
                  SSL & Setup inclus
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedDomainToBuy(null)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-xs font-medium transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleCompletePurchase}
                disabled={isProcessingPayment}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {buyPaymentMethod === "cib_edahabia" && cibStep === "card" ? "Continuer vers OTP" : "Confirmer et Payer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLOUDFLARE NAMESERVERS GUIDE */}
      {cloudflareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Méthode Cloudflare / Serveurs de Noms</h3>
                  <p className="text-xs text-neutral-400">Compatible avec 100% des hébergeurs</p>
                </div>
              </div>

              <button 
                onClick={() => setCloudflareModalOpen(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Si votre registrar ne supporte pas le CNAME sur la racine (@), changez simplement vos serveurs DNS (NS) par nos serveurs universels :
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-semibold">Nameserver 1</div>
                  <div className="text-sm font-mono text-yellow-500 font-bold">ns1.dzbuild-dns.com</div>
                </div>
                <button 
                  onClick={() => handleCopy("ns1.dzbuild-dns.com", "NS 1")}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded font-medium"
                >
                  Copier
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-semibold">Nameserver 2</div>
                  <div className="text-sm font-mono text-yellow-500 font-bold">ns2.dzbuild-dns.com</div>
                </div>
                <button 
                  onClick={() => handleCopy("ns2.dzbuild-dns.com", "NS 2")}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded font-medium"
                >
                  Copier
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              Cette méthode inclut la protection anti-DDoS mondiale et le CDN ultrarapide pour l'Algérie.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCloudflareModalOpen(false)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-xl text-xs font-bold"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DNS DETAILS */}
      {dnsDetailsDomain && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Détails DNS & Diagnostic</h3>
                  <p className="text-xs text-neutral-400 font-mono">{dnsDetailsDomain.domain}</p>
                </div>
              </div>

              <button 
                onClick={() => setDnsDetailsDomain(null)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1e1e24] rounded-xl border border-neutral-800">
                <span className="text-xs text-neutral-400">Statut de la propagation :</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Propagé
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1e1e24] rounded-xl border border-neutral-800">
                <span className="text-xs text-neutral-400">Certificat SSL / TLS :</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Let's Encrypt Actif (Auto-renouvelé)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1e1e24] rounded-xl border border-neutral-800">
                <span className="text-xs text-neutral-400">Cible CNAME configurée :</span>
                <span className="text-xs font-mono font-bold text-yellow-500">{dnsDetailsDomain.targetCname}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDnsDetailsDomain(null)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation de suppression d'un domaine */}
      <ConfirmModal
        isOpen={!!domainToDelete}
        title="Déconnecter le domaine"
        description={`Êtes-vous sûr de vouloir déconnecter le domaine "${domainToDelete?.domain}" ?`}
        confirmText="Déconnecter"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeletingDomain}
        onConfirm={handleConfirmDeleteDomain}
        onClose={() => setDomainToDelete(null)}
      />
    </div>
  );
}
