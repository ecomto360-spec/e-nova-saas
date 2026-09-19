const fs = require('fs');

// 1. Dashboard
let dash = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const dashLinkOld = `<Link 
          to={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Voir la boutique
        </Link>`;

const dashLinkNew = `{isTrialExpired ? (
          <button 
            disabled
            className="bg-neutral-800 text-neutral-500 font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Voir la boutique
          </button>
        ) : (
          <Link 
            to={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"}
            target="_blank"
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Voir la boutique
          </Link>
        )}`;

dash = dash.replace(dashLinkOld, dashLinkNew);
fs.writeFileSync('src/pages/Dashboard.tsx', dash);


// 2. Header
let header = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

const headerLinkOld = `<a 
          href={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"}
          target="_blank"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
        >
          <Eye size={16} />
          {t('common.viewStore')}
        </a>`;

const headerLinkNew = `{isTrialExpired ? (
          <button 
            disabled
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-500 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            <Eye size={16} />
            {t('common.viewStore')}
          </button>
        ) : (
          <a 
            href={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"}
            target="_blank"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
          >
            <Eye size={16} />
            {t('common.viewStore')}
          </a>
        )}`;
        
if (!header.includes('const { tenantData, isTrialExpired } = useTenant();')) {
   header = header.replace(
      'const { tenantData } = useTenant();',
      'const { tenantData, isTrialExpired } = useTenant();'
   );
}
header = header.replace(headerLinkOld, headerLinkNew);
fs.writeFileSync('src/components/layout/Header.tsx', header);


// 3. Settings (Aperçu de la boutique)
let settings = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

const settingsLinkOld = `<Link to={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"} target="_blank" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">
                <div className="flex items-center gap-3 text-sm text-neutral-300 group-hover:text-white">
                  <Eye className="w-4 h-4 text-yellow-500" />
                  Aperçu de la boutique
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
              </Link>`;

const settingsLinkNew = `{isTrialExpired ? (
                <div className="flex items-center justify-between p-2 rounded-lg opacity-50 cursor-not-allowed">
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

// 4. Customize (Lien tout en haut)
let customize = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

const customizeLinkOld = `<a 
              href={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <ExternalLink size={14} /> Voir la boutique
            </a>`;

const customizeLinkNew = `{isTrialExpired ? (
              <button 
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-500 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <ExternalLink size={14} /> Voir la boutique
              </button>
            ) : (
              <a 
                href={tenantData?.storeUrl ? \`/store/\${tenantData.storeUrl}\` : "/store"}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <ExternalLink size={14} /> Voir la boutique
              </a>
            )}`;
            
if (!customize.includes('const { tenantData, isTrialExpired } = useTenant();')) {
   customize = customize.replace(
      'const { tenantData } = useTenant();',
      'const { tenantData, isTrialExpired } = useTenant();'
   );
}
customize = customize.replace(customizeLinkOld, customizeLinkNew);
fs.writeFileSync('src/pages/Customize.tsx', customize);


console.log("Disabled buttons when trial is expired");
