import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../contexts/TenantContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Rocket, AlertTriangle, RefreshCw, HelpCircle, Sparkles, ChevronRight, ShoppingCart, CheckCircle, Wallet, TrendingUp, ReceiptText, Eye, LineChart as LineChartIcon, Filter, Users, XCircle, Package as PackageIcon, PieChart, MapPin, Clock, Lock, Copy, Plus, ListTodo, Share2, ChevronDown, ChevronUp, Store } from "lucide-react";
import {
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval, subMonths, subYears
} from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'this_year';

const parseOrderDate = (order: any) => {
  const timestamp = order.created_at || order.createdAt;
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (order.date && typeof order.date === 'string') {
    // try to parse ISO string first
    if (order.date.includes('T')) {
      return new Date(order.date);
    }
    const [datePart, timePart] = order.date.split(' ');
    if (datePart && timePart) {
      const [d, m, y] = datePart.split('/');
      const [h, min] = timePart.split(':');
      if (d && m && y && h && min) {
        return new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min));
      }
    }
  }
  return new Date();
};

const getRangeInterval = (range: DateRange) => {
  const now = new Date();
  switch (range) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case '7days': return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case '30days': return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case 'this_year': return { start: startOfYear(now), end: endOfYear(now) };
    default: return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
  }
};

const getPreviousRangeInterval = (range: DateRange) => {
  const now = new Date();
  switch (range) {
    case 'today': {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case 'yesterday': {
      const prevDay = subDays(now, 2);
      return { start: startOfDay(prevDay), end: endOfDay(prevDay) };
    }
    case '7days': return { start: startOfDay(subDays(now, 13)), end: endOfDay(subDays(now, 7)) };
    case '30days': return { start: startOfDay(subDays(now, 59)), end: endOfDay(subDays(now, 30)) };
    case 'this_month': {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case 'last_month': {
      const prevMonth = subMonths(now, 2);
      return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
    }
    case 'this_year': {
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    }
    default: return { start: startOfDay(subDays(now, 13)), end: endOfDay(subDays(now, 7)) };
  }
};

export default function Dashboard() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const { tenantData, isTrialExpired } = useTenant();
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Utilisateur";

  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const qGlobal = query(collection(db, "orders"), where("userId", "==", user.uid));
        const snapGlobal = await getDocs(qGlobal);
        const ordersGlobal = snapGlobal.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const qTenant = query(collection(db, "tenants", user.uid, "orders"));
        const snapTenant = await getDocs(qTenant);
        const ordersTenant = snapTenant.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allOrders = Array.from(new Map([...ordersGlobal, ...ordersTenant].map(item => [item.id, item])).values());
        
        // Setup local storage visit mock based on actual orders found so it isn't 0
        const storedVisits = localStorage.getItem('store_visits');
        if (!storedVisits || parseInt(storedVisits) < allOrders.length) {
          localStorage.setItem('store_visits', Math.max(12, allOrders.length * 3).toString());
        }
        
        setOrders(allOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  const stats = useMemo(() => {
    const currentInterval = getRangeInterval(dateRange);
    const prevInterval = getPreviousRangeInterval(dateRange);

    const currentOrders = orders.filter(o => {
      try {
        const d = parseOrderDate(o);
        return d >= currentInterval.start && d <= currentInterval.end;
      } catch (e) {
        return false;
      }
    });
    
    const prevOrders = orders.filter(o => {
      try {
        const d = parseOrderDate(o);
        return d >= prevInterval.start && d <= prevInterval.end;
      } catch (e) {
        return false;
      }
    });

    const calculateMetrics = (orderList: any[]) => {
      const totalOrders = orderList.length;
      const delivered = orderList.filter(o => o.status === "Livrée").length;
      const cancelled = orderList.filter(o => o.status === "Annulée").length;
      const validOrders = orderList.filter(o => !["Annulée", "Échouée", "Retournée"].includes(o.status));
      const revenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const avgBasket = validOrders.length > 0 ? revenue / validOrders.length : 0;
      return { totalOrders, delivered, cancelled, revenue, avgBasket };
    };

    const current = calculateMetrics(currentOrders);
    const prev = calculateMetrics(prevOrders);

    const getChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      changes: {
        totalOrders: getChange(current.totalOrders, prev.totalOrders),
        delivered: getChange(current.delivered, prev.delivered),
        cancelled: getChange(current.cancelled, prev.cancelled),
        revenue: getChange(current.revenue, prev.revenue),
        avgBasket: getChange(current.avgBasket, prev.avgBasket),
      },
      currentOrders
    };
  }, [orders, dateRange]);

  const renderChange = (change: number, reverseColors = false) => {
    if (change === 0) return <span className="text-neutral-500">0%</span>;
    if (change > 0) {
      return <span className={reverseColors ? "text-red-500" : "text-emerald-500"}>+{change.toFixed(1)}%</span>;
    }
    return <span className={reverseColors ? "text-emerald-500" : "text-red-500"}>{change.toFixed(1)}%</span>;
  };

  // Generate chart data based on date range
  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const salesMap: Record<string, number> = {};
    
    stats.currentOrders.forEach(o => {
      const d = parseOrderDate(o);
      let key = "";
      if (dateRange === 'today' || dateRange === 'yesterday') {
        key = `${d.getHours()}:00`;
      } else {
        key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}`;
      }
      
      dataMap[key] = (dataMap[key] || 0) + 1;
      
      if (!["Annulée", "Échouée", "Retournée"].includes(o.status)) {
        salesMap[key] = (salesMap[key] || 0) + (Number(o.total) || 0);
      }
    });

    return Object.keys(dataMap).sort().map(k => ({
      name: k,
      commandes: dataMap[k],
      revenus: salesMap[k] || 0
    }));
  }, [stats.currentOrders, dateRange]);

    const advancedStats = useMemo(() => {
    const statusCounts = {};
    const productsCounts = {};
    const wilayasCounts = {};

    stats.currentOrders.forEach(o => {
      // Status
      statusCounts[o.status || 'Nouveau'] = (statusCounts[o.status || 'Nouveau'] || 0) + 1;
      
      // Wilaya
      const wilaya = o.wilaya || (o.shippingAddress && o.shippingAddress.wilaya);
      if (wilaya) {
        wilayasCounts[wilaya] = (wilayasCounts[wilaya] || 0) + 1;
      }

      // Products
      if (Array.isArray(o.items)) {
         o.items.forEach((item) => {
            const name = item.name || item.productName || 'Produit inconnu';
            productsCounts[name] = (productsCounts[name] || 0) + (item.quantity || 1);
         });
      }
    });

    const topStatuses = Object.entries(statusCounts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 4);
    const topProducts = Object.entries(productsCounts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 4);
    const topWilayas = Object.entries(wilayasCounts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 4);
    
    const recentOrders = [...stats.currentOrders].sort((a, b) => parseOrderDate(b).getTime() - parseOrderDate(a).getTime()).slice(0, 5);

    return { topStatuses, topProducts, topWilayas, recentOrders };
  }, [stats.currentOrders]);

  const kpis = [
    { label: t("dashboard.orders"), value: stats.current.totalOrders, change: stats.changes.totalOrders, icon: ShoppingCart },
    { label: t("dashboard.delivered"), value: stats.current.delivered, change: stats.changes.delivered, icon: CheckCircle },
    { label: t("dashboard.revenue"), value: `${stats.current.revenue.toLocaleString()} DA`, change: stats.changes.revenue, icon: Wallet },
    { label: t("dashboard.avgCart"), value: `${Math.round(stats.current.avgBasket).toLocaleString()} DA`, change: stats.changes.avgBasket, icon: ReceiptText },
    { label: t("dashboard.canceled"), value: stats.current.cancelled, change: stats.changes.cancelled, icon: XCircle, reverseColors: true },
    { label: t("dashboard.visitors"), value: "0", change: 0, icon: Eye },
    { label: t("dashboard.pageViews"), value: "0", change: 0, icon: LineChartIcon },
    { label: t("dashboard.conversion"), value: "0.0%", change: 0, icon: Filter },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            Bonjour, {firstName} ! <span className="text-yellow-500">👋</span>
          </h1>
          <p className="text-sm text-neutral-400">Voici le résumé des performances de votre boutique {dateRange === 'today' ? "aujourd'hui" : "pour la période sélectionnée"}</p>
        </div>
        {isTrialExpired ? (
          <button 
            disabled
            className="bg-neutral-800 text-neutral-500 font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Voir la boutique
          </button>
        ) : (
          <Link 
            to={tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store"}
            target="_blank"
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Voir la boutique
          </Link>
        )}
      </div>

      {isTrialExpired && (
        <div className="bg-[#1e1e24] border border-red-900/50 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-white font-semibold text-lg">Essai gratuit</h2>
                <span className="bg-red-500/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded uppercase">Expiré</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-neutral-400 flex items-center gap-1.5"><PackageIcon className="w-4 h-4" /> 300 produits</span>
                <span className="text-red-500 flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5" /> Abonnement expiré - Renouvelez maintenant
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              to="/dashboard/subscription"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Renouveler l'abonnement
            </Link>
            <Link to="/dashboard/subscription" className="text-neutral-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              <HelpCircle className="w-4 h-4" />
              Comment renouveler ?
            </Link>
          </div>
        </div>
      )}

      {/* Copilot Banner */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              Une nouvelle ère pour le e-commerce en Algérie avec E-Nova Copilot 
              <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded">73</span>
            </h3>
            <p className="text-sm text-neutral-400">Écrivez à Copilot en arabe ou en français, il fait le travail à votre place : il...</p>
          </div>
        </div>
        <ChevronRight className="text-neutral-500 w-5 h-5" />
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 overflow-x-auto pb-2 xl:pb-0">
        <div className="flex items-center gap-1 bg-[#1e1e24] border border-neutral-800 rounded-lg p-1 text-sm font-medium whitespace-nowrap min-w-max">
          <span className="px-3 text-neutral-400 flex items-center gap-2 border-r border-neutral-700 mr-1"><LineChartIcon className="w-4 h-4"/> Analytiques avancées</span>
          
          <button onClick={() => setDateRange('today')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === 'today' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>{t("dashboard.ranges.today")}</button>
          <button onClick={() => setDateRange('yesterday')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === 'yesterday' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>{t("dashboard.ranges.yesterday")}</button>
          <button onClick={() => setDateRange('7days')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === '7days' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>7 jours</button>
          <button onClick={() => setDateRange('30days')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === '30days' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>30 jours</button>
          <button onClick={() => setDateRange('this_month')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === 'this_month' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>{t("dashboard.ranges.thisMonth")}</button>
          <button onClick={() => setDateRange('last_month')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === 'last_month' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>{t("dashboard.ranges.lastMonth")}</button>
          <button onClick={() => setDateRange('this_year')} className={`px-3 py-1.5 rounded-md transition-colors ${dateRange === 'this_year' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}>{t("dashboard.ranges.thisYear")}</button>
        </div>
      </div>

      {/* KPI Grid */}
      {loadingOrders ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <kpi.icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-neutral-400 text-right">{kpi.label}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-white">{kpi.value}</p>
              </div>
              <div className="mt-4 text-xs text-right">
                {renderChange(kpi.change, kpi.reverseColors)} vs période préc.
              </div>
            </div>
          ))}
        </div>
      )}

            {/* Charts Area */}
      {!loadingOrders && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1 */}
            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 h-80 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-semibold text-neutral-400">{t("dashboard.chartTitle")}</h3>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Commandes</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> Impressions</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="commandes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCommandes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                     <p className="text-sm text-neutral-400">Aucune donnée pour cette période</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2 */}
            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 h-80 flex flex-col">
              <div className="flex justify-end items-start mb-6">
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Visiteurs uniques</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Pages vues</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> Commandes</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} width={40} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="revenus" stroke="#eab308" strokeWidth={3} dot={{r:4, fill: '#eab308', strokeWidth:0}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-neutral-400">Aucune donnée pour cette période</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Three Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <PieChart className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">{t("dashboard.ordersByStatus")}</h3>
              </div>
              <div className="flex-1 flex flex-col">
                {advancedStats.topStatuses.length > 0 ? (
                  <div className="space-y-4">
                    {advancedStats.topStatuses.map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300">{status}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-400">Aucune commande dans cette période</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <PackageIcon className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">{t("dashboard.topProducts")}</h3>
              </div>
              <div className="flex-1 flex flex-col">
                {advancedStats.topProducts.length > 0 ? (
                   <div className="space-y-4">
                    {advancedStats.topProducts.map(([product, count]) => (
                      <div key={product} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300 truncate max-w-[150px]" title={product}>{product}</span>
                        <span className="text-sm font-medium text-white">{count} vendus</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                      <PackageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-400">Aucune vente dans cette période</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 text-neutral-500 border-b border-dashed border-neutral-500 pb-1">
                     <h3 className="text-sm font-medium">{t("dashboard.mainWilayas")}</h3>
                   </div>
                   <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-yellow-500" />
                     <h3 className="text-sm font-medium text-white">{t("dashboard.topWilayas")}</h3>
                   </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                {advancedStats.topWilayas.length > 0 ? (
                  <div className="space-y-4">
                    {advancedStats.topWilayas.map(([wilaya, count]) => (
                      <div key={wilaya} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300 truncate max-w-[150px]">{wilaya}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-800/30 text-neutral-500 flex items-center justify-center mb-4">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-neutral-400">Aucune commande dans cette période</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commandes récentes */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-neutral-400" />
                    <h3 className="text-base font-semibold text-white">Commandes récentes</h3>
                  </div>
                  <Link to="/dashboard/orders" className="bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors">
                    Voir tout
                  </Link>
                </div>
                
                <div className="flex-1 flex flex-col">
                  {advancedStats.recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs font-medium text-neutral-500 border-b border-neutral-800">
                            <th className="pb-3 font-medium">Référence</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Client</th>
                            <th className="pb-3 font-medium">Montant</th>
                            <th className="pb-3 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {advancedStats.recentOrders.map(order => (
                             <tr key={order.id} className="text-sm hover:bg-neutral-800/20 transition-colors">
                               <td className="py-4 text-white font-medium">{order.reference || order.id.slice(-6).toUpperCase()}</td>
                               <td className="py-4 text-neutral-400">{parseOrderDate(order).toLocaleDateString()}</td>
                               <td className="py-4 text-neutral-300">{order.customer?.name || order.shippingAddress?.fullName || 'Client'}</td>
                               <td className="py-4 text-white font-medium">{order.total} DA</td>
                               <td className="py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'Livrée' ? 'bg-emerald-500/10 text-emerald-500' :
                                    order.status === 'Annulée' || order.status === 'Échouée' ? 'bg-red-500/10 text-red-500' :
                                    order.status === 'En cours' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                 }`}>
                                   {order.status || 'Nouveau'}
                                 </span>
                               </td>
                             </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 rounded-3xl bg-[#2a2a32] flex items-center justify-center mb-4 shadow-inner">
                        <Lock className="w-6 h-6 text-neutral-500" />
                      </div>
                      <h4 className="text-white font-semibold mb-2">Pas encore de commandes</h4>
                      <p className="text-sm text-neutral-400 mb-6">Partagez le lien de votre boutique et commencez à vendre</p>
                      <div className="flex items-center gap-3">
                        <Link to="/dashboard/products" className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-yellow-400 transition-colors">
                          <Plus className="w-4 h-4" />
                          Ajouter un produit
                        </Link>
                        <button className="border border-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-neutral-800 transition-colors" onClick={() => {
                           navigator.clipboard.writeText(`${window.location.origin}/store/${tenantData?.storeUrl || ''}`);
                        }}>
                          <Share2 className="w-4 h-4" />
                          Partager le lien
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment utiliser */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] overflow-hidden">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 transition-colors"
                  onClick={() => setShowHowTo(!showHowTo)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full border border-neutral-400"></div>
                    </div>
                    <h3 className="text-base font-medium text-white">Comment utiliser la plateforme</h3>
                  </div>
                  {showHowTo ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
                </div>
                {showHowTo && (
                   <div className="px-5 pb-5 pt-2 border-t border-neutral-800 text-sm text-neutral-400 space-y-4">
                     <p>Bienvenue sur votre tableau de bord ! Voici quelques étapes pour bien démarrer :</p>
                     <ul className="list-disc pl-5 space-y-2">
                       <li>Allez dans <strong>Paramètres</strong> pour configurer vos méthodes de livraison et de paiement.</li>
                       <li>Personnalisez l'apparence de votre boutique via <strong>Personnaliser la boutique</strong>.</li>
                       <li>Ajoutez vos premiers articles dans <strong>Produits</strong>.</li>
                       <li>Partagez le lien de votre boutique et commencez à recevoir des commandes !</li>
                     </ul>
                   </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Lien de votre boutique */}
              <div className="rounded-2xl bg-yellow-500 p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Store className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-bold text-black">Lien de votre boutique</h3>
                  </div>
                  <p className="text-black/80 text-sm mb-4">Partagez ce lien avec vos clients</p>
                  
                  <div className="flex items-center gap-2 bg-yellow-400/50 rounded-xl p-1 border border-yellow-400">
                    <div className="flex-1 px-3 text-black/80 text-sm truncate select-all">
                      {tenantData?.storeUrl ? `${window.location.host}/store/${tenantData.storeUrl}` : "URL non configurée"}
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/${tenantData?.storeUrl || ''}`)}
                      className="w-10 h-10 flex items-center justify-center bg-yellow-500 rounded-lg shadow-sm hover:bg-yellow-400 transition-colors text-black"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Guide de configuration */}
              <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Rocket className="w-5 h-5 text-white" />
                  <h3 className="text-base font-semibold text-white">Guide de configuration</h3>
                </div>
                
                <div className="bg-[#16161a] rounded-xl p-4 border border-neutral-800 flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0">
                    <ListTodo className="w-5 h-5 text-black" />
                  </div>
                  <p className="text-sm text-white font-medium">Complétez ces étapes pour lancer votre boutique</p>
                </div>
                
                <Link to="/dashboard/settings" className="w-full bg-yellow-500 text-black px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
                  <ListTodo className="w-4 h-4" />
                  Continuer la configuration de votre boutique
                </Link>
              </div>

              {/* Tip DZBuild */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#2a2a24] to-[#1e1e24] p-6 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-sm font-bold text-yellow-500">DZBuild</h3>
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-500 ml-auto cursor-pointer" />
                </div>
                <p className="text-sm text-white font-medium mb-4 leading-relaxed">
                  Ajoutez un <span className="text-yellow-500">prix barré</span> au-dessus du prix de vente. 
                  Les clients achètent plus quand ils perçoivent une économie.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700 text-neutral-400 text-xs">
                  <span className="w-3 h-3 flex items-center justify-center border border-neutral-500 rounded-sm scale-[0.6]"><MapPin className="w-3 h-3" /></span>
                  Tarification
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
