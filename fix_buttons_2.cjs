const fs = require('fs');
let settings = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

const settingsLinkOld = `<Link to={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"} target="_blank" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">
                <div className="flex items-center gap-3 text-sm text-neutral-300 group-hover:text-white">
                  <Eye className="w-4 h-4 text-yellow-500" />
                  Aperçu de la boutique
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
              </Link>`;

const settingsLinkNew = `{isTrialExpired ? (
                <div className="flex items-center justify-between p-2 rounded-lg opacity-50 cursor-not-allowed select-none">
                  <div className="flex items-center gap-3 text-sm text-neutral-500">
                    <Eye className="w-4 h-4 text-neutral-600" />
                    Aperçu de la boutique
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-700" />
                </div>
              ) : (
                <Link to={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"} target="_blank" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 text-sm text-neutral-300 group-hover:text-white">
                    <Eye className="w-4 h-4 text-yellow-500" />
                    Aperçu de la boutique
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                </Link>
              )}`;

settings = settings.replace(settingsLinkOld, settingsLinkNew);
fs.writeFileSync('src/pages/settings/StoreSettings.tsx', settings);

console.log("Fixed settings link again");
