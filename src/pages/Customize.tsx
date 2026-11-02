import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  Type,
  Menu,
  Monitor,
  Smartphone,
  Save,
  ChevronDown,
  Check,
  Eye,
  ExternalLink,
  Store,
  ShoppingBag,
  RotateCw,
  Search,
  Image as ImageIcon,
  ChevronRight,
  UploadCloud,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Undo2,
  Redo2,
  Tablet,
  Sparkles
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { useTenant } from "../contexts/TenantContext";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

import { STORE_THEMES } from "../data/themesData";
import { getThemeManifest } from "../themes/registry";
import type { StoreDemoProduct } from "../data/themesData";
import { ThemeStorePreview } from "../components/storefront/ThemeStorePreview";
import { loadDemoStoreData, removeDemoStoreData } from "../lib/storefrontDemoService";
import { HomeSectionsList, SectionDetailEditor } from "../components/admin/customize/sectionsManager";
import {
  LanguageGroup, HeaderV2Group, ProductCardGroup, SortingGroup, PriceFormatGroup,
  ProductPageGroup, CheckoutGroup, FooterGroup, HelpWidgetGroup, SeoGroup,
} from "../components/admin/customize/groups";
import { AssistantIAPanel, type AssistantProposal } from "../components/admin/customize/assistantIA";
import { createHomeSection, duplicateHomeSection } from "../data/storefrontDefaults";
import type { HomeSection, HomeSectionType, StoreV2Settings } from "../types/storefrontSections";
import { MAX_HOME_SECTIONS } from "../types/storefrontSections";
import { mergeSections, defaultV2Settings } from "../data/storefrontDefaults";
import { StoreCustomizerConfig, defaultStoreConfig } from "../components/admin/StoreCustomizerConfig";
import { resizeAndConvertImageToBase64, getImageDimensions } from "../components/admin/storefront/editorUI";
import { HeroEditor } from "../components/admin/storefront/HeroEditor";
import { TrustBarEditor } from "../components/admin/storefront/TrustBarEditor";
import { CategoriesEditor } from "../components/admin/storefront/CategoriesEditor";
import { FeaturedProductsEditor } from "../components/admin/storefront/FeaturedProductsEditor";
import { openStoreWindow } from "../lib/openStore";
import {
  StorefrontSettings,
  SectionId,
  defaultStorefrontSettings,
  mergeStorefrontSettings,
  EditorCategoryLite,
} from "../types/storefront";

type SectionKey = "hero" | "trustBar" | "categories" | "featured";

const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Bannière Hero",
  trust: "Barre de réassurance",
  categories: "Catégories",
  featured: "Produits vedettes",
};

/** Item de groupe du panneau principal, filtré par la recherche. */
function GroupListItem({ menu, icon, label, hint, search, onSelect }: {
  menu: string; icon: React.ReactNode; label: string; hint: string; search: string; onSelect: () => void;
}): React.ReactElement | null {
  const q = search.trim().toLowerCase();
  if (q && !label.toLowerCase().includes(q) && !hint.toLowerCase().includes(q) && !menu.toLowerCase().includes(q)) return null;
  return (
    <div className="flex flex-col gap-0.5 p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-600" onClick={onSelect}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-white flex items-center gap-2">{icon} {label}</span>
        <ChevronRight size={16} className="text-neutral-500" />
      </div>
      <span className="text-xs text-neutral-500 ml-6">{hint}</span>
    </div>
  );
}

export default function Customize() {
  const { tenantData } = useTenant();

  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewView, setPreviewView] = useState<"home" | "product" | "checkout">("home");

  const [activeThemeId, setActiveThemeId] = useState<string>(
    localStorage.getItem("dzbuild_active_theme") || "starter"
  );

  /* T3 — identifiant du registre : tokens typo/layout (organic_bio, corporate…). */
  const registryThemeId = tenantData?.activeThemeRegistryId || undefined;
  const currentTheme = STORE_THEMES.find(t => t.id === activeThemeId) || STORE_THEMES[0];
  const resolvedTheme = registryThemeId
    ? STORE_THEMES.find(t => t.id === getThemeManifest(registryThemeId).legacyStoreThemeId) || currentTheme
    : currentTheme;

  // Configuration design (en-tête, couleurs, annonce...) -> store_config/{uid}
  const [config, setConfig] = useState<StoreCustomizerConfig>(defaultStoreConfig);
  // Contenu de la page d'accueil -> /tenants/{uid}/settings/storefront
  const [storefront, setStorefront] = useState<StorefrontSettings>(defaultStorefrontSettings);

  // Dernières versions enregistrées (pour le bouton Annuler)
  const [savedConfig, setSavedConfig] = useState<StoreCustomizerConfig>(defaultStoreConfig);
  const [savedStorefront, setSavedStorefront] = useState<StorefrontSettings>(defaultStorefrontSettings);
  const [savedThemeId, setSavedThemeId] = useState<string>(activeThemeId);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cancelledFlash, setCancelledFlash] = useState(false);

  const [activeMenu, setActiveMenu] = useState<string>("main");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listes pour les éditeurs et l'aperçu (catégories, produits, ventes)
  const [editorCategories, setEditorCategories] = useState<EditorCategoryLite[]>([]);
  const [editorProducts, setEditorProducts] = useState<StoreDemoProduct[]>([]);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});
  /** T1 — données de démo (chargement / suppression en un clic). */
  const [demoBusy, setDemoBusy] = useState<"" | "load" | "remove">("");
  const [demoNotice, setDemoNotice] = useState("");

  /** T2 — brouillon sections v2 + réglages v2, historique annuler/rétablir. */
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [v2, setV2] = useState<StoreV2Settings>(defaultV2Settings());
  const [savedSections, setSavedSections] = useState<HomeSection[]>([]);
  const [savedV2, setSavedV2] = useState<StoreV2Settings>(defaultV2Settings());
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeV2SectionId, setActiveV2SectionId] = useState<string | null>(null);
  const activeV2Section = activeV2SectionId ? sections.find((x) => x.id === activeV2SectionId) ?? null : null;
  const [eyeMode, setEyeMode] = useState(false);
  const [panelSearch, setPanelSearch] = useState("");
  interface EditorSnapshot {
    sections: HomeSection[]; v2: StoreV2Settings; storefront: StorefrontSettings;
    config: StoreCustomizerConfig; themeId: string;
  }
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);

  const handleLoadDemo = async () => {
    const user = auth.currentUser;
    if (!user?.uid || demoBusy) return;
    setDemoBusy("load");
    setDemoNotice("");
    try {
      const res = await loadDemoStoreData(user.uid);
      setDemoNotice(`Démo chargée : ${res.products} produits, ${res.categories} catégories, avis et FAQ. Rechargez pour voir la boutique publique.`);
      window.location.reload();
    } catch {
      setDemoNotice("Échec du chargement de la démo. Réessayez.");
      setDemoBusy("");
    }
  };

  const handleRemoveDemo = async () => {
    const user = auth.currentUser;
    if (!user?.uid || demoBusy) return;
    setDemoBusy("remove");
    setDemoNotice("");
    try {
      const res = await removeDemoStoreData(user.uid);
      setDemoNotice(`Démo supprimée (${res.products} produits, ${res.categories} catégories).`);
      window.location.reload();
    } catch {
      setDemoNotice("Échec de la suppression. Réessayez.");
      setDemoBusy("");
    }
  };

  const isDirty =
    JSON.stringify(config) !== JSON.stringify(savedConfig) ||
    JSON.stringify(storefront) !== JSON.stringify(savedStorefront) ||
    activeThemeId !== savedThemeId ||
    JSON.stringify(sections) !== JSON.stringify(savedSections) ||
    JSON.stringify(v2) !== JSON.stringify(savedV2);

  /* ---------------------------------------------------------------- */
  /* T2 — Historique annuler / rétablir (50 pas max)                   */
  /* ---------------------------------------------------------------- */

  const snapshot = (): EditorSnapshot => ({
    sections: JSON.parse(JSON.stringify(sections)),
    v2: JSON.parse(JSON.stringify(v2)),
    storefront: JSON.parse(JSON.stringify(storefront)),
    config: JSON.parse(JSON.stringify(config)),
    themeId: activeThemeId,
  });

  const pushHistory = () => {
    setUndoStack((prev) => [...prev.slice(-49), snapshot()]);
    setRedoStack([]);
  };

  const applySnapshot = (snap: EditorSnapshot) => {
    setSections(snap.sections);
    setV2(snap.v2);
    setStorefront(snap.storefront);
    setConfig(snap.config);
    setActiveThemeId(snap.themeId);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = [...undoStack];
    const snap = prev.pop()!;
    setUndoStack(prev);
    setRedoStack((r) => [...r, snapshot()]);
    applySnapshot(snap);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = [...redoStack];
    const snap = next.pop()!;
    setRedoStack(next);
    setUndoStack((u) => [...u, snapshot()]);
    applySnapshot(snap);
  };

  /* ---------------------------------------------------------------- */
  /* T2 — Mutations sections v2 (avec historique)                      */
  /* ---------------------------------------------------------------- */

  const applySections = (next: HomeSection[]) => {
    pushHistory();
    setSections(next);
  };

  const handleSectionAdd = (type: HomeSectionType) => {
    if (sections.length >= MAX_HOME_SECTIONS) return;
    applySections([...sections, createHomeSection(type)]);
  };

  const handleSectionDuplicate = (id: string) => {
    const sec = sections.find((x) => x.id === id);
    if (!sec || sections.length >= MAX_HOME_SECTIONS) return;
    applySections([...sections, duplicateHomeSection(sec)]);
  };

  const handleSectionDelete = (id: string) => {
    applySections(sections.filter((x) => x.id !== id));
    if (activeV2SectionId === id) setActiveV2SectionId(null);
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const handleSectionReorder = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    [next[from], next[to]] = [next[to], next[from]];
    applySections(next);
  };

  const handleSectionToggleVisible = (id: string) => {
    applySections(sections.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)));
  };

  const handleSectionChange = (next: HomeSection) => {
    applySections(sections.map((x) => (x.id === next.id ? next : x)));
  };

  const updateV2 = (patch: Partial<StoreV2Settings>) => {
    pushHistory();
    setV2((prev) => ({ ...prev, ...patch }));
  };

  /** Réinitialiser un groupe v2 aux valeurs enregistrées. */
  const resetV2Group = (group: keyof StoreV2Settings) => {
    pushHistory();
    setV2((prev) => ({ ...prev, [group]: JSON.parse(JSON.stringify(savedV2[group])) }));
  };

  const resetProductBlocks = () => {
    pushHistory();
    setV2((prev) => ({ ...prev, productPage: { ...prev.productPage, blocksOrder: [...savedV2.productPage.blocksOrder] } }));
  };

  /** Assistant IA — applique la proposition validée par le marchand. */
  const applyAssistant = (p: AssistantProposal) => {
    pushHistory();
    if (p.target === "hero") {
      setSections((prev) => prev.map((x) =>
        x.type === "hero" ? { ...x, title: p.title, description: p.body, primaryButton: { ...x.primaryButton, text: p.cta } } : x
      ));
      setStorefront((prev) => ({ ...prev, hero: { ...prev.hero, title: p.title, description: p.body, primaryButton: { ...prev.hero.primaryButton, text: p.cta } } }));
    } else if (p.target === "announcement") {
      setConfig((prev) => ({ ...prev, announcementText: p.title.fr, showAnnouncement: true }));
    } else if (p.target === "promoBanner") {
      setSections((prev) => prev.map((x) =>
        x.type === "promoBanner" ? { ...x, title: p.title, description: p.body, buttonText: p.cta } : x
      ));
    } else if (p.target === "faq" && p.faq) {
      setSections((prev) => prev.map((x) =>
        x.type === "faq"
          ? { ...x, items: p.faq!.map((f, i) => ({ id: `ai_${Date.now().toString(36)}_${i}`, question: f.question, answer: f.answer })) }
          : x
      ));
    }
  };

  /** Réinitialiser TOUT le brouillon aux dernières valeurs enregistrées. */
  const resetAll = () => {
    if (!isDirty) return;
    if (!window.confirm("Réinitialiser toutes les modifications non enregistrées ?")) return;
    pushHistory();
    setSections(JSON.parse(JSON.stringify(savedSections)));
    setV2(JSON.parse(JSON.stringify(savedV2)));
    setStorefront(JSON.parse(JSON.stringify(savedStorefront)));
    setConfig(JSON.parse(JSON.stringify(savedConfig)));
    setActiveThemeId(savedThemeId);
  };

  /* ---------------------------------------------------------------- */
  /* Chargement                                                        */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const loadAll = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1) Configuration design (store_config)
        let loadedConfig: StoreCustomizerConfig = { ...defaultStoreConfig };
        let themeId = localStorage.getItem("dzbuild_active_theme") || "starter";
        const confSnap = await getDoc(doc(db, "store_config", user.uid));
        if (confSnap.exists()) {
          const data = confSnap.data();
          if (data.activeThemeId) themeId = data.activeThemeId;
          if (data.config) {
            loadedConfig = { ...loadedConfig, ...(data.config as Partial<StoreCustomizerConfig>) };
          }
        }

        // 2) Contenu de la page d'accueil (/tenants/{uid}/settings/storefront)
        let loadedStorefront: StorefrontSettings;
        const sfSnap = await getDoc(doc(db, "tenants", user.uid, "settings", "storefront"));
        const sfRaw = sfSnap.exists() ? (sfSnap.data() as Record<string, unknown>) : undefined;
        if (sfSnap.exists()) {
          loadedStorefront = mergeStorefrontSettings(sfSnap.data() as Partial<StorefrontSettings>);
        } else {
          // Première édition : migration douce des anciens champs Hero plats.
          const hasCustom = (v: string, def: string) => Boolean(v) && v !== def;
          const oldTitle = hasCustom(loadedConfig.heroTitle, defaultStoreConfig.heroTitle)
            ? loadedConfig.heroTitle
            : "";
          const oldSub = hasCustom(loadedConfig.heroSubtitle, defaultStoreConfig.heroSubtitle)
            ? loadedConfig.heroSubtitle
            : "";
          const oldBtn = hasCustom(loadedConfig.heroButtonText, defaultStoreConfig.heroButtonText)
            ? loadedConfig.heroButtonText
            : "";
          loadedStorefront = {
            ...defaultStorefrontSettings,
            hero: {
              ...defaultStorefrontSettings.hero,
              desktopImage: loadedConfig.heroDesktopBg || "",
              mobileImage: loadedConfig.heroMobileBg || "",
              title: oldTitle ? { fr: oldTitle, ar: oldTitle } : defaultStorefrontSettings.hero.title,
              description: oldSub ? { fr: oldSub, ar: oldSub } : defaultStorefrontSettings.hero.description,
              primaryButton: {
                ...defaultStorefrontSettings.hero.primaryButton,
                text: oldBtn ? { fr: oldBtn, ar: oldBtn } : defaultStorefrontSettings.hero.primaryButton.text,
                link: loadedConfig.heroButtonLink || defaultStorefrontSettings.hero.primaryButton.link,
              },
            },
          };
        }

        setActiveThemeId(themeId);
        setConfig(loadedConfig);
        setStorefront(loadedStorefront);
        setSavedConfig(loadedConfig);
        setSavedStorefront(loadedStorefront);
        setSavedThemeId(themeId);

        // T2 — sections v2 + réglages v2 du même doc (fallback défauts).
        const loadedSections = mergeSections(sfRaw).sections;
        const rawV2 = (sfRaw as { v2?: Partial<StoreV2Settings> } | undefined)?.v2;
        const loadedV2: StoreV2Settings = rawV2 ? { ...defaultV2Settings(), ...rawV2 } : defaultV2Settings();
        setSections(loadedSections);
        setV2(loadedV2);
        setSavedSections(loadedSections);
        setSavedV2(loadedV2);

        // 3) Listes pour les éditeurs + aperçu fidèle
        const [catsSnap, prodsSnap, ordersSnap] = await Promise.all([
          getDocs(query(collection(db, "categories"), where("userId", "==", user.uid), where("status", "==", "active"))),
          getDocs(query(collection(db, "products"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "orders"), where("userId", "==", user.uid))),
        ]);

        setEditorCategories(
          catsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<EditorCategoryLite, "id">) }))
        );
        setEditorProducts(
          prodsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<StoreDemoProduct, "id">) }))
        );

        const counts: Record<string, number> = {};
        ordersSnap.forEach(d => {
          const items = (d.data() as { items?: Array<{ productId?: string; quantity?: number }> }).items ?? [];
          items.forEach(it => {
            if (it && it.productId) {
              counts[it.productId] = (counts[it.productId] ?? 0) + (Number(it.quantity) || 1);
            }
          });
        });
        setSoldCounts(counts);
      } catch (err) {
        console.error("Failed to load customizer data:", err);
      }
    };
    loadAll();
  }, []);

  /* ---------------------------------------------------------------- */
  /* Mutations locales (aperçu en direct, sans sauvegarde)             */
  /* ---------------------------------------------------------------- */

  const updateConfig = <K extends keyof StoreCustomizerConfig>(
    key: K,
    value: StoreCustomizerConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateSection = <K extends SectionKey>(
    key: K,
    patch: Partial<StorefrontSettings[K]>
  ) => {
    setStorefront(prev => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    } as StorefrontSettings));
  };

  const moveSection = (id: SectionId, dir: -1 | 1) => {
    setStorefront(prev => {
      const order = [...prev.sectionsOrder];
      const i = order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...prev, sectionsOrder: order };
    });
  };

  const setSectionVisible = (id: SectionId, visible: boolean) => {
    setStorefront(prev => ({
      ...prev,
      [id]: { ...prev[id], visible },
    } as StorefrontSettings));
  };

  /* ---------------------------------------------------------------- */
  /* Uploads (favicon / logo — design, pas de sections)                */
  /* ---------------------------------------------------------------- */

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "faviconUrl" | "logoUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setUploadingField(fieldName);
    try {
      if (fieldName === "faviconUrl") {
        const dimensions = await getImageDimensions(file);
        if (dimensions.width !== dimensions.height) {
          setErrorMessage(
            `L'icône doit être carrée (32x32 ou 64x64 ou 128x128 pixels). Image actuelle : ${dimensions.width}x${dimensions.height}`
          );
          setUploadingField(null);
          return;
        }
      }

      const base64String = await resizeAndConvertImageToBase64(
        file,
        fieldName === "logoUrl" ? 600 : 1200
      );
      updateConfig(fieldName, base64String);
      setUploadingField(null);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingField(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Sauvegarde / Annulation                                           */
  /* ---------------------------------------------------------------- */

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    const newConfig = { ...config };
    if (!newConfig.isActivated) {
      newConfig.isActivated = true;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        // 1) Design -> store_config/{uid} (comportement historique conservé)
        await setDoc(doc(db, "store_config", user.uid), {
          activeThemeId,
          config: newConfig,
        }, { merge: true });

        // 2) Contenu de la page d'accueil + sections v2 + réglages v2 -> /tenants/{uid}/settings/storefront (merge)
        await setDoc(doc(db, "tenants", user.uid, "settings", "storefront"), {
          ...JSON.parse(JSON.stringify(storefront)),
          sections: JSON.parse(JSON.stringify(sections)),
          v2: JSON.parse(JSON.stringify(v2)),
        }, { merge: true });
      }
      setConfig(newConfig);
      setSavedConfig(newConfig);
      setSavedStorefront(JSON.parse(JSON.stringify(storefront)));
      setSavedSections(JSON.parse(JSON.stringify(sections)));
      setSavedV2(JSON.parse(JSON.stringify(v2)));
      setSavedThemeId(activeThemeId);
      setUndoStack([]);
      setRedoStack([]);

      localStorage.setItem("dzbuild_active_theme", activeThemeId);
      localStorage.setItem("dzbuild_store_name", newConfig.storeName);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving theme settings:", error);
      setErrorMessage("Erreur lors de l'enregistrement. Vérifiez votre connexion puis réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* T2 — Raccourcis clavier : Ctrl/Cmd+S enregistrer, Ctrl+Z annuler  */
  /* ---------------------------------------------------------------- */

  const shortcutsRef = useRef({ save: () => {}, undo: () => {}, redo: () => {}, dirty: false, saving: false });
  shortcutsRef.current = { save: handleSave, undo, redo, dirty: isDirty, saving: isSaving };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        if (shortcutsRef.current.dirty && !shortcutsRef.current.saving) shortcutsRef.current.save();
      } else if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        shortcutsRef.current.undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        shortcutsRef.current.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);



  const handleCancel = () => {
    setConfig(savedConfig);
    setStorefront(savedStorefront);
    setActiveThemeId(savedThemeId);
    setCancelledFlash(true);
    setTimeout(() => setCancelledFlash(false), 2000);
  };

  /* ---------------------------------------------------------------- */
  /* Rendu                                                             */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden font-sans">
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="text-sm font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 transition-colors"><X size={16} /></button>
        </div>
      )}
      <div className="flex gap-6 flex-1 h-full p-4">
        {/* Sidebar Controls */}
        <div className="w-80 flex flex-col h-full bg-[#16161a] border border-neutral-800 rounded-2xl overflow-hidden shrink-0">

          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Store size={18} />
              Personnaliser
            </h2>
            <Link to="/store" className="text-amber-500 hover:text-amber-400 text-xs font-bold flex items-center gap-1">
              <Eye size={14} /> Voir
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeMenu === "main" ? (
              <div className="space-y-3">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type="text" value={panelSearch} onChange={(e) => setPanelSearch(e.target.value)} placeholder="Rechercher une section..." className="w-full bg-[#1e1e24] border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" aria-label="Rechercher une section" />
                </div>

                {/* Réglages globaux */}
                <div className="flex flex-col gap-2">
                  <GroupListItem menu="language" icon={<span className="text-base">🌐</span>} label="Langue de la boutique" hint="Arabe (RTL) ou Français" search={panelSearch} onSelect={() => setActiveMenu("language")} />
                  <GroupListItem menu="header" icon={<Store size={16} className="text-neutral-400" />} label="En-tête et Logo" hint="Logo, couleurs, styles de barre" search={panelSearch} onSelect={() => setActiveMenu("header")} />
                  <GroupListItem menu="headerV2" icon={<Menu size={16} className="text-neutral-400" />} label="Éléments de l'en-tête" hint="Recherche, panier, sticky, langue" search={panelSearch} onSelect={() => setActiveMenu("headerV2")} />
                  <GroupListItem menu="colors" icon={<div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-purple-500"></div>} label="Couleurs et Police" hint="Couleurs principales et polices" search={panelSearch} onSelect={() => setActiveMenu("colors")} />

                  <div className="flex items-center justify-between p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-600" onClick={() => updateV2({ header: { ...v2.header, showSearch: !v2.header.showSearch } })} role="button" tabIndex={0} aria-label="Barre de recherche">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <Search size={16} />
                      </div>
                      <span className="text-sm font-bold text-white">Barre de recherche</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${v2.header.showSearch ? "bg-amber-500" : "bg-neutral-600"}`}>
                      <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${v2.header.showSearch ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </div>

                  <GroupListItem menu="announcement" icon={<div className="w-4 h-3 border-2 border-neutral-400 rounded-sm flex items-center justify-center"><div className="w-1.5 h-0.5 bg-neutral-400"></div></div>} label="Barre d'annonce" hint="Message en haut de la boutique" search={panelSearch} onSelect={() => setActiveMenu("announcement")} />

                  <GroupListItem menu="productCard" icon={<ShoppingBag size={16} className="text-neutral-400" />} label="Carte produit" hint="Apparence des cartes produits" search={panelSearch} onSelect={() => setActiveMenu("productCard")} />
                  <GroupListItem menu="sorting" icon={<ArrowDown size={16} className="text-neutral-400" />} label="Tri des produits" hint="Ordre par défaut du catalogue" search={panelSearch} onSelect={() => setActiveMenu("sorting")} />
                  <GroupListItem menu="priceFormat" icon={<Type size={16} className="text-neutral-400" />} label="Format des prix" hint="15000 DA · 15,000 DA · 15 000 DA" search={panelSearch} onSelect={() => setActiveMenu("priceFormat")} />
                  <GroupListItem menu="productPage" icon={<Menu size={16} className="text-neutral-400" />} label="Page produit" hint="Ordre des blocs, galerie, barre mobile" search={panelSearch} onSelect={() => setActiveMenu("productPage")} />
                  <GroupListItem menu="checkout" icon={<ShoppingBag size={16} className="text-neutral-400" />} label="Page de paiement" hint="Champs, disposition, textes" search={panelSearch} onSelect={() => setActiveMenu("checkout")} />
                  <GroupListItem menu="footer" icon={<ExternalLink size={16} className="text-neutral-400" />} label="Pied de page" hint="À propos, réseaux, marque" search={panelSearch} onSelect={() => setActiveMenu("footer")} />
                  <GroupListItem menu="helpWidget" icon={<Sparkles size={16} className="text-neutral-400" />} label="Widget d'aide" hint="Bouton flottant, canaux, FAQ" search={panelSearch} onSelect={() => setActiveMenu("helpWidget")} />
                  <GroupListItem menu="seo" icon={<Search size={16} className="text-neutral-400" />} label="SEO" hint="Title, description, partage" search={panelSearch} onSelect={() => setActiveMenu("seo")} />
                </div>

                {/* Assistant IA (validation marchand avant application) */}
                <div className="pt-3">
                  <AssistantIAPanel storeName={config.storeName || ""} onApply={applyAssistant} />
                </div>

                {/* Gestion des sections de la page d'accueil (modèle v2) */}
                <div className="pt-3">
                  <HomeSectionsList
                    sections={sections}
                    search={panelSearch}
                    activeSectionId={activeV2SectionId}
                    onSelect={(id) => { setActiveV2SectionId(id); setSelectedSectionId(id); setActiveMenu("section_detail"); }}
                    onReorder={handleSectionReorder}
                    onToggleVisible={handleSectionToggleVisible}
                    onDuplicate={handleSectionDuplicate}
                    onDelete={handleSectionDelete}
                    onAdd={handleSectionAdd}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setActiveMenu("main")}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm font-medium mb-2"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" /> Retour
                </button>

                {activeMenu === "colors" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-purple-500"></div>
                      Couleurs et Police
                    </h3>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur principale</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.primaryColor} onChange={(e) => updateConfig("primaryColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.primaryColor} onChange={(e) => updateConfig("primaryColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur secondaire</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.secondaryColor} onChange={(e) => updateConfig("secondaryColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.secondaryColor} onChange={(e) => updateConfig("secondaryColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur d'arrière-plan</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.bgColor} onChange={(e) => updateConfig("bgColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.bgColor} onChange={(e) => updateConfig("bgColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur des titres de sections</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.headingColor} onChange={(e) => updateConfig("headingColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.headingColor} onChange={(e) => updateConfig("headingColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Police de caractères</label>
                      <select value={config.fontFamily} onChange={(e) => updateConfig("fontFamily", e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="Cairo">Cairo</option>
                        <option value="Tajawal">Tajawal</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Langue de la boutique</label>
                      <select value={config.language} onChange={(e) => updateConfig("language", e.target.value as StoreCustomizerConfig["language"])} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="ar">dz العربية (Arabic)</option>
                        <option value="fr">Français (French)</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Style des boutons</label>
                      <select value={config.buttonStyle} onChange={(e) => updateConfig("buttonStyle", e.target.value as StoreCustomizerConfig["buttonStyle"])} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="rounded">Arrondi</option>
                        <option value="pill">Pill</option>
                        <option value="square">Carré</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeMenu === "header" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">En-tête et Logo</h3>

                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 hover:bg-[#1e1e24] relative overflow-hidden group">
                       <label className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center z-10">
                         <input type="file" accept="image/png, image/x-icon" className="hidden" onChange={(e) => handleImageUpload(e, "faviconUrl")} />
                       </label>
                       {uploadingField === "faviconUrl" ? (
                         <div className="flex flex-col items-center justify-center text-amber-500 z-0">
                           <RotateCw className="w-6 h-6 animate-spin mb-2" />
                           <span className="text-xs font-medium">Téléchargement...</span>
                         </div>
                       ) : config.faviconUrl ? (
                         <div className="relative w-full h-16 flex flex-col items-center justify-center z-0">
                           <img src={config.faviconUrl} alt="Favicon" className="w-12 h-12 object-contain mb-2" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                             <span className="text-[10px] text-white bg-[#111111]/80 px-2 py-1 rounded">Cliquez pour modifier</span>
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateConfig("faviconUrl", ""); }} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium px-3 py-1 rounded relative z-20 cursor-pointer">Supprimer</button>
                           </div>
                         </div>
                       ) : (
                         <div className="pointer-events-none flex flex-col items-center z-0">
                           <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center mb-2">
                             <ImageIcon size={20} />
                           </div>
                           <p className="text-sm font-bold text-white text-center">Télécharger l'icône de la boutique (Favicon)</p>
                           <p className="text-xs text-neutral-500 text-center mt-1">PNG ou ICO - 32x32 ou 64x64 pixels</p>
                         </div>
                       )}
                    </div>

                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 hover:bg-[#1e1e24] relative overflow-hidden group">
                       <label className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center z-10">
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "logoUrl")} />
                       </label>
                       {uploadingField === "logoUrl" ? (
                         <div className="flex flex-col items-center justify-center text-amber-500 z-0">
                           <RotateCw className="w-6 h-6 animate-spin mb-2" />
                           <span className="text-xs font-medium">Téléchargement...</span>
                         </div>
                       ) : config.logoUrl ? (
                         <div className="relative w-full h-24 flex flex-col items-center justify-center z-0">
                           <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain mb-2" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                             <span className="text-[10px] text-white bg-[#111111]/80 px-2 py-1 rounded">Cliquez pour modifier</span>
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateConfig("logoUrl", ""); }} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium px-3 py-1 rounded relative z-20 cursor-pointer">Supprimer</button>
                           </div>
                         </div>
                       ) : (
                         <div className="pointer-events-none flex flex-col items-center z-0">
                           <UploadCloud size={24} className="text-neutral-400 mb-2" />
                           <p className="text-sm font-bold text-white text-center">Logo de la boutique</p>
                           <p className="text-xs text-neutral-500 text-center mt-1">PNG, JPG, WebP, SVG</p>
                         </div>
                       )}
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-5 shrink-0 rounded-full relative cursor-pointer transition-colors ${config.showStoreNameWithLogo ? "bg-amber-500" : "bg-neutral-600"}`} onClick={() => updateConfig("showStoreNameWithLogo", !config.showStoreNameWithLogo)}>
                          <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${config.showStoreNameWithLogo ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-white flex items-center gap-1">Afficher le nom de la boutique à côté du logo</span>
                            <span className="text-[11px] text-neutral-500 mt-0.5">Le nom de la boutique apparaîtra à côté du logo lorsque activé</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Nom de la boutique</label>
                      <input type="text" value={config.storeName} onChange={(e) => updateConfig("storeName", e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><Palette size={14} /> Couleur de la barre de navigation</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.navBgColor} onChange={(e) => updateConfig("navBgColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.navBgColor} onChange={(e) => updateConfig("navBgColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><Type size={14} /> Couleur du texte du menu</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.navTextColor} onChange={(e) => updateConfig("navTextColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.navTextColor} onChange={(e) => updateConfig("navTextColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Style de la barre de navigation</label>
                      <select value={config.navStyle} onChange={(e) => updateConfig("navStyle", e.target.value as StoreCustomizerConfig["navStyle"])} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="default">Par défaut</option>
                        <option value="centered">Centré</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><Menu size={14} /> Style du menu</label>
                      <select value={config.menuStyle} onChange={(e) => updateConfig("menuStyle", e.target.value as StoreCustomizerConfig["menuStyle"])} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="default">Par défaut</option>
                        <option value="pills">Boutons arrondis (Pills)</option>
                        <option value="underline">Souligné (Underline)</option>
                        <option value="square">Boutons carrés</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><ImageIcon size={14} /> Taille du logo</label>
                      <select value={config.logoSize} onChange={(e) => updateConfig("logoSize", e.target.value as StoreCustomizerConfig["logoSize"])} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="small">Petit (30px)</option>
                        <option value="medium">Moyen (40px)</option>
                        <option value="large">Grand (50px)</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><ShoppingBag size={14} /> Style de l'icône du panier</label>
                      <select value={config.cartIconStyle} onChange={(e) => updateConfig("cartIconStyle", e.target.value as StoreCustomizerConfig["cartIconStyle"])} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="default">Par défaut (sac)</option>
                        <option value="filled">Rempli</option>
                        <option value="outline">Contour</option>
                        <option value="minimal">Minimal (chariot)</option>
                      </select>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.isSticky ? "bg-amber-500" : "bg-neutral-600"}`} onClick={() => updateConfig("isSticky", !config.isSticky)}>
                          <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${config.isSticky ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-white flex items-center gap-1">Barre de navigation fixe (Sticky)</span>
                            <span className="text-[11px] text-neutral-500">La barre reste visible lors du défilement</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.hasShadow ? "bg-amber-500" : "bg-neutral-600"}`} onClick={() => updateConfig("hasShadow", !config.hasShadow)}>
                          <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${config.hasShadow ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <span className="text-sm text-white flex items-center gap-1">Ajouter une ombre à la barre</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.hasBottomBorder ? "bg-amber-500" : "bg-neutral-600"}`} onClick={() => updateConfig("hasBottomBorder", !config.hasBottomBorder)}>
                          <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${config.hasBottomBorder ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <span className="text-sm text-white flex items-center gap-1">Ajouter une bordure inférieure</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.showCartIcon ? "bg-amber-500" : "bg-neutral-600"}`} onClick={() => updateConfig("showCartIcon", !config.showCartIcon)}>
                          <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${config.showCartIcon ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <span className="text-sm text-white flex items-center gap-1">Afficher l'icône du panier</span>
                      </div>

                      <div className="flex items-start gap-3 mt-2">
                        <div className={`w-10 h-5 shrink-0 rounded-full relative cursor-pointer transition-colors ${config.hideOnProductPage ? "bg-amber-500" : "bg-neutral-600"}`} onClick={() => updateConfig("hideOnProductPage", !config.hideOnProductPage)}>
                          <div className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${config.hideOnProductPage ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-white flex items-center gap-1">Masquer l'en-tête sur la page produit</span>
                            <span className="text-[11px] text-neutral-500 mt-0.5">Masque la barre de navigation (logo et menu) uniquement sur la page produit — elle n'est pas chargée du tout, pour une page plus rapide et sans distraction. N'affecte pas les autres pages.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMenu === "hero" && (
                  <HeroEditor
                    value={storefront.hero}
                    onChange={(patch) => updateSection("hero", patch)}
                  />
                )}

                {activeMenu === "trust" && (
                  <TrustBarEditor
                    value={storefront.trustBar}
                    onChange={(patch) => updateSection("trustBar", patch)}
                  />
                )}

                {activeMenu === "categories" && (
                  <CategoriesEditor
                    value={storefront.categories}
                    onChange={(patch) => updateSection("categories", patch)}
                    categories={editorCategories}
                  />
                )}

                {activeMenu === "featured" && (
                  <FeaturedProductsEditor
                    value={storefront.featured}
                    onChange={(patch) => updateSection("featured", patch)}
                    products={editorProducts}
                    soldCounts={soldCounts}
                  />
                )}

                {activeMenu === "announcement" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Barre d'annonce</h3>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Afficher la barre</label>
                      <select value={config.showAnnouncement ? "yes" : "no"} onChange={(e) => updateConfig("showAnnouncement", e.target.value === "yes")} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Texte de l'annonce</label>
                      <input type="text" value={config.announcementText} onChange={(e) => updateConfig("announcementText", e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Lien (optionnel)</label>
                      <input type="text" value={config.announcementLink} onChange={(e) => updateConfig("announcementLink", e.target.value)} placeholder="https://..." className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur de fond</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.announcementBgColor} onChange={(e) => updateConfig("announcementBgColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.announcementBgColor} onChange={(e) => updateConfig("announcementBgColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Couleur du texte</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.announcementTextColor} onChange={(e) => updateConfig("announcementTextColor", e.target.value)} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={config.announcementTextColor} onChange={(e) => updateConfig("announcementTextColor", e.target.value)} className="flex-1 bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                  </div>
                )}

                {activeMenu === "language" && (
                  <LanguageGroup
                    language={(config.language === "fr" ? "fr" : "ar") as "fr" | "ar"}
                    onLanguageChange={(v) => updateConfig("language", v)}
                  />
                )}

                {activeMenu === "headerV2" && (
                  <HeaderV2Group v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "productCard" && (
                  <ProductCardGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "sorting" && (
                  <SortingGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "priceFormat" && (
                  <PriceFormatGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "productPage" && (
                  <ProductPageGroup v2={v2} onChange={updateV2} onResetBlocks={resetProductBlocks} />
                )}

                {activeMenu === "checkout" && (
                  <CheckoutGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "footer" && (
                  <FooterGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "helpWidget" && (
                  <HelpWidgetGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "seo" && (
                  <SeoGroup v2={v2} onChange={updateV2} />
                )}

                {activeMenu === "section_detail" && activeV2Section && (
                  <SectionDetailEditor
                    section={activeV2Section}
                    products={editorProducts.map((p) => ({ id: p.id, name: p.name || p.nameAr || p.id }))}
                    categories={editorCategories.map((c) => ({ id: c.id, name: c.name || c.id }))}
                    onChange={handleSectionChange}
                    onBack={() => { setActiveV2SectionId(null); setActiveMenu("main"); }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-neutral-800 bg-[#1a1a24] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                onClick={resetAll}
                disabled={!isDirty || isSaving}
                title="Réinitialiser toutes les modifications non enregistrées"
                className={`px-3 py-2 border rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isDirty && !isSaving
                    ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                    : "border-neutral-800 text-neutral-600 cursor-not-allowed"
                }`}
              >
                <RotateCw size={14} /> Réinitialiser
              </button>
              <button
                onClick={undo}
                disabled={undoStack.length === 0 || isSaving}
                title="Annuler (Ctrl+Z)"
                className={`p-2 rounded-lg transition-colors ${undoStack.length > 0 && !isSaving ? "border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800" : "text-neutral-700 cursor-not-allowed"}`}
                aria-label="Annuler"
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0 || isSaving}
                title="Rétablir (Ctrl+Shift+Z)"
                className={`p-2 rounded-lg transition-colors ${redoStack.length > 0 && !isSaving ? "border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800" : "text-neutral-700 cursor-not-allowed"}`}
                aria-label="Rétablir"
              >
                <Redo2 size={14} />
              </button>
              <button
                onClick={() => setEyeMode((e) => !e)}
                title={eyeMode ? "Réafficher les repères d'édition" : "Prévisualiser sans repères d'édition"}
                className={`p-2 rounded-lg transition-colors ${eyeMode ? "bg-amber-500 text-black" : "border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"}`}
                aria-pressed={eyeMode}
                aria-label="Mode aperçu sans repères"
              >
                <Eye size={14} />
              </button>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${isDirty ? "bg-amber-500/15 text-amber-400" : "bg-neutral-800 text-neutral-500"}`} title={isDirty ? "Pense à enregistrer (Ctrl+S)" : "Tout est enregistré"}>
                {isDirty ? "● Non enregistré" : "✓ À jour"}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
              <button
                onClick={handleLoadDemo}
                disabled={Boolean(demoBusy)}
                title="Charger des catégories, produits, avis et FAQ de démonstration (supprimables en un clic)"
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {demoBusy === "load" ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {demoBusy === "load" ? "Chargement…" : "Données de démo"}
              </button>
              <button
                onClick={handleRemoveDemo}
                disabled={Boolean(demoBusy)}
                title="Supprimer uniquement les produits et catégories de démonstration"
                className="px-2.5 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {demoBusy === "remove" ? "…" : "Suppr. démo"}
              </button>
              <a
                href={`/store/${tenantData?.storeUrl || ""}`}
                target="_blank"
                rel="noreferrer"
                title="Ouvrir la boutique publique dans un nouvel onglet"
                className="px-3 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={14} /> Voir la boutique
              </a>
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className={`px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  isSaving || !isDirty ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Enregistrer (Ctrl+S)"
              >
                {isSaving ? <RotateCw className="w-4 h-4 animate-spin" /> : (savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                {savedSuccess ? "Enregistré !" : isDirty ? "Enregistrer" : "À jour"}
              </button>
            </div>
            {demoNotice && <span className="text-[11px] text-neutral-400 max-w-[240px] truncate w-full" title={demoNotice}>{demoNotice}</span>}
          </div>
        </div>

        {/* Live Preview Window Container */}
        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#16161a] flex flex-col overflow-hidden shadow-sm">
          {/* Top Browser Toolbar */}
          <div className="h-14 bg-[#1e1e24] border-b border-neutral-800 flex items-center px-4 justify-between shrink-0">
            {/* Device Toggles */}
            <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`p-1.5 rounded-md transition-colors ${deviceMode === "desktop" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setDeviceMode("tablet")}
                title="Aperçu tablette"
                className={`p-1.5 rounded-md transition-colors ${deviceMode === "tablet" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <Tablet size={16} />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                title="Aperçu mobile"
                className={`p-1.5 rounded-md transition-colors ${deviceMode === "mobile" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <Smartphone size={16} />
              </button>
            </div>
            {/* View Switcher (Accueil, Produit, Commande) */}
            <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => { setPreviewView("home"); setActiveMenu("main"); }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${previewView === "home" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <Store size={14} /> Accueil
              </button>
              <button
                onClick={() => { setPreviewView("product"); }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${previewView === "product" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <ShoppingBag size={14} /> Produit
              </button>
              <button
                onClick={() => { setPreviewView("checkout"); }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${previewView === "checkout" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <Check size={14} /> Commande
              </button>
            </div>
            <a
              href={tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store"}
              onClick={(e) => {
                e.preventDefault();
                openStoreWindow(tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store", { forceReload: true });
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={14} /> Voir la boutique
            </a>
          </div>
          {/* Interactive Live Theme Store View */}
          <div className={`flex-1 overflow-y-auto bg-[#fafafa] flex justify-center ${deviceMode === "mobile" ? "p-4" : ""}`}>
            <div className={`transition-all duration-300 ${
              deviceMode === "mobile" ? "w-[390px] border-4 border-neutral-800 rounded-3xl shadow-xl overflow-hidden bg-white my-auto"
              : deviceMode === "tablet" ? "w-[768px] border-4 border-neutral-800 rounded-2xl shadow-xl overflow-hidden bg-white my-auto"
              : "w-full"}`}>
              <ThemeStorePreview
                theme={resolvedTheme}
                registryThemeId={registryThemeId}
                config={{ ...config, isActivated: true }}
                storefront={storefront}
                sectionsV2={sections}
                v2Settings={v2}
                selectedSectionId={selectedSectionId}
                disableEditorOverlays={eyeMode}
                storeSlug={auth.currentUser?.uid}
                currentView={previewView}
                actualProducts={editorProducts}
                actualCategories={editorCategories}
                soldCounts={soldCounts}
                onSectionSelect={(sectionId) => {
                  if (sectionId === "header") { setActiveMenu("header"); setSelectedSectionId("header"); return; }
                  if (sectionId === "hero_banner") { setActiveMenu("hero"); setSelectedSectionId("hero_banner"); return; }
                  if (sectionId === "trust") { setActiveMenu("trust"); setSelectedSectionId("trust"); return; }
                  if (sectionId === "categories") { setActiveMenu("categories"); setSelectedSectionId("categories"); return; }
                  if (sectionId === "featured") { setActiveMenu("featured"); setSelectedSectionId("featured"); return; }
                  if (sectionId === "announcement") { setActiveMenu("announcement"); setSelectedSectionId("announcement"); return; }
                  // Sections v2 : sélection + ouverture de l'éditeur dédié
                  const sec = sections.find((x) => x.id === sectionId);
                  if (sec) {
                    setSelectedSectionId(sectionId);
                    setActiveV2SectionId(sectionId);
                    setActiveMenu("section_detail");
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
