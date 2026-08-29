import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Image as ImageIcon, Copy, Check, ExternalLink } from 'lucide-react';

interface UploadedImage {
  id: string;
  mimeType: string;
  createdAt: string;
  url: string;
}

export default function MediaManager({ refreshTrigger }: { refreshTrigger?: number }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/images');
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
      }
    } catch (err) {
      console.error("Failed to fetch images", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette image ? Les liens vers celle-ci seront rompus.")) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/images/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete image", err);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(null);
    }
  };

  const copyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-[#111] border border-neutral-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-neutral-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">Aucun média</h3>
        <p className="text-neutral-400 max-w-md">Les images que vous uploadez apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
        <h2 className="font-semibold text-white">Bibliothèque des médias</h2>
        <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-medium">
          {images.length} fichier(s)
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-[#1a1a1a] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-square w-full relative bg-black/50 overflow-hidden flex items-center justify-center p-4">
              <img 
                src={img.url} 
                alt="Upload" 
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a 
                  href={img.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => deleteImage(img.id)}
                  disabled={isDeleting === img.id}
                  className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg transition-colors"
                  title="Supprimer l'image"
                >
                  {isDeleting === img.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="p-3 border-t border-neutral-800 flex items-center justify-between">
              <div className="text-xs text-neutral-500 truncate mr-2">
                {new Date(img.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </div>
              <button 
                onClick={() => copyUrl(img.url, img.id)}
                className="text-neutral-400 hover:text-white transition-colors p-1"
                title="Copier le lien"
              >
                {copiedId === img.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
