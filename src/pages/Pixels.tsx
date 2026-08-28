import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, 
  Radio, 
  LayoutGrid, 
  Globe, 
  Info, 
  ArrowUpCircle,
  Zap,
  Trash2,
  Edit2,
  X,
  Loader2,
  ChevronLeft,
  RefreshCw,
  Youtube,
  ArrowRight,
  Eye,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Check
} from "lucide-react";
import { ConfirmModal } from "../components/common/ConfirmModal";

interface Pixel {
  id: string;
  name?: string;
  platform: string;
  pixelId: string;
  status: "active" | "inactive";
  accessToken?: string;
  domainVerification?: string;
  adAccountId?: string;
  conversionLabel?: string;
}

const PLATFORMS = [
  { 
    id: "meta", 
    name: "Meta Pixel", 
    color: "text-blue-500", 
    bg: "bg-blue-500/10",
    placeholder: "123456789012345",
    Icon: MetaIcon,
    hasSubIcons: true
  },
  { 
    id: "tiktok", 
    name: "TikTok Pixel", 
    color: "text-white", 
    bg: "bg-neutral-800",
    placeholder: "CXXXXXXXXXXXXX",
    Icon: TikTokIcon
  },
  { 
    id: "snapchat", 
    name: "Snapchat Pixel", 
    color: "text-yellow-400", 
    bg: "bg-yellow-400/10",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx",
    Icon: SnapchatIcon
  },
  { 
    id: "pinterest", 
    name: "Pinterest Tag", 
    color: "text-red-500", 
    bg: "bg-red-500/10",
    placeholder: "1234567890123",
    Icon: PinterestIcon
  },
  { 
    id: "ga", 
    name: "Google Analytics", 
    color: "text-orange-500", 
    bg: "bg-orange-500/10",
    placeholder: "G-XXXXXXXXXX",
    Icon: GAIcon
  },
  { 
    id: "gtm", 
    name: "Google Tag Manager", 
    color: "text-blue-400", 
    bg: "bg-blue-400/10",
    placeholder: "GTM-XXXXXXX",
    Icon: GTMIcon
  },
  { 
    id: "gads", 
    name: "Google Ads", 
    color: "text-blue-500", 
    bg: "bg-blue-600/10",
    placeholder: "AW-XXXXXXXXXX",
    Icon: GAdsIcon
  }
];

export default function Pixels() {
  const { user } = useAuth();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"select" | "form">("select");
  const [editingPixel, setEditingPixel] = useState<Pixel | null>(null);
  const [formData, setFormData] = useState({ 
    platform: "meta", 
    name: "",
    pixelId: "", 
    status: "active",
    accessToken: "",
    domainVerification: "",
    adAccountId: "",
    conversionLabel: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pixelToDelete, setPixelToDelete] = useState<Pixel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadPixels();
    } else {
      setPixels([]);
      setLoading(false);
    }
  }, [user]);

  const loadPixels = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "pixels"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const pxs: Pixel[] = [];
      querySnapshot.forEach((doc) => {
        pxs.push({ id: doc.id, ...doc.data() } as Pixel);
      });
      setPixels(pxs);
    } catch (err) {
      console.error("Error loading pixels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (px?: Pixel) => {
    if (px) {
      setEditingPixel(px);
      setFormData({ 
        platform: px.platform, 
        name: px.name || "",
        pixelId: px.pixelId, 
        status: px.status,
        accessToken: px.accessToken || "",
        domainVerification: px.domainVerification || "",
        adAccountId: px.adAccountId || "",
        conversionLabel: px.conversionLabel || ""
      });
      setModalStep("form");
    } else {
      setEditingPixel(null);
      setFormData({ 
        platform: "meta", 
        name: "",
        pixelId: "", 
        status: "active",
        accessToken: "",
        domainVerification: "",
        adAccountId: "",
        conversionLabel: ""
      });
      setModalStep("select");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPixel(null);
    setModalStep("select");
  };

  const handlePlatformSelect = (platformId: string) => {
    setFormData({ ...formData, platform: platformId });
    setModalStep("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const dataToSave = {
        platform: formData.platform,
        name: formData.name,
        pixelId: formData.pixelId,
        status: formData.status,
        accessToken: formData.accessToken,
        domainVerification: formData.domainVerification,
        adAccountId: formData.adAccountId,
        conversionLabel: formData.conversionLabel,
      };

      if (editingPixel) {
        const pxRef = doc(db, "pixels", editingPixel.id);
        await updateDoc(pxRef, dataToSave);
      } else {
        await addDoc(collection(db, "pixels"), {
          ...dataToSave,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      await loadPixels();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving pixel:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pixelToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "pixels", pixelToDelete.id));
      setPixels(pixels.filter(p => p.id !== pixelToDelete.id));
      setPixelToDelete(null);
    } catch (err) {
      console.error("Error deleting pixel:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const activePixels = pixels.filter(p => p.status === "active").length;
  const usedPlatforms = new Set(pixels.map(p => p.platform)).size;
  const totalPixels = pixels.length;

  const getPlatformCounts = () => {
    const counts: Record<string, number> = {};
    PLATFORMS.forEach(p => counts[p.id] = 0);
    pixels.forEach(p => {
      if (counts[p.platform] !== undefined) {
        counts[p.platform]++;
      }
    });
    return counts;
  };
  const platformCounts = getPlatformCounts();

  const selectedPlatformData = PLATFORMS.find(p => p.id === formData.platform);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Paramètres Pixel et suivi</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Ajoutez les codes de suivi de vos plateformes publicitaires pour suivre vos campagnes
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2.5 rounded-xl font-medium hover:bg-yellow-400 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Ajouter un pixel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Pixels actifs</p>
            <p className="text-2xl font-bold text-white leading-tight">{activePixels}</p>
          </div>
        </div>
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Plateformes utilisées</p>
            <p className="text-2xl font-bold text-white leading-tight">{usedPlatforms}</p>
          </div>
        </div>
        <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Pixels globaux</p>
            <p className="text-2xl font-bold text-white leading-tight">{totalPixels}</p>
          </div>
        </div>
      </div>

      {/* Plan Banner */}
      <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="bg-neutral-800 text-xs px-1.5 py-0.5 rounded border border-neutral-700">Ad</span>
              Plan Pro - Un pixel par type
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              Vous pouvez ajouter un pixel par type (Facebook, TikTok, Snapchat...). Pour des pixels illimités, passez au plan illimité.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {PLATFORMS.map(p => (
                <span key={p.id} className={`text-[10px] px-2 py-1 rounded-full font-medium border border-current ${p.color} bg-opacity-10 bg-current flex items-center gap-1.5`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-current`}></div>
                  {p.name}: {platformCounts[p.id]}/1
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-sm font-medium text-white hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0">
          <ArrowUpCircle className="w-4 h-4" />
          Passer au plan supérieur
        </button>
      </div>

      {/* Main List Area */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-white">Tout votre tracking au même endroit</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Vous pouvez ajouter un pixel par type. Tous les pixels apparaîtront sur toutes les pages. La personnalisation par catégories ou produits est disponible dans le plan illimité.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-800/50 px-3 py-1.5 rounded-full border border-neutral-800 shrink-0">
            <Zap className="w-3.5 h-3.5" />
            Votre plan actuel : <span className="text-white font-medium">Pro</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : pixels.length === 0 ? (
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1e1e24] flex items-center justify-center shadow-lg"><MetaIcon className="w-5 h-5 text-blue-500" /></div>
              <div className="w-10 h-10 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg"><TikTokIcon className="w-5 h-5 text-white" /></div>
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg"><SnapchatIcon className="w-5 h-5 text-black" /></div>
              <div className="w-10 h-10 rounded-xl bg-[#1e1e24] flex items-center justify-center shadow-lg"><PinterestIcon className="w-5 h-5 text-red-500" /></div>
              <div className="w-10 h-10 rounded-xl bg-[#1e1e24] flex items-center justify-center shadow-lg"><GAIcon className="w-5 h-5 text-orange-500" /></div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Aucun pixel ajouté pour le moment</h3>
            <p className="text-sm text-neutral-400 mb-6 max-w-md">
              Ajoutez vos pixels de suivi pour suivre les performances de vos campagnes
            </p>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-2.5 rounded-xl font-medium hover:bg-yellow-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter un premier pixel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pixels.map(pixel => {
              const platformData = PLATFORMS.find(p => p.id === pixel.platform) || PLATFORMS[0];
              return (
                <div key={pixel.id} className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 flex items-center justify-between hover:border-neutral-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#1e1e24] border border-neutral-800`}>
                      <platformData.Icon className={`w-6 h-6 ${platformData.color}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium flex items-center gap-2">
                        {pixel.name || platformData.name}
                        {pixel.status === 'active' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-neutral-600"></span>
                        )}
                      </h4>
                      <p className="text-sm text-neutral-400 font-mono mt-0.5">{pixel.pixelId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(pixel)}
                      className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPixelToDelete(pixel)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Ajouter/Modifier Pixel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full shadow-2xl my-8 transition-all ${modalStep === 'select' ? 'max-w-4xl' : 'max-w-md'}`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800/50">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-neutral-400 border border-neutral-600 rounded-full p-0.5" />
                  {editingPixel ? "Modifier le pixel" : "Ajouter un nouveau pixel"}
                </h2>
                {modalStep === 'select' && (
                  <p className="text-neutral-400 text-sm mt-1">Commencez par sélectionner la plateforme à connecter à votre boutique.</p>
                )}
              </div>
              <button 
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Step 1: Selection */}
            {modalStep === "select" && (
              <>
                <div className="p-6">
                  <h3 className="text-white font-medium text-lg mb-1">Choisissez d'abord la plateforme</h3>
                  <p className="text-neutral-400 text-sm mb-6">
                    Le nom du pixel et son identifiant restent masqués tant que la plateforme n'est pas choisie, pour rendre le parcours plus simple.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => handlePlatformSelect(platform.id)}
                        className="bg-[#16161a] border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center group h-[140px]"
                      >
                        <platform.Icon className={`w-8 h-8 mb-3 ${platform.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-white font-medium text-sm mb-1">{platform.name}</span>
                        {platform.hasSubIcons && (
                          <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <FBIcon className="w-4 h-4 text-blue-500" />
                            <InstaIcon className="w-4 h-4 text-pink-500" />
                            <ThreadsIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-neutral-500 text-[10px] font-mono">{platform.placeholder}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t border-neutral-800/50 flex justify-end">
                  <button 
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 rounded-lg border border-neutral-700 text-white font-medium hover:bg-neutral-800 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}

            {/* Modal Body - Step 2: Form */}
            {modalStep === "form" && (
              <form onSubmit={handleSave} className="flex flex-col h-full max-h-[85vh]">
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Selected Platform Header */}
                  <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#1e1e24] border border-neutral-700 shrink-0`}>
                        {selectedPlatformData && <selectedPlatformData.Icon className={`w-6 h-6 ${selectedPlatformData.color}`} />}
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-0.5">Plateforme sélectionnée</div>
                        <h3 className="text-white font-medium text-lg leading-tight">{selectedPlatformData?.name}</h3>
                        {selectedPlatformData?.id === 'meta' && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                            <FBIcon className="w-3 h-3 text-blue-500" />
                            <InstaIcon className="w-3 h-3 text-pink-500" />
                            <ThreadsIcon className="w-3 h-3 text-white" />
                            Fonctionne automatiquement avec Facebook, Instagram et Threads
                          </div>
                        )}
                      </div>
                    </div>
                    {!editingPixel && (
                      <button 
                        type="button"
                        onClick={() => setModalStep("select")}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e1e24] border border-neutral-700 hover:bg-neutral-800 transition-colors rounded-lg text-sm text-neutral-300"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Changer de plateforme
                      </button>
                    )}
                  </div>

                  {/* YouTube Tutorial */}
                  <a href="#" className="bg-[#1a1114] border border-red-900/30 rounded-xl p-4 flex items-center justify-between group hover:border-red-900/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                        <Youtube className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">Voir le tutoriel sur YouTube</h4>
                        <p className="text-neutral-400 text-xs mt-0.5">Vidéo pas à pas pour configurer le pixel</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                  </a>

                  <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-white font-medium text-lg">Informations du pixel</h3>
                      <p className="text-neutral-400 text-sm mt-1">Ajoutez un nom clair et le bon identifiant afin de retrouver ce pixel facilement plus tard.</p>
                    </div>

                    {/* Nom du pixel */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300">Nom du pixel <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Exemple : Pixel Meta - Campagne Ramadan"
                        className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500"
                      />
                      <p className="text-xs text-neutral-500">Nom descriptif pour identifier ce pixel</p>
                    </div>

                    {/* Pixel ID */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300">Identifiant Pixel (Pixel ID) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={formData.pixelId}
                        onChange={(e) => setFormData({...formData, pixelId: e.target.value})}
                        placeholder={selectedPlatformData?.placeholder || "Ex: 1234567890"}
                        className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500 font-mono"
                      />
                      <p className="text-xs text-neutral-500">Entrez l'identifiant du pixel depuis la plateforme publicitaire</p>
                    </div>

                    {/* Conditional Fields based on platform */}
                    {["meta", "tiktok", "snapchat", "pinterest"].includes(formData.platform) && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Access Token (pour le suivi serveur)</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            value={formData.accessToken}
                            onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                            placeholder="EAxxxxxxxx..."
                            className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500 font-mono"
                          />
                          <div className="absolute right-0 top-0 h-full flex items-center">
                            <div className="px-2">
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            </div>
                            <button type="button" className="h-full px-3 text-neutral-500 hover:text-neutral-300 border-l border-neutral-700">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">Optionnel - Pour le suivi côté serveur (Conversions API / Events API)</p>
                      </div>
                    )}

                    {formData.platform === "pinterest" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Identifiant du compte publicitaire (Ad Account ID)</label>
                        <input 
                          type="text" 
                          value={formData.adAccountId}
                          onChange={(e) => setFormData({...formData, adAccountId: e.target.value})}
                          placeholder="549755885175"
                          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500 font-mono"
                        />
                        <p className="text-xs text-neutral-500">Requis pour le suivi serveur - visible dans Pinterest Ads Manager à côté du nom du compte</p>
                      </div>
                    )}

                    {formData.platform === "gads" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Conversion Label (libellé de conversion)</label>
                        <input 
                          type="text" 
                          value={formData.conversionLabel}
                          onChange={(e) => setFormData({...formData, conversionLabel: e.target.value})}
                          placeholder="AbCdEfGhlj0123456789"
                          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-500 font-mono"
                        />
                        <p className="text-xs text-neutral-500">Requis pour enregistrer les achats - la partie après « / » du send_to dans l'action de conversion Google Ads</p>
                      </div>
                    )}

                    {formData.platform === "meta" && (
                      <div className="bg-[#1e2330] border border-blue-900/50 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                          <h4 className="text-white font-medium text-sm">Vérification de domaine Facebook</h4>
                          <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Optionnel</span>
                        </div>
                        <p className="text-sm text-neutral-300">Ajoutez le code de vérification de votre domaine dans Facebook Business Manager pour diffuser des publicités sur votre domaine personnalisé.</p>
                        
                        <div className="bg-[#2a2118] border border-orange-900/50 rounded-lg p-4 flex gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-orange-500 font-medium text-sm mb-1">Très optionnel — aucune vérification requise</h5>
                            <p className="text-xs text-orange-500/80 leading-relaxed">
                              Vous n'avez pas besoin de vérifier votre domaine pour utiliser le pixel. Sans domaine personnalisé (CNAME pointant vers votre boutique), la vérification peut ne pas aboutir : Facebook refuse souvent les sous-domaines partagés (par exemple <span className="text-red-400">votre-boutique.dzbuild.app</span>). Laissez ce champ vide si vous n'avez pas de domaine personnalisé connecté.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <input 
                            type="text" 
                            value={formData.domainVerification}
                            onChange={(e) => setFormData({...formData, domainVerification: e.target.value})}
                            placeholder="Exemple : abc123xyz..."
                            className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-neutral-500 font-mono"
                          />
                          <div className="flex items-center pt-1">
                            <a href="#" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                              Copiez la valeur contenue dans content="..." du meta tag de vérification. <ExternalLink className="w-3 h-3" /> Obtenir depuis Business Manager
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Toggle */}
                    <div className="flex items-center gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, status: formData.status === 'active' ? 'inactive' : 'active'})}
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${formData.status === 'active' ? "bg-emerald-500" : "bg-neutral-600"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${formData.status === 'active' ? "left-7" : "left-1"}`} />
                      </button>
                      <span className="text-sm font-medium text-white">Pixel activé</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-800/50 flex items-center justify-end gap-3 bg-[#1e1e24] rounded-b-2xl">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-lg border border-neutral-700 text-white font-medium hover:bg-neutral-800 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                  {!editingPixel && (
                    <button 
                      type="button"
                      onClick={() => setModalStep("select")}
                      className="px-4 py-2.5 rounded-lg border border-neutral-700 text-white font-medium hover:bg-neutral-800 transition-colors text-sm flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Changer de plateforme
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-6 py-2.5 rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-70 text-sm"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isSaving ? "Enregistrement..." : "Enregistrer le pixel"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Confirmation de suppression d'un pixel */}
      <ConfirmModal
        isOpen={!!pixelToDelete}
        title="Supprimer le pixel"
        description={`Êtes-vous sûr de vouloir supprimer définitivement le pixel "${pixelToDelete?.name}" (${pixelToDelete?.pixelId}) ?`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setPixelToDelete(null)}
      />
    </div>
  );
}

// --- Icons ---
function MetaIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.11.58-.33.77-.55.77-.48 0-.85-.36-1.16-.62-4.22-3.66-4.64-5.21-6.17-5.21-1.07 0-1.84.5-2.07.82l.37-1.15c.34-1.05 1.4-1.86 2.53-1.86 1.77 0 2.87 2.15 4.3 4.41.67 1.05 1.15 1.48 1.63 1.48.24 0 .44-.12.55-.54.34-1.32.96-5.02.96-5.02.26-1.35.43-1.57.82-1.57s.54.19.83.6l-.87-.3z"/>
    </svg>
  );
}

function TikTokIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

function SnapchatIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.1 1.9c-.3 0-.6 0-.8.1-1.8.3-3.4 1.7-4.1 3.5-.2.5-.2 1.2-.2 1.7 0 .5.1 1.1.2 1.6.4 1 1 2 1.9 2.8.2.2.4.3.4.4s0 .3-.1.4c-.1.2-.4.4-.6.6-.5.4-1.1.8-1.6 1.1-.3.2-.6.3-.9.5-.4.2-1 .3-1.5.3-.2 0-.4 0-.5.1-.3.1-.4.4-.3.7.1.3.4.5.8.7.6.2 1.2.3 1.9.4.5.1 1 .2 1.6.4.3.1.6.2.9.4.3.2.6.4.8.6.1.1.2.2.3.4 0 .1.1.2.2.3.1.1.3.1.4.1h2.5c.1 0 .2 0 .4-.1.1-.1.2-.2.2-.3 0-.1.1-.3.3-.4.2-.2.5-.4.8-.6.3-.2.6-.3.9-.4.6-.2 1.1-.3 1.6-.4.7-.1 1.3-.2 1.9-.4.4-.2.7-.4.8-.7.1-.3 0-.6-.3-.7-.1-.1-.3-.1-.5-.1-.5 0-1.1-.1-1.5-.3-.3-.2-.6-.3-.9-.5-.5-.3-1.1-.7-1.6-1.1-.2-.2-.5-.4-.6-.6-.1-.1-.2-.3-.1-.4s.2-.2.4-.4c.9-.8 1.5-1.8 1.9-2.8.1-.5.2-1.1.2-1.6 0-.5 0-1.2-.2-1.7-.7-1.8-2.3-3.2-4.1-3.5-.2-.1-.5-.1-.8-.1z"/>
    </svg>
  );
}

function PinterestIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/>
    </svg>
  );
}

function GAIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3 15H7v-6h2v6zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
    </svg>
  );
}

function GTMIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M11 2L2 11l9 9 9-9-9-9zm0 13.5l-4.5-4.5 4.5-4.5 4.5 4.5L11 15.5z"/>
    </svg>
  );
}

function GAdsIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/>
    </svg>
  );
}

function FBIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
    </svg>
  );
}

function InstaIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function ThreadsIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.42 16.5c-1.34 2.1-3.6 3.1-6 3.1-4.22 0-7.3-3.13-7.3-7.46s3.08-7.46 7.3-7.46c2.8 0 5.1 1.5 6.3 3.8l-1.9 1c-1-1.7-2.6-2.6-4.4-2.6-3 0-5.2 2.2-5.2 5.3s2.2 5.3 5.2 5.3c1.7 0 3.4-1 4.3-2.6.4-.8.6-1.7.6-2.6v-.3h-4.3v-2.1h6.4v3c0 1.2-.2 2.4-.7 3.6zM14.6 12v.2c0 1-.4 1.9-1.1 2.5-.7.6-1.7 1-2.7 1s-2-.4-2.7-1c-.7-.6-1.1-1.5-1.1-2.5V12c0-1 .4-1.9 1.1-2.5.7-.6 1.7-1 2.7-1s2 .4 2.7 1c.7.6 1.1 1.5 1.1 2.5zm-2.1 0c0-.5-.2-.9-.6-1.2-.4-.3-.9-.5-1.5-.5s-1.1.2-1.5.5c-.4.3-.6.7-.6 1.2v.2c0 .5.2.9.6 1.2.4.3.9.5 1.5.5s1.1-.2 1.5-.5c.4-.3.6-.7.6-1.2V12z"/>
    </svg>
  );
}
