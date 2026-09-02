const fs = require('fs');
let code = fs.readFileSync('src/components/admin/VariantManager.tsx', 'utf8');

// 1. Add useRef to the import
if (!code.includes("useRef")) {
  code = code.replace('import React, { useState } from "react";', 'import React, { useState, useRef } from "react";');
}

// 2. Add fileInputRef to the component
code = code.replace(
  'const [imageModalOpen, setImageModalOpen] = useState<{gIdx: number, oIdx: number} | null>(null);',
  `const [imageModalOpen, setImageModalOpen] = useState<{gIdx: number, oIdx: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageModalOpen) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateOption(imageModalOpen.gIdx, imageModalOpen.oIdx, { image: base64 });
    };
    reader.readAsDataURL(file);
  };`
);

// 3. Update the modal UI
const modalTarget = `<div className="h-48 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Veuillez d'abord télécharger les images du produit</p>
              </div>`;

const modalReplacement = `<input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
              
              {imageModalOpen && (() => {
                const opt = variants[imageModalOpen.gIdx].options[imageModalOpen.oIdx];
                const optData = typeof opt === 'string' ? null : opt;
                const currentImage = optData?.image;
                
                return currentImage ? (
                  <div className="h-48 border-2 border-neutral-700 rounded-xl flex items-center justify-center p-2 relative overflow-hidden bg-[#16161a]">
                    <img src={currentImage} alt="Selected" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-48 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                    <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">Aucune image sélectionnée</p>
                  </div>
                );
              })()}`;

code = code.replace(modalTarget, modalReplacement);

// 4. Update the Upload new button
const buttonTarget = `<button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  Upload new
                </button>`;
const buttonReplacement = `<button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload new
                </button>`;

code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/components/admin/VariantManager.tsx', code);
console.log("VariantManager updated!");
