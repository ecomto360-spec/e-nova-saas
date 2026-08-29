import React, { useState, useRef } from 'react';
import { Upload, Loader2, Copy, Check, ImageIcon } from 'lucide-react';

export default function ImageUploader({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setUploadedUrl(null);
    setCopied(false);

    const formData = new FormData();
    formData.append('image', e.target.files[0]);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        // Construct full URL
        const fullUrl = window.location.origin + data.url;
        setUploadedUrl(fullUrl);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        alert(data.error || "Erreur lors de l'upload");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyUrl = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <ImageIcon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Hébergement d'images public</h2>
          <p className="text-sm text-neutral-400">Uploadez une image (jpg, png, webp) pour obtenir un lien direct.</p>
        </div>
      </div>
      
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
        {uploadedUrl && (
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-neutral-700 rounded-lg px-3 py-2">
            <span className="text-sm text-neutral-300 max-w-[150px] sm:max-w-[300px] truncate">{uploadedUrl}</span>
            <button onClick={copyUrl} className="text-neutral-400 hover:text-white transition-colors" title="Copier le lien">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload} 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? 'Envoi...' : 'Uploader une image'}
        </button>
      </div>
    </div>
  );
}
