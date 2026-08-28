import { Search, Star, Check, X, Trash2, Settings } from "lucide-react";
import { cn } from "../lib/utils";

const mockReviews = [
  { id: 1, author: "Boukhalfa", avatar: "B", bg: "bg-blue-600", product: "Running Bepro Fenix", rating: 5, text: "شكرا على الاحترافية", status: "Publié", date: "03/08/2026 04:55" },
  { id: 2, author: "بعلي مصطفى", avatar: "ب", bg: "bg-emerald-600", product: "JOMA WINNER 2", rating: 5, text: "-", status: "Publié", date: "22/04/2026 15:39" },
  { id: 3, author: "طاهر طالبي", avatar: "ط", bg: "bg-red-600", product: "JOMA WINNER 2", rating: 5, text: "-", status: "Publié", date: "13/04/2026 08:19" },
  { id: 4, author: "mohamed mouzaika", avatar: "m", bg: "bg-indigo-600", product: "JOMA WINNER 2", rating: 5, text: "-", status: "Publié", date: "07/04/2026 22:32" },
  { id: 5, author: "نادي رجاء", avatar: "ن", bg: "bg-yellow-600", product: "Jogging BEPRO Style", rating: 5, text: "-", status: "Publié", date: "06/04/2026 21:08" },
  { id: 6, author: "يحي محمد", avatar: "ي", bg: "bg-pink-600", product: "JOMA WINNER 2", rating: 5, text: "-", status: "Publié", date: "24/03/2026 00:18" },
];

const RenderStars = ({ count }: { count: number }) => {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={cn("h-3.5 w-3.5", i < count ? "fill-yellow-500 text-yellow-500" : "fill-neutral-700 text-neutral-700")} 
        />
      ))}
    </div>
  );
};

export default function Reviews() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
          Avis clients
        </h1>
        <button className="rounded-full bg-yellow-500 px-4 py-1.5 text-sm font-bold text-black hover:bg-yellow-400 transition-colors">
          8 Total des avis
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-white">8</p>
          <p className="mt-1 text-sm font-medium text-neutral-400">Total des avis</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-yellow-500">0</p>
          <p className="mt-1 text-sm font-medium text-neutral-400">En attente</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-emerald-500">8</p>
          <p className="mt-1 text-sm font-medium text-neutral-400">Publiés</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-purple-500">0</p>
          <p className="mt-1 text-sm font-medium text-neutral-400">Achats vérifiés</p>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="rounded-xl border border-neutral-800 bg-[#1e1e24] p-4 flex items-center justify-between cursor-pointer hover:bg-[#16161a] transition-colors">
        <div className="flex items-center gap-2 text-yellow-500 font-medium">
          <Settings className="h-4 w-4" />
          Paramètres des avis
        </div>
        <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-0 rounded-xl border border-neutral-800 bg-[#1e1e24] overflow-hidden">
        
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#1e1e24]">
          <div className="flex gap-2">
            {["Tous", "En attente", "Publiés", "Rejetés"].map((tab, i) => (
              <button
                key={tab}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  i === 0 
                    ? "bg-yellow-500 text-black" 
                    : "border border-neutral-700 bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full sm:max-w-md">
            <input 
              type="text" 
              placeholder="Rechercher par nom ou texte..." 
              className="w-full rounded-md border border-neutral-700 bg-[#16161a] py-2 pl-4 pr-4 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-[#16161a] text-xs uppercase text-neutral-500 border-y border-neutral-800">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Auteur</th>
                <th scope="col" className="px-4 py-3 font-medium">Produit</th>
                <th scope="col" className="px-4 py-3 font-medium">Note</th>
                <th scope="col" className="px-4 py-3 font-medium">Texte</th>
                <th scope="col" className="px-4 py-3 font-medium text-center">Statut</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {mockReviews.map((review) => (
                <tr key={review.id} className="hover:bg-[#16161a]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white font-medium text-sm", review.bg)}>
                        {review.avatar}
                      </div>
                      <span className="font-medium text-white">{review.author}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-neutral-300">{review.product}</td>
                  <td className="px-4 py-4">
                    <RenderStars count={review.rating} />
                  </td>
                  <td className="px-4 py-4 max-w-[200px] truncate" dir="auto">{review.text}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-neutral-500">{review.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 text-neutral-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors" title="Rejeter">
                        <X className="h-4 w-4" />
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-colors" title="Approuver">
                        <Check className="h-4 w-4" />
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-md border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
