const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

content = content.replace(
  /<div className="relative w-full h-24 flex flex-col items-center justify-center pointer-events-none z-0">\s*<img src=\{config\.logoUrl\} alt="Logo" className="w-full h-full object-contain mb-2" \/>\s*<div className="absolute inset-0 bg-black\/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">\s*<span className="text-\[10px\] text-white bg-\[#111111\]\/80 px-2 py-1 rounded">Cliquez pour modifier<\/span>\s*<\/div>\s*<\/div>/,
  '<div className="relative w-full h-24 flex flex-col items-center justify-center z-0">\\n' +
  '  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain mb-2" />\\n' +
  '  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">\\n' +
  '    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateConfig(\\'logoUrl\\', \\'\\'); }} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium px-2 py-1 rounded">Supprimer</button>\\n' +
  '  </div>\\n' +
  '</div>'
);

content = content.replace(
  /<div className="relative w-full h-24 flex flex-col items-center justify-center pointer-events-none z-0">\s*<img src=\{config\.heroDesktopBg\} alt="Hero Desktop" className="w-full h-full object-cover rounded mb-2" \/>\s*<div className="absolute inset-0 bg-black\/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">\s*<span className="text-\[10px\] text-white bg-\[#111111\]\/80 px-2 py-1 rounded">Cliquez pour modifier<\/span>\s*<\/div>\s*<\/div>/,
  '<div className="relative w-full h-24 flex flex-col items-center justify-center z-0">\\n' +
  '  <img src={config.heroDesktopBg} alt="Hero Desktop" className="w-full h-full object-cover rounded mb-2" />\\n' +
  '  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">\\n' +
  '    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateConfig(\\'heroDesktopBg\\', \\'\\'); }} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium px-2 py-1 rounded">Supprimer</button>\\n' +
  '  </div>\\n' +
  '</div>'
);

content = content.replace(
  /<div className="relative w-full h-32 flex flex-col items-center justify-center pointer-events-none z-0">\s*<img src=\{config\.heroMobileBg\} alt="Hero Mobile" className="w-full h-full object-cover rounded mb-2" \/>\s*<div className="absolute inset-0 bg-black\/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">\s*<span className="text-\[10px\] text-white bg-\[#111111\]\/80 px-2 py-1 rounded">Cliquez pour modifier<\/span>\s*<\/div>\s*<\/div>/,
  '<div className="relative w-full h-32 flex flex-col items-center justify-center z-0">\\n' +
  '  <img src={config.heroMobileBg} alt="Hero Mobile" className="w-full h-full object-cover rounded mb-2" />\\n' +
  '  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">\\n' +
  '    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateConfig(\\'heroMobileBg\\', \\'\\'); }} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium px-2 py-1 rounded">Supprimer</button>\\n' +
  '  </div>\\n' +
  '</div>'
);

fs.writeFileSync('src/pages/Customize.tsx', content);
console.log("Updated");
