const fs = require('fs');

let settings = fs.readFileSync('src/pages/settings/StoreSettings.tsx', 'utf8');
settings = settings.replace(
  '<Link to="/store" target="_blank" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">',
  '<Link to={tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store"} target="_blank" className="flex items-center justify-between p-2 hover:bg-[#1e1e24] rounded-lg transition-colors group">'
);
fs.writeFileSync('src/pages/settings/StoreSettings.tsx', settings);

let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dashboard = dashboard.replace(
  '<Link \n          to="/store"\n          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"\n        >',
  '<Link \n          to={tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store"}\n          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"\n        >'
);
fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);

console.log("Fixed store links to use storeUrl");
