import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit2, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  Tag,
  DollarSign,
  Boxes,
  Check,
  Sparkles,
  ArrowLeft,
  Wand2,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Eye,
  ChevronDown,
  PlusCircle,
  FolderTree,
  Star,
  Info
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  setDoc,
  runTransaction
} from "firebase/firestore";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { VariantManager } from "../components/admin/VariantManager";

export type VariantType = "text" | "color" | "image_text" | "multiple";

export interface VariantOptionDef {
  value: string;
  priceDiff?: number;
  quantity?: number;
  stock?: number;
  colorCode?: string;
  image?: string;
  hasImageCard?: boolean;
}

export interface ProductVariant {
  name: string;
  type?: VariantType;
  options: any[];
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  weight?: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  trackStock?: boolean;
  fragile?: boolean;
  trackVariantStock?: boolean;
  featured?: boolean;
  sku?: string;
  status: "active" | "inactive";
  variants?: ProductVariant[];
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}



export default function Products() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "stock">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form Data
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | "">("");
  const [formCostPrice, setFormCostPrice] = useState<number | "">("");
  const [formWeight, setFormWeight] = useState<number | "">("");
  const [formTrackStock, setFormTrackStock] = useState(true);
  const [formFragile, setFormFragile] = useState(false);
  const [formTrackVariantStock, setFormTrackVariantStock] = useState(false);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formCategory, setFormCategory] = useState("");
  const [formStock, setFormStock] = useState<number | "">(20);
  const [formSku, setFormSku] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [variantInputName, setVariantInputName] = useState("");
  const [variantInputOptions, setVariantInputOptions] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("L'image est trop grande (max 5 Mo).", "error");
      return;
    }

    setIsUploading(true);
    setFormError("");

    try {
      // Pour éviter les problèmes liés à Firebase Storage (non initialisé ou CORS),
      // nous compressons l'image en Base64 pour l'enregistrer directement.
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Qualité JPEG 70% pour Firebase Firestore
          };
          
          img.onerror = (error) => reject(error);
        };
        
        reader.onerror = (error) => reject(error);
      });
      
      setFormImages(prev => [...prev, base64Image]);
      showToast("Image ajoutée avec succès");
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      showToast("Erreur lors du traitement de l'image.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch categories
      const catQuery = query(collection(db, "categories"), where("userId", "==", user.uid));
      const catSnap = await getDocs(catQuery);
      const cats: string[] = [];
      catSnap.forEach(doc => {
        const data = doc.data();
        if (data.name) cats.push(data.name);
      });
      setCategoriesList(cats);

      // 2. Fetch products from 'products' collection
      const prodQuery = query(collection(db, "products"), where("userId", "==", user.uid));
      const prodSnap = await getDocs(prodQuery);
      const loadedProducts: ProductItem[] = [];

      prodSnap.forEach(docSnap => {
        loadedProducts.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ProductItem);
      });

      setProducts(loadedProducts);
    } catch (err) {
      console.error("Error loading products:", err);
      showToast("Erreur lors du chargement des produits", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prod?: ProductItem) => {
    setFormError("");
    if (prod) {
      setEditingProduct(prod);
      setFormName(prod.name);
      setFormDescription(prod.description || "");
      setFormPrice(prod.price);
      setFormOriginalPrice(prod.originalPrice || "");
      setFormCostPrice(prod.costPrice || "");
      setFormWeight(prod.weight || "");
      setFormTrackStock(prod.trackStock ?? true);
      setFormFragile(prod.fragile ?? false);
      setFormTrackVariantStock(prod.trackVariantStock ?? false);
      setFormFeatured(prod.featured ?? false);
      setFormCategory(prod.category || (categoriesList[0] || "Général"));
      setFormStock(prod.stock ?? 20);
      setFormSku(prod.sku || "");
      setFormStatus(prod.status || "active");
      setFormImages(prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []));
      setFormVariants(prod.variants || []);
    } else {
      setEditingProduct(null);
      setFormName("");
      setFormDescription("");
      setFormPrice("");
      setFormOriginalPrice("");
      setFormCostPrice("");
      setFormWeight("");
      setFormTrackStock(true);
      setFormFragile(false);
      setFormTrackVariantStock(false);
      setFormFeatured(false);
      setFormCategory(categoriesList[0] || "Général");
      setFormStock(20);
      setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setFormStatus("active");
      setFormImages([]);
      setFormVariants([]);
    }
    setVariantInputName("");
    setVariantInputOptions("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError("");
  };



  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formName.trim()) {
      setFormError("Veuillez saisir un nom pour le produit.");
      return;
    }
    if (formPrice === "" || Number(formPrice) < 0) {
      setFormError("Veuillez renseigner un prix de vente valide.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const productPayload = {
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        originalPrice: formOriginalPrice !== "" ? Number(formOriginalPrice) : null,
        costPrice: formCostPrice !== "" ? Number(formCostPrice) : null,
        weight: formWeight !== "" ? Number(formWeight) : null,
        trackStock: formTrackStock,
        fragile: formFragile,
        trackVariantStock: formTrackVariantStock,
        featured: formFeatured,
        category: formCategory || "Général",
        stock: formStock !== "" 
          ? Number(formStock) 
          : (formTrackVariantStock && formVariants.length > 0 
              ? formVariants.reduce((sum, v) => sum + (v.options?.reduce((s: number, opt: any) => s + (Number(opt.quantity ?? opt.stock) || 0), 0) || 0), 0) 
              : 0),
        sku: formSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        status: formStatus,
        image: formImages[0] || "",
        images: formImages,
        variants: formVariants,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      let updatedId = "";

      if (editingProduct) {
        updatedId = editingProduct.id;
        const prodRef = doc(db, "products", editingProduct.id);
        await updateDoc(prodRef, productPayload);
        showToast("Produit mis à jour avec succès");
      } else {
        const docRef = await addDoc(collection(db, "products"), {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        updatedId = docRef.id;
        showToast("Produit ajouté au catalogue");
      }

      // Sync updated product list into tenant document for Landing Pages generator
      try {
        const tenantRef = doc(db, "tenants", user.uid);
        const tSnap = await getDoc(tenantRef);
        if (tSnap.exists()) {
          const tData = tSnap.data();
          const existingProds = tData.products && Array.isArray(tData.products) ? [...tData.products] : [];
          const prodForTenant = {
            id: updatedId,
            name: formName.trim(),
            description: formDescription.trim(),
            price: Number(formPrice),
            ...(formOriginalPrice !== "" && { originalPrice: Number(formOriginalPrice) }),
            ...(formCostPrice !== "" && { costPrice: Number(formCostPrice) }),
            ...(formWeight !== "" && { weight: Number(formWeight) }),
            trackStock: formTrackStock,
            fragile: formFragile,
            trackVariantStock: formTrackVariantStock,
            featured: formFeatured,
            category: formCategory || "Général",
            stock: formStock !== "" ? Number(formStock) : 0,
            sku: formSku.trim(),
            status: formStatus,
            image: formImages[0] || "",
            images: formImages,
            variants: formVariants
          };

          const existingIdx = existingProds.findIndex((p: any) => p.id === updatedId);
          if (existingIdx >= 0) {
            existingProds[existingIdx] = prodForTenant;
          } else {
            existingProds.unshift(prodForTenant);
          }

          await updateDoc(tenantRef, { products: existingProds });
        }
      } catch (syncErr) {
        console.warn("Tenant sync notice:", syncErr);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving product:", err);
      setFormError(err.message || "Erreur lors de l'enregistrement du produit.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const productRef = doc(db, "products", productToDelete.id);
      
      // Update tenant doc using a transaction to ensure atomicity
      if (user) {
        const tenantRef = doc(db, "tenants", user.uid);
        await runTransaction(db, async (transaction) => {
          const tSnap = await transaction.get(tenantRef);
          if (tSnap.exists() && tSnap.data().products) {
            const updated = tSnap.data().products.filter((p: any) => p.id !== productToDelete.id);
            transaction.update(tenantRef, { products: updated });
          }
          // Also delete the product inside the same transaction
          transaction.delete(productRef);
        });
      } else {
        await deleteDoc(productRef);
      }

      setProducts(products.filter(p => p.id !== productToDelete.id));
      showToast(`Produit "${productToDelete.name}" supprimé`);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("Erreur lors de la suppression du produit", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (prod: ProductItem) => {
    const newStatus: "active" | "inactive" = prod.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "products", prod.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setProducts(products.map(p => p.id === prod.id ? { ...p, status: newStatus } : p));
      showToast(`Produit ${newStatus === "active" ? "activé" : "désactivé"}`);
    } catch (err) {
      console.error("Error toggling product status:", err);
      showToast("Impossible de modifier le statut", "error");
    }
  };

  const handleDuplicateProduct = async (prod: ProductItem) => {
    if (!user) return;
    try {
      const duplicatedData = {
        name: `${prod.name} (Copie)`,
        description: prod.description || "",
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        costPrice: prod.costPrice || null,
        weight: prod.weight || null,
        trackStock: prod.trackStock ?? true,
        fragile: prod.fragile ?? false,
        trackVariantStock: prod.trackVariantStock ?? false,
        featured: prod.featured ?? false,
        category: prod.category || "Général",
        stock: prod.stock || 20,
        sku: `${prod.sku || "SKU"}-COPY`,
        status: "active" as const,
        image: prod.image,
        variants: prod.variants || [],
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "products"), duplicatedData);
      showToast("Produit dupliqué avec succès");
      await loadData();
    } catch (err) {
      console.error("Error duplicating product:", err);
      showToast("Erreur lors de la duplication", "error");
    }
  };

  // Filtered and sorted products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    
    let matchStatus = true;
    if (statusFilter === "active") matchStatus = p.status === "active";
    else if (statusFilter === "inactive") matchStatus = p.status === "inactive";
    else if (statusFilter === "active_hidden") matchStatus = p.status === "active_hidden";

    let matchStock = true;
    if (stockFilter === "in_stock") matchStock = p.stock > 0;
    else if (stockFilter === "out_of_stock") matchStock = p.stock <= 0;

    let matchFeatured = true;
    if (featuredFilter) matchFeatured = !!p.featured;

    return matchSearch && matchCategory && matchStatus && matchStock && matchFeatured;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "stock") return a.stock - b.stock;
    return 0; // default order
  });

  // Calculate quick stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === "active").length;
  const lowStockProducts = products.filter(p => p.stock <= 5).length;
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
  if (isModalOpen) {
    return (
      <div className="pb-24 max-w-7xl mx-auto">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success" 
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800 backdrop-blur-md" 
              : "bg-red-950/90 text-red-300 border-red-800 backdrop-blur-md"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            {toast.message}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-transparent border border-neutral-700 text-white flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {editingProduct ? "Modifier le produit" : "Ajouter un nouveau produit"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
              <span className="text-red-500 font-bold">▶</span> Voir le tutoriel
            </button>
            <button onClick={handleCloseModal} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour aux produits
            </button>
          </div>
        </div>

        <form id="product-form" onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-white">Informations de base</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nom du produit <span className="text-red-500">*</span></label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Exemple : iPhone 15 Pro" className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">Description</label>
                    <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 text-xs font-bold text-black hover:bg-yellow-400 transition-colors">
                      <Wand2 className="w-3.5 h-3.5" /> Générer la description par IA
                    </button>
                  </div>
                  <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#16161a]">
                    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-neutral-700 bg-[#1e1e24] text-neutral-400">
                       <span className="text-xs px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">Texte normal <ChevronDown className="w-3 h-3 inline" /></span>
                       <div className="w-px h-4 bg-neutral-700 mx-1"></div>
                       <span className="font-bold px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">B</span>
                       <span className="italic px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">I</span>
                       <span className="underline px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">U</span>
                       <span className="line-through px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">S</span>
                       <div className="w-px h-4 bg-neutral-700 mx-1"></div>
                       <span className="px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded text-xs">"</span>
                    </div>
                    <textarea rows={6} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Rédigez une description détaillée du produit..." className="w-full bg-transparent p-4 text-sm text-white placeholder-neutral-500 focus:outline-none resize-y" />
                  </div>
                </div>
              </div>
            </div>

            {/* Prix et stock */}
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-white">Prix et stock</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Prix <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <input type="number" required min={0} value={formPrice} onChange={(e) => setFormPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 rounded-l-lg border border-neutral-700 border-r-0 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">DA</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Prix avant remise</label>
                  <div className="flex mb-1">
                    <input type="number" min={0} value={formOriginalPrice} onChange={(e) => setFormOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 rounded-l-lg border border-neutral-700 border-r-0 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">DA</span>
                  </div>
                  <p className="text-xs text-neutral-500">Laisser vide s'il n'y a pas de remise</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Coût du produit</label>
                  <div className="flex mb-1">
                    <input type="number" min={0} value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 rounded-l-lg border border-neutral-700 border-r-0 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">DA</span>
                  </div>
                  <p className="text-xs text-neutral-500">Prix d'achat ou coût (usage interne uniquement)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Code produit (SKU) <span className="text-neutral-500 font-normal text-xs">(optionnel)</span></label>
                  <input type="text" value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="Code produit (SKU)" className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Poids <span className="text-neutral-500 font-normal text-xs">(optionnel)</span></label>
                  <div className="flex mb-1">
                    <span className="flex items-center px-3 border border-neutral-700 border-r-0 bg-[#16161a] rounded-l-lg"><AlertCircle className="w-4 h-4 text-yellow-500" /></span>
                    <input type="number" min={0} value={formWeight} onChange={(e) => setFormWeight(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 border border-neutral-700 bg-[#16161a] px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">kg</span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">Poids du produit en kilogrammes. Au-delà de 5 kg, des frais de livraison supplémentaires s'appliquent</p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formTrackStock ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormTrackStock(!formTrackStock)}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formTrackStock ? "translate-x-4" : "translate-x-1"}`} />
                    </div>
                    <span className="text-sm font-medium text-white">Suivi du stock</span>
                  </label>
                  <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Lorsque le suivi du stock est désactivé, le produit apparaîtra toujours comme disponible</p>
                </div>
                {formTrackStock && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                      Quantité disponible
                    </label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700 bg-[#1e1e24] px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formFragile ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormFragile(!formFragile)}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formFragile ? "translate-x-4" : "translate-x-1"}`} />
                    </div>
                    <span className="text-sm font-medium text-white">Produit fragile</span>
                  </label>
                  <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Le colis sera marqué comme fragile lors de l'envoi à la société de livraison (si elle prend en charge cette option)</p>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formTrackVariantStock ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormTrackVariantStock(!formTrackVariantStock)}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formTrackVariantStock ? "translate-x-4" : "translate-x-1"}`} />
                    </div>
                    <span className="text-sm font-medium text-white flex items-center gap-2"><Boxes className="w-4 h-4" /> Suivi du stock des variantes</span>
                  </label>
                  <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Le stock sera suivi pour chaque option (couleur/taille) séparément. Lorsque toutes les options sont épuisées, le produit apparaît comme indisponible.</p>
                  <p className="text-xs text-neutral-500 mt-1 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Suivre le stock de chaque combinaison d'options séparément (ex: Taille 32 + Bleu = 2 en stock)</p>
                </div>
              </div>
            </div>

            {/* Variantes */}
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-neutral-400" />
                  <h2 className="text-base font-semibold text-white">Variantes (Couleurs / Options)</h2>
                </div>
                <button type="button" onClick={() => setFormVariants([...formVariants, { name: "", type: "text", options: [] }])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-600 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" /> Ajouter un groupe
                </button>
              </div>
              <p className="text-xs text-neutral-500 flex items-start gap-1 mb-6"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Ajoutez des groupes de variantes comme : couleurs, tailles, capacité... Le client doit choisir une option de chaque groupe</p>
              
              <VariantManager 
                variants={formVariants} 
                onChange={setFormVariants} 
                productImages={formImages} 
                onAddProductImage={(img) => setFormImages(prev => [...prev, img])}
                trackVariantStock={formTrackVariantStock}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Images du produit */}
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <UploadCloud className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-white">Images du produit <span className="text-red-500">*</span></h2>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageFileChange}
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed border-neutral-600 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-800/50 transition-colors mb-6 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-yellow-500 animate-spin mb-2" />
                    <span className="text-sm font-medium text-white">Téléchargement...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-sm font-medium text-white mb-1">Cliquez pour télécharger</span>
                    <span className="text-xs text-neutral-500">Au moins une image requise</span>
                  </>
                )}
              </div>

              {formImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-neutral-700 bg-[#16161a] aspect-square flex items-center justify-center group">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute bottom-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                          Principale
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormImages(prev => {
                                const newArr = [...prev];
                                [newArr[0], newArr[idx]] = [newArr[idx], newArr[0]];
                                return newArr;
                              });
                            }}
                            className="p-2 bg-neutral-700/80 text-white hover:bg-neutral-600 rounded-lg transition-colors text-xs font-medium"
                          >
                            Rendre principale
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional: URL Input fallback */}
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <label className="block text-xs font-medium text-neutral-400 mb-2">Ajouter via URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="img-url-input"
                    placeholder="https://..." 
                    className="flex-1 rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value;
                        if (val) {
                          setFormImages(prev => [...prev, val]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('img-url-input') as HTMLInputElement;
                      if (input && input.value) {
                        setFormImages(prev => [...prev, input.value]);
                        input.value = "";
                      }
                    }}
                    className="px-3 py-2 bg-neutral-700 text-white rounded-lg text-sm hover:bg-neutral-600"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Catégorie et statut */}
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <FolderTree className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-white">Catégorie et statut</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Catégorie</label>
                  <div className="relative">
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors appearance-none">
                      <option value="Sans catégorie">Sans catégorie</option>
                      {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="Général">Général</option>
                      <option value="Vêtements">Vêtements</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Statut</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors">
                    <option value="active">Actif - Disponible à la vente</option>
                    <option value="inactive">Inactif - Masqué</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formFeatured ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormFeatured(!formFeatured)}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formFeatured ? "translate-x-4" : "translate-x-1"}`} />
                    </div>
                    <span className="text-sm font-medium text-white flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Produit en vedette</span>
                  </label>
                  <p className="text-xs text-neutral-500 leading-relaxed">Les produits en vedette apparaissent dans la section "Produits en vedette" de la page d'accueil</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-yellow-500 text-sm font-bold text-black hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Check className="w-4 h-4 stroke-[2.5]" /> {editingProduct ? "Mettre à jour le produit" : "Ajouter le produit"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (

    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
          toast.type === "success" 
            ? "bg-emerald-950/90 text-emerald-300 border-emerald-800 backdrop-blur-md" 
            : "bg-red-950/90 text-red-300 border-red-800 backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-yellow-500" />
            Produits
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gérez votre catalogue de produits, fixez vos prix et suivez vos stocks.
          </p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/10 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Ajouter un produit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("products.totalCatalog")}</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalProducts} <span className="text-xs font-normal text-neutral-500">{t("products.productsCount")}</span></p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("products.activeProducts")}</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeProducts} <span className="text-xs font-normal text-neutral-500">{t("products.online")}</span></p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("products.criticalStock")}</p>
            <p className="text-xl font-bold text-white mt-0.5">{lowStockProducts} <span className="text-xs font-normal text-neutral-500">{t("products.alerts")}</span></p>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-neutral-800/80 rounded-2xl p-4.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("products.inventoryValue")}</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalInventoryValue.toLocaleString()} <span className="text-xs font-normal text-neutral-500">DZD</span></p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-neutral-800 bg-[#1e1e24] p-5 shadow-xl space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..." 
              className="w-full rounded-lg border border-neutral-700 bg-[#25252d] py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters & View */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-neutral-200 focus:border-yellow-500 focus:outline-none appearance-none"
            >
              <option value="all">{t("products.allCategories")}</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-neutral-200 focus:border-yellow-500 focus:outline-none appearance-none"
            >
              <option value="all">{t("products.allStatuses")}</option>
              <option value="active">Actif</option>
              <option value="active_hidden">Actif - Masqué</option>
              <option value="inactive">Brouillon</option>
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-neutral-200 focus:border-yellow-500 focus:outline-none appearance-none"
            >
              <option value="all">{t("products.allStock")}</option>
              <option value="in_stock">En stock</option>
              <option value="out_of_stock">Épuisé</option>
            </select>

            {/* En vedette toggle */}
            <button 
              onClick={() => setFeaturedFilter(!featuredFilter)}
              className={`flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-2 text-sm transition-colors ${featuredFilter ? "bg-amber-500/10 text-amber-500 border-amber-500/50" : "bg-[#25252d] text-neutral-400 hover:text-white"}`}>
              <Star className="w-4 h-4" />
              <span>{t("products.featured")}</span>
            </button>

            {/* Tout sélectionner */}
            <label className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-[#25252d] px-3 py-2 text-sm text-neutral-400 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" className="rounded bg-[#16161a] border-neutral-700 text-yellow-500 focus:ring-yellow-500/20" />
              <span>{t("products.selectAll")}</span>
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#25252d] border border-neutral-700 rounded-lg p-0.5 ml-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <Boxes className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <SlidersHorizontal className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <p className="text-sm text-neutral-400">Chargement de votre catalogue...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-[#16161a]/60 py-16 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4 border border-yellow-500/20">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-sm text-neutral-400 mb-6 max-w-sm mx-auto">
              {search || categoryFilter !== "all" || statusFilter !== "all" 
                ? "Essayez de modifier vos filtres pour voir plus de résultats."
                : "Commencez par ajouter votre premier produit à votre catalogue."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View (Screenshot 1) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((prod) => (
              <div 
                key={prod.id} 
                className="bg-[#1e1e24] border border-neutral-800 rounded-xl overflow-hidden flex flex-col transition-all group"
              >
                {/* Image header */}
                <div className="relative aspect-4/3 w-full bg-[#f8f9fa] overflow-hidden flex items-center justify-center">
                  <div className="absolute top-2 left-2 z-10">
                    <input type="checkbox" className="rounded bg-white/80 border-gray-300 w-4 h-4 text-amber-500 focus:ring-amber-500/20" />
                  </div>
                  {prod.image ? (
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply" 
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-neutral-400" />
                  )}
                  
                  {/* Status Pill */}
                  <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                    prod.status === "active" 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-neutral-200 text-neutral-600"
                  }`}>
                    {prod.status === "active" ? "Actif" : "Inactif"}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col space-y-2 bg-[#16161a]">
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{prod.name}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{prod.category || "Sans catégorie"}</p>
                  </div>
                  
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-sm font-extrabold text-amber-500">{prod.price.toLocaleString()} DA</span>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <span className="text-xs text-neutral-500 line-through">{prod.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  
                  {/* Actions bar */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-neutral-800/50">
                    <button className="flex items-center justify-center py-1.5 rounded-lg bg-blue-900/30 text-blue-500 hover:bg-blue-900/50 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.open(`/store?productId=${prod.id}`, '_blank')} className="flex items-center justify-center py-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenModal(prod)} className="flex items-center justify-center py-1.5 rounded-lg bg-amber-900/30 text-amber-500 hover:bg-amber-900/50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setProductToDelete(prod)} className="flex items-center justify-center py-1.5 rounded-lg bg-red-900/30 text-red-500 hover:bg-red-900/50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View (Screenshot 2) */
          <div className="flex flex-col gap-3">
            {filteredProducts.map((prod) => (
              <div 
                key={prod.id} 
                className="bg-[#1e1e24] border border-neutral-800 rounded-xl overflow-hidden flex items-center p-3 gap-4 transition-all hover:border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded bg-[#16161a] border-neutral-700 w-4 h-4 text-amber-500 focus:ring-amber-500/20" />
                  
                  {/* Image */}
                  <div className="relative w-16 h-16 rounded-lg bg-[#f8f9fa] overflow-hidden flex items-center justify-center shrink-0">
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 flex flex-col">
                    <h3 className="font-bold text-white text-sm line-clamp-1 flex items-center gap-2">
                      {prod.name}
                      {prod.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </h3>
                  </div>
                  
                  <div className="col-span-3 text-xs text-neutral-500 line-clamp-1">
                    {prod.category || "Sans catégorie"}
                  </div>
                  
                  <div className="col-span-4 flex items-baseline justify-end gap-2 pr-4">
                    <span className="text-sm font-extrabold text-amber-500">{prod.price.toLocaleString()} DA</span>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <span className="text-xs text-neutral-500 line-through">{prod.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-neutral-800">
                  <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-900/30 text-blue-500 hover:bg-blue-900/50 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button onClick={() => window.open(`/store?productId=${prod.id}`, '_blank')} className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleOpenModal(prod)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-900/30 text-amber-500 hover:bg-amber-900/50 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setProductToDelete(prod)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-900/30 text-red-500 hover:bg-red-900/50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-800/50 text-xs text-neutral-500">
          <div>
            Affichage de <span className="font-bold text-white">1</span> à <span className="font-bold text-white">{filteredProducts.length}</span> sur <span className="font-bold text-white">{filteredProducts.length}</span> produit(s)
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-800 bg-[#16161a] hover:bg-neutral-800 transition-colors opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" /> Précédent
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-800 bg-[#16161a] hover:bg-neutral-800 transition-colors opacity-50 cursor-not-allowed">
              Suivant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>Afficher :</span>
            <select className="bg-[#16161a] border border-neutral-800 rounded px-2 py-1 text-white">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
{/* Modal: Confirmation de suppression d'un produit */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Supprimer le produit"
        description={`Êtes-vous sûr de vouloir supprimer définitivement le produit "${productToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteProduct}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
}
