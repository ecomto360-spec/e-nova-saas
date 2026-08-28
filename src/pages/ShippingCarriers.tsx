import React from "react";
import { useState, useMemo } from "react";
import { 
  Link as LinkIcon, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  Truck,
  Info,
  X,
  Star,
  Package,
  RefreshCw,
  AlertTriangle,
  Wifi,
  Check
} from "lucide-react";
import { ConfirmModal } from "../components/common/ConfirmModal";

// List of 51 carriers extracted from the images
const CARRIERS = [
  "Med Express", "Ecotrack personnalisé", "Yalidine", "Yalitec",
  "Guepex", "Easy & Speed", "Economiqua", "Maystro",
  "ZR Express", "Noest", "Abex Express", "DHD",
  "Conexlog", "MSM Go", "Rex Livraison", "RB Livraison",
  "Speed Delivery", "Areex", "Prest", "Rocket Delivery",
  "WorldExpress", "BA Consult", "Packers", "48Hr Livraison",
  "Mono Hub", "Anderson Delivery", "GOLIVRI", "Coyote Express",
  "Salva Delivery", "Distazero", "FRET.Direct", "TSL Express",
  "Negmar Express", "Ultra Express", "OM Express", "Allo Livraison",
  "Assil Delivery", "Expedia Chrono", "HHD Express", "Imir Logistics",
  "Navex Delivery", "Swift Express", "Univer Delivery", "Colireli",
  "FZ Delivery", "Delivromail", "PDEX", "Zimou Express",
  "Colivraison", "Ecom Delivery", "Elogistia"
].map((name, index) => ({
  id: `carrier-${index}`,
  name
}));

export default function ShippingCarriers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [linkedCarriers, setLinkedCarriers] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<{id: string, name: string} | null>(null);
  const [carrierToUnlink, setCarrierToUnlink] = useState<{id: string, name: string} | null>(null);
  
  // Form State
  const [token, setToken] = useState("");
  const [apiEnabled, setApiEnabled] = useState(true);
  const [isDefault, setIsDefault] = useState(true);
  const [stockPrep, setStockPrep] = useState(false);
  const [syncRates, setSyncRates] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const openModal = (carrier: {id: string, name: string}) => {
    setSelectedCarrier(carrier);
    // Reset form or load existing config
    setToken("");
    setApiEnabled(true);
    setIsDefault(true);
    setStockPrep(false);
    setSyncRates(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCarrier(null);
  };

  const handleSave = () => {
    if (selectedCarrier) {
      const newLinked = new Set(linkedCarriers);
      newLinked.add(selectedCarrier.id);
      setLinkedCarriers(newLinked);
    }
    closeModal();
  };

  const handleConfirmUnlink = () => {
    if (!carrierToUnlink) return;
    const newLinked = new Set(linkedCarriers);
    newLinked.delete(carrierToUnlink.id);
    setLinkedCarriers(newLinked);
    setCarrierToUnlink(null);
  };

  const filteredCarriers = useMemo(() => {
    return CARRIERS.filter(carrier => 
      carrier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getColor = (name: string) => {
    const colors = ['bg-blue-600', 'bg-red-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-24">
      {/* Hero Section */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl font-semibold text-white flex items-center gap-3 mb-4">
            <LinkIcon className="text-neutral-400 w-8 h-8" />
            Lier les transporteurs
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Liez votre boutique aux transporteurs pour envoyer et suivre les commandes. Vous pouvez lier
            plusieurs transporteurs et choisir le plus adapté pour chaque commande.
          </p>
          
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-colors text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Voir la vidéo importante
            </button>
            
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {linkedCarriers.size} liés sur {CARRIERS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6 space-y-6">
        
        {/* Search and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <Truck className="w-5 h-5 text-blue-400" />
            Transporteurs disponibles
            <Info className="w-4 h-4 text-yellow-600" />
          </div>
          
          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Rechercher un transporteur..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#16161a] border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <span className="text-xs text-neutral-500">
              Affichage {filteredCarriers.length} sur {CARRIERS.length} transporteurs
            </span>
          </div>
        </div>

        {/* Carriers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCarriers.map((carrier) => {
            const isLinked = linkedCarriers.has(carrier.id);
            return (
              <div 
                key={carrier.id} 
                className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-neutral-700 transition-colors"
              >
                {/* Logo Placeholder */}
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                  <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${getColor(carrier.name)}`}>
                    {getInitials(carrier.name)}
                  </div>
                </div>
                
                <h3 className="text-white text-sm font-medium text-center line-clamp-1 w-full">
                  {carrier.name}
                </h3>
                
                {isLinked ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarrierToUnlink(carrier);
                    }}
                    className="flex items-center justify-center gap-2 w-24 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-emerald-400 hover:bg-neutral-700 hover:text-red-400 transition-colors group cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 group-hover:hidden" />
                    <X className="w-4 h-4 hidden group-hover:block" />
                    <span className="group-hover:hidden">Lié</span>
                    <span className="hidden group-hover:block">Délier</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => openModal(carrier)}
                    className="flex items-center justify-center gap-2 w-24 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Lier
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Lier Transporteur */}
      {isModalOpen && selectedCarrier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                   <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${getColor(selectedCarrier.name)}`}>
                    {getInitials(selectedCarrier.name)}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedCarrier.name}</h2>
                  <p className="text-neutral-400 text-sm mt-0.5">Entrer les données API pour la liaison</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Token Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Bearer Token</label>
                <input 
                  type="text" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Entrez le Bearer Token"
                  className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                
                {/* 1. Activer API */}
                <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
                  <button 
                    onClick={() => setApiEnabled(!apiEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${apiEnabled ? "bg-yellow-500" : "bg-neutral-600"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${apiEnabled ? "left-6" : "left-1"}`} />
                  </button>
                  <span className="text-sm font-medium text-neutral-200">Activer l'envoi des commandes via API</span>
                </div>

                {/* 2. Transporteur par défaut */}
                <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
                  <button 
                    onClick={() => setIsDefault(!isDefault)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isDefault ? "bg-yellow-500" : "bg-neutral-600"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isDefault ? "left-6" : "left-1"}`} />
                  </button>
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    Définir comme transporteur par défaut
                  </div>
                </div>

                {/* 3. Préparation depuis le stock */}
                <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setStockPrep(!stockPrep)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${stockPrep ? "bg-yellow-500" : "bg-neutral-600"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${stockPrep ? "left-6" : "left-1"}`} />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                      <Package className="w-4 h-4 text-blue-500" />
                      Préparation depuis le stock
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed pl-15">
                    Activez uniquement si vos produits sont stockés chez le transporteur. La commande arrive alors dans « Colis prêts → Prêt à préparer » et le transporteur la prépare depuis votre stock.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3 ml-0 sm:ml-15 mt-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-500/90 leading-relaxed">
                      Avant d'activer : chaque produit doit avoir un SKU identique à sa référence enregistrée chez le transporteur, avec le suivi de stock activé. Si un SKU manque, une erreur s'affichera à l'envoi et la commande ne partira pas.
                    </p>
                  </div>
                </div>

                {/* 4. Synchroniser tarifs */}
                <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSyncRates(!syncRates)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${syncRates ? "bg-yellow-500" : "bg-neutral-600"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${syncRates ? "left-6" : "left-1"}`} />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                      Synchroniser les tarifs avec votre compte transporteur
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed pl-15">
                    Si activé, les tarifs de livraison par wilaya sont récupérés automatiquement en arrière-plan depuis votre compte transporteur après la liaison — la même synchronisation que la page des tarifs de livraison, que vous pouvez relancer là-bas à tout moment.
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 flex gap-3 items-start mt-4">
                  <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Pour obtenir le Bearer Token, connectez-vous au tableau de bord du transporteur et allez dans Paramètres {'>'} API.
                  </p>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-800/50 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  setIsTesting(true);
                  setTimeout(() => setIsTesting(false), 1500);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#16161a] border border-neutral-700 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Wifi className="w-4 h-4" />
                {isTesting ? "Test en cours..." : "Tester la connexion"}
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-3 rounded-xl text-sm font-medium hover:bg-yellow-400 transition-colors"
              >
                <Check className="w-4 h-4" />
                Lier et enregistrer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Confirmation de déliaison du transporteur */}
      <ConfirmModal
        isOpen={!!carrierToUnlink}
        title="Délier le transporteur"
        description={`Voulez-vous vraiment délier le transporteur "${carrierToUnlink?.name}" ?`}
        confirmText="Délier"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={handleConfirmUnlink}
        onClose={() => setCarrierToUnlink(null)}
      />
    </div>
  );
}
