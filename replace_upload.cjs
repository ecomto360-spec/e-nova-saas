const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

const replaceBlock = (content, searchField, iconComp, title, subtitle, objectFit = "object-contain") => {
  const regex = new RegExp(
    `<div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg=\\[#1e1e24\\]/50 cursor-pointer hover:bg=\\[#1e1e24\\]">[\\s\\S]*?<${iconComp}[\\s\\S]*?onChange={\\(e\\) => updateConfig\\('${searchField}', e\\.target\\.value\\)}[\\s\\S]*?/>\\s*</div>`, 'g'
  );

  const replacement = `                    <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 hover:bg-[#1e1e24] relative overflow-hidden group">
                       <label className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center z-10">
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, '${searchField}')} />
                       </label>
                       {uploadingField === '${searchField}' ? (
                         <div className="flex flex-col items-center justify-center text-amber-500 z-0">
                           <RotateCw className="w-6 h-6 animate-spin mb-2" />
                           <span className="text-xs font-medium">Téléchargement...</span>
                         </div>
                       ) : config.${searchField} ? (
                         <div className="relative w-full h-32 flex flex-col items-center justify-center pointer-events-none z-0">
                           <img src={config.${searchField}} alt="${title}" className="w-full h-full ${objectFit} mb-2" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <span className="text-[10px] text-white bg-[#111111]/80 px-2 py-1 rounded">Cliquez pour modifier</span>
                           </div>
                         </div>
                       ) : (
                         <div className="pointer-events-none flex flex-col items-center z-0">
                           <${iconComp} size={24} className="text-neutral-400 mb-2" />
                           <p className="text-sm font-bold text-white text-center">${title}</p>
                           <p className="text-xs text-neutral-500 text-center mt-1">${subtitle}</p>
                         </div>
                       )}
                    </div>`;

  return content.replace(regex, replacement);
};

content = replaceBlock(content, 'logoUrl', 'UploadCloud', 'Logo de la boutique', 'PNG, JPG, WebP, SVG', 'object-contain');
content = replaceBlock(content, 'heroDesktopBg', 'Monitor', "Image d'arrière-plan (ordinateur)", '1920x600 pixels recommandé', 'object-cover rounded');
content = replaceBlock(content, 'heroMobileBg', 'Smartphone', "Image d'arrière-plan (mobile)", '600x800 pixels recommandé', 'object-cover rounded');

fs.writeFileSync('src/pages/Customize.tsx', content);

console.log("Done");
