import { useState } from "react";
import { Ghost, Search, Filter, Loader2, Send } from "lucide-react";

export default function AbandonedCarts() {
  const [isRelancing, setIsRelancing] = useState(false);
  const [lastRelanceTime, setLastRelanceTime] = useState(0);

  const handleRelance = async () => {
    const now = Date.now();
    if (isRelancing || now - lastRelanceTime < 3000) {
      return; // Debounce / Lock
    }
    
    setIsRelancing(true);
    setLastRelanceTime(now);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Relance SMS envoyée avec succès !");
    } finally {
      setIsRelancing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          Paniers abandonnés
        </h1>
        <button className="rounded-md border border-neutral-700 bg-[#1e1e24] px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
          Paramètres de relance
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm">
          <p className="text-sm font-medium text-neutral-400">Total Paniers Abandonnés</p>
          <p className="mt-2 text-3xl font-semibold text-white">1</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm">
          <p className="text-sm font-medium text-neutral-400">Paniers Récupérés</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-500">0</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-sm">
          <p className="text-sm font-medium text-neutral-400">Valeur Récupérée</p>
          <p className="mt-2 text-3xl font-semibold text-blue-500">0 DA</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-[#1e1e24] p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Rechercher par client ou email..." 
              className="w-full rounded-md border border-neutral-700 bg-[#16161a] py-2 pl-9 pr-4 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
          <button className="flex items-center gap-2 rounded-md border border-neutral-700 bg-[#16161a] px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800">
            <Filter className="h-4 w-4" />
            Filtres
          </button>
        </div>

        {/* Mock Abandoned Cart List for testing the debounce */}
        <div className="mt-4 rounded-lg border border-neutral-800 bg-[#1e1e24] overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-[#16161a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">Karim Benali<br/><span className="text-xs text-neutral-500">0661 23 45 67</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">4,500 DZD</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Il y a 2 heures</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={handleRelance}
                    disabled={isRelancing}
                    className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-500/20 px-3 py-1.5 rounded-md transition-colors"
                  >
                    {isRelancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Relancer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
