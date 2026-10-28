import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../contexts/TenantContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { 
  ShoppingCart, 
  CheckCircle2, 
  Wallet, 
  TrendingUp, 
  ReceiptText, 
  Eye, 
  FileText, 
  Filter, 
  Users, 
  XCircle, 
  Clock, 
  Zap, 
  Infinity as InfinityIcon, 
  ChevronRight, 
  ChevronDown, 
  Trophy, 
  MapPin, 
  RefreshCw, 
  Calendar, 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  BarChart3,
  Rocket,
  Package
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { 
  DateRangeType, 
  DashboardStatsResult
} from "../lib/analyticsService";

export default function Dashboard() {
  const { user } = useAuth();
  const { tenantData } = useTenant();
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "rafik";

  // Date range and product filter state
  const [dateRange, setDateRange] = useState<DateRangeType>('today');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');

  // Custom date picker modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartInput, setCustomStartInput] = useState<string>(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [customEndInput, setCustomEndInput] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Data state
  const [loading, setLoading] = useState(false);

  // Hidden series on Visitors & PageViews chart
  const [hiddenSeries, setHiddenSeries] = useState<{
    visiteurs: boolean;
    pagesVues: boolean;
    commandes: boolean;
  }>({
    visiteurs: false,
    pagesVues: false,
    commandes: false
  });

  // Subscription calculation
  const planInfo = useMemo(() => {
    const planName = tenantData?.plan === "pro" || tenantData?.plan === "unlimited" ? "Plan Illimité" : "Plan Illimité";
    const isActive = tenantData?.status !== "expired" && tenantData?.subscriptionActive !== false;
    
    // Calculate expiration date
    let expiresDateStr = "2027/01/25";
    let remainingDays = 100;

    if (tenantData?.planExpiresAt) {
      try {
        const exp = new Date(tenantData.planExpiresAt);
        if (!isNaN(exp.getTime())) {
          const y = exp.getFullYear();
          const m = String(exp.getMonth() + 1).padStart(2, "0");
          const d = String(exp.getDate()).padStart(2, "0");
          expiresDateStr = `${y}/${m}/${d}`;
          const diffMs = exp.getTime() - Date.now();
          remainingDays = Math.max(0, Math.ceil(diffMs / 86400000));
        }
      } catch {}
    }

    return {
      name: planName,
      isActive,
      expiresDateStr,
      remainingDays,
      isExpiringSoon: remainingDays <= 7
    };
  }, [tenantData]);

  const [stats, setStats] = useState<DashboardStatsResult | null>(null);

  // Fetch stats from server
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          range: dateRange,
          productId: selectedProductId,
          tenantId: tenantData?.id || '',
          from: dateRange === 'custom' ? customStartInput : '',
          to: dateRange === 'custom' ? customEndInput : ''
        });
        const res = await fetch(`/api/dashboard/stats?${queryParams}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dateRange, selectedProductId, customStartInput, customEndInput, tenantData]);

  const [productOptions, setProductOptions] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?tenantId=${tenantData?.id || ''}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProductOptions(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, [tenantData]);

  // Toggle chart series
  const toggleSeries = (key: 'visiteurs' | 'pagesVues' | 'commandes') => {
    setHiddenSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!stats) return <div className="p-8 text-center text-neutral-400">Chargement des données...</div>;

  return (
    <div className="space-y-5 pb-16 text-white">
      {/* 1. TOP HEADER: Bonjour & Voir la boutique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Bonjour, {firstName} ! <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Voici le résumé des performances de votre boutique aujourd'hui
          </p>
        </div>

        <Link
          to={tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store"}
          target="_blank"
          className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95"
        >
          <Eye className="w-4 h-4" />
          <span>Voir la boutique</span>
        </Link>
      </div>

      {/* 2. BANNER 1: Plan Subscription Card */}
      <div className="bg-[#141417] border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <InfinityIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-white font-bold text-base sm:text-lg">{planInfo.name}</h2>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                planInfo.isActive 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {planInfo.isActive ? "Actif" : "Expiré"}
              </span>
            </div>
            <p className={`text-xs ${planInfo.isExpiringSoon ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}>
              Se termine le {planInfo.expiresDateStr} · {planInfo.remainingDays} jours restants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            to="/dashboard/subscription"
            className="bg-[#1c1c22] hover:bg-neutral-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-neutral-700/80 transition-colors"
          >
            Gérer l'abonnement
          </Link>
          <Link
            to="/dashboard/subscription"
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Comment renouveler ?</span>
          </Link>
        </div>
      </div>

      {/* 3. BANNER 2: Announcement / Copilot */}
      <Link 
        to="/dashboard/customize" 
        className="block bg-[#16161b] hover:bg-[#1a1a20] border border-neutral-800/80 rounded-2xl p-4 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-xs sm:text-sm truncate">
                Nouveau : Copilot dans Personnaliser, solde en temps réel et packs doublés
              </h3>
              <p className="text-neutral-400 text-xs truncate mt-0.5">
                Décrivez votre activité en une phrase, et Copilot conçoit votre boutique : coule...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#202026] text-neutral-300 border border-neutral-700 text-xs font-bold px-2 py-0.5 rounded-md">
              85
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </Link>

      {/* 4. FILTERS BAR: Analytiques avancées */}
      <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-400 text-xs font-bold shrink-0 border-r border-neutral-800 mr-1">
            <BarChart3 className="w-4 h-4 text-neutral-400" />
            <span>Analytiques avancées</span>
          </div>

          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'yesterday', label: "Hier" },
            { id: '7days', label: "7 jours" },
            { id: '30days', label: "30 jours" },
            { id: 'this_month', label: "Ce mois" },
            { id: 'last_month', label: "Mois dernier" },
            { id: 'this_year', label: "Cette année" },
            { id: 'custom', label: "Personnalisé" },
          ].map(tab => {
            const isActive = dateRange === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'custom') {
                    setShowCustomModal(true);
                  } else {
                    setDateRange(tab.id as DateRangeType);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/10"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Dropdown Filter */}
        <div className="relative shrink-0 self-end lg:self-auto min-w-[160px]">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-[#121215] border border-neutral-700/80 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">Tout</option>
            {productOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 5. 10 KPI CARDS (2 rows of 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* ROW 1 */}
        {/* Card 1: Commandes */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.commandes.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.commandes.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.commandes.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.commandes.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 2: Livrées */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.livrees.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.livrees.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.livrees.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.livrees.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 3: Revenus (hors livraison) */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.revenus.label}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white text-right my-1 truncate">{stats.kpis.revenus.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.revenus.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.revenus.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 4: Profit */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
              {stats.kpis.profit.label}
              {stats.kpis.profit.infoTooltip && (
                <span title={stats.kpis.profit.infoTooltip} className="cursor-help text-neutral-500">
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white text-right my-1 truncate">{stats.kpis.profit.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.profit.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.profit.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 5: Panier moyen */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.panierMoyen.label}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white text-right my-1 truncate">{stats.kpis.panierMoyen.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.panierMoyen.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.panierMoyen.changeFormatted}
            </span>
          </div>
        </div>

        {/* ROW 2 */}
        {/* Card 6: Visiteurs */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.visiteurs.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.visiteurs.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.visiteurs.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.visiteurs.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 7: Pages vues */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.pagesVues.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.pagesVues.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.pagesVues.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.pagesVues.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 8: Conversion */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.conversion.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.conversion.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.conversion.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.conversion.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 9: Nouveaux clients */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.nouveauxClients.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.nouveauxClients.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={stats.kpis.nouveauxClients.isPositive ? "text-emerald-400" : "text-red-400"}>
              {stats.kpis.nouveauxClients.changeFormatted}
            </span>
          </div>
        </div>

        {/* Card 10: Annulées (Inverted logic: drop is green, rise is red) */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-xs text-neutral-400 font-medium">{stats.kpis.annulees.label}</span>
          </div>
          <p className="text-2xl font-bold text-white text-right my-1">{stats.kpis.annulees.value}</p>
          <div className="text-xs font-bold text-right">
            <span className={
              stats.kpis.annulees.change === 0 
                ? "text-neutral-400" 
                : stats.kpis.annulees.change! < 0 
                ? "text-emerald-400" 
                : "text-red-400"
            }>
              {stats.kpis.annulees.changeFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* 6. CHARTS ROW: Heures de pointe des ventes & Visiteurs & Pages vues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAPH 1: Heures de pointe des ventes */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-5 sm:p-6 flex flex-col h-[360px] shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Heures de pointe des ventes</h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Les heures où vos clients achètent le plus</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Heure de pointe {stats.peakHourData.peakHourString}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Commandes
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Impressions
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.peakHourData.points} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#25252c" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#555" 
                  tick={{ fill: '#888', fontSize: 10 }}
                  interval={1}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#555" 
                  tick={{ fill: '#888', fontSize: 10 }} 
                  allowDecimals={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#555" 
                  tick={{ fill: '#888', fontSize: 10 }} 
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                {/* Commandes Bar (Left Axis) */}
                <Bar 
                  yAxisId="left"
                  dataKey="commandes" 
                  name="Commandes"
                  radius={[4, 4, 0, 0]}
                >
                  {stats.peakHourData.points.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isPeak ? "#f59e0b" : "#10b981"} 
                    />
                  ))}
                </Bar>
                {/* Impressions Bar (Right Axis) */}
                <Bar 
                  yAxisId="right"
                  dataKey="impressions" 
                  name="Impressions"
                  fill="#818cf8" 
                  opacity={0.6}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 2: Visiteurs & Pages vues */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-5 sm:p-6 flex flex-col h-[360px] shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white">Visiteurs & Pages vues</h3>
            </div>

            {/* Clickable Legend */}
            <div className="flex items-center gap-3 text-[11px] select-none">
              <button 
                type="button"
                onClick={() => toggleSeries('visiteurs')}
                className={`flex items-center gap-1.5 transition-opacity ${hiddenSeries.visiteurs ? 'opacity-30 line-through' : 'opacity-100 text-neutral-300'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Visiteurs uniques
              </button>
              <button 
                type="button"
                onClick={() => toggleSeries('pagesVues')}
                className={`flex items-center gap-1.5 transition-opacity ${hiddenSeries.pagesVues ? 'opacity-30 line-through' : 'opacity-100 text-neutral-300'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Pages vues
              </button>
              <button 
                type="button"
                onClick={() => toggleSeries('commandes')}
                className={`flex items-center gap-1.5 transition-opacity ${hiddenSeries.commandes ? 'opacity-30 line-through' : 'opacity-100 text-neutral-300'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Commandes
              </button>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={stats.visitorTrendData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradVisiteurs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradPagesVues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradCommandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#25252c" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#555" 
                  tick={{ fill: '#888', fontSize: 10 }} 
                />
                {/* Left Axis for Visiteurs and PagesVues */}
                <YAxis 
                  yAxisId="left"
                  stroke="#555" 
                  tick={{ fill: '#888', fontSize: 10 }} 
                  allowDecimals={false}
                />
                {/* Right Axis for Commandes */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#555" 
                  tick={{ fill: '#888', fontSize: 10 }} 
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />

                {!hiddenSeries.visiteurs && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="visiteurs"
                    name="Visiteurs uniques"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#gradVisiteurs)"
                    activeDot={{ r: 5 }}
                  />
                )}

                {!hiddenSeries.pagesVues && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="pagesVues"
                    name="Pages vues"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradPagesVues)"
                    activeDot={{ r: 5 }}
                  />
                )}

                {!hiddenSeries.commandes && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="commandes"
                    name="Commandes"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fill="url(#gradCommandes)"
                    activeDot={{ r: 5 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. BOTTOM ROW: 3 BLOCKS (Donut, Top produits, Top wilayas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BLOCK 1: Commandes par statut (Donut) */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full border-2 border-amber-500" />
            <h3 className="text-sm font-bold text-white">Commandes par statut</h3>
          </div>

          <div className="relative w-full h-[210px] flex items-center justify-center">
            {stats.statusData.total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData.items.filter(i => i.count > 0)}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {stats.statusData.items.filter(i => i.count > 0).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [`${value} (${item.payload.percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#333', borderRadius: '10px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">{stats.statusData.total}</span>
                  <span className="text-[10px] font-semibold text-neutral-400">Commandes</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-neutral-500">
                <div className="w-12 h-12 rounded-full border border-neutral-700/60 flex items-center justify-center mb-2">
                  <BarChart3 className="w-5 h-5 text-neutral-600" />
                </div>
                <p className="text-xs">Aucune commande sur cette période</p>
              </div>
            )}
          </div>

          {/* Status Legend Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-400">
            {stats.statusData.items.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCK 2: Top produits */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white">Top produits</h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[240px] pr-1">
            {stats.topProducts.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[10px] text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">
                    <th className="pb-2 font-bold w-5">#</th>
                    <th className="pb-2 font-bold">Produit</th>
                    <th className="pb-2 font-bold text-center">Qté</th>
                    <th className="pb-2 font-bold text-right">Revenus</th>
                    <th className="pb-2 font-bold text-right">Vues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-medium">
                  {stats.topProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="py-2.5 text-neutral-500 font-bold">{idx + 1}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-7 h-7 rounded-lg object-cover border border-neutral-700 shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-500">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="truncate max-w-[110px] text-white" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-bold text-white">{p.quantity}</td>
                      <td className="py-2.5 text-right font-bold text-neutral-200 whitespace-nowrap">
                        {p.revenue.toLocaleString()} DA
                      </td>
                      <td className="py-2.5 text-right text-neutral-400 font-mono text-[11px]">
                        {p.views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-8">
                <Package className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-xs">Aucune vente enregistrée sur cette période</p>
              </div>
            )}
          </div>
        </div>

        {/* BLOCK 3: Top wilayas (Horizontal Bars, Arabic names) */}
        <div className="bg-[#16161b] border border-neutral-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white">Top wilayas</h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[240px] pr-1" dir="rtl">
            {stats.topWilayas.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {stats.topWilayas.map((w, idx) => {
                  const maxCount = stats.topWilayas[0]?.count || 1;
                  const pct = Math.max(12, Math.round((w.count / maxCount) * 100));

                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-20 text-neutral-300 font-bold truncate text-right">
                        {w.nameAr}
                      </span>
                      <div className="flex-1 bg-neutral-900 rounded-md h-5 overflow-hidden border border-neutral-800 p-0.5 flex items-center">
                        <div 
                          className="bg-amber-500 h-full rounded text-[10px] text-black font-extrabold flex items-center justify-end px-1.5 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        >
                          {w.count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-8" dir="ltr">
                <MapPin className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-xs">Aucune commande avec wilaya sur cette période</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM DATE RANGE MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181c] border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-white">Période personnalisée</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Date de début</label>
                <input
                  type="date"
                  value={customStartInput}
                  onChange={(e) => setCustomStartInput(e.target.value)}
                  className="w-full bg-[#121215] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Date de fin</label>
                <input
                  type="date"
                  value={customEndInput}
                  onChange={(e) => setCustomEndInput(e.target.value)}
                  className="w-full bg-[#121215] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateRange('custom');
                  setShowCustomModal(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
