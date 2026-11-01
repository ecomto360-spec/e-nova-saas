import { useLanguage } from "../contexts/LanguageContext";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  Ghost, 
  Search, 
  Filter, 
  Loader2, 
  Send, 
  Phone, 
  ShoppingBag, 
  CheckCircle2, 
  Trash2, 
  ExternalLink, 
  Eye, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  X, 
  MessageSquare, 
  Plus, 
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  XCircle,
  Mail,
  User,
  DollarSign,
  Copy,
  Check,
  StickyNote
} from "lucide-react";
import { 
  AbandonedCart, 
  getAbandonedCarts, 
  markAbandonedCartAsContacted,
  markAbandonedCartAsRecovered, 
  deleteAbandonedCart, 
  convertAbandonedCartToOrder, 
  generateWhatsAppRelanceUrl,
  saveAbandonedCart,
  cleanupOldAbandonedCarts
} from "../lib/abandonedCartService";
import { copyToClipboard } from "../lib/clipboard";
import CartDetailsModal from "../components/common/CartDetailsModal";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { formatDateTime } from "../lib/date";

/** Bouton copier compact des lignes du tableau (visible au survol, feedback ✓ + toast). */
function QuickCopyButton({ value, ariaLabel, onToast, hoverClass = "opacity-0 group-hover/name:opacity-100 group-focus-within/name:opacity-100" }: {
  value: string;
  ariaLabel: string;
  onToast: (msg?: string) => void;
  hoverClass?: string;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    if (!value || copied) return;
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      onToast();
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      onToast(t("cartDetails.copyFailed"));
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`transition-opacity p-0.5 text-neutral-500 hover:text-amber-400 cursor-pointer ${hoverClass}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function AbandonedCarts() {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "abandoned" | "contacted" | "recovered">("all");
  const [detailsTarget, setDetailsTarget] = useState<{ id: string; focusNotes?: boolean } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  // Extension WhatsApp : filtre « envoyés uniquement », renvoi, historique
  const [waOnlyFilter, setWaOnlyFilter] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [waHistory, setWaHistory] = useState<Array<{ id: string; data: Record<string, unknown> }> | null>(null);
  // Lot 19 : notes (filtre, brouillons conservés tant que la page est ouverte, toast)
  const [notesOnlyFilter, setNotesOnlyFilter] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Template personnalisé de relance WhatsApp
  const [waTemplate, setWaTemplate] = useState<string>(() => {
    return localStorage.getItem("dzbuild_wa_relance_template") || 
      "👋 Bonjour {client},\n\nNous avons remarqué que vous avez initié une commande sur notre boutique pour :\n📦 *{product}*\n💰 Montant total : *{total} DZD* (Paiement à la livraison)\n📍 Destination : {wilaya}\n\nSouhaitez-vous que nous préparions et expédions votre colis dès aujourd'hui ?\nRépondez simplement *OUI* à ce message pour valider votre livraison.\n\nMerci de votre confiance !";
  });

  const loadCarts = useCallback(async () => {
    try {
      const data = await getAbandonedCarts(auth.currentUser?.uid);
      setCarts(data);
    } catch (err) {
      console.warn("Failed to load abandoned carts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCarts();

    const handleUpdate = () => {
      loadCarts();
    };

    window.addEventListener("dzbuild_abandoned_cart_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Écouter les messages provenant de fenêtres enfants / iframes
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "dzbuild_abandoned_cart_updated") {
        loadCarts();
      }
    };
    window.addEventListener("message", handleMessage);

    // Écouteur Firestore en temps réel (filtré sur CE vendeur : apparition < 5 s)
    let unsubGlobal: (() => void) | undefined;
    let unsubTenant: (() => void) | undefined;
    try {
      const tenantUid = auth.currentUser?.uid;
      if (tenantUid) {
        unsubGlobal = onSnapshot(
          query(collection(db, "abandoned_carts"), where("tenantId", "==", tenantUid)),
          () => { loadCarts(); },
          (err) => console.warn("Firestore abandoned listener warning:", err)
        );

        unsubTenant = onSnapshot(collection(db, "tenants", tenantUid, "abandoned_carts"), () => {
          loadCarts();
        }, () => {});
      }
    } catch {}

    // Nettoyage automatique : suppression des fiches de plus de 60 jours
    // (une fois au chargement de la page, après résolution de l'authentification).
    const cleanupTimer = setTimeout(() => {
      if (auth.currentUser?.uid) {
        cleanupOldAbandonedCarts(auth.currentUser.uid, 60).catch(() => {});
      }
    }, 4000);

    return () => {
      clearTimeout(cleanupTimer);
      window.removeEventListener("dzbuild_abandoned_cart_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("message", handleMessage);
      if (unsubGlobal) unsubGlobal();
      if (unsubTenant) unsubTenant();
    };
  }, [loadCarts]);

  // Statistiques calculées (statut "contacted" ; l'ancien "relanced" est mappé)
  const isContactedStatus = (c: AbandonedCart) =>
    c.status === "contacted" || c.status === "relanced" || (c.relanceCount && c.relanceCount > 0);

  // Panier vivant affiché dans la modale (suit les mises à jour temps réel)
  const selectedCart = useMemo(
    () => (detailsTarget ? carts.find((c) => c.id === detailsTarget.id) || null : null),
    [detailsTarget, carts]
  );

  // Fermer la modale si le panier a été supprimé
  useEffect(() => {
    if (detailsTarget && !selectedCart) setDetailsTarget(null);
  }, [detailsTarget, selectedCart]);

  // Toast « Copié ✓ » (partagé modale + lignes)
  const notifyCopied = useCallback((message?: string) => {
    setToast(message || t("cartDetails.copied"));
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, [t]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const setNoteDraft = useCallback((cartId: string, value: string) => {
    setNoteDrafts((prev) => ({ ...prev, [cartId]: value }));
  }, []);

  const stats = useMemo(() => {
    const totalAbandoned = carts.length;
    const abandonedActive = carts.filter(c => c.status === "abandoned" && !c.recovered).length;
    const contacted = carts.filter(isContactedStatus).length;
    const recovered = carts.filter(c => c.status === "recovered" || c.recovered).length;
    const recoveredAmount = carts
      .filter(c => c.status === "recovered" || c.recovered)
      .reduce((sum, c) => sum + (Number(c.total) || 0), 0);
    const lostAmount = carts
      .filter(c => c.status === "abandoned")
      .reduce((sum, c) => sum + (Number(c.total) || 0), 0);

    const recoveryRate = totalAbandoned > 0 ? Math.round((recovered / totalAbandoned) * 100) : 0;

    return {
      totalAbandoned,
      abandonedActive,
      contacted,
      recovered,
      recoveredAmount,
      lostAmount,
      recoveryRate
    };
  }, [carts]);

  // Filtrage et recherche
  const filteredCarts = useMemo(() => {
    return carts.filter(cart => {
      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "abandoned" ? (cart.status === "abandoned" && !cart.recovered) :
        statusFilter === "contacted" ? ((cart.status === "contacted" || cart.status === "relanced") && !cart.recovered) :
        statusFilter === "recovered" ? (cart.status === "recovered" || cart.recovered) : true;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (cart.client && cart.client.toLowerCase().includes(q)) ||
        (cart.phone && cart.phone.includes(q)) ||
        (cart.email && cart.email.toLowerCase().includes(q)) ||
        (cart.wilaya && cart.wilaya.toLowerCase().includes(q)) ||
        (cart.itemsSummary && cart.itemsSummary.toLowerCase().includes(q)) ||
        // Lot 19 : la recherche inclut aussi le texte des notes
        ((cart.notes || []).some((n) => (n.text || "").toLowerCase().includes(q)))
      );

      // Filtre WhatsApp : uniquement les paniers avec un message envoyé
      const matchesWa = !waOnlyFilter || Boolean(cart.waStatus);

      // Lot 19 : filtre « Avec notes »
      const matchesNotes = !notesOnlyFilter || (cart.notes || []).length > 0;

      return matchesStatus && matchesSearch && matchesWa && matchesNotes;
    });
  }, [carts, statusFilter, searchQuery, waOnlyFilter, notesOnlyFilter]);

  // Extension WhatsApp : renvoyer le message d'un panier
  const handleWaResend = async (cart: AbandonedCart) => {
    if (!cart.waToken) return;
    setResendingId(cart.id);
    try {
      const r = await fetch("/api/whatsapp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, token: cart.waToken })
      });
      const j = await r.json().catch(() => ({}) as Record<string, unknown>);
      if (j.ok === true) {
        await loadCarts();
      } else {
        alert(`Renvoi impossible : ${String(j.error || "erreur")}`);
      }
    } catch {
      alert("Renvoi impossible : erreur réseau.");
    } finally {
      setResendingId(null);
    }
  };

  // Extension WhatsApp : historique des messages d'un panier
  const openWaHistory = async (cart: AbandonedCart) => {
    setWaHistory([]);
    try {
      const snap = await getDocs(query(collection(db, "whatsapp_messages"), where("cartId", "==", cart.id)));
      const list: Array<{ id: string; data: Record<string, unknown> }> = [];
      snap.forEach((d) => list.push({ id: d.id, data: d.data() as Record<string, unknown> }));
      list.sort((a, b) => String(a.data.sentAt || "").localeCompare(String(b.data.sentAt || "")));
      setWaHistory(list);
    } catch {
      setWaHistory(null);
    }
  };

  // Date relative compacte ("il y a 3 min")
  const formatRelativeTime = (value: any): string => {
    try {
      let ms = 0;
      if (value && typeof value === "object" && typeof (value as any).toMillis === "function") {
        ms = (value as any).toMillis();
      } else {
        const parsed = new Date(value).getTime();
        ms = Number.isFinite(parsed) ? parsed : 0;
      }
      if (!ms) return "—";
      const diff = Math.max(0, Date.now() - ms);
      const min = Math.floor(diff / 60000);
      if (min < 1) return "à l'instant";
      if (min < 60) return `il y a ${min} min`;
      const hours = Math.floor(min / 60);
      if (hours < 24) return `il y a ${hours} h`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `il y a ${days} j`;
      return `il y a ${Math.floor(days / 30)} mois`;
    } catch {
      return "—";
    }
  };

  // Action : Relancer via WhatsApp
  const handleRelanceWhatsApp = async (cart: AbandonedCart) => {
    const url = generateWhatsAppRelanceUrl(cart, waTemplate);
    if (!url) {
      alert("Numéro de téléphone non valide pour WhatsApp.");
      return;
    }

    // Ouvrir WhatsApp
    window.open(url, "_blank");

    // Marquer comme contacté
    await markAbandonedCartAsContacted(cart.id, auth.currentUser?.uid);
    await loadCarts();
  };

  // Action : Marquer comme "Contacté" (icône téléphone, avec confirmation)
  const handleMarkContacted = async (cart: AbandonedCart) => {
    if (!window.confirm("Voulez-vous marquer ce panier comme \"Contacté\" ?")) {
      return;
    }
    await markAbandonedCartAsContacted(cart.id, auth.currentUser?.uid);
    await loadCarts();
  };

  // Action : Convertir en Commande active
  const handleConvertToOrder = async (cart: AbandonedCart) => {
    if (!confirm(`Confirmer la conversion du panier de ${cart.client} (${(cart.total || 0).toLocaleString()} DZD) en commande officielle ?`)) {
      return;
    }

    setConvertingId(cart.id);
    try {
      const newOrderId = await convertAbandonedCartToOrder(cart, auth.currentUser?.uid);
      await loadCarts();
      alert(`🎉 Félicitations ! La commande a été créée avec succès sous le N° ${newOrderId}. Elle est désormais visible dans la liste de vos commandes.`);
    } catch (err: any) {
      alert(`Erreur lors de la conversion : ${err?.message || err}`);
    } finally {
      setConvertingId(null);
    }
  };

  // Action : Supprimer le panier
  const handleDelete = async (cartId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce panier abandonné de la liste ?")) {
      return;
    }
    await deleteAbandonedCart(cartId, auth.currentUser?.uid);
    await loadCarts();
    if (detailsTarget?.id === cartId) {
      setDetailsTarget(null);
    }
  };

  // Action : Créer un panier abandonné de démonstration pour tester la détection
  const handleCreateTestCart = async () => {
    const demoPhones = ["0550123456", "0661987654", "0770456123"];
    const demoNames = ["Amine Zerrouki", "Khadidja Belhadj", "Youcef Mansouri"];
    const demoWilayas = ["16 - Alger", "31 - Oran", "25 - Constantine"];
    const demoProducts = ["Pack Sérum Anti-Âge Ultime (2 flacons)", "Sneakers Édition DZ (Pointure 42)", "Montre Connectée Sport Pro"];
    const demoTotals = [4800, 6500, 8900];

    const idx = Math.floor(Math.random() * demoPhones.length);
    const effectiveTenantId = auth.currentUser?.uid || "default_tenant";

    await saveAbandonedCart({
      id: `cart_${effectiveTenantId}_${demoPhones[idx]}`,
      tenantId: effectiveTenantId,
      userId: effectiveTenantId,
      client: demoNames[idx],
      phone: demoPhones[idx],
      email: `${demoNames[idx].toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      wilaya: demoWilayas[idx],
      commune: "Centre Ville",
      address: "Rue de la Liberté, Bâtiment C",
      itemsSummary: `1x ${demoProducts[idx]}`,
      items: [{
        id: `demo-${Date.now()}`,
        name: demoProducts[idx],
        price: demoTotals[idx] - 400,
        quantity: 1
      }],
      total: demoTotals[idx],
      status: "abandoned",
      recovered: false,
      source: "storefront_form_detection"
    });

    await loadCarts();
    alert("✅ Panier abandonné de test créé avec succès ! Vous pouvez maintenant tester la relance WhatsApp ou la conversion en commande.");
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Ghost className="w-7 h-7 text-amber-500" />
            <span>Paniers Abandonnés & Détection de Leads</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Détection automatique dès qu'un client remplit le formulaire de votre boutique sans cliquer sur « Commander »
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={handleCreateTestCart}
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Générer un panier abandonné test pour valider la fonctionnalité"
          >
            <Plus className="w-4 h-4" />
            <span>Tester la détection</span>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-[#1e1e24] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-neutral-400" />
            <span>Message de Relance</span>
          </button>

          <button 
            onClick={loadCarts}
            className="p-2 rounded-xl border border-neutral-700 bg-[#1e1e24] text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Abandonnés */}
        <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Paniers Abandonnés</p>
              <p className="mt-2 text-3xl font-black text-white">{stats.abandonedActive}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Ghost className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-neutral-400">
            <span>Montant en attente :</span>
            <span className="font-bold text-amber-400 ml-1.5">{stats.lostAmount.toLocaleString()} DZD</span>
          </div>
        </div>

        {/* Paniers Contactés */}
        <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Paniers Contactés</p>
              <p className="mt-2 text-3xl font-black text-blue-400">{stats.contacted}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-neutral-400">
            <span>Contactés par téléphone ou WhatsApp</span>
          </div>
        </div>

        {/* Paniers Récupérés */}
        <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Paniers Récupérés</p>
              <p className="mt-2 text-3xl font-black text-emerald-400">{stats.recovered}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-emerald-400">
            <span>Taux de conversion : <strong>{stats.recoveryRate}%</strong></span>
          </div>
        </div>

        {/* Valeur Récupérée */}
        <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Chiffre d'Affaires Sauvé</p>
              <p className="mt-2 text-2xl font-black text-emerald-400">{stats.recoveredAmount.toLocaleString()} DZD</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-neutral-400">
            <span>Convertis en commandes réelles</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] overflow-hidden shadow-sm">
        {/* Sub-header with Tabs & Search */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#16161a] rounded-xl border border-neutral-800 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "all" ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Tous ({carts.length})
            </button>
            <button
              onClick={() => setStatusFilter("abandoned")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "abandoned" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Abandonnés ({carts.filter(c => c.status === "abandoned" && !c.recovered).length})
            </button>
            <button
              onClick={() => setStatusFilter("contacted")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "contacted" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Contactés ({carts.filter(c => (c.status === "contacted" || c.status === "relanced") && !c.recovered).length})
            </button>
            <button
              onClick={() => setStatusFilter("recovered")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "recovered" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Récupérés ({carts.filter(c => c.status === "recovered" || c.recovered).length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, téléphone, wilaya ou produit..." 
              className="w-full rounded-xl border border-neutral-700 bg-[#16161a] py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre WhatsApp (extension Order Automation) */}
          <button
            onClick={() => setWaOnlyFilter(!waOnlyFilter)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              waOnlyFilter
                ? "bg-[#25D366]/15 text-[#25D366] border-[#25D366]/40 shadow-sm"
                : "border-neutral-700 bg-[#1e1e24] text-neutral-400 hover:text-white"
            }`}
            title="Afficher uniquement les paniers relancés par WhatsApp"
          >
            <Send className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Filtre « Avec notes » (Lot 19) */}
          <button
            onClick={() => setNotesOnlyFilter(!notesOnlyFilter)}
            aria-pressed={notesOnlyFilter}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              notesOnlyFilter
                ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40 shadow-sm"
                : "border-neutral-700 bg-[#1e1e24] text-neutral-400 hover:text-white"
            }`}
            title={t("cartDetails.withNotes")}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>{t("cartDetails.withNotes")}</span>
          </button>
        </div>

        {/* Table of abandoned carts */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs font-medium">Chargement des paniers abandonnés en direct...</p>
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-center mx-auto mb-4 text-neutral-500">
              <Ghost className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Aucun panier abandonné trouvé</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-5">
              {searchQuery ? "Aucun résultat ne correspond à votre recherche." : "Les clients qui commencent à saisir leur formulaire dans la boutique ou dans le tiroir panier sans cliquer sur 'Commander' apparaîtront instantanément ici."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateTestCart}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simuler un panier test</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-[#16161a]">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Client & Contact</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Articles & Destination</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Montant</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Date & Statut</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Actions de Récupération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredCarts.map((cart) => {
                  const isRecovered = cart.status === "recovered" || cart.recovered;
                  const isContacted = cart.status === "contacted" || cart.status === "relanced";
                  const isRefused = cart.status === "refused";
                  const waStatusLabel: Record<string, string> = {
                    sent: "Envoyé", delivered: "Livré", read: "Lu", replied: "Répondu", failed: "Échec"
                  };

                  return (
                    <tr key={cart.id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Client */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isRecovered ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                            isContacted ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5 group/name">
                              <span dir="auto">{cart.client || "Client sans nom"}</span>
                              {cart.client && (
                                <QuickCopyButton value={cart.client} ariaLabel={t("cartDetails.copyName")} onToast={notifyCopied} />
                              )}
                              {cart.source && (
                                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                                  {cart.source.includes("cart") ? "Panier" : "Fiche"}
                                </span>
                              )}
                              {/* Icône notes (Lot 19) : compteur + aperçu de la dernière note */}
                              {(cart.notes || []).length > 0 && (
                                <button
                                  onClick={() => setDetailsTarget({ id: cart.id, focusNotes: true })}
                                  aria-label={`${t("cartDetails.notes")} (${cart.notes!.length})`}
                                  title={`${(cart.notes || []).map((n) => n.text).find(Boolean) || ""}`.slice(0, 120)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500/20 transition-colors cursor-pointer"
                                >
                                  <StickyNote className="w-3 h-3" />
                                  {cart.notes!.length}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 group/phone">
                              <a 
                                href={`tel:${cart.phone}`} 
                                className="text-xs font-mono font-medium text-neutral-300 hover:text-amber-400 flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-neutral-500" />
                                <span dir="ltr">{cart.phone}</span>
                              </a>
                              {cart.phone && (
                                <QuickCopyButton value={cart.phone} ariaLabel={t("cartDetails.copyPhone")} onToast={notifyCopied} hoverClass="opacity-0 group-hover/phone:opacity-100 group-focus-within/phone:opacity-100" />
                              )}
                              {cart.email && (
                                <span className="text-[11px] text-neutral-500 truncate max-w-[130px]" title={cart.email}>
                                  • {cart.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Items & Wilaya */}
                      <td className="px-5 py-4">
                        <div className="text-xs text-neutral-200 font-semibold line-clamp-1 max-w-xs" title={cart.itemsSummary}>
                          {cart.itemsSummary || "Articles en attente"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1">
                          <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {cart.wilaya ? `${cart.wilaya} ${cart.commune ? `(${cart.commune})` : ""}` : "Wilaya non spécifiée"}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-white">
                          {(cart.total || 0).toLocaleString()} <span className="text-xs font-medium text-neutral-400">DZD</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">Paiement à la livraison</div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs text-neutral-300 font-semibold" title={formatDateTime(cart.createdAt || cart.date, false)}>
                          {formatRelativeTime(cart.updatedAt || cart.createdAt || cart.date)}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {formatDateTime(cart.createdAt || cart.date, false)}
                        </div>
                        <div className="mt-1">
                          {isRecovered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Récupéré
                              {cart.orderId && <span className="text-neutral-400 font-mono ml-1">({cart.orderId.substring(0, 10)})</span>}
                            </span>
                          ) : isContacted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <MessageSquare className="w-3 h-3" /> Contacté{cart.relanceCount && cart.relanceCount > 1 ? ` (${cart.relanceCount}x)` : ""}
                            </span>
                          ) : isRefused ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Refusé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Abandonné
                            </span>
                          )}
                          {/* Badge WhatsApp (extension Order Automation) */}
                          {cart.waStatus && (
                            <span className={`ms-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              cart.waStatus === "failed"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : cart.waStatus === "replied"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/25"
                            }`} title={cart.waSimulated ? "Mode simulation (Cloud API non configurée)" : "Envoyé via Meta Cloud API"}>
                              <Send className="w-3 h-3" /> {waStatusLabel[cart.waStatus] || cart.waStatus}
                              {cart.waSimulated && <span className="opacity-60">(simulé)</span>}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton Relance WhatsApp */}
                          <button
                            onClick={() => handleRelanceWhatsApp(cart)}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                            title="Ouvrir WhatsApp avec message personnalisé pré-rempli"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Bouton Convertir en Commande */}
                          {!isRecovered && (
                            <button
                              onClick={() => handleConvertToOrder(cart)}
                              disabled={convertingId === cart.id}
                              className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              title="Valider et transformer en commande officielle"
                            >
                              {convertingId === cart.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">Valider</span>
                            </button>
                          )}

                          {/* Bouton Marquer Contacté (icône téléphone) */}
                          {!isRecovered && !isContacted && (
                            <button
                              onClick={() => handleMarkContacted(cart)}
                              className="p-1.5 text-neutral-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
                              title="Marquer ce panier comme contacté"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                          )}

                          {/* Bouton Renvoyer WhatsApp (extension) */}
                          {cart.waToken && !isRecovered && !isRefused && (
                            <button
                              onClick={() => handleWaResend(cart)}
                              disabled={resendingId === cart.id}
                              className="p-1.5 text-neutral-400 hover:text-[#25D366] rounded-lg hover:bg-[#25D366]/10 transition-colors cursor-pointer disabled:opacity-50"
                              title="Renvoyer le message WhatsApp"
                            >
                              {resendingId === cart.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Bouton Historique WhatsApp (extension) */}
                          {cart.waStatus && (
                            <button
                              onClick={() => openWaHistory(cart)}
                              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Historique des messages WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Bouton Voir Détails */}
                          <button
                            onClick={() => setDetailsTarget({ id: cart.id })}
                            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Voir les détails complets"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Bouton Supprimer */}
                          <button
                            onClick={() => handleDelete(cart.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Supprimer ce panier"
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

      {/* MODAL : Détails du Panier Abandonné (Lot 19 — client, contenu, journal, notes) */}
      {selectedCart && (
        <CartDetailsModal
          cart={selectedCart}
          focusNotes={detailsTarget?.focusNotes === true}
          onClose={() => setDetailsTarget(null)}
          onConvert={handleConvertToOrder}
          onMarkContacted={handleMarkContacted}
          converting={convertingId === selectedCart.id}
          draft={noteDrafts[selectedCart.id] || ""}
          onDraftChange={(v) => setNoteDraft(selectedCart.id, v)}
          onToast={notifyCopied}
        />
      )}

      {/* Toast « Copié » (Lot 19) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* MODAL : Configuration du Template de Relance WhatsApp */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#1e1e24] shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Modèle de Relance WhatsApp</h3>
                  <p className="text-xs text-neutral-400">Personnalisez le message automatique envoyé aux clients</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-bold text-neutral-300">
                Texte du message WhatsApp :
              </label>
              <textarea
                rows={8}
                value={waTemplate}
                onChange={(e) => setWaTemplate(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-[#16161a] p-3 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono leading-relaxed"
              />

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <p className="font-bold text-neutral-300">Variables dynamiques disponibles :</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-amber-400/90 pt-1">
                  <span>{`{client}`} : Nom du client</span>
                  <span>{`{phone}`} : Téléphone</span>
                  <span>{`{product}`} : Résumé articles</span>
                  <span>{`{total}`} : Montant en DZD</span>
                  <span>{`{wilaya}`} : Wilaya de livraison</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  localStorage.removeItem("dzbuild_wa_relance_template");
                  setWaTemplate("👋 Bonjour {client},\n\nNous avons remarqué que vous avez initié une commande sur notre boutique pour :\n📦 *{product}*\n💰 Montant total : *{total} DZD* (Paiement à la livraison)\n📍 Destination : {wilaya}\n\nSouhaitez-vous que nous préparions et expédions votre colis dès aujourd'hui ?\nRépondez simplement *OUI* à ce message pour valider votre livraison.\n\nMerci de votre confiance !");
                }}
                className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("dzbuild_wa_relance_template", waTemplate);
                  setIsSettingsOpen(false);
                  alert("✅ Modèle de relance WhatsApp sauvegardé avec succès !");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md cursor-pointer"
              >
                Enregistrer le modèle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Historique des messages WhatsApp (extension) */}
      {waHistory !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#25D366]" />
                Historique WhatsApp
              </h3>
              <button onClick={() => setWaHistory(null)} className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2.5 overflow-y-auto">
              {waHistory.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-6">Aucun message pour ce panier.</p>
              )}
              {waHistory.map((m) => {
                const kind = String(m.data.kind || "");
                const isIn = m.data.direction === "in";
                const st = String(m.data.status || "");
                const stLabel: Record<string, string> = { sent: "envoyé", delivered: "livré", read: "lu", replied: "répondu", failed: "échec", received: "reçu" };
                const kindLabel: Record<string, string> = {
                  cart: "Relance panier", cart_reminder: "Rappel 4 h", order_confirm: "Confirmation commande",
                  order_status: "Statut commande", incoming: "Réponse client", merchant_todo: "À traiter"
                };
                return (
                  <div key={m.id} className={`rounded-xl border p-3 ${isIn ? "bg-emerald-500/5 border-emerald-500/20" : "bg-neutral-800/40 border-neutral-700/60"}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wide">
                        {isIn ? "← " : "→ "}{kindLabel[kind] || kind}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {String(m.data.sentAt || "").slice(0, 19).replace("T", " ")} · {stLabel[st] || st}
                        {m.data.simulated === true ? " · simulé" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed" dir={m.data.lang === "ar" ? "rtl" : "ltr"}>
                      {String(m.data.body || "")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
