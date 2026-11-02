import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Palette, Sparkles, Store } from "lucide-react";
import { auth, dbPublic } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocFromServer, collection, query, where, getDocs, getDocsFromServer } from "firebase/firestore";
import { STORE_THEMES, StoreTheme } from "../data/themesData";
import { ThemeStorePreview } from "../components/storefront/ThemeStorePreview";
import { StoreCustomizerConfig, defaultStoreConfig } from "../components/admin/StoreCustomizerConfig";
import { isTenantExpired } from "../lib/checkExpiration";
import { StoreUnavailable } from "../components/storefront/StoreUnavailable";
import { StorefrontSettings, mergeStorefrontSettings } from "../types/storefront";
import type { HomeSection, StoreV2Settings } from "../types/storefrontSections";
import { mergeSections, defaultV2Settings } from "../data/storefrontDefaults";
import { STORE_WINDOW_NAME } from "../lib/openStore";
import { BUNDLE_ID } from "../version";

/**
 * Page publique de boutique.
 *
 * CONTRAT (Lot 15) : toutes les données (boutique, catégories, produits)
 * proviennent UNIQUEMENT du slug de l'URL (/store/:slug), lues côté SERVEUR
 * (getDocsFromServer) via dbPublic — une instance Firestore SANS authentification
 * (voir lib/firebase.ts) : l'état de session du navigateur ne peut ni bloquer
 * ni modifier ces lectures. Jamais de localStorage/sessionStorage, jamais d'un
 * cache du dashboard. La session propriétaire ne fait qu'afficher la barre
 * d'outils (aucun changement de source de données, aucun filtre uid).
 *
 * La route /store (sans slug, ouverte par d'anciens boutons du dashboard)
 * résout via auth.uid UNIQUEMENT pour un compte propriétaire ; elle affiche
 * désormais un état explicite (jamais une fausse liste vide muette).
 */
export default function StorefrontView() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialProductId = location.state?.productId || queryParams.get('productId');
  const [activeTheme, setActiveTheme] = useState<StoreTheme>(STORE_THEMES[0]);
  const [storeName, setStoreName] = useState<string>("أزياء الموضة");
  const [loading, setLoading] = useState(true);
  const [actualProducts, setActualProducts] = useState<any[]>([]);
  const [actualCategories, setActualCategories] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreCustomizerConfig | undefined>(undefined);
  const [storefront, setStorefront] = useState<StorefrontSettings | undefined>(undefined);
  /** T1 — sections v2 + réglages globaux (même document Firestore). */
  const [sectionsV2, setSectionsV2] = useState<HomeSection[] | undefined>(undefined);
  const [v2Settings, setV2Settings] = useState<StoreV2Settings | undefined>(undefined);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});
  const [isExpired, setIsExpired] = useState(false);
  /** Mode maintenance global (super admin) — bannière + page dédiée. */
  const [maintenance, setMaintenance] = useState<{ on: boolean; message: string } | null>(null);
  /** Boutique suspendue par un administrateur. */
  const [isSuspended, setIsSuspended] = useState(false);
  const [tenantId, setTenantId] = useState<string>("");
  /** Erreur de chargement visible (jamais un faux « aucun produit » muet). */
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Slug fourni mais AUCUNE boutique ne lui correspond (état explicite). */
  const [storeNotFound, setStoreNotFound] = useState(false);
  /** Route /store SANS slug : contexte manquant explicite (jamais de grille vide muette). */
  const [missingStoreUrl, setMissingStoreUrl] = useState<"anonymous" | "no-tenant" | null>(null);
  /** Vrai uniquement si un compte est connecté (barre d'outils propriétaire). */
  const [ownerSignedIn, setOwnerSignedIn] = useState(false);

  // Fenêtre unique réutilisée par tous les boutons « Voir la boutique » du dashboard.
  useEffect(() => {
    window.name = STORE_WINDOW_NAME;
  }, []);

  // Barre d'outils propriétaire : affichée SEULEMENT si un compte est
  // connecté. Elle ne modifie JAMAIS les données affichées (voir contrat).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setOwnerSignedIn(Boolean(user)));
    return () => unsubscribe();
  }, []);

  // Réglages plateforme : mode maintenance + bannière + scripts globaux.
  useEffect(() => {
    let alive = true;
    getDocFromServer(doc(dbPublic, "platform_settings", "general")).then((snap) => {
      if (!alive || !snap.exists()) return;
      const d = snap.data() as { maintenance?: { on?: boolean; message?: string }; globalScripts?: string };
      if (d.maintenance && d.maintenance.on) setMaintenance({ on: true, message: d.maintenance.message || "" });
      // Scripts globaux (analytics…) injectés une seule fois
      const scripts = String(d.globalScripts || "").trim();
      if (scripts) {
        const holder = document.createElement("div");
        holder.innerHTML = scripts;
        holder.querySelectorAll("script").forEach((old) => {
          const sc = document.createElement("script");
          [...old.attributes].forEach((a) => sc.setAttribute(a.name, a.value));
          sc.text = old.textContent || "";
          document.head.appendChild(sc);
        });
      }
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // Garde-fou : si le chargement dépasse 15 s (réseau bloqué, restauration de
  // session auth qui pend, requêtes Firestore sans réponse), on affiche
  // l'erreur visible au lieu d'un spinner infini — jamais un faux « aucun
  // produit », jamais une page muette.
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => {
      setLoading(false);
      setLoadError("La boutique met trop de temps à charger (réseau ou session bloquée). Actualisez la page, ou rouvrez-la depuis le tableau de bord.");
    }, 15000);
    return () => window.clearTimeout(t);
  }, [loading]);

  /* T2 — SEO : title, meta description, Open Graph et schema.org (v2.seo). */
  useEffect(() => {
    const seo = v2Settings?.seo;
    const title = seo?.title?.trim() ? seo.title : `${storeName} — Boutique en ligne`;
    const desc = seo?.description?.trim() ? seo.description : "Boutique en ligne algérienne : paiement à la livraison et livraison dans les 58 wilayas.";
    document.title = title;
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", desc);
    if (seo?.keywords?.trim()) setMeta("name", "keywords", seo.keywords);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    if (seo?.shareImage?.trim()) setMeta("property", "og:image", seo.shareImage);
    setMeta("name", "twitter:card", "summary_large_image");
    let ld = document.getElementById("enova-store-schema");
    if (!ld) {
      ld = document.createElement("script");
      ld.id = "enova-store-schema";
      (ld as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: storeName,
      description: desc,
      areaServed: "DZ",
      currenciesAccepted: "DZD",
      paymentAccepted: "Cash on delivery",
    });
  }, [v2Settings, storeName]);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const loadStoreSettings = async (uid?: string) => {
      let targetUserId = uid;
      setLoadError(null);
      setStoreNotFound(false);
      setMissingStoreUrl(null);

      // If a storeSlug is provided in the URL, fetch the tenant by storeUrl (slug)
            if (storeSlug) {
        try {
          const tenantQuery = query(collection(dbPublic, "tenants"), where("storeUrl", "==", storeSlug));
          // Lecture SERVEUR forcée : la boutique publique doit toujours refléter
          // l'état réel de la base, jamais un cache local périmé du navigateur.
          const tenantSnap = await getDocsFromServer(tenantQuery);
          if (!tenantSnap.empty) {
            targetUserId = tenantSnap.docs[0].id;
            const data = tenantSnap.docs[0].data();
            if (isTenantExpired(data)) {
               setIsExpired(true);
            }
            if (data.status === "suspended") {
               setIsSuspended(true);
            }
            if (data.storeName) setStoreName(data.storeName);
            if (data.activeTheme) {
              const found = STORE_THEMES.find(t => t.id === data.activeTheme);
              if (found) setActiveTheme(found);
            }
          } else {
            // Slug inconnu : état explicite « boutique introuvable » —
            // JAMAIS une page boutique factice avec une liste vide.
            setStoreNotFound(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error fetching tenant by slug:", err);
          setLoadError("Impossible de retrouver cette boutique (slug). Vérifiez votre connexion.");
        }
      }

      if (targetUserId) {
        try {
          // ALWAYS fetch tenant doc to check expiration
          const tRef = doc(dbPublic, "tenants", targetUserId);
          setTenantId(targetUserId);
          const tSnap = await getDocFromServer(tRef);
          if (tSnap.exists()) {
             const data = tSnap.data();
             if (isTenantExpired(data)) {
                 setIsExpired(true);
             }
             if (data.status === "suspended") {
                 setIsSuspended(true);
             }
             if (data.storeName) setStoreName(data.storeName);
             if (data.activeTheme) {
               const found = STORE_THEMES.find(t => t.id === data.activeTheme);
               if (found) setActiveTheme(found);
             }
          } else if (!storeSlug) {
            // Route /store sans slug : le compte connecté n'a PAS de boutique.
            // État explicite au lieu d'une liste vide silencieuse.
            setMissingStoreUrl("no-tenant");
            setLoading(false);
            return;
          }

          // Fetch Custom Store Config
          const confRef = doc(dbPublic, "store_config", targetUserId);
          const confSnap = await getDocFromServer(confRef);
          if (confSnap.exists()) {
            const confData = confSnap.data();
            if (confData.activeThemeId) {
              const found = STORE_THEMES.find(t => t.id === confData.activeThemeId);
              if (found) setActiveTheme(found);
            }
            if (confData.config) {
              setStoreConfig(confData.config);
            }
          }

          // Fetch Storefront Settings (contenu éditable de la page d'accueil)
          const sfRef = doc(dbPublic, "tenants", targetUserId, "settings", "storefront");
          const sfSnap = await getDocFromServer(sfRef);
          const sfData = sfSnap.exists() ? (sfSnap.data() as Record<string, unknown>) : undefined;
          setStorefront(mergeStorefrontSettings(sfData as Partial<StorefrontSettings> | undefined));
          // Sections v2 (si présentes) sinon migration automatique v1 -> v2.
          setSectionsV2(mergeSections(sfData).sections);
          const rawV2 = (sfData as { v2?: Partial<StoreV2Settings> } | undefined)?.v2;
          setV2Settings(rawV2 ? { ...defaultV2Settings(), ...rawV2 } : defaultV2Settings());

          // Compute sold counts per product (source "meilleures ventes")
          const ordersQuery = query(collection(dbPublic, "orders"), where("userId", "==", targetUserId));
          const ordersSnap = await getDocsFromServer(ordersQuery);
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

          // Fetch products
          const productsQuery = query(collection(dbPublic, "products"), where("userId", "==", targetUserId));
          const productsSnap = await getDocsFromServer(productsQuery);
          const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setActualProducts(productsData);

          // Fetch categories
          const categoriesQuery = query(collection(dbPublic, "categories"), where("userId", "==", targetUserId), where("status", "==", "active"));
          const categoriesSnap = await getDocsFromServer(categoriesQuery);
          const categoriesData = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setActualCategories(categoriesData);
        } catch (err) {
          console.error("Error fetching storefront data:", err);
          setLoadError("Impossible de charger les données de la boutique (produits, commandes, catégories). Vérifiez votre connexion puis actualisez.");
        }
      }
      setLoading(false);
    };

    if (storeSlug) {
      // Chemin public : UNIQUEMENT le slug de l'URL (indépendant de l'auth).
      loadStoreSettings();
    } else {
      // Route /store sans slug (anciens boutons du dashboard) : résolution
      // via le compte connecté, sinon état explicite — jamais une grille vide muette.
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          loadStoreSettings(user.uid);
        } else {
          setMissingStoreUrl("anonymous");
          setLoading(false);
        }
      });
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [storeSlug]);

  if (maintenance?.on) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Maintenance en cours</h1>
          <p className="text-neutral-400">{maintenance.message || "La plateforme est momentanément indisponible. Revenez bientôt."}</p>
        </div>
      </div>
    );
  }
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
            <Store className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Boutique indisponible</h1>
          <p className="text-neutral-400">Cette boutique est momentanément indisponible. Contactez le support si vous pensez que c'est une erreur.</p>
        </div>
      </div>
    );
  }
  if (isExpired) return <StoreUnavailable />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Slug fourni mais aucune boutique ne correspond : état explicite.
  if (storeNotFound) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 text-center">
          <Store className="w-10 h-10 mx-auto text-neutral-400" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Boutique introuvable</h1>
          <p className="mt-1 text-sm text-neutral-600" dir="rtl">لم يتم العثور على هذا المتجر</p>
          <p className="mt-3 text-xs text-neutral-500 break-all font-mono" dir="ltr">/store/{storeSlug}</p>
          <p className="mt-3 text-xs text-neutral-500">
            Vérifiez l'adresse de la boutique (Réglages → Boutique → URL).
          </p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors">
            <ArrowLeft size={14} />
            العودة إلى الرئيسية · Accueil
          </a>
        </div>
      </div>
    );
  }

  // Route /store sans slug : aucun compte, ou compte sans boutique.
  if (missingStoreUrl) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 text-center">
          <Store className="w-10 h-10 mx-auto text-neutral-400" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {missingStoreUrl === "anonymous" ? "URL de boutique manquante" : "Aucune boutique pour ce compte"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600" dir="rtl">
            {missingStoreUrl === "anonymous" ? "رابط المتجر غير مكتمل" : "لا يوجد متجر مرتبط بهذا الحساب"}
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            {missingStoreUrl === "anonymous" ? (
              <>Chaque boutique a sa propre adresse&nbsp;: <span className="font-mono" dir="ltr">/store/votre-boutique</span></>
            ) : (
              <>Créez votre boutique depuis le tableau de bord pour obtenir son adresse publique.</>
            )}
          </p>
          {missingStoreUrl === "no-tenant" ? (
            <Link to="/create-store" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-colors">
              <Sparkles size={14} />
              Créer ma boutique
            </Link>
          ) : (
            <a href="/" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors">
              <ArrowLeft size={14} />
              العودة إلى الرئيسية · Accueil
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Erreur de chargement visible (jamais un faux « aucun produit ») */}
      {loadError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-2 flex-wrap text-center">
          <span>⚠️ {loadError}</span>
          <button
            onClick={() => window.location.reload()}
            className="underline font-bold hover:text-red-900"
          >
            Actualiser
          </button>
        </div>
      )}
      {/* Top Admin Quick Bar for Store Owner — affichée UNIQUEMENT si un
          compte est connecté. Elle n'altère jamais les données affichées. */}
      {ownerSignedIn && (
      <div className="bg-[#18181b] text-neutral-300 px-4 py-2 text-xs flex items-center justify-between border-b border-neutral-800 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour au tableau de bord</span>
          </Link>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <Store size={14} />
            <span>Thème en direct : <strong>{activeTheme.name}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Marqueur de version : permet de vérifier en un coup d'œil que
              cet onglet exécute bien le bundle courant (console :
              [e-nova] bundle … / attribut html data-enova-bundle). */}
          <span
            className="hidden sm:inline text-neutral-600 font-mono"
            title="Identifiant du bundle déployé (lot de livraison)"
          >
            {BUNDLE_ID}
          </span>
          <Link
            to="/dashboard/themes"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            <Palette size={12} className="text-amber-400" />
            <span>Changer de thème</span>
          </Link>
          <Link
            to="/dashboard/customize"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors"
          >
            <Edit3 size={12} />
            <span>Personnaliser</span>
          </Link>
        </div>
      </div>
      )}

      {/* Main Storefront Layout */}
      <div className="flex-1">
        <ThemeStorePreview 
          theme={activeTheme}
          initialProductId={initialProductId} 
          customStoreName={storeName}
          isStandaloneView={true}
          actualProducts={actualProducts}
          actualCategories={actualCategories}
          tenantId={tenantId}
          config={storeConfig ? { ...storeConfig, isActivated: true } : undefined}
          storefront={storefront}
          soldCounts={soldCounts}
          sectionsV2={sectionsV2}
          v2Settings={v2Settings}
          storeSlug={storeSlug || tenantId}
        />
      </div>
    </div>
  );
}
