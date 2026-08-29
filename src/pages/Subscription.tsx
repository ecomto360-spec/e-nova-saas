import React, { useState, useEffect, useRef } from "react";
import { 
  Gem, 
  Rocket, 
  Infinity as InfinityIcon, 
  Building2, 
  Check, 
  X, 
  Gift, 
  Clock, 
  HelpCircle, 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  CreditCard, 
  ArrowLeft, 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  Loader2,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";

export type PlanType = "pro" | "unlimited" | "enterprise";
export type DurationType = "1m" | "3m" | "6m" | "1y";

interface PlanPricing {
  "1m": { total: number; monthly: number; discountBadge?: string; discountPct?: number };
  "3m": { total: number; monthly: number; discountBadge?: string; discountPct?: number };
  "6m": { total: number; monthly: number; discountBadge?: string; discountPct?: number };
  "1y": { total: number; monthly: number; discountBadge?: string; discountPct?: number; isBest?: boolean };
}

const PRICING_DATA: Record<PlanType, PlanPricing> = {
  pro: {
    "1m": { total: 1000, monthly: 1000 },
    "3m": { total: 2800, monthly: 933, discountBadge: "Économisez 7%", discountPct: 7 },
    "6m": { total: 5500, monthly: 917, discountBadge: "Économisez 8%", discountPct: 8 },
    "1y": { total: 10000, monthly: 833, discountBadge: "Meilleure offre — Économisez 17%", discountPct: 17, isBest: true }
  },
  unlimited: {
    "1m": { total: 2500, monthly: 2500 },
    "3m": { total: 7000, monthly: 2333, discountBadge: "Économisez 7%", discountPct: 7 },
    "6m": { total: 13500, monthly: 2250, discountBadge: "Économisez 8%", discountPct: 8 },
    "1y": { total: 25000, monthly: 2083, discountBadge: "Meilleure offre — Économisez 17%", discountPct: 17, isBest: true }
  },
  enterprise: {
    "1m": { total: 5500, monthly: 5500 },
    "3m": { total: 15400, monthly: 5133, discountBadge: "Économisez 7%", discountPct: 7 },
    "6m": { total: 30250, monthly: 5042, discountBadge: "Économisez 8%", discountPct: 8 },
    "1y": { total: 55000, monthly: 4583, discountBadge: "Meilleure offre — Économisez 17%", discountPct: 17, isBest: true }
  }
};

const PLAN_NAMES: Record<PlanType, string> = {
  pro: "Professionnel",
  unlimited: "Illimité",
  enterprise: "Entreprise"
};

const DURATION_LABELS: Record<DurationType, string> = {
  "1m": "1 mois",
  "3m": "3 mois",
  "6m": "6 mois",
  "1y": "1 an"
};

interface PaymentRecord {
  id: string;
  plan: string;
  planType: PlanType;
  duration: string;
  amountDA: number;
  amountUSD: number;
  paymentMethod: "card" | "cib_edahabia" | "baridimob";
  status: "completed" | "pending" | "rejected";
  receiptUrl?: string;
  receiptFileName?: string;
  createdAt: string;
  employeesCount?: number;
}

export default function Subscription() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Tenant state
  const [tenantData, setTenantData] = useState<any>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Modal flow state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");
  const [selectedDuration, setSelectedDuration] = useState<DurationType>("1m");
  const [employeeCount, setEmployeeCount] = useState<number>(25);
  
  // Step 2 payment options
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cib_edahabia" | "baridimob">("card");
  
  // BaridiMob upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copiedRip, setCopiedRip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modals for Info
  const [showHowToRenewModal, setShowHowToRenewModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [previewReceiptModal, setPreviewReceiptModal] = useState<string | null>(null);

  // Load tenant subscription info
  const fetchTenantData = async () => {
    if (!user) return;
    try {
      setLoadingTenant(true);
      const docRef = doc(db, "tenants", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTenantData(data);
      }
    } catch (error) {
      console.error("Error loading tenant subscription:", error);
    } finally {
      setLoadingTenant(false);
    }
  };

  // Load payment history
  const fetchPayments = async () => {
    if (!user) return;
    try {
      setLoadingPayments(true);
      const q = query(
        collection(db, "payments"),
        where("tenantId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: PaymentRecord[] = [];
      querySnapshot.forEach((d) => {
        const item = d.data();
        list.push({
          id: d.id,
          plan: item.plan || "Professionnel",
          planType: item.planType || "pro",
          duration: item.duration || "1 mois",
          amountDA: item.amountDA || 0,
          amountUSD: item.amountUSD || 0,
          paymentMethod: item.paymentMethod || "card",
          status: item.status || "completed",
          receiptUrl: item.receiptUrl,
          receiptFileName: item.receiptFileName,
          createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : item.createdAt || new Date().toISOString(),
          employeesCount: item.employeesCount
        });
      });
      // Sort desc by createdAt
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(list);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
    fetchPayments();
  }, [user]);

  // Pricing calculations
  const calculateTotalDA = (plan: PlanType, duration: DurationType, employees: number) => {
    let basePrice = PRICING_DATA[plan][duration].total;
    if (plan === "enterprise" && employees > 25) {
      const extraEmployees = employees - 25;
      const monthsMultiplier = duration === "1m" ? 1 : duration === "3m" ? 3 : duration === "6m" ? 6 : 12;
      basePrice += extraEmployees * 200 * monthsMultiplier;
    }
    if (appliedDiscount) {
      basePrice = Math.round(basePrice * (1 - appliedDiscount.percent / 100));
    }
    return basePrice;
  };

  const totalDA = calculateTotalDA(selectedPlan, selectedDuration, employeeCount);
  // Exchange rate: 1 USD ~ 214 DZD
  const totalUSD = (totalDA / 214).toFixed(2);

  const handleApplyPromo = () => {
    setPromoError("");
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === "DZBUILD" || clean === "PROMO10" || clean === "WELCOME10") {
      setAppliedDiscount({ code: clean, percent: 10 });
    } else if (clean === "VIP20" || clean === "RAMADAN20") {
      setAppliedDiscount({ code: clean, percent: 20 });
    } else if (clean === "SUPER50") {
      setAppliedDiscount({ code: clean, percent: 50 });
    } else {
      setPromoError("Code promo invalide ou expiré.");
    }
  };

  const handleCopyRip = () => {
    navigator.clipboard.writeText("00799999002871122994");
    setCopiedRip(true);
    setTimeout(() => setCopiedRip(false), 2500);
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModalForPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setModalStep(1);
    setIsModalOpen(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Submit payment & upgrade subscription
  const handleConfirmPayment = async () => {
    if (!user) return;
    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const isInstant = paymentMethod === "card" || paymentMethod === "cib_edahabia";
      const status = isInstant ? "completed" : "pending";

      // Calculate expiration date
      const now = new Date();
      let expiresAt = new Date();
      if (selectedDuration === "1m") expiresAt.setMonth(now.getMonth() + 1);
      else if (selectedDuration === "3m") expiresAt.setMonth(now.getMonth() + 3);
      else if (selectedDuration === "6m") expiresAt.setMonth(now.getMonth() + 6);
      else if (selectedDuration === "1y") expiresAt.setFullYear(now.getFullYear() + 1);

      // 1. Create Payment record in Firestore
      const paymentData = {
        tenantId: user.uid,
        tenantEmail: user.email || "",
        storeName: tenantData?.storeName || "Ma Boutique",
        plan: PLAN_NAMES[selectedPlan],
        planType: selectedPlan,
        duration: DURATION_LABELS[selectedDuration],
        durationCode: selectedDuration,
        amountDA: totalDA,
        amountUSD: parseFloat(totalUSD),
        paymentMethod: paymentMethod,
        status: status,
        receiptUrl: receiptPreview || null,
        receiptFileName: receiptFile?.name || null,
        ...(selectedPlan === "enterprise" && { employeesCount: employeeCount }),
        promoCodeApplied: appliedDiscount?.code || null,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "payments"), paymentData);

      // 2. If instant, update the Tenant status & plan directly
      if (isInstant) {
        const tenantRef = doc(db, "tenants", user.uid);
        await updateDoc(tenantRef, {
          plan: selectedPlan,
          planName: PLAN_NAMES[selectedPlan],
          planExpiresAt: expiresAt.toISOString(),
          status: "active",
          employeesCount: selectedPlan === "enterprise" ? employeeCount : 1,
          updatedAt: new Date().toISOString()
        });
        setSuccessMessage(`Félicitations ! Votre abonnement ${PLAN_NAMES[selectedPlan]} a été activé avec succès.`);
      } else {
        setSuccessMessage("Votre reçu BaridiMob a été envoyé avec succès ! Votre abonnement sera activé dès validation par notre équipe (en moins d'une heure).");
      }

      // Re-fetch
      await fetchTenantData();
      await fetchPayments();

      setTimeout(() => {
        setIsModalOpen(false);
      }, 2500);

    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMessage("Une erreur est survenue lors de l'enregistrement de votre paiement. Veuillez réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Expiration badge math
  const currentPlan = tenantData?.plan || "pro";
  const currentPlanName = PLAN_NAMES[currentPlan as PlanType] || "Professionnel";
  const isTrial = !tenantData?.planExpiresAt || tenantData?.plan === "pro";
  
  // Calculate trial or subscription expiration string
  let expirationDateStr = "2026/08/25 (2 jours)";
  if (tenantData?.planExpiresAt) {
    try {
      const exp = new Date(tenantData.planExpiresAt);
      const diffTime = exp.getTime() - new Date().getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const year = exp.getFullYear();
      const month = String(exp.getMonth() + 1).padStart(2, '0');
      const day = String(exp.getDate()).padStart(2, '0');
      expirationDateStr = `${year}/${month}/${day} (${diffDays} jours)`;
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <Gem className="w-7 h-7 text-yellow-500" />
          Mettre à niveau
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-400">
          Choisissez le plan adapté à votre boutique —— Les meilleurs prix et des outils illimités pour le succès de votre entreprise 🚀
        </p>
      </div>

      {/* Free Trial / Active Plan Banner */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white text-base">
                {isTrial ? "Essai gratuit (PRO)" : `Abonnement Actif (${currentPlanName})`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-blue-200/80 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 shrink-0 text-blue-400" />
              {isTrial 
                ? `L'essai gratuit expire le ${expirationDateStr} - Abonnez-vous maintenant !` 
                : `Votre abonnement expire le ${expirationDateStr}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHowToRenewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors whitespace-nowrap"
        >
          <HelpCircle className="w-4 h-4" />
          Comment renouveler ?
        </button>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* 1. PROFESSIONNEL */}
        <div className="relative rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] p-6 sm:p-7 flex flex-col justify-between shadow-sm transition-all hover:border-neutral-700">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <Rocket className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Professionnel</h3>
              </div>
              {currentPlan === "pro" && (
                <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  Votre plan actuel
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">1,000</span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-medium">DA/mois</span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm border-t border-gray-100 dark:border-neutral-800/80 pt-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Jusqu'à 300 produits</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Commandes illimitées ∞</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>3 pages de destination</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>1 pixel par plateforme — Meta, TikTok, Google, Pinterest, Snapchat</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>1 membre d'équipe</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Domaine personnalisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Récupération des paniers abandonnés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Intégration avancée des transporteurs</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>6 Google Sheets avancés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Quelques extensions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Personnalisation avancée</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Support prioritaire 24/7</span>
              </div>

              {/* Excluded features */}
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans multi-langue</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Suppression du logo DZBuild</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>CRM non inclus</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>API standard</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans SLA</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans développement sur mesure</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans design exclusif</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenModalForPlan("pro")}
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-yellow-500 hover:bg-yellow-400 text-neutral-950 transition-all shadow-md active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Renouveler l'abonnement
          </button>
        </div>

        {/* 2. ILLIMITÉ (Most Popular) */}
        <div className="relative rounded-2xl border-2 border-yellow-500 bg-white dark:bg-[#1e1e24] p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-yellow-500/5 transition-all">
          {/* Popular Tag */}
          <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full shadow-md">
            + plus populaire
          </div>

          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <InfinityIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Illimité</h3>
            </div>

            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">2,500</span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-medium">DA/mois</span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm border-t border-gray-100 dark:border-neutral-800/80 pt-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Produits illimités ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Commandes illimitées ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Pages de destination illimitées ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Pixels illimités — Meta, TikTok, Google, Pinterest, Snapchat ∞</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>3 membres d'équipe</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Domaine personnalisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Récupération des paniers abandonnés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Intégration avancée des transporteurs</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>10 Google Sheets avancés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>La plupart des extensions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Personnalisation complète</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Support prioritaire 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Boutique multi-langue</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Supprimer la marque DZBuild</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>CRM avancé inclus</span>
              </div>

              {/* Excluded */}
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>API standard</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans SLA</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans développement sur mesure</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
                <X className="w-4 h-4 shrink-0 text-red-500/70" />
                <span>Sans design exclusif</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenModalForPlan("unlimited")}
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 transition-all shadow-lg active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Passer à l'Illimité
          </button>
        </div>

        {/* 3. ENTREPRISE */}
        <div className="relative rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] p-6 sm:p-7 flex flex-col justify-between shadow-sm transition-all hover:border-neutral-700">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Building2 className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Entreprise</h3>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">5,500</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-medium">DA/mois</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Base : 25 employés inclus</p>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm border-t border-gray-100 dark:border-neutral-800/80 pt-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Produits illimités ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Commandes illimitées ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Pages de destination illimitées ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Pixels illimités — Meta, TikTok, Google, Pinterest, Snapchat ∞</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>25 employés inclus <span className="text-gray-500 dark:text-neutral-400 font-normal">(+200 DA / employé sup.)</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Domaine personnalisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Récupération des paniers abandonnés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Intégration avancée des transporteurs</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>30 Google Sheets avancés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Toutes les extensions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Personnalisation exclusive</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Support technique direct 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Boutique multi-langue</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Supprimer la marque DZBuild</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>CRM avancé inclus</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Accès API avancé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>SLA 99.9% garanti</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Développement de fonctionnalités personnalisées</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Design exclusif de la boutique</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenModalForPlan("enterprise")}
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-yellow-500 hover:bg-yellow-400 text-neutral-950 transition-all shadow-md active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Passer à Entreprise
          </button>
        </div>
      </div>

      {/* Need Help Box */}
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎧</span> Besoin d'aide ?
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400">
            Si vous rencontrez un problème ou avez une question concernant l'abonnement, contactez-nous directement :
          </p>
        </div>
        <button
          onClick={() => setShowSupportModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-yellow-500" />
          Discuter avec nous
        </button>
      </div>

      {/* Payment History Section */}
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📋</span> Historique des paiements
          </h3>
          <button 
            onClick={fetchPayments}
            className="text-xs text-yellow-500 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
        </div>

        {loadingPayments ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-neutral-400 flex items-center justify-center gap-2">
              <span>📭</span> Aucun paiement pour le moment. Vos paiements apparaîtront ici après votre première opération.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-neutral-800/60 text-gray-500 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Durée</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Moyen</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 rounded-r-lg">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/80">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 text-gray-600 dark:text-neutral-300 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {p.plan}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
                      {p.duration}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {p.amountDA.toLocaleString()} DA
                    </td>
                    <td className="px-4 py-3 text-xs uppercase font-semibold text-gray-500 dark:text-neutral-400">
                      {p.paymentMethod === "card" ? "Carte / PayPal" : p.paymentMethod === "cib_edahabia" ? "CIB / Edahabia" : "BaridiMob"}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Actif
                        </span>
                      ) : p.status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          <Clock className="w-3.5 h-3.5" /> En attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                          <X className="w-3.5 h-3.5" /> Rejeté
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.receiptUrl ? (
                        <button
                          onClick={() => setPreviewReceiptModal(p.receiptUrl || null)}
                          className="inline-flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir
                        </button>
                      ) : (
                        <span className="text-neutral-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
        <button
          onClick={() => handleOpenModalForPlan(currentPlan === "unlimited" ? "unlimited" : currentPlan === "enterprise" ? "enterprise" : "pro")}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm sm:text-base bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 shadow-2xl hover:scale-105 transition-all active:scale-95"
        >
          <Gem className="w-5 h-5 fill-current" />
          Activer ma boutique
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CHECKOUT MODAL (MULTI-STEP) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-[560px] bg-[#1a1a20] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto max-h-[92vh] flex flex-col justify-between">
            
            {/* Modal Header & Steps Progress Bar */}
            <div>
              {/* Step indicator bar */}
              <div className="flex gap-2 mb-6">
                <div className={`h-1 flex-1 rounded-full ${modalStep === 1 ? 'bg-yellow-500' : 'bg-yellow-500'}`} />
                <div className={`h-1 flex-1 rounded-full ${modalStep === 2 ? 'bg-yellow-500' : 'bg-neutral-800'}`} />
              </div>

              {/* Title row */}
              <div className="flex items-center justify-between mb-6">
                {modalStep === 2 ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModalStep(1)}
                      className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">Récapitulatif</h2>
                  </div>
                ) : (
                  <h2 className="text-xl font-bold">Choisissez la durée</h2>
                )}

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error / Success Notifications */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* STEP 1: DURATION SELECTION */}
              {modalStep === 1 && (
                <div className="space-y-6">
                  {/* Plan Switcher Tabs */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-[#141418] rounded-2xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("pro")}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                        selectedPlan === "pro"
                          ? "bg-[#1e1e24] text-yellow-500 border border-yellow-500/40 shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Rocket className="w-4 h-4 shrink-0" />
                      <span>Professionnel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan("unlimited")}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                        selectedPlan === "unlimited"
                          ? "bg-[#1e1e24] text-yellow-500 border border-yellow-500/40 shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <InfinityIcon className="w-4 h-4 shrink-0" />
                      <span>Illimité</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan("enterprise")}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                        selectedPlan === "enterprise"
                          ? "bg-[#1e1e24] text-yellow-500 border border-yellow-500/40 shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Entreprise</span>
                    </button>
                  </div>

                  {/* Duration Options Cards Grid (2x2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(["1m", "3m", "6m", "1y"] as DurationType[]).map((durKey) => {
                      const durInfo = PRICING_DATA[selectedPlan][durKey];
                      const isSelected = selectedDuration === durKey;

                      return (
                        <div
                          key={durKey}
                          onClick={() => setSelectedDuration(durKey)}
                          className={`relative cursor-pointer rounded-2xl p-4 transition-all border ${
                            isSelected
                              ? "bg-[#1f2824] border-yellow-500 ring-1 ring-yellow-500/50"
                              : "bg-[#15151a] border-neutral-800 hover:border-neutral-700"
                          }`}
                        >
                          {/* Discount Badge */}
                          {durInfo.discountBadge && (
                            <span
                              className={`absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full shadow ${
                                durInfo.isBest
                                  ? "bg-emerald-500 text-black"
                                  : "bg-orange-500 text-white"
                              }`}
                            >
                              {durInfo.discountBadge}
                            </span>
                          )}

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">
                              {DURATION_LABELS[durKey]}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? "border-yellow-500 bg-yellow-500 text-black"
                                  : "border-neutral-700"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-white">
                              {durInfo.total.toLocaleString()}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium">DA</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {durInfo.monthly.toLocaleString()} DA /mois
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Enterprise Employees Slider */}
                  {selectedPlan === "enterprise" && (
                    <div className="p-4 rounded-2xl bg-[#141418] border border-neutral-800 space-y-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-300">
                          Nombre d'employés: <span className="text-yellow-500">{employeeCount}</span>
                        </span>
                        <span className="text-neutral-500">
                          {employeeCount === 25 ? "Inclus dans la base" : `+${(employeeCount - 25) * 200} DA/mois`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="100"
                        step="5"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
                        className="w-full accent-yellow-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SUMMARY & PAYMENT METHOD */}
              {modalStep === 2 && (
                <div className="space-y-5 overflow-y-auto max-h-[60vh] pr-1">
                  {/* Summary Box */}
                  <div className="rounded-2xl bg-[#141418] border border-neutral-800 p-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Plan</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{PLAN_NAMES[selectedPlan]}</span>
                        <button 
                          onClick={() => setModalStep(1)}
                          className="px-2 py-0.5 rounded-md bg-neutral-800 text-[11px] text-neutral-400 hover:text-white"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Durée</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{DURATION_LABELS[selectedDuration]}</span>
                        <button 
                          onClick={() => setModalStep(1)}
                          className="px-2 py-0.5 rounded-md bg-neutral-800 text-[11px] text-neutral-400 hover:text-white"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>

                    {selectedPlan === "enterprise" && (
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Employés</span>
                        <span className="font-bold text-white">{employeeCount}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                      <span className="font-medium text-neutral-400">Total</span>
                      <div className="text-right">
                        <span className="text-lg sm:text-xl font-extrabold text-yellow-500">
                          {totalDA.toLocaleString()} DA
                        </span>
                        <span className="text-xs text-neutral-400 ml-1.5">
                          (≈ ${totalUSD})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Entrez un code promo (optionnel)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-[#141418] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs sm:text-sm font-semibold text-white transition-colors"
                    >
                      Appliquer
                    </button>
                  </div>
                  {appliedDiscount && (
                    <p className="text-xs text-emerald-400 font-medium">
                      Code promo {appliedDiscount.code} appliqué (-{appliedDiscount.percent}%) !
                    </p>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-400">{promoError}</p>
                  )}

                  {/* Payment Methods */}
                  <div className="space-y-3 pt-2">
                    {/* Option 1: Card / PayPal / Apple Pay */}
                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                        paymentMethod === "card"
                          ? "bg-[#18231c] border-yellow-500/80 ring-1 ring-yellow-500/40"
                          : "bg-[#141418] border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
                            <span className="text-xs font-bold text-blue-400">VISA</span>
                            <span className="text-xs font-bold text-orange-400">MC</span>
                            <span className="text-xs font-bold text-sky-300">PayPal</span>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-white">
                              Visa / Mastercard / PayPal / Apple Pay
                            </p>
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              ⚡ Activation instantanée
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            paymentMethod === "card"
                              ? "border-yellow-500 bg-yellow-500 text-black"
                              : "border-neutral-700"
                          }`}
                        >
                          {paymentMethod === "card" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {paymentMethod === "card" && (
                        <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-3">
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                            <span>
                              Paiement 100% sécurisé — Visa, Mastercard, PayPal ou Apple Pay. Votre abonnement est activé automatiquement dès la confirmation du paiement.
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-neutral-300">
                            <span>Le débit sera effectué en dollars US</span>
                            <span className="font-bold text-white text-sm">${totalUSD}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-neutral-500" />
                            Vous pouvez annuler votre abonnement à tout moment
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Option 2: CIB / EDAHABIA */}
                    <div
                      onClick={() => setPaymentMethod("cib_edahabia")}
                      className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                        paymentMethod === "cib_edahabia"
                          ? "bg-[#18231c] border-yellow-500/80 ring-1 ring-yellow-500/40"
                          : "bg-[#141418] border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 font-extrabold text-xs px-2 py-1 rounded-lg border border-yellow-500/30">
                            💳 CIB / EDAHABIA
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-white">
                              CIB / EDAHABIA
                            </p>
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              ⚡ Activation instantanée
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            paymentMethod === "cib_edahabia"
                              ? "border-yellow-500 bg-yellow-500 text-black"
                              : "border-neutral-700"
                          }`}
                        >
                          {paymentMethod === "cib_edahabia" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {paymentMethod === "cib_edahabia" && (
                        <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-3">
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                            <span>
                              Paiement 100% sécurisé — carte EDAHABIA ou CIB. Votre abonnement est activé automatiquement dès la confirmation du paiement.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Option 3: BaridiMob */}
                    <div
                      onClick={() => setPaymentMethod("baridimob")}
                      className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                        paymentMethod === "baridimob"
                          ? "bg-[#18231c] border-yellow-500/80 ring-1 ring-yellow-500/40"
                          : "bg-[#141418] border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-yellow-500 text-black font-extrabold text-xs px-2 py-1 rounded-lg">
                            BaridiMob
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-white">BaridiMob</p>
                            <p className="text-[11px] text-neutral-400">
                              Virement + reçu — approbation en moins d'une heure
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            paymentMethod === "baridimob"
                              ? "border-yellow-500 bg-yellow-500 text-black"
                              : "border-neutral-700"
                          }`}
                        >
                          {paymentMethod === "baridimob" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {paymentMethod === "baridimob" && (
                        <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-3">
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                            <span>
                              Transférez le montant vers le compte ci-dessous puis envoyez le reçu — activation après vérification (généralement moins d'une heure).
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f0f13] border border-neutral-800">
                            <div>
                              <p className="text-[11px] text-neutral-400">RIP BaridiMob</p>
                              <p className="text-xs sm:text-sm font-mono font-bold text-white">
                                00799999002871122994
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyRip();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1"
                            >
                              {copiedRip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedRip ? "Copié !" : "Copier"}
                            </button>
                          </div>

                          {/* Upload Receipt Area */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-emerald-500/5 hover:bg-emerald-500/10"
                          >
                            {receiptPreview ? (
                              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                                <CheckCircle className="w-4 h-4" />
                                <span>Reçu sélectionné : {receiptFile?.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400">
                                <UploadCloud className="w-4 h-4" />
                                <span>Envoyer le reçu</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom CTA */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              {modalStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setModalStep(2)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                >
                  <Gem className="w-4 h-4" />
                  Suivant {totalDA.toLocaleString()} DA
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing || (paymentMethod === "baridimob" && !receiptPreview)}
                  onClick={handleConfirmPayment}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Gem className="w-4 h-4" />
                      {paymentMethod === "card"
                        ? `Payer maintenant $${totalUSD}`
                        : paymentMethod === "cib_edahabia"
                        ? `Payer maintenant ${totalDA.toLocaleString()} DA`
                        : "Envoyer le reçu"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HOW TO RENEW MODAL */}
      {showHowToRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#1e1e24] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-500" />
                Comment renouveler votre abonnement ?
              </h3>
              <button 
                onClick={() => setShowHowToRenewModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-black text-xs font-bold">1</span>
                <p>Sélectionnez le plan désiré (Professionnel, Illimité ou Entreprise) et la durée (1 mois, 3 mois, 6 mois ou 1 an).</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-black text-xs font-bold">2</span>
                <p>Choisissez votre mode de paiement : Carte bancaire / PayPal (instantané), CIB / Edahabia (instantané) ou Virement BaridiMob.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-black text-xs font-bold">3</span>
                <p>Si vous choisissez BaridiMob, effectuez le transfert vers notre RIP, joignez la capture de votre reçu et cliquez sur "Envoyer le reçu". L'activation est effectuée en moins d'une heure.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowHowToRenewModal(false);
                handleOpenModalForPlan("unlimited");
              }}
              className="w-full mt-4 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold text-sm transition-all"
            >
              Mettre à niveau maintenant
            </button>
          </div>
        </div>
      )}

      {/* SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1e1e24] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Support & Assistance</h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Notre équipe d'assistance est disponible 24/7 pour vous aider avec votre abonnement ou toute question relative à votre boutique.
            </p>
            <div className="p-4 rounded-xl bg-[#141418] border border-neutral-800 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Email:</span>
                <span className="font-semibold text-white">support@dzbuild.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">WhatsApp / Tél:</span>
                <span className="font-semibold text-yellow-500">+213 555 12 34 56</span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="https://api.whatsapp.com/send?phone=213555123456&text=Bonjour%20Support%20DZBuild"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                WhatsApp Direct
              </a>
              <button
                onClick={() => setShowSupportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {previewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-lg w-full bg-[#1e1e24] border border-neutral-800 rounded-3xl p-4">
            <button
              onClick={() => setPreviewReceiptModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-semibold mb-3 text-neutral-300">Reçu de paiement BaridiMob</h4>
            <div className="max-h-[70vh] overflow-auto rounded-xl flex items-center justify-center bg-black/40">
              <img src={previewReceiptModal} alt="Reçu BaridiMob" className="max-w-full h-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
