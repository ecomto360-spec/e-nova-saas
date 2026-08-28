import { useState, useEffect, FormEvent } from "react";
import { 
  MonitorPlay, Plus, Youtube, Sparkles, Search, Rocket, Copy, Check, ExternalLink, 
  Edit3, Eye, Trash2, ArrowLeft, CheckCircle2, Clock, ShieldCheck, Truck, Banknote, 
  RotateCcw, Star, ChevronDown, ChevronUp, Smartphone, Laptop, Save, AlertCircle, 
  X, HelpCircle, Layers, Settings as SettingsIcon, Package, RefreshCw, ShoppingCart
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { LandingPage, LandingProduct, LandingSection, AlgerianWilaya } from "../types/landing";
import { SAMPLE_PRODUCTS, ALGERIAN_WILAYAS, getDefaultSectionsForProduct } from "../data/landingData";
import { generateAILandingContent } from "../lib/aiLanding";
import { ConfirmModal } from "../components/common/ConfirmModal";

interface LandingPagesProps {
  defaultView?: "list" | "new" | "edit";
}

export default function LandingPages({ defaultView = "list" }: LandingPagesProps) {
  const { user } = useAuth();
  const [storeSubdomain, setStoreSubdomain] = useState("mimi-1");
  const [storeName, setStoreName] = useState("Mimi Store");
  const [subscriptionPlan, setSubscriptionPlan] = useState("professionnel");
  
  // Data state
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [availableProducts, setAvailableProducts] = useState<LandingProduct[]>(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(true);

  // View state: 'list' | 'create_step' | 'editor'
  const [currentView, setCurrentView] = useState<"list" | "create_step" | "editor">(defaultView === "new" ? "create_step" : "list");
  const [selectedPageForEdit, setSelectedPageForEdit] = useState<LandingPage | null>(null);

  // Search & Filter in list
  const [searchQuery, setSearchQuery] = useState("");
  
  // Creation Stepper State (Screenshots 2, 3, 4)
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<LandingProduct | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Editor State (Screenshot 5)
  const [editorTab, setEditorTab] = useState<"sections" | "params">("params");
  const [editorDevice, setEditorDevice] = useState<"mobile" | "desktop">("mobile");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<LandingPage | null>(null);
  const [pageToDelete, setPageToDelete] = useState<LandingPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Generation State
  const [aiPromptName, setAiPromptName] = useState("");
  const [aiPromptPrice, setAiPromptPrice] = useState(2500);
  const [aiPromptNotes, setAiPromptNotes] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopy = (text: string, label: string = "Lien") => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copié dans le presse-papiers !`);
  };

  // Helper to format slug
  const formatSlug = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const tenantRef = doc(db, "tenants", user.uid);
    const unsubscribe = onSnapshot(tenantRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const sub = data.subdomain || data.slug || "mimi-1";
        setStoreSubdomain(sub);
        setStoreName(data.storeName || "Mimi Store");
        setSubscriptionPlan(data.subscriptionPlan || "professionnel");

        // Merge custom products if any
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          const userProds: LandingProduct[] = data.products.map((p: any) => ({
            id: p.id || `prod-${Date.now()}`,
            name: p.name || "Produit sans titre",
            price: Number(p.price) || 1500,
            originalPrice: Number(p.originalPrice) || Number(p.price) * 1.3,
            image: p.image || p.imageUrl || SAMPLE_PRODUCTS[0].image,
            description: p.description || "",
            category: p.category || "Général",
            stock: Number(p.stock) || 20
          }));
          setAvailableProducts([...userProds, ...SAMPLE_PRODUCTS]);
        }

        // Load or initialize landing pages
        if (data.landingPages && Array.isArray(data.landingPages)) {
          setPages(data.landingPages);
        } else {
          // Initialize with default sample page matching screenshot 6 (vetement luxe)
          const defaultSamplePage: LandingPage = {
            id: "lp-sample-vetement-luxe",
            title: "vetement luxe",
            slug: "t-shirt-exemple",
            description: "Offre promotionnelle exclusive sur notre collection de vêtements de luxe.",
            status: "active",
            productId: SAMPLE_PRODUCTS[0].id,
            product: SAMPLE_PRODUCTS[0],
            seoTitle: "vetement luxe",
            seoDescription: "Achetez vetement luxe au meilleur prix avec livraison express 58 Wilayas.",
            viewsCount: 0,
            ordersCount: 0,
            createdAt: "2026/08/22",
            updatedAt: "2026/08/22",
            sections: getDefaultSectionsForProduct(SAMPLE_PRODUCTS[0]),
            theme: {
              primaryColor: "#f59e0b",
              accentColor: "#10b981",
              backgroundColor: "#ffffff",
              textColor: "#111827",
              fontFamily: "Inter, sans-serif"
            }
          };
          setPages([defaultSamplePage]);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore read error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Persist pages to Firestore
  const savePagesToFirestore = async (newPages: LandingPage[]) => {
    setPages(newPages);
    if (!user) return;
    try {
      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, {
        landingPages: newPages,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error saving landing pages to Firestore:", err);
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  // Select Product Handler (Screenshot 4)
  const handleSelectProduct = (prod: LandingProduct) => {
    setSelectedProduct(prod);
    setProductPickerOpen(false);
    if (!newTitle) {
      setNewTitle(`Offre spéciale - ${prod.name}`);
    }
    const autoSlug = formatSlug(prod.name);
    setNewSlug(autoSlug);
    setCreationStep(2);
  };

  // Create Page and Open Editor (Screenshots 2 -> 5)
  const handleCreatePage = async () => {
    if (!selectedProduct) {
      showToast("Veuillez d'abord choisir un produit", "error");
      return;
    }

    const title = newTitle.trim() || `Offre spéciale - ${selectedProduct.name}`;
    const slug = formatSlug(newSlug || selectedProduct.name);

    if (pages.some(p => p.slug === slug)) {
      showToast(`Le lien "landing/${slug}" existe déjà, veuillez en choisir un autre`, "error");
      return;
    }

    const newPage: LandingPage = {
      id: `lp-${Date.now()}`,
      title,
      slug,
      description: newDescription.trim() || `Page d'atterrissage pour ${selectedProduct.name}`,
      status: "active",
      productId: selectedProduct.id,
      product: selectedProduct,
      seoTitle: title,
      seoDescription: newDescription.trim() || `Commandez ${selectedProduct.name} au meilleur prix.`,
      viewsCount: 0,
      ordersCount: 0,
      createdAt: new Date().toLocaleDateString("fr-FR"),
      updatedAt: new Date().toLocaleDateString("fr-FR"),
      sections: getDefaultSectionsForProduct(selectedProduct),
      theme: {
        primaryColor: "#f59e0b",
        accentColor: "#10b981",
        backgroundColor: "#ffffff",
        textColor: "#111827",
        fontFamily: "Inter, sans-serif"
      }
    };

    const updated = [newPage, ...pages];
    await savePagesToFirestore(updated);

    setSelectedPageForEdit(newPage);
    setCurrentView("editor");
    setEditorTab("params");
    showToast(`Page "${title}" créée avec succès !`);
  };

  // AI Page Generation Handler
  const handleGenerateWithAI = async () => {
    if (!aiPromptName.trim()) {
      showToast("Veuillez saisir le nom du produit", "error");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const generated = await generateAILandingContent(
        aiPromptName,
        aiPromptPrice,
        "Tous publics en Algérie",
        aiPromptNotes
      );

      const tempProd: LandingProduct = {
        id: `ai-prod-${Date.now()}`,
        name: aiPromptName.trim(),
        price: aiPromptPrice,
        originalPrice: Math.round(aiPromptPrice * 1.45),
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        description: aiPromptNotes || `Offre spéciale sur ${aiPromptName.trim()}`
      };

      const newPage: LandingPage = {
        id: `lp-ai-${Date.now()}`,
        title: generated.title,
        slug: generated.slug,
        description: generated.seoDescription,
        status: "active",
        productId: tempProd.id,
        product: tempProd,
        seoTitle: generated.seoTitle,
        seoDescription: generated.seoDescription,
        viewsCount: 0,
        ordersCount: 0,
        createdAt: new Date().toLocaleDateString("fr-FR"),
        updatedAt: new Date().toLocaleDateString("fr-FR"),
        sections: generated.sections,
        theme: {
          primaryColor: "#f59e0b",
          accentColor: "#10b981",
          backgroundColor: "#ffffff",
          textColor: "#111827",
          fontFamily: "Inter, sans-serif"
        }
      };

      const updated = [newPage, ...pages];
      await savePagesToFirestore(updated);

      setIsGeneratingAI(false);
      setAiModalOpen(false);
      setSelectedPageForEdit(newPage);
      setCurrentView("editor");
      setEditorTab("sections");
      showToast("Page générée avec succès grâce à l'IA !");
    } catch (err) {
      console.error("AI Generation error:", err);
      setIsGeneratingAI(false);
      showToast("Erreur lors de la génération IA", "error");
    }
  };

  // Save Editor Changes (Screenshot 5)
  const handleSaveEditor = async () => {
    if (!selectedPageForEdit) return;
    setIsSaving(true);
    try {
      const updatedList = pages.map(p => 
        p.id === selectedPageForEdit.id 
          ? { ...selectedPageForEdit, updatedAt: new Date().toLocaleDateString("fr-FR") }
          : p
      );
      await savePagesToFirestore(updatedList);
      setIsSaving(false);
      showToast("Toutes les modifications ont été enregistrées avec succès !");
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      showToast("Erreur d'enregistrement", "error");
    }
  };

  // Delete Page
  const handleConfirmDeletePage = async () => {
    if (!pageToDelete) return;
    setIsDeleting(true);
    try {
      const updated = pages.filter(p => p.id !== pageToDelete.id);
      await savePagesToFirestore(updated);
      showToast(`Page "${pageToDelete.title}" supprimée.`);
      setPageToDelete(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression de la page", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered pages for list
  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-bounce ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {toast.text}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: MAIN LIST OF LANDING PAGES (Screenshots 1 & 6) */}
      {/* ========================================================================= */}
      {currentView === "list" && (
        <div className="space-y-6">
          {/* Header Card with 3 buttons */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                    Pages d'atterrissage
                  </h1>
                  <p className="text-sm text-neutral-400 mt-1">
                    Créez des pages d'atterrissage professionnelles pour vos campagnes publicitaires (TikTok, Facebook, Instagram)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="btn-landing-tutorial"
                  onClick={() => setTutorialModalOpen(true)}
                  className="bg-[#e50914] hover:bg-[#b80710] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                  Voir le tutoriel
                </button>

                <button
                  id="btn-landing-ai"
                  onClick={() => setAiModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Créer avec l'IA
                </button>

                <button
                  id="btn-create-new-landing"
                  onClick={() => {
                    setSelectedProduct(null);
                    setNewTitle("");
                    setNewSlug("");
                    setNewDescription("");
                    setCreationStep(1);
                    setCurrentView("create_step");
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Créer une nouvelle page
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar (Screenshot 6) */}
          {pages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <MonitorPlay className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{pages.length}</div>
                  <div className="text-xs text-neutral-400">Total des pages</div>
                </div>
              </div>

              <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {pages.reduce((acc, p) => acc + (p.viewsCount || 0), 0)}
                  </div>
                  <div className="text-xs text-neutral-400">Total des vues</div>
                </div>
              </div>

              <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">500</div>
                    <div className="text-xs text-neutral-400">Solde Crédits IA</div>
                  </div>
                </div>
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Utiliser IA →
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          {pages.length > 0 && (
            <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les pages..."
                  className="w-full bg-[#1e1e24] border border-neutral-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-neutral-500"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-[#1e1e24] px-3 py-2 rounded-lg text-neutral-400 border border-neutral-800">
                <span>📁</span>
                <span>{filteredPages.length}</span>
              </div>
            </div>
          )}

          {/* Plan Limit Banner */}
          <div className="bg-[#241c14] border border-orange-900/40 rounded-xl p-4 flex items-center gap-3">
            <Rocket className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-white">Plan professionnel - {pages.length}/3 pages</span>
              <span className="text-neutral-400 ml-2">
                Vous pouvez créer {Math.max(0, 3 - pages.length)} page(s) supplémentaire(s)
              </span>
            </div>
          </div>

          {/* EMPTY STATE (Screenshot 1) */}
          {pages.length === 0 && (
            <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-12 sm:p-16 text-center max-w-xl mx-auto shadow-sm space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/5">
                <Rocket className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Commencez par créer une page</h2>
                <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Les pages d'atterrissage vous aident à convertir les visiteurs en clients. Créez votre première page maintenant et augmentez vos ventes.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setNewTitle("");
                  setNewSlug("");
                  setNewDescription("");
                  setCreationStep(1);
                  setCurrentView("create_step");
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-yellow-500/20"
              >
                <Plus className="w-4 h-4" />
                Créer une page
              </button>
            </div>
          )}

          {/* PAGE CARDS GRID / LIST (Screenshot 6) */}
          {pages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPages.map((page) => {
                const fullUrl = `https://e-nova.vercel.app/store/${storeSubdomain}/landing/${page.slug}`;
                return (
                  <div 
                    key={page.id}
                    className="bg-[#16161a] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 space-y-4 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top: Title & Status */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-base font-bold text-white truncate">{page.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded shrink-0">
                          {page.status === "active" ? "Active" : "Brouillon"}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-4">
                        <span className="flex items-center gap-1 font-mono">
                          📅 {page.createdAt}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          🗂 {page.sections?.length || 0} section(s)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          👁 {page.viewsCount || 0}
                        </span>
                      </div>

                      {/* URL Box with Copy Button */}
                      <div className="bg-[#1e1e24] border border-neutral-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-yellow-500 text-xs">🔗</span>
                          <span className="text-xs text-neutral-300 font-mono truncate">
                            {fullUrl}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(fullUrl, "Lien de la page")}
                          className="bg-yellow-500/10 hover:bg-yellow-500 hover:text-black text-yellow-400 p-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
                          title="Copier le lien"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedPageForEdit(page);
                          setCurrentView("editor");
                          setEditorTab("params");
                        }}
                        className="flex-1 bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-yellow-500" />
                        Modifier
                      </button>

                      <button
                        onClick={() => {
                          setPreviewPage(page);
                          setPreviewModalOpen(true);
                        }}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Aperçu
                      </button>

                      <button
                        onClick={() => setPageToDelete(page)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Supprimer la page"
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: STEPPER CREATION WIZARD (Screenshots 2, 3, 4) */}
      {/* ========================================================================= */}
      {currentView === "create_step" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Back button & Title */}
          <div>
            <button
              onClick={() => setCurrentView("list")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white bg-[#16161a] border border-neutral-800 px-3 py-1.5 rounded-lg mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">Créer une nouvelle page d'atterrissage</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Choisissez votre produit et personnalisez votre page en quelques étapes simples
            </p>
          </div>

          {/* Stepper Bar */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                selectedProduct ? "bg-emerald-500 text-black" : "bg-yellow-500 text-black"
              }`}>
                {selectedProduct ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className="text-xs sm:text-sm font-medium text-white">Choix du produit</span>
            </div>

            <div className="w-12 h-px bg-neutral-800" />

            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                selectedProduct ? "bg-yellow-500 text-black" : "bg-neutral-800 text-neutral-400"
              }`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium text-neutral-300">Informations de la page</span>
            </div>

            <div className="w-12 h-px bg-neutral-800" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-medium text-neutral-500">Création</span>
            </div>
          </div>

          {/* Step 1: Product Selection (Screenshots 2 & 4) */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-500" />
              <h2 className="text-base font-bold text-white">Choix du produit</h2>
              <span className="text-[10px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                Requis
              </span>
            </div>

            {/* If NO product chosen (Screenshot 2) */}
            {!selectedProduct && (
              <div 
                onClick={() => setProductPickerOpen(true)}
                className="border-2 border-dashed border-neutral-700 hover:border-yellow-500 rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all bg-[#1e1e24]/40 hover:bg-[#1e1e24]/80 group"
              >
                <div className="w-16 h-16 rounded-full bg-yellow-500 text-black flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-500/20">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Choisir un produit</h3>
                <p className="text-xs text-neutral-400">Cliquez ici pour choisir le produit à promouvoir dans votre catalogue</p>
              </div>
            )}

            {/* If product chosen (Screenshot 4) */}
            {selectedProduct && (
              <div className="bg-[#1e1e24] border-2 border-yellow-500/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-yellow-500/5">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-700 bg-[#16161a]"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedProduct.name}</h3>
                    <div className="text-sm font-bold text-yellow-500 mt-0.5">
                      {selectedProduct.price.toLocaleString("fr-DZ")} DA
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setProductPickerOpen(true)}
                  className="bg-[#16161a] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 self-end sm:self-center"
                >
                  <Edit3 className="w-3.5 h-3.5 text-yellow-500" />
                  Changer
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Page Information (Screenshots 2 & 4) */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-yellow-500" />
              <h2 className="text-base font-bold text-white">Informations de la page</h2>
            </div>

            {/* Titre de la page */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Titre de la page
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Exemple : Offre spéciale - Produit incroyable"
                className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-neutral-500"
              />
            </div>

            {/* Lien de la page (Slug) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Lien de la page (Slug)
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(formatSlug(e.target.value))}
                placeholder="auto-generated-if-empty"
                className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-yellow-500 placeholder-neutral-500"
              />
              <div className="bg-[#121215] border border-neutral-800 rounded-xl p-3 mt-2">
                <div className="text-[11px] text-neutral-500 mb-1">Aperçu du lien :</div>
                <div className="text-xs text-emerald-400 font-mono break-all">
                  https://e-nova.vercel.app/store/{storeSubdomain}/landing/{newSlug || "your-slug"}
                </div>
              </div>
            </div>

            {/* Description courte */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Description courte (optionnel)
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Courte description de la page pour les résultats de recherche"
                className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Submit Action (Screenshots 2 & 4) */}
          <div className="space-y-2">
            <button
              onClick={handleCreatePage}
              disabled={!selectedProduct}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/20 disabled:opacity-50"
            >
              <Rocket className="w-5 h-5" />
              Créer la page et commencer la modification
            </button>
            <p className="text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Après la création, vous pourrez ajouter des sections et personnaliser le design
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: FULL VISUAL LANDING PAGE EDITOR (Screenshot 5) */}
      {/* ========================================================================= */}
      {currentView === "editor" && selectedPageForEdit && (
        <div className="space-y-4 -mt-2">
          {/* Top Bar */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView("list")}
                className="p-2 rounded-xl bg-[#1e1e24] hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                title="Retour à la liste"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4 text-yellow-500" />
                  Éditeur de page
                </h1>
              </div>

              {/* URL Pill */}
              <div className="hidden md:flex items-center gap-2 bg-[#1e1e24] border border-neutral-700/80 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-yellow-500">🔗</span>
                <span className="text-neutral-300 font-mono">
                  https://e-nova.vercel.app/store/{storeSubdomain}/landing/{selectedPageForEdit.slug}
                </span>
                <button
                  onClick={() => handleCopy(`https://e-nova.vercel.app/store/${storeSubdomain}/landing/${selectedPageForEdit.slug}`)}
                  className="text-neutral-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right Top Actions */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              {/* Device Toggle */}
              <div className="flex items-center bg-[#1e1e24] border border-neutral-800 p-1 rounded-xl">
                <button
                  onClick={() => setEditorDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    editorDevice === "mobile" ? "bg-yellow-500 text-black" : "text-neutral-400 hover:text-white"
                  }`}
                  title="Vue Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditorDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    editorDevice === "desktop" ? "bg-yellow-500 text-black" : "text-neutral-400 hover:text-white"
                  }`}
                  title="Vue Ordinateur"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => {
                  setPreviewPage(selectedPageForEdit);
                  setPreviewModalOpen(true);
                }}
                className="bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-yellow-500" />
                Aperçu
              </button>

              {/* Quick Save */}
              <button
                onClick={handleSaveEditor}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>

          {/* Main Editor Grid (Sidebar + Live Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            {/* LEFT SIDEBAR: TABS & CONTROLS */}
            <div className="bg-[#16161a] border border-neutral-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              {/* Tab Header (Sections vs Paramètres) */}
              <div className="grid grid-cols-2 border-b border-neutral-800 p-2 gap-2 bg-[#121215]">
                <button
                  onClick={() => setEditorTab("sections")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    editorTab === "sections"
                      ? "bg-[#1e1e24] border border-yellow-500/40 text-yellow-400 shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Sections ({selectedPageForEdit.sections.length})
                </button>

                <button
                  onClick={() => setEditorTab("params")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    editorTab === "params"
                      ? "bg-[#1e1e24] border border-yellow-500/40 text-yellow-400 shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Paramètres
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto">
                {/* TAB CONTENT: PARAMÈTRES (Screenshot 5) */}
                {editorTab === "params" && (
                  <div className="space-y-4">
                    {/* Titre de la page */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-300">
                        Titre de la page
                      </label>
                      <input
                        type="text"
                        value={selectedPageForEdit.title}
                        onChange={(e) => setSelectedPageForEdit({ ...selectedPageForEdit, title: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    {/* Lien de la page (Slug) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-300">
                        Lien de la page
                      </label>
                      <div className="flex items-center bg-[#1e1e24] border border-neutral-700 rounded-xl overflow-hidden px-3">
                        <span className="text-xs text-neutral-500 font-mono">
                          https://e-nova.vercel.app/store/{storeSubdomain}/landing/
                        </span>
                        <input
                          type="text"
                          value={selectedPageForEdit.slug}
                          onChange={(e) => setSelectedPageForEdit({ ...selectedPageForEdit, slug: formatSlug(e.target.value) })}
                          className="flex-1 bg-transparent py-2.5 text-xs text-yellow-400 font-mono focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        (max 40) أحرف لاتينية صغيرة وأرقام وشرطات فقط
                      </p>
                    </div>

                    {/* Titre SEO */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-300">
                        Titre SEO
                      </label>
                      <input
                        type="text"
                        value={selectedPageForEdit.seoTitle || selectedPageForEdit.title}
                        onChange={(e) => setSelectedPageForEdit({ ...selectedPageForEdit, seoTitle: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    {/* Description SEO */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-300">
                        Description SEO
                      </label>
                      <textarea
                        rows={3}
                        value={selectedPageForEdit.seoDescription || ""}
                        onChange={(e) => setSelectedPageForEdit({ ...selectedPageForEdit, seoDescription: e.target.value })}
                        className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    {/* Produit par défaut (المنتج الافتراضي) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1">
                        <span>📦</span>
                        <span>المنتج الافتراضي (Produit associé)</span>
                      </label>
                      <div className="bg-[#1e1e24] border border-neutral-700 rounded-xl p-3 flex items-center justify-between">
                        <div className="text-xs font-medium text-white">
                          {selectedPageForEdit.product?.name || "T-shirt — exemple"}
                        </div>
                        <button
                          onClick={() => setProductPickerOpen(true)}
                          className="text-[11px] text-yellow-400 hover:text-yellow-300 font-semibold"
                        >
                          Changer
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        يُستخدم لحساب السعر والإجمالي في نماذج الطلب ℹ️
                      </p>
                    </div>

                    {/* Pixels Tracking */}
                    <div className="pt-3 border-t border-neutral-800 space-y-3">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        Pixels & Publicités
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Facebook Pixel ID</label>
                        <input
                          type="text"
                          placeholder="Ex: 123456789012345"
                          value={selectedPageForEdit.pixelFacebook || ""}
                          onChange={(e) => setSelectedPageForEdit({ ...selectedPageForEdit, pixelFacebook: e.target.value })}
                          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">TikTok Pixel ID</label>
                        <input
                          type="text"
                          placeholder="Ex: C89AB34..."
                          value={selectedPageForEdit.pixelTiktok || ""}
                          onChange={(e) => setSelectedPageForEdit({ ...selectedPageForEdit, pixelTiktok: e.target.value })}
                          className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: SECTIONS */}
                {editorTab === "sections" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                      <span>Organisez vos sections</span>
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded">
                        Glisser / Réorganiser
                      </span>
                    </div>

                    {selectedPageForEdit.sections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        className={`bg-[#1e1e24] border rounded-xl p-3 transition-all ${
                          editingSectionId === sec.id ? "border-yellow-500" : "border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-neutral-500">#{idx + 1}</span>
                            <span className="text-xs font-semibold text-white">{sec.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Toggle visibility */}
                            <button
                              onClick={() => {
                                const newSecs = [...selectedPageForEdit.sections];
                                newSecs[idx].enabled = !newSecs[idx].enabled;
                                setSelectedPageForEdit({ ...selectedPageForEdit, sections: newSecs });
                              }}
                              className={`p-1 rounded text-[10px] font-bold ${
                                sec.enabled ? "text-emerald-400 bg-emerald-500/10" : "text-neutral-500 bg-neutral-800"
                              }`}
                            >
                              {sec.enabled ? "Actif" : "Masqué"}
                            </button>

                            {/* Edit toggle */}
                            <button
                              onClick={() => setEditingSectionId(editingSectionId === sec.id ? null : sec.id)}
                              className="p-1 text-neutral-400 hover:text-white"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Section Config if expanded */}
                        {editingSectionId === sec.id && (
                          <div className="mt-3 pt-3 border-t border-neutral-700/80 space-y-3">
                            <div>
                              <label className="block text-[11px] text-neutral-400 mb-1">Titre de la section</label>
                              <input
                                type="text"
                                value={sec.title}
                                onChange={(e) => {
                                  const newSecs = [...selectedPageForEdit.sections];
                                  newSecs[idx].title = e.target.value;
                                  setSelectedPageForEdit({ ...selectedPageForEdit, sections: newSecs });
                                }}
                                className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>

                            {/* Section Specific Fields */}
                            {sec.type === "hero" && (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] text-neutral-400">Grand Titre</label>
                                  <input
                                    type="text"
                                    value={sec.data.headline || ""}
                                    onChange={(e) => {
                                      const newSecs = [...selectedPageForEdit.sections];
                                      newSecs[idx].data.headline = e.target.value;
                                      setSelectedPageForEdit({ ...selectedPageForEdit, sections: newSecs });
                                    }}
                                    className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-neutral-400">Texte Bouton CTA</label>
                                  <input
                                    type="text"
                                    value={sec.data.ctaText || ""}
                                    onChange={(e) => {
                                      const newSecs = [...selectedPageForEdit.sections];
                                      newSecs[idx].data.ctaText = e.target.value;
                                      setSelectedPageForEdit({ ...selectedPageForEdit, sections: newSecs });
                                    }}
                                    className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                </div>
                              </div>
                            )}

                            {sec.type === "countdown" && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-neutral-400">Stock restant</label>
                                  <input
                                    type="number"
                                    value={sec.data.remainingStock || 7}
                                    onChange={(e) => {
                                      const newSecs = [...selectedPageForEdit.sections];
                                      newSecs[idx].data.remainingStock = Number(e.target.value);
                                      setSelectedPageForEdit({ ...selectedPageForEdit, sections: newSecs });
                                    }}
                                    className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-neutral-400">Heures restantes</label>
                                  <input
                                    type="number"
                                    value={sec.data.hours || 3}
                                    onChange={(e) => {
                                      const newSecs = [...selectedPageForEdit.sections];
                                      newSecs[idx].data.hours = Number(e.target.value);
                                      setSelectedPageForEdit({ ...selectedPageForEdit, sections: newSecs });
                                    }}
                                    className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Save Action in Sidebar (Screenshot 5) */}
              <div className="p-4 border-t border-neutral-800 bg-[#121215]">
                <button
                  onClick={handleSaveEditor}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer toutes les modifications
                </button>
              </div>
            </div>

            {/* RIGHT PANEL: LIVE INTERACTIVE PREVIEW CONTAINER (Screenshot 5) */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-neutral-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Rendu en direct de votre page d'atterrissage</span>
              </div>

              {/* Viewport Frame */}
              <div 
                className={`bg-white text-neutral-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-neutral-800 transition-all ${
                  editorDevice === "mobile" 
                    ? "w-full max-w-[390px] min-h-[720px]" 
                    : "w-full max-w-[900px] min-h-[720px]"
                }`}
              >
                {/* Simulated Algerian High-Converting Landing Page Render */}
                <LandingPageLiveRenderer 
                  page={selectedPageForEdit} 
                  wilayas={ALGERIAN_WILAYAS}
                  onOrderPlaced={(orderData) => {
                    showToast(`🎉 Simulation de commande reçue : ${orderData.fullName} (${orderData.phone}) !`);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PRODUCT PICKER (Screenshot 3) */}
      {/* ========================================================================= */}
      {productPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-bold text-white">Choisir un produit</h3>
              </div>
              <button 
                onClick={() => setProductPickerOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Rechercher un produit par nom..."
                className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-neutral-500"
              />
            </div>

            {/* Products Grid (Screenshot 3) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1">
              {availableProducts
                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                .map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (currentView === "editor" && selectedPageForEdit) {
                        setSelectedPageForEdit({
                          ...selectedPageForEdit,
                          productId: prod.id,
                          product: prod
                        });
                        setProductPickerOpen(false);
                        showToast(`Produit associé mis à jour vers ${prod.name}`);
                      } else {
                        handleSelectProduct(prod);
                      }
                    }}
                    className="bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700/80 hover:border-yellow-500 rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center group"
                  >
                    <img 
                      src={prod.image} 
                      alt={prod.name}
                      className="w-24 h-24 rounded-lg object-cover mb-2.5 bg-[#121215] group-hover:scale-105 transition-transform"
                    />
                    <div className="text-xs font-semibold text-white truncate w-full mb-1">
                      {prod.name}
                    </div>
                    <div className="text-xs font-bold text-yellow-500">
                      {prod.price.toLocaleString("fr-DZ")} DA
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AI LANDING PAGE GENERATOR */}
      {/* ========================================================================= */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Générateur de Page par IA</h3>
                  <p className="text-xs text-neutral-400">Rédige des textes percutants adaptés au marché algérien</p>
                </div>
              </div>
              <button 
                onClick={() => setAiModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nom du produit ou offre
                </label>
                <input
                  type="text"
                  value={aiPromptName}
                  onChange={(e) => setAiPromptName(e.target.value)}
                  placeholder="Ex: Montre Homme Luxe Quartz + Bracelet Cuir"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Prix de vente en Dinar (DZD)
                </label>
                <input
                  type="number"
                  value={aiPromptPrice}
                  onChange={(e) => setAiPromptPrice(Number(e.target.value))}
                  placeholder="Ex: 3500"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Points forts ou détails supplémentaires (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={aiPromptNotes}
                  onChange={(e) => setAiPromptNotes(e.target.value)}
                  placeholder="Ex: Étanche, livraison gratuite pour 2 pièces achetées, garantie 1 an..."
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateWithAI}
              disabled={isGeneratingAI || !aiPromptName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50"
            >
              {isGeneratingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGeneratingAI ? "Génération des sections en cours..." : "Générer la page d'atterrissage complète"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TUTORIAL / ADS STRATEGY */}
      {/* ========================================================================= */}
      {tutorialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Youtube className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-white">Guide Vidéo & Stratégie E-Commerce DZ</h3>
                  <p className="text-xs text-neutral-400">Comment maximiser votre taux de conversion avec les pages d'atterrissage</p>
                </div>
              </div>
              <button 
                onClick={() => setTutorialModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-[#1e1e24] rounded-xl flex flex-col items-center justify-center p-6 text-center border border-neutral-800">
              <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mb-3">
                <Youtube className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Tutoriel Express : Vendre avec DZBuild Landing Pages</h4>
              <p className="text-xs text-neutral-400 max-w-md">
                Découvrez comment lier votre Pixel TikTok / Facebook, créer un formulaire COD avec 58 wilayas et doubler vos commandes en ligne.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#1e1e24] p-3 rounded-xl border border-neutral-800 text-xs">
                <div className="font-bold text-yellow-500 mb-1">1. Formulaire COD Simplifié</div>
                <div className="text-neutral-400 text-[11px]">Pas de panier complexe, saisie directe Nom + Wilaya + Numéro.</div>
              </div>
              <div className="bg-[#1e1e24] p-3 rounded-xl border border-neutral-800 text-xs">
                <div className="font-bold text-yellow-500 mb-1">2. Offres en lot (Bundles)</div>
                <div className="text-neutral-400 text-[11px]">Augmentez le panier moyen avec des réductions sur 2 ou 3 articles.</div>
              </div>
              <div className="bg-[#1e1e24] p-3 rounded-xl border border-neutral-800 text-xs">
                <div className="font-bold text-yellow-500 mb-1">3. Vitesse & Mobile First</div>
                <div className="text-neutral-400 text-[11px]">Chargement ultra-rapide optimisé pour les connexions 4G en Algérie.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FULL SCREEN PREVIEW */}
      {/* ========================================================================= */}
      {previewModalOpen && previewPage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-white">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-bold font-mono">Aperçu en direct : https://e-nova.vercel.app/store/{storeSubdomain}/landing/{previewPage.slug}</span>
            </div>
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              Fermer l'aperçu
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
            <div className="bg-white text-neutral-900 w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden border border-neutral-700">
              <LandingPageLiveRenderer 
                page={previewPage} 
                wilayas={ALGERIAN_WILAYAS}
                onOrderPlaced={(order) => {
                  showToast(`Commande test validée pour ${order.fullName} !`);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation de suppression d'une landing page */}
      <ConfirmModal
        isOpen={!!pageToDelete}
        title="Supprimer la landing page"
        description={`Êtes-vous sûr de vouloir supprimer définitivement la landing page "${pageToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeletePage}
        onClose={() => setPageToDelete(null)}
      />
    </div>
  );
}

// =================================================================================
// SUB-COMPONENT: REAL ALGERIAN LANDING PAGE RENDERER (Clean, Conversion-Focused)
// =================================================================================
function LandingPageLiveRenderer({ 
  page, 
  wilayas,
  onOrderPlaced 
}: { 
  page: LandingPage; 
  wilayas: AlgerianWilaya[];
  onOrderPlaced: (order: any) => void;
}) {
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // Default 16 Alger
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("b2");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const curWilaya = wilayas.find(w => w.code === selectedWilayaCode) || wilayas[0];
  const currentPrice = page.product?.price || 1500;
  const originalPrice = page.product?.originalPrice || Math.round(currentPrice * 1.4);

  // Bundle calculations
  let quantity = 1;
  let itemsTotal = currentPrice;
  if (selectedBundleId === "b2") {
    quantity = 2;
    itemsTotal = Math.round(currentPrice * 1.8);
  } else if (selectedBundleId === "b3") {
    quantity = 3;
    itemsTotal = Math.round(currentPrice * 2.5);
  }

  const deliveryFee = selectedBundleId === "b3" ? 0 : (deliveryType === "home" ? curWilaya.homeDeliveryPrice : curWilaya.deskDeliveryPrice);
  const grandTotal = itemsTotal + deliveryFee;

  const handleSubmitOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert("Veuillez saisir votre Nom et Numéro de téléphone");
      return;
    }
    setOrderSuccess(true);
    onOrderPlaced({
      fullName,
      phone,
      wilaya: curWilaya.name,
      deliveryType,
      quantity,
      total: grandTotal
    });
  };

  return (
    <div className="font-sans text-neutral-900 bg-white min-h-[600px] select-none text-left">
      {/* Top Urgent Bar */}
      <div className="bg-red-600 text-white text-[11px] font-bold py-1.5 px-3 text-center flex items-center justify-center gap-1.5 animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        <span>⚡ Offre Spéciale limitée • Paiement à la réception (58 Wilayas)</span>
      </div>

      {/* Hero Section */}
      <div className="p-4 border-b border-neutral-100">
        <div className="relative rounded-xl overflow-hidden mb-3 bg-neutral-100">
          <img 
            src={page.product?.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"} 
            alt={page.product?.name}
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded shadow">
            🔥 -30% Réduction
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-neutral-900 leading-snug mb-1">
          {page.title}
        </h1>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-amber-400">
            {"★".repeat(5)}
          </div>
          <span className="text-xs text-neutral-500 font-semibold">(4.9/5 • 148 avis clients vérifiés)</span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-3 mb-4 bg-amber-50/80 p-3 rounded-xl border border-amber-200/60">
          <span className="text-2xl font-black text-amber-700">
            {currentPrice.toLocaleString("fr-DZ")} DZD
          </span>
          <span className="text-sm line-through text-neutral-400 font-semibold">
            {originalPrice.toLocaleString("fr-DZ")} DZD
          </span>
        </div>

        {/* Fast CTA Anchor */}
        <a 
          href="#order-form"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-center text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          COMMANDER MAINTENANT (COD)
        </a>
      </div>

      {/* Countdown Bar */}
      <div className="bg-neutral-900 text-white p-3 text-center">
        <div className="text-xs font-bold text-yellow-400 mb-1">
          ⏳ L'offre expire dans :
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
          <span className="bg-neutral-800 px-2 py-1 rounded">02 H</span>
          <span>:</span>
          <span className="bg-neutral-800 px-2 py-1 rounded">47 M</span>
          <span>:</span>
          <span className="bg-neutral-800 px-2 py-1 rounded">35 S</span>
        </div>
      </div>

      {/* Features bullet points */}
      <div className="p-4 bg-neutral-50 border-b border-neutral-100 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Pourquoi nous faire confiance :</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-neutral-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-neutral-800">Garantie 100%</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-neutral-200">
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-neutral-800">58 Wilayas</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-neutral-200">
            <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-neutral-800">Paiement à réception</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-neutral-200">
            <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-semibold text-neutral-800">Échange facile</span>
          </div>
        </div>
      </div>

      {/* PACKS / BUNDLES (High AOV) */}
      <div className="p-4 border-b border-neutral-100 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Choisissez votre pack promotionnel :
        </div>

        <div className="space-y-2">
          {/* Bundle 1 */}
          <div 
            onClick={() => setSelectedBundleId("b1")}
            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
              selectedBundleId === "b1" ? "border-amber-500 bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white"
            }`}
          >
            <div>
              <div className="font-bold text-xs">1 Pièce (Standard)</div>
              <div className="text-[11px] text-neutral-500">Idéal pour tester</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-neutral-900">{currentPrice.toLocaleString("fr-DZ")} DZD</div>
            </div>
          </div>

          {/* Bundle 2 */}
          <div 
            onClick={() => setSelectedBundleId("b2")}
            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all ${
              selectedBundleId === "b2" ? "border-amber-500 bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white"
            }`}
          >
            <span className="absolute -top-2 right-3 bg-amber-500 text-black text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow">
              ⭐ Le plus vendu (-15%)
            </span>
            <div>
              <div className="font-bold text-xs">Pack de 2 Pièces</div>
              <div className="text-[11px] text-emerald-600 font-semibold">Économisez {Math.round(currentPrice * 0.2)} DZD</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-amber-700">{Math.round(currentPrice * 1.8).toLocaleString("fr-DZ")} DZD</div>
            </div>
          </div>

          {/* Bundle 3 */}
          <div 
            onClick={() => setSelectedBundleId("b3")}
            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all ${
              selectedBundleId === "b3" ? "border-amber-500 bg-amber-50/50 shadow-sm" : "border-neutral-200 bg-white"
            }`}
          >
            <span className="absolute -top-2 right-3 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow">
              🎉 LIVRAISON GRATUITE
            </span>
            <div>
              <div className="font-bold text-xs">Pack Famille (3 Pièces)</div>
              <div className="text-[11px] text-emerald-600 font-semibold">Livraison offerte partout en Algérie</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-amber-700">{Math.round(currentPrice * 2.5).toLocaleString("fr-DZ")} DZD</div>
            </div>
          </div>
        </div>
      </div>

      {/* COD CHECKOUT FORM */}
      <div id="order-form" className="p-4 bg-neutral-50">
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="text-center border-b border-neutral-100 pb-3">
            <h3 className="text-base font-extrabold text-neutral-900">
              Formulaire de Commande Express
            </h3>
            <p className="text-xs text-neutral-500">
              Remplissez vos coordonnées ci-dessous, paiement à la livraison
            </p>
          </div>

          {!orderSuccess ? (
            <form onSubmit={handleSubmitOrder} className="space-y-3">
              {/* Nom & Prénom */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nom et Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Mohamed Benali"
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 0550 12 34 56"
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Wilaya Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Wilaya <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWilayaCode}
                  onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-xs text-neutral-900 bg-white focus:outline-none focus:border-emerald-500"
                >
                  {wilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name} ({w.arName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de livraison */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mode de réception
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("home")}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-center ${
                      deliveryType === "home" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200"
                    }`}
                  >
                    🏠 À Domicile ({selectedBundleId === "b3" ? "0 DZD" : `${curWilaya.homeDeliveryPrice} DZD`})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("desk")}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-center ${
                      deliveryType === "desk" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200"
                    }`}
                  >
                    🏢 Au Bureau ({selectedBundleId === "b3" ? "0 DZD" : `${curWilaya.deskDeliveryPrice} DZD`})
                  </button>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Commune / Adresse exacte
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Bab Ezzouar, Cité 2068 logts"
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Total Calculation */}
              <div className="bg-neutral-100 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Produits ({quantity} pièce{quantity > 1 ? "s" : ""}) :</span>
                  <span>{itemsTotal.toLocaleString("fr-DZ")} DZD</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Livraison ({curWilaya.name}) :</span>
                  <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : ""}>
                    {deliveryFee === 0 ? "GRATUITE" : `${deliveryFee} DZD`}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-1 flex justify-between font-black text-sm text-neutral-900">
                  <span>Total à payer :</span>
                  <span className="text-emerald-700 font-mono">{grandTotal.toLocaleString("fr-DZ")} DZD</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-center text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 animate-pulse"
              >
                <Check className="w-5 h-5" />
                CONFIRMER MA COMMANDE
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-neutral-900">
                Merci pour votre commande !
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Votre commande de <strong>{grandTotal.toLocaleString("fr-DZ")} DZD</strong> a été enregistrée avec succès. Notre service client vous contactera au <strong>{phone}</strong> pour confirmer la livraison.
              </p>
              <button
                type="button"
                onClick={() => setOrderSuccess(false)}
                className="text-xs text-emerald-600 font-bold underline pt-2"
              >
                Passer une autre commande
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
