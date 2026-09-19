const fs = require('fs');

let settings = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

settings = settings.replace(
  /<a href="#" className="flex items-center justify-between p-2 hover:bg-\[#1e1e24\] rounded-lg transition-colors group">([\s\S]*?)Aperçu de la boutique([\s\S]*?)<\/a>/g,
  '<Link to="/store" target="_blank" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">$1Aperçu de la boutique$2</Link>'
);

if (!settings.includes('Link as LinkIcon') && !settings.includes('import { Link } from "react-router-dom"')) {
  // It probably already has Link from 'lucide-react' as LinkIcon.
  if (settings.includes('import { Link as LinkIcon')) {
     settings = settings.replace(
       'import { Link as LinkIcon',
       'import { Link } from "react-router-dom";\nimport { Link as LinkIcon'
     );
  }
} else if (!settings.includes('import { Link } from "react-router-dom"')) {
   settings = 'import { Link } from "react-router-dom";\n' + settings;
}

fs.writeFileSync('src/pages/settings/StoreSettings.tsx', settings);

let unavailable = fs.readFileSync('src/components/storefront/StoreUnavailable.tsx', 'utf8');
unavailable = unavailable.replace('window.location.href = "/"', 'window.location.href = "/dashboard"');
fs.writeFileSync('src/components/storefront/StoreUnavailable.tsx', unavailable);

console.log("Fixed store links");
