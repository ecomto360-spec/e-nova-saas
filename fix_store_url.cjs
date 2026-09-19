const fs = require('fs');
let content = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

content = content.replace(
  /<a href="https:\/\/e-nova\.vercel\.app\/store\/boutikdz" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 text-sm font-medium flex items-center gap-2">\s*https:\/\/e-nova\.vercel\.app\/store\/boutikdz\s*<ExternalLink className="w-4 h-4" \/>\s*<\/a>/,
  `{tenantData?.storeUrl ? (
                <Link to={\`/store/\${tenantData.storeUrl}\`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 text-sm font-medium flex items-center gap-2">
                  {window.location.origin}/store/{tenantData.storeUrl}
                  <ExternalLink className="w-4 h-4" />
                </Link>
              ) : (
                <span className="text-neutral-500 text-sm italic">URL non configurée</span>
              )}`
);

fs.writeFileSync('src/pages/settings/StoreSettings.tsx', content);
console.log("Fixed hardcoded store URL");
