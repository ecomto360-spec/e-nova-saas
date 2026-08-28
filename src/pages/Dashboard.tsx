import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../contexts/TenantContext";
import { Rocket, AlertTriangle, RefreshCw, HelpCircle, ChevronRight, ShoppingCart, CheckCircle, Wallet, TrendingUp, ReceiptText, Eye, LineChart, Filter, Users, XCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { isTrialExpired, tenantData } = useTenant();
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Utilisateur";

  const kpis = [
    { label: "Commandes", value: "0", icon: ShoppingCart },
    { label: "Livrées", value: "0", icon: CheckCircle },
    { label: "Revenus", value: "0 DA", icon: Wallet },
    { label: "Profit", value: "0 DA", icon: TrendingUp },
    { label: "Panier moyen", value: "0 DA", icon: ReceiptText },
    { label: "Visiteurs", value: "0", icon: Eye },
    { label: "Pages vues", value: "0", icon: LineChart },
    { label: "Conversion", value: "0.0%", icon: Filter },
    { label: "Nouveaux clients", value: "0", icon: Users },
    { label: "Annulées", value: "0", icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            Bonjour, {firstName} ! <span className="text-yellow-500">👋</span>
          </h1>
          <p className="text-sm text-neutral-400">Voici le résumé des performances de votre boutique aujourd'hui</p>
        </div>
        <Link 
          to="/store"
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Voir la boutique
        </Link>
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
              to="/subscription"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Renouveler l'abonnement
            </Link>
            <Link to="/subscription" className="text-neutral-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
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
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1e1e24] border border-neutral-800 rounded-lg p-1 text-sm font-medium">
          <span className="px-3 text-neutral-400 flex items-center gap-2 border-r border-neutral-700"><LineChart className="w-4 h-4"/> Analytiques avancées</span>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">Aujourd'hui</button>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">Hier</button>
          <button className="px-3 py-1.5 bg-yellow-500 text-black rounded-md shadow">7 jours</button>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">30 jours</button>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">Ce mois</button>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">Mois dernier</button>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">Cette année</button>
          <button className="px-3 py-1.5 text-neutral-400 hover:text-white rounded-md">Personnalisé</button>
        </div>
        <select className="bg-[#1e1e24] border border-neutral-800 text-sm font-medium rounded-lg px-4 py-2.5 text-white focus:outline-none">
          <option>Tout</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <div className="mt-4 text-xs text-neutral-500">
              0%
            </div>
          </div>
        ))}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 h-80 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center">
            <LineChart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Heures de pointe des ventes</h3>
          <p className="text-sm text-neutral-400 max-w-sm">Les heures où vos clients achètent le plus</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-6 h-80 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Visiteurs & Pages vues</h3>
          <p className="text-sm text-neutral-400 max-w-sm">Statistiques d'audience pour la période</p>
        </div>
      </div>
    </div>
  );
}

// Local helper component
function PackageIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  );
}
