import { Code2, ExternalLink, Settings, Rocket, CheckCircle2 } from "lucide-react";

export default function ApiSettings() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">API</h1>
        <div className="text-sm text-neutral-500">Paramètres / API</div>
      </div>

      {/* Header Box */}
      <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#2a1d13] border border-orange-900/30 text-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">DZBuild API</h2>
              <p className="text-sm text-neutral-400 mb-2">
                Pilotez votre boutique par programmation : produits, commandes, clients et pages de destination — depuis vos propres systèmes.
              </p>
              <div className="inline-flex items-center gap-2 bg-[#1e1e24] border border-neutral-700 px-3 py-1.5 rounded-md text-xs font-mono text-neutral-300">
                URL de base: <span className="text-orange-400">https://api.dzbuild.app/v1</span>
              </div>
            </div>
          </div>
          <button className="whitespace-nowrap border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0">
            <ExternalLink className="w-4 h-4" /> Documentation API
          </button>
        </div>
      </div>

      {/* Enterprise Upsell Banner */}
      <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#2a1d13] border border-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
          <Rocket className="w-8 h-8 text-orange-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">L'API est réservée au plan Enterprise</h2>
        <p className="text-sm text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed">
          L'accès programmatique à votre boutique — création de commandes, synchronisation des produits, webhooks et vitrines sur mesure — est une exclusivité du plan Enterprise.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full mb-10">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 flex items-start gap-4 text-left">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Gérer produits, commandes et clients par programmation</div>
            </div>
          </div>
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 flex items-start gap-4 text-left">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Synchroniser stock et prix avec vos systèmes automatiquement</div>
            </div>
          </div>
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 flex items-start gap-4 text-left">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Vitrines personnalisées et applications mobiles</div>
            </div>
          </div>
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 flex items-start gap-4 text-left">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Clés sécurisées, révocables à tout moment</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-[#1e1e24] border border-neutral-800 text-neutral-400 px-6 py-2.5 rounded-lg text-sm font-medium">
            Votre plan actuel : <span className="text-white font-bold">Pro</span>
          </div>
          <button className="bg-[#e65032] hover:bg-[#cc4529] text-white px-8 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Passer à Enterprise
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-6">Après la mise à niveau, revenez ici pour générer vos clés.</p>
      </div>
    </div>
  );
}
