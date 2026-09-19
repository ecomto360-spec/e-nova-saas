const fs = require('fs');

let content = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');

// First add useTenant hook to import if not present
if (!content.includes('useTenant')) {
  content = content.replace(
    'import { useAuth } from "../../hooks/useAuth";',
    'import { useAuth } from "../../hooks/useAuth";\nimport { useTenant } from "../../contexts/TenantContext";'
  );
  
  content = content.replace(
    'const { user } = useAuth();',
    'const { user } = useAuth();\n  const { tenantData, isTrialExpired } = useTenant();'
  );
}

// Ensure the helper function to format dates is imported or we write one
const imports = `import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";`;

if (!content.includes('date-fns')) {
  content = content.replace(
    'import { Save, Store, MapPin, Phone, Info, CheckCircle, Zap, ExternalLink, Plus, ShoppingCart, Copy, Check } from "lucide-react";',
    'import { Save, Store, MapPin, Phone, Info, CheckCircle, Zap, ExternalLink, Plus, ShoppingCart, Copy, Check, AlertTriangle } from "lucide-react";\n' + imports
  );
} else {
  // If it is there, just make sure we have AlertTriangle
  content = content.replace('Copy, Check }', 'Copy, Check, AlertTriangle }');
}


// Replace the static block
const staticBlock = `<div className="space-y-4 pt-4 border-t border-neutral-800">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Plan actuel</div>
                <div className="text-white font-medium">Pro</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Date d'expiration de l'abonnement</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">2026/08/22</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-yellow-500 text-black px-2 py-0.5 rounded">2 jours restants</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Date de création</div>
                <div className="text-white font-medium">2026/08/19</div>
              </div>
            </div>`;

const dynamicBlock = `{/* Dynamic Store Status */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Plan actuel</div>
                <div className="text-white font-medium capitalize">{tenantData?.plan || "Essai Gratuit"}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Date d'expiration</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {tenantData?.planExpiresAt ? format(new Date(tenantData.planExpiresAt), 'dd/MM/yyyy') : 
                     tenantData?.trialStartDate ? (
                       (() => {
                         const start = typeof tenantData.trialStartDate === 'object' && tenantData.trialStartDate.seconds 
                           ? new Date(tenantData.trialStartDate.seconds * 1000)
                           : new Date(tenantData.trialStartDate);
                         const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
                         return format(end, 'dd/MM/yyyy');
                       })()
                     ) : "N/A"}
                  </span>
                  {(() => {
                    let endDate = null;
                    if (tenantData?.planExpiresAt) {
                      endDate = new Date(tenantData.planExpiresAt);
                    } else if (tenantData?.trialStartDate) {
                      const start = typeof tenantData.trialStartDate === 'object' && tenantData.trialStartDate.seconds 
                           ? new Date(tenantData.trialStartDate.seconds * 1000)
                           : new Date(tenantData.trialStartDate);
                      endDate = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
                    }
                    
                    if (endDate) {
                      const daysLeft = differenceInDays(endDate, new Date());
                      if (daysLeft < 0) {
                        return <span className="text-[10px] uppercase tracking-wider font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded">Expiré</span>;
                      }
                      if (daysLeft <= 3) {
                        return <span className="text-[10px] uppercase tracking-wider font-bold bg-red-500 text-white px-2 py-0.5 rounded">{daysLeft} jours restants</span>;
                      }
                      return <span className="text-[10px] uppercase tracking-wider font-bold bg-yellow-500 text-black px-2 py-0.5 rounded">{daysLeft} jours restants</span>;
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Date de création</div>
                <div className="text-white font-medium">
                  {tenantData?.createdAt ? (
                    typeof tenantData.createdAt === 'object' && tenantData.createdAt.seconds 
                      ? format(new Date(tenantData.createdAt.seconds * 1000), 'dd/MM/yyyy')
                      : format(new Date(tenantData.createdAt), 'dd/MM/yyyy')
                  ) : (
                    tenantData?.trialStartDate ? (
                      typeof tenantData.trialStartDate === 'object' && tenantData.trialStartDate.seconds 
                        ? format(new Date(tenantData.trialStartDate.seconds * 1000), 'dd/MM/yyyy')
                        : format(new Date(tenantData.trialStartDate), 'dd/MM/yyyy')
                    ) : "N/A"
                  )}
                </div>
              </div>
            </div>`;

content = content.replace(staticBlock, dynamicBlock);

// Update active status logic
const staticActive = `<div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-white font-medium">Actif</h4>
                <p className="text-sm text-neutral-400">Votre boutique est accessible aux clients</p>
              </div>
            </div>`;

const dynamicActive = `{isTrialExpired ? (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-red-500 font-medium">Expiré</h4>
                  <p className="text-sm text-neutral-400">Votre boutique est suspendue</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Actif</h4>
                  <p className="text-sm text-neutral-400">Votre boutique est accessible aux clients</p>
                </div>
              </div>
            )}`;

content = content.replace(staticActive, dynamicActive);


fs.writeFileSync('src/pages/settings/StoreSettings.tsx', content);
console.log("Updated StoreSettings");
