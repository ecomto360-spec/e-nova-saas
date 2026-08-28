import React from "react";
import { useState } from "react";
import { 
  Truck, 
  PlayCircle, 
  Gift, 
  MapPin, 
  Zap, 
  Search,
  CheckCircle2,
  Info
} from "lucide-react";

// Full list of 58 wilayas for realism
const WILAYAS = [
  { id: "01", ar: "أدرار", fr: "Adrar" },
  { id: "02", ar: "الشلف", fr: "Chlef" },
  { id: "03", ar: "الأغواط", fr: "Laghouat" },
  { id: "04", ar: "أم البواقي", fr: "Oum El Bouaghi" },
  { id: "05", ar: "باتنة", fr: "Batna" },
  { id: "06", ar: "بجاية", fr: "Béjaïa" },
  { id: "07", ar: "بسكرة", fr: "Biskra" },
  { id: "08", ar: "بشار", fr: "Béchar" },
  { id: "09", ar: "البليدة", fr: "Blida" },
  { id: "10", ar: "البويرة", fr: "Bouira" },
  { id: "11", ar: "تمنراست", fr: "Tamanrasset" },
  { id: "12", ar: "تبسة", fr: "Tébessa" },
  { id: "13", ar: "تلمسان", fr: "Tlemcen" },
  { id: "14", ar: "تيارت", fr: "Tiaret" },
  { id: "15", ar: "تيزي وزو", fr: "Tizi Ouzou" },
  { id: "16", ar: "الجزائر", fr: "Alger" },
  { id: "17", ar: "الجلفة", fr: "Djelfa" },
  { id: "18", ar: "جيجل", fr: "Jijel" },
  { id: "19", ar: "سطيف", fr: "Sétif" },
  { id: "20", ar: "سعيدة", fr: "Saïda" },
  { id: "21", ar: "سكيكدة", fr: "Skikda" },
  { id: "22", ar: "سيدي بلعباس", fr: "Sidi Bel Abbès" },
  { id: "23", ar: "عنابة", fr: "Annaba" },
  { id: "24", ar: "قالمة", fr: "Guelma" },
  { id: "25", ar: "قسنطينة", fr: "Constantine" },
  { id: "26", ar: "المدية", fr: "Médéa" },
  { id: "27", ar: "مستغانم", fr: "Mostaganem" },
  { id: "28", ar: "المسيلة", fr: "M'Sila" },
  { id: "29", ar: "معسكر", fr: "Mascara" },
  { id: "30", ar: "ورقلة", fr: "Ouargla" },
  { id: "31", ar: "وهران", fr: "Oran" },
  { id: "32", ar: "البيض", fr: "El Bayadh" },
  { id: "33", ar: "إليزي", fr: "Illizi" },
  { id: "34", ar: "برج بوعريريج", fr: "Bordj Bou Arreridj" },
  { id: "35", ar: "بومرداس", fr: "Boumerdès" },
  { id: "36", ar: "الطارف", fr: "El Tarf" },
  { id: "37", ar: "تندوف", fr: "Tindouf" },
  { id: "38", ar: "تيسمسيلت", fr: "Tissemsilt" },
  { id: "39", ar: "الوادي", fr: "El Oued" },
  { id: "40", ar: "خنشلة", fr: "Khenchela" },
  { id: "41", ar: "سوق أهراس", fr: "Souk Ahras" },
  { id: "42", ar: "تيبازة", fr: "Tipaza" },
  { id: "43", ar: "ميلة", fr: "Mila" },
  { id: "44", ar: "عين الدفلى", fr: "Aïn Defla" },
  { id: "45", ar: "النعامة", fr: "Naâma" },
  { id: "46", ar: "عين تموشنت", fr: "Aïn Témouchent" },
  { id: "47", ar: "غرداية", fr: "Ghardaïa" },
  { id: "48", ar: "غليزان", fr: "Relizane" },
  { id: "49", ar: "تيميمون", fr: "Timimoun" },
  { id: "50", ar: "برج باجي مختار", fr: "Bordj Badji Mokhtar" },
  { id: "51", ar: "أولاد جلال", fr: "Ouled Djellal" },
  { id: "52", ar: "بني عباس", fr: "Béni Abbès" },
  { id: "53", ar: "عين صالح", fr: "In Salah" },
  { id: "54", ar: "عين قزام", fr: "In Guezzam" },
  { id: "55", ar: "تقرت", fr: "Touggourt" },
  { id: "56", ar: "جانت", fr: "Djanet" },
  { id: "57", ar: "المغير", fr: "El M'Ghair" },
  { id: "58", ar: "المنيعة", fr: "El Meniaa" }
];

interface WilayaRate {
  id: string;
  homeActive: boolean;
  homePrice: string;
  deskActive: boolean;
  deskPrice: string;
  duration: string;
}

export default function ShippingRates() {
  const [freeAll, setFreeAll] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState(false);
  const [thresholdValue, setThresholdValue] = useState("5000");
  
  const [wilayaSystem, setWilayaSystem] = useState<58 | 69>(58);
  
  const [globalHomePrice, setGlobalHomePrice] = useState("600");
  const [globalDeskPrice, setGlobalDeskPrice] = useState("400");
  const [globalDuration, setGlobalDuration] = useState("3");

  const [search, setSearch] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Initialize rates state
  const [rates, setRates] = useState<Record<string, WilayaRate>>(
    WILAYAS.reduce((acc, w) => {
      acc[w.id] = {
        id: w.id,
        homeActive: true,
        homePrice: "600,00",
        deskActive: true,
        deskPrice: "400,00",
        duration: "3"
      };
      return acc;
    }, {} as Record<string, WilayaRate>)
  );

  const handleApplyToAll = () => {
    const newRates = { ...rates };
    Object.keys(newRates).forEach(key => {
      newRates[key] = {
        ...newRates[key],
        homePrice: globalHomePrice + ",00",
        deskPrice: globalDeskPrice + ",00",
        duration: globalDuration
      };
    });
    setRates(newRates);
  };

  // Filtering
  const filteredWilayas = WILAYAS.filter(w => {
    const matchesSearch = w.ar.includes(search) || w.fr.toLowerCase().includes(search.toLowerCase()) || w.id.includes(search);
    const rate = rates[w.id];
    const matchesActive = showOnlyActive ? (rate.homeActive || rate.deskActive) : true;
    return matchesSearch && matchesActive;
  });

  const totalPages = Math.ceil(filteredWilayas.length / itemsPerPage);
  const paginatedWilayas = filteredWilayas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Totals
  const totalHomeActive = Object.values(rates).filter((r: any) => r.homeActive).length;
  const totalDeskActive = Object.values(rates).filter((r: any) => r.deskActive).length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Truck className="text-neutral-400 w-6 h-6" />
            Tarifs de livraison
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gérer les tarifs de livraison pour toutes les wilayas algériennes
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-colors">
          <PlayCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Voir le tutoriel</span>
        </button>
      </div>

      {/* Free Shipping Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16161a] border border-neutral-800 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Livraison gratuite pour toutes les commandes</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${freeAll ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-800 text-neutral-400'}`}>
                  {freeAll ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => { setFreeAll(!freeAll); if(!freeAll) setFreeThreshold(false); }}
              className={`w-11 h-6 rounded-full transition-colors relative ${freeAll ? "bg-yellow-500" : "bg-neutral-600"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${freeAll ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <div className="flex gap-2 text-sm text-neutral-400 bg-[#16161a] p-3 rounded-lg border border-neutral-800">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <p>Une fois activé, la livraison sera <span className="text-emerald-400 font-medium">100% gratuite</span> pour tous les clients quelle que soit la valeur de la commande.</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16161a] border border-neutral-800 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Livraison gratuite au-dessus d'un montant</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${freeThreshold ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-800 text-neutral-400'}`}>
                  {freeThreshold ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => { setFreeThreshold(!freeThreshold); if(!freeThreshold) setFreeAll(false); }}
              className={`w-11 h-6 rounded-full transition-colors relative ${freeThreshold ? "bg-yellow-500" : "bg-neutral-600"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${freeThreshold ? "left-6" : "left-1"}`} />
            </button>
          </div>
          
          <div className="flex gap-2 text-sm text-neutral-400">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <p>Livraison gratuite uniquement pour les commandes dépassant le montant défini.</p>
          </div>

          {freeThreshold && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm text-neutral-300 font-medium mb-1.5 block">Seuil minimum pour livraison gratuite :</label>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    className="flex-1 bg-[#16161a] border border-neutral-700 rounded-l-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    placeholder="Exemple : 5000"
                  />
                  <div className="bg-neutral-800 border border-l-0 border-neutral-700 rounded-r-lg px-4 py-2 text-sm text-neutral-400">
                    DA
                  </div>
                </div>
              </div>
              <button className="w-full bg-yellow-500 text-black font-medium py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Enregistrer les modifications
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wilaya System */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-white font-medium">Système de wilayas</h2>
              <p className="text-sm text-neutral-400">Choisissez le nombre de wilayas à afficher dans votre boutique</p>
            </div>
          </div>
          <div className="flex items-center bg-[#16161a] rounded-lg p-1 border border-neutral-800">
            <button 
              onClick={() => setWilayaSystem(58)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${wilayaSystem === 58 ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              58 wilaya <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Recommandé</span>
            </button>
            <button 
              onClick={() => setWilayaSystem(69)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${wilayaSystem === 69 ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              69 wilaya
            </button>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <h4 className="text-emerald-500 text-sm font-medium">58 wilayas - Compatible avec les transporteurs</h4>
            <p className="text-emerald-500/70 text-xs mt-0.5">Inclut les wilayas originales prises en charge par tous les transporteurs en Algérie (Yalidine, Maystro, Noest, ZR Express...)</p>
          </div>
        </div>
      </div>

      {/* Global Rates */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-white font-medium">Source des tarifs</h2>
        </div>
        <button className="w-full bg-yellow-500 text-black py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
          <StarIcon /> Appliquer les tarifs par défaut <span className="bg-black/20 text-black text-[10px] px-1.5 py-0.5 rounded">Recommandé</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Prix livraison à domicile (DA)</label>
            <input 
              type="text" 
              value={globalHomePrice}
              onChange={(e) => setGlobalHomePrice(e.target.value)}
              className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Prix livraison au bureau (DA)</label>
            <input 
              type="text" 
              value={globalDeskPrice}
              onChange={(e) => setGlobalDeskPrice(e.target.value)}
              className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Durée de livraison (jours)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={globalDuration}
                onChange={(e) => setGlobalDuration(e.target.value)}
                className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
              />
              <button 
                onClick={handleApplyToAll}
                className="bg-[#16161a] border border-neutral-700 text-neutral-300 px-4 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                <RefreshIcon /> Appliquer à tout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wilayas Table */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Rechercher une wilaya..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#16161a] border border-neutral-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded font-medium flex items-center gap-1.5">
              <UserIcon /> 58 wilaya
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className={`w-10 h-5 rounded-full transition-colors relative ${showOnlyActive ? "bg-blue-500" : "bg-neutral-600"}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${showOnlyActive ? "left-[22px]" : "left-1"}`} />
              </button>
              <span className="text-sm text-neutral-400">Afficher uniquement les actives</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="p-4 w-12"><input type="checkbox" className="rounded border-neutral-700 bg-[#16161a]" /></th>
                <th className="p-4">WILAYA</th>
                <th className="p-4 w-48 text-center">LIVRAISON À DOMICILE</th>
                <th className="p-4 w-48 text-center">LIVRAISON AU BUREAU</th>
                <th className="p-4 w-32 text-center">DURÉE (JOURS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {paginatedWilayas.map((wilaya) => {
                const rate = rates[wilaya.id];
                return (
                  <tr key={wilaya.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="p-4"><input type="checkbox" className="rounded border-neutral-700 bg-[#16161a]" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                          {wilaya.id}
                        </span>
                        <span className="text-white font-medium" dir="rtl">{wilaya.ar}</span>
                        <span className="text-neutral-500 text-sm">({wilaya.fr})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => setRates({...rates, [wilaya.id]: {...rate, homeActive: !rate.homeActive}})}
                          className="flex items-center gap-1.5"
                        >
                          <div className={`w-8 h-4 rounded-full transition-colors relative ${rate.homeActive ? "bg-emerald-500" : "bg-neutral-600"}`}>
                            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${rate.homeActive ? "left-[18px]" : "left-0.5"}`} />
                          </div>
                          <span className={`text-xs ${rate.homeActive ? 'text-emerald-500' : 'text-neutral-500'}`}>Activé</span>
                        </button>
                        <input 
                          type="text"
                          value={rate.homePrice}
                          onChange={(e) => setRates({...rates, [wilaya.id]: {...rate, homePrice: e.target.value}})}
                          className="w-32 bg-[#16161a] border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-center text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => setRates({...rates, [wilaya.id]: {...rate, deskActive: !rate.deskActive}})}
                          className="flex items-center gap-1.5"
                        >
                          <div className={`w-8 h-4 rounded-full transition-colors relative ${rate.deskActive ? "bg-emerald-500" : "bg-neutral-600"}`}>
                            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${rate.deskActive ? "left-[18px]" : "left-0.5"}`} />
                          </div>
                          <span className={`text-xs ${rate.deskActive ? 'text-emerald-500' : 'text-neutral-500'}`}>Activé</span>
                        </button>
                        <input 
                          type="text"
                          value={rate.deskPrice}
                          onChange={(e) => setRates({...rates, [wilaya.id]: {...rate, deskPrice: e.target.value}})}
                          className="w-32 bg-[#16161a] border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-center text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <input 
                          type="text"
                          value={rate.duration}
                          onChange={(e) => setRates({...rates, [wilaya.id]: {...rate, duration: e.target.value}})}
                          className="w-16 bg-[#16161a] border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-center text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-sm text-neutral-400">
          <div>
            Affichage <span className="text-yellow-500 font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-yellow-500 font-medium">{Math.min(currentPage * itemsPerPage, filteredWilayas.length)}</span> de <span className="text-yellow-500 font-medium">{filteredWilayas.length}</span> wilaya
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-neutral-500 hover:text-white disabled:opacity-50"
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${currentPage === i + 1 ? 'bg-yellow-500 text-black font-medium' : 'hover:bg-neutral-800'}`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-neutral-400 hover:text-white disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-yellow-500">{totalHomeActive}</span>
          <span className="text-sm text-neutral-400 mt-1">Livraison à domicile</span>
        </div>
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-emerald-500">{totalDeskActive}</span>
          <span className="text-sm text-neutral-400 mt-1">Livraison au bureau</span>
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  );
}

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
