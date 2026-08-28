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
  Tag, 
  Plus, 
  Search, 
  Package, 
  Edit2, 
  Trash2, 
  Loader2,
  Image as ImageIcon,
  X
} from "lucide-react";
import { ConfirmModal } from "../components/common/ConfirmModal";

interface Category {
  id: string;
  name: string;
  status: "active" | "inactive";
  imageUrl: string;
  productCount: number;
}

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSubcatToggle, setShowSubcatToggle] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", status: "active", imageUrl: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "categories"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const cats: Category[] = [];
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, status: cat.status, imageUrl: cat.imageUrl || "" });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", status: "active", imageUrl: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      if (editingCategory) {
        const catRef = doc(db, "categories", editingCategory.id);
        await updateDoc(catRef, {
          name: formData.name,
          status: formData.status,
          imageUrl: formData.imageUrl
        });
      } else {
        await addDoc(collection(db, "categories"), {
          name: formData.name,
          status: formData.status,
          imageUrl: formData.imageUrl,
          productCount: 0,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      await loadCategories();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving category:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "categories", categoryToDelete.id));
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Tag className="text-yellow-500 w-6 h-6" />
            Gestion des catégories
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Ajoutez et modifiez les catégories de produits pour organiser votre boutique
          </p>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
            <button 
              onClick={() => setShowSubcatToggle(!showSubcatToggle)}
              className={`w-10 h-6 rounded-full transition-colors relative ${showSubcatToggle ? "bg-yellow-500" : "bg-neutral-600"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showSubcatToggle ? "left-5" : "left-1"}`} />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Sous-catégories uniquement dans la catégorie parente</span>
              <span className="text-xs text-neutral-500">Les sous-catégories seront masquées sur la page d'accueil</span>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2.5 rounded-xl font-medium hover:bg-yellow-400 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ajouter une catégorie
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#1e1e24] p-4 rounded-xl border border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Rechercher une catégorie par nom..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161a] border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-500 min-w-[200px]"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Tag className="w-12 h-12 mb-4 opacity-20" />
            <p>Aucune catégorie trouvée.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-neutral-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#16161a] rounded-lg border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    {cat.status === 'active' ? (
                      <span className="inline-flex items-center bg-emerald-500/10 text-emerald-500 text-[10px] font-medium px-2 py-0.5 rounded-full mb-1">
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-neutral-500/10 text-neutral-400 text-[10px] font-medium px-2 py-0.5 rounded-full mb-1">
                        Inactif
                      </span>
                    )}
                    <h3 className="text-white font-medium text-sm">{cat.name}</h3>
                    <div className="flex items-center gap-1.5 text-neutral-400 mt-1">
                      <Package className="w-3.5 h-3.5" />
                      <span className="text-xs">{cat.productCount} produit(s)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleOpenModal(cat)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:bg-neutral-700/50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button 
                    onClick={() => setCategoryToDelete(cat)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">
                {editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}
              </h2>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Nom de la catégorie</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="Ex: Vêtements"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">URL de l'image (optionnel)</label>
                <input 
                  type="url" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Statut</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-700 text-white font-medium hover:bg-neutral-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center bg-yellow-500 text-black px-4 py-2.5 rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Confirmation de suppression d'une catégorie */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Supprimer la catégorie"
        description={`Êtes-vous sûr de vouloir supprimer définitivement la catégorie "${categoryToDelete?.name}" ?`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
