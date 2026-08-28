import { useState } from "react";
import { Store, Link as LinkIcon, CheckCircle, Copy, ExternalLink, Eye, PlusCircle, ShoppingCart, Info, MapPin, Phone, Search, Zap } from "lucide-react";

export default function StoreSettings() {
  const [formData, setFormData] = useState({
    storeName: "boutikdz",
    description: "",
    wilaya: "",
    commune: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "store@example.com",
    googleVerification: "",
    bingVerification: ""
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Store className="w-8 h-8 text-neutral-400" />
        <h1 className="text-2xl font-bold text-white">Paramètres de la boutique</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Link */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-5 h-5 text-neutral-400" />
              <span className="text-neutral-300 text-sm">Lien de votre boutique :</span>
              <a href="https://boutikdz.dzbuild.app" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 text-sm font-medium flex items-center gap-2">
                https://boutikdz.dzbuild.app
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <form className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <Store className="w-5 h-5 text-neutral-400" />
                <h2 className="text-lg font-medium text-white">Informations de la boutique</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Nom de la boutique</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Description de la boutique</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Écrivez une brève description de votre boutique..."
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-neutral-800 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-neutral-400" />
                <h3 className="text-base font-medium text-white">Emplacement</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Wilaya</label>
                  <select
                    value={formData.wilaya}
                    onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-400 focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
                  >
                    <option value="">Choisir la wilaya</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Commune</label>
                  <input
                    type="text"
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    placeholder="Nom de la commune"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse complète"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"
                />
              </div>
            </div>

            <div className="p-6 border-b border-neutral-800 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-neutral-400" />
                <h3 className="text-base font-medium text-white">Coordonnées</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Numéro de téléphone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">E-mail de la boutique</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-neutral-400" />
                <h3 className="text-base font-medium text-white">Optimisation pour les moteurs de recherche (SEO)</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Code de vérification Google</label>
                <input
                  type="text"
                  value={formData.googleVerification}
                  onChange={(e) => setFormData({ ...formData, googleVerification: e.target.value })}
                  placeholder="Exemple : googleXXXXXXXXXXXXXXXX"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600 font-mono"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Copiez le code de vérification depuis <a href="#" className="text-yellow-500 hover:underline">Google Search Console</a> et choisissez la méthode "HTML tag" puis copiez la valeur content uniquement
                </p>
                <div className="mt-2 text-xs font-mono text-neutral-500 bg-[#16161a] p-3 rounded-lg border border-neutral-800">
                  Exemple du code :<br/>
                  <span className="text-pink-500">&lt;meta</span> <span className="text-blue-400">name=</span><span className="text-yellow-300">"google-site-verification"</span> <span className="text-blue-400">content=</span><span className="text-yellow-300">"</span><span className="border border-dashed border-yellow-500 text-yellow-500 px-1">Cette partie uniquement</span><span className="text-yellow-300">"</span><span className="text-pink-500">&gt;</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Code de vérification Bing</label>
                <input
                  type="text"
                  value={formData.bingVerification}
                  onChange={(e) => setFormData({ ...formData, bingVerification: e.target.value })}
                  placeholder="Exemple : XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600 font-mono"
                />
                <p className="text-xs text-neutral-500">
                  Copiez le code de vérification depuis <a href="#" className="text-yellow-500 hover:underline">Bing Webmaster Tools</a> (optionnel)
                </p>
              </div>

              <div className="pt-4">
                <button type="button" className="bg-yellow-500 text-black px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-neutral-400" />
              <h3 className="text-base font-medium text-white">Statut de la boutique</h3>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-white font-medium">Actif</h4>
                <p className="text-sm text-neutral-400">Votre boutique est accessible aux clients</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Plan actuel</div>
                <div className="text-white font-medium">Pro</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Date d'expiration de l'abonnement</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">2026/08/22</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-yellow-500 text-black px-2 py-0.5 rounded">2 jours restants</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Date de création</div>
                <div className="text-white font-medium">2026/08/19</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-neutral-400" />
              <h3 className="text-base font-medium text-white">Liens rapides</h3>
            </div>
            <div className="space-y-1">
              <a href="#" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">
                <div className="flex items-center gap-3 text-sm text-neutral-300 group-hover:text-white">
                  <Eye className="w-4 h-4 text-yellow-500" />
                  Aperçu de la boutique
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
              </a>
              <a href="#" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">
                <div className="flex items-center gap-3 text-sm text-neutral-300 group-hover:text-white">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  Ajouter un nouveau produit
                </div>
              </a>
              <a href="#" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">
                <div className="flex items-center gap-3 text-sm text-neutral-300 group-hover:text-white">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  Gérer les commandes
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
