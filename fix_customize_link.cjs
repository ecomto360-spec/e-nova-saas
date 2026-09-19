const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

content = content.replace(
  /<Link\s*to="\/store"\s*className="px-4 py-1\.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-2 transition-colors"\s*>\s*<ExternalLink size=\{14\} \/> Voir la boutique\s*<\/Link>/,
  `<a 
              href="/store"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={14} /> Voir la boutique
            </a>`
);

fs.writeFileSync('src/pages/Customize.tsx', content);
console.log("Customize link updated");
