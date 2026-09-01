const fs = require('fs');

// --- 1. UPDATE ThemeStorePreview.tsx ---
let previewCode = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

// Update Interface
previewCode = previewCode.replace(
  `interface ThemeStorePreviewProps {
  theme: StoreTheme;
  customStoreName?: string;
  customLogoUrl?: string;
  isStandaloneView?: boolean;
  actualProducts?: any[];
}`,
  `interface ThemeStorePreviewProps {
  theme: StoreTheme;
  customStoreName?: string;
  customLogoUrl?: string;
  isStandaloneView?: boolean;
  actualProducts?: any[];
  currentView?: "home" | "product" | "checkout";
  onSectionSelect?: (sectionId: string) => void;
}`
);

// Update Component signature
previewCode = previewCode.replace(
  `export function ThemeStorePreview({ theme, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts }: ThemeStorePreviewProps) {`,
  `export function ThemeStorePreview({ theme, customStoreName, customLogoUrl, isStandaloneView = false, actualProducts, currentView = "home", onSectionSelect }: ThemeStorePreviewProps) {`
);

// Define Hover Wrapper Helper (to be inserted before return)
const hoverHelper = `
  // Helper pour entourer les sections cliquables
  const EditableSection = ({ id, children, className = "" }: { id: string, children: React.ReactNode, className?: string }) => {
    if (isStandaloneView) return <div className={className}>{children}</div>;
    return (
      <div 
        className={\`relative group/section cursor-pointer \${className}\`}
        onClick={(e) => {
          e.stopPropagation();
          if (onSectionSelect) onSectionSelect(id);
        }}
      >
        <div className="absolute inset-0 border-2 border-transparent group-hover/section:border-amber-500 group-hover/section:bg-amber-500/5 transition-all z-40 pointer-events-none rounded-lg m-0.5"></div>
        {/* Badge indicateur au survol */}
        <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/section:opacity-100 transition-opacity z-50 pointer-events-none shadow-sm">
          Modifier
        </div>
        {children}
      </div>
    );
  };
`;

// Insert the helper right after state declarations (around COD Form State)
previewCode = previewCode.replace(
  `const [orderSuccess, setOrderSuccess] = useState(false);`,
  `const [orderSuccess, setOrderSuccess] = useState(false);\n${hoverHelper}`
);

// Replace the main return with conditional rendering based on currentView
// For the sake of the demo, I will inject simple layouts for Product and Checkout
const viewsReplacement = `
  if (currentView === "product") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans" style={{ fontFamily: theme.fontFamily || "Inter, sans-serif" }}>
        {/* Header (Clickable) */}
        <EditableSection id="header" className="bg-[#1a1f2e] text-white">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-8" /> : <h1 className="text-xl font-bold">{storeName}</h1>}
            <div className="flex gap-4"><div className="w-8 h-8 bg-white/10 rounded-full"></div></div>
          </div>
        </EditableSection>

        {/* Product Page (Clickable) */}
        <EditableSection id="product_page" className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 aspect-[4/5] bg-gray-100 rounded-xl"></div>
            <div className="w-full md:w-1/2 space-y-4">
              <div className="w-20 h-6 bg-emerald-100 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-800">T-shirt Premium</h2>
              <h3 className="text-xl font-black" style={{ color: theme.primaryColor || "#f59e0b" }}>2500 د.ج</h3>
              <div className="space-y-2 pt-4">
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="flex gap-2"><div className="w-10 h-10 bg-gray-100 rounded-full"></div><div className="w-10 h-10 bg-gray-100 rounded-full"></div></div>
              </div>
              <div className="pt-8">
                <div className="w-full h-12 rounded-xl" style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}></div>
              </div>
            </div>
          </div>
        </EditableSection>
      </div>
    );
  }

  if (currentView === "checkout") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans" style={{ fontFamily: theme.fontFamily || "Inter, sans-serif" }}>
         <EditableSection id="header" className="bg-[#1a1f2e] text-white">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="max-h-8" /> : <h1 className="text-xl font-bold">{storeName}</h1>}
          </div>
        </EditableSection>

        <EditableSection id="checkout_page" className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 order-2 lg:order-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="h-40 bg-gray-50 rounded-xl mb-4"></div>
              <div className="h-10 bg-gray-100 rounded-xl mt-8"></div>
            </div>
            <div className="w-full lg:w-2/3 order-1 lg:order-2 space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                 <div className="h-6 w-1/3 bg-gray-100 rounded mb-6"></div>
                 <div className="h-12 bg-gray-50 rounded-xl"></div>
                 <div className="h-12 bg-gray-50 rounded-xl"></div>
                 <div className="grid grid-cols-2 gap-4"><div className="h-12 bg-gray-50 rounded-xl"></div><div className="h-12 bg-gray-50 rounded-xl"></div></div>
               </div>
            </div>
          </div>
        </EditableSection>
      </div>
    );
  }

  return (
`;

previewCode = previewCode.replace(`return (`, viewsReplacement);

// Wrap Home Sections with EditableSection
previewCode = previewCode.replace(
  `<header className="bg-white border-b border-gray-100 sticky top-0 z-40">`,
  `<EditableSection id="header"><header className="bg-white border-b border-gray-100 sticky top-0 z-40">`
);
previewCode = previewCode.replace(
  `</header>`,
  `</header></EditableSection>`
);

previewCode = previewCode.replace(
  `<section className="relative bg-[#1a1f2e] pt-12 pb-24 overflow-hidden rounded-b-[40px]">`,
  `<EditableSection id="hero"><section className="relative bg-[#1a1f2e] pt-12 pb-24 overflow-hidden rounded-b-[40px]">`
);
previewCode = previewCode.replace(
  `</section>\n\n      {/* Trust Badges */}`,
  `</section></EditableSection>\n\n      {/* Trust Badges */}`
);

previewCode = previewCode.replace(
  `<section className="bg-white border-b border-gray-100 py-6">`,
  `<EditableSection id="trust"><section className="bg-white border-b border-gray-100 py-6">`
);
previewCode = previewCode.replace(
  `</section>\n\n      {/* Featured Category Section */}`,
  `</section></EditableSection>\n\n      {/* Featured Category Section */}`
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', previewCode);

// --- 2. UPDATE Customize.tsx ---
let customizeCode = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

// Add View States
const statesToInject = `  const [previewView, setPreviewView] = useState<"home" | "product" | "checkout">("home");
  const [activeMenu, setActiveMenu] = useState<string>("main"); // main, header, product, checkout`;

customizeCode = customizeCode.replace(
  `const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");`,
  `const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");\n${statesToInject}`
);

// Replace the top Browser Toolbar with the new View Switcher
const oldToolbar = `<div className="h-11 bg-gray-100 dark:bg-[#1e1e24] border-b border-gray-200 dark:border-neutral-800 flex items-center px-4 gap-4 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50"></div>
            </div>
            <div className="flex-1 max-w-sm mx-auto bg-white dark:bg-[#16161a] rounded-lg px-3 py-1 text-xs text-gray-500 dark:text-neutral-400 font-mono text-center border border-gray-200 dark:border-neutral-800 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>e-nova.vercel.app/store/demo-{liveTheme.id}</span>
            </div>
            <Link
              to="/store"
              className="text-xs text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink size={13} />
            </Link>
          </div>`;

const newToolbar = `<div className="h-14 bg-[#1e1e24] border-b border-neutral-800 flex items-center px-4 justify-between shrink-0">
            {/* Device Toggles */}
            <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800">
              <button 
                onClick={() => setDeviceMode("desktop")}
                className={\`p-1.5 rounded-md transition-colors \${deviceMode === "desktop" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Monitor size={16} />
              </button>
              <button 
                onClick={() => setDeviceMode("mobile")}
                className={\`p-1.5 rounded-md transition-colors \${deviceMode === "mobile" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Smartphone size={16} />
              </button>
            </div>

            {/* View Switcher (Accueil, Produit, Commande) */}
            <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800">
              <button 
                onClick={() => { setPreviewView("home"); setActiveMenu("main"); }}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 \${previewView === "home" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Store size={14} /> Accueil
              </button>
              <button 
                onClick={() => { setPreviewView("product"); setActiveMenu("product_page"); }}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 \${previewView === "product" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <ShoppingBag size={14} /> Produit
              </button>
              <button 
                onClick={() => { setPreviewView("checkout"); setActiveMenu("checkout_page"); }}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 \${previewView === "checkout" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}\`}
              >
                <Check size={14} /> Commande
              </button>
            </div>

            <Link
              to="/store"
              className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={14} /> Voir la boutique
            </Link>
          </div>`;

customizeCode = customizeCode.replace(oldToolbar, newToolbar);

// Pass props to preview
const oldPreviewTag = `<ThemeStorePreview 
                theme={liveTheme} 
                customStoreName={storeName}
                customLogoUrl={logoUrl}
              />`;
const newPreviewTag = `<ThemeStorePreview 
                theme={liveTheme} 
                customStoreName={storeName}
                customLogoUrl={logoUrl}
                currentView={previewView}
                onSectionSelect={(sectionId) => {
                  if (sectionId === 'header') { setActiveMenu('header'); setPreviewView('home'); }
                  if (sectionId === 'product_page') { setActiveMenu('product_page'); setPreviewView('product'); }
                  if (sectionId === 'checkout_page') { setActiveMenu('checkout_page'); setPreviewView('checkout'); }
                }}
              />`;

customizeCode = customizeCode.replace(oldPreviewTag, newPreviewTag);

// Remove the device toggle block from the top left since we moved it to the center toolbar
const deviceToggleTopLeft = `<div className="flex bg-gray-100 dark:bg-[#16161a] p-1 rounded-lg border border-gray-200 dark:border-neutral-800">
            <button 
              onClick={() => setDeviceMode("desktop")}
              className={\`p-1.5 rounded-md transition-colors \${deviceMode === "desktop" ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-neutral-400"}\`}
            >
              <Monitor size={16} />
            </button>
            <button 
              onClick={() => setDeviceMode("mobile")}
              className={\`p-1.5 rounded-md transition-colors \${deviceMode === "mobile" ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-neutral-400"}\`}
            >
              <Smartphone size={16} />
            </button>
          </div>`;
customizeCode = customizeCode.replace(deviceToggleTopLeft, "");

// Replace the Left Sidebar completely to implement drill-down
const oldSidebarStart = `{/* Accordion Settings */}`;
const oldSidebarEnd = `{/* Live Preview Window Container */}`;

// Extract everything before sidebar and after sidebar
const parts = customizeCode.split(oldSidebarStart);
const parts2 = parts[1].split(oldSidebarEnd);

const newSidebar = `
          {/* Drill-down Sidebar */}
          <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e24] shadow-sm overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
            
            {/* MAIN MENU */}
            {activeMenu === "main" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-1">
                  
                  {/* Identité / Header */}
                  <div 
                    onClick={() => setActiveMenu("header")}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-amber-500 transition-colors">
                         <LayoutTemplate size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">En-tête et Logo</h4>
                        <p className="text-[10px] text-neutral-400">Logo et barre de navigation</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-500 -rotate-90 group-hover:text-white" />
                  </div>

                  {/* Colors */}
                  <div 
                    onClick={() => setActiveMenu("colors")}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-amber-500 transition-colors">
                         <Palette size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Couleurs et Police</h4>
                        <p className="text-[10px] text-neutral-400">Couleurs principales et polices</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-500 -rotate-90 group-hover:text-white" />
                  </div>

                  {/* Product Page */}
                  <div 
                    onClick={() => { setActiveMenu("product_page"); setPreviewView("product"); }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-amber-500 transition-colors">
                         <ShoppingBag size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Page produit</h4>
                        <p className="text-[10px] text-neutral-400">Paramètres page produit</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-500 -rotate-90 group-hover:text-white" />
                  </div>

                  {/* Checkout Page */}
                  <div 
                    onClick={() => { setActiveMenu("checkout_page"); setPreviewView("checkout"); }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-amber-500 transition-colors">
                         <Check size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Page de paiement</h4>
                        <p className="text-[10px] text-neutral-400">Personnaliser le paiement</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-500 -rotate-90 group-hover:text-white" />
                  </div>

                </div>
              </div>
            )}

            {/* HEADER SETTINGS SUBMENU */}
            {activeMenu === "header" && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
                  <button onClick={() => setActiveMenu("main")} className="text-neutral-400 hover:text-white flex items-center gap-1 text-xs">
                    <ChevronDown className="w-4 h-4 rotate-90" /> Retour
                  </button>
                  <span className="text-sm font-bold text-white ml-2 flex items-center gap-2">
                    <LayoutTemplate size={14} className="text-amber-500" /> En-tête et Logo
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Name */}
                  <div>
                    <label className="text-xs text-gray-600 dark:text-neutral-400 block mb-2 font-medium">Nom de la boutique</label>
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex: Ma Super Boutique"
                      className="w-full bg-[#16161a] border border-neutral-700 text-sm rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  
                  {/* Logo Upload */}
                  <div>
                    <label className="text-xs text-gray-600 dark:text-neutral-400 block mb-2 font-medium">Logo de la boutique</label>
                    <div className="border-2 border-dashed border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center bg-[#16161a] hover:border-amber-500 transition-colors cursor-pointer relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => setLogoUrl(event.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {logoUrl ? (
                        <div className="w-full flex flex-col items-center gap-3">
                           <img src={logoUrl} alt="Logo" className="max-h-16 object-contain" />
                           <button 
                             type="button" 
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogoUrl(""); }}
                             className="text-xs text-red-400 z-20 px-3 py-1 bg-red-400/10 rounded-lg hover:bg-red-400/20"
                           >Supprimer l'image</button>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                             <Upload className="w-5 h-5 text-amber-500" />
                          </div>
                          <span className="text-sm font-bold text-white">Importer un logo</span>
                          <span className="text-xs text-neutral-500 mt-1">PNG, JPG, WebP transparent</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COLORS SETTINGS SUBMENU */}
            {activeMenu === "colors" && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
                  <button onClick={() => setActiveMenu("main")} className="text-neutral-400 hover:text-white flex items-center gap-1 text-xs">
                    <ChevronDown className="w-4 h-4 rotate-90" /> Retour
                  </button>
                  <span className="text-sm font-bold text-white ml-2 flex items-center gap-2">
                    <Palette size={14} className="text-amber-500" /> Couleurs
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-3 font-medium">Couleur principale de la marque</label>
                    <div className="flex items-center justify-between p-3 bg-[#16161a] border border-neutral-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-600 shadow-sm cursor-pointer">
                          <input 
                            type="color" 
                            value={primaryColor || "#f59e0b"}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="absolute -inset-2 w-12 h-12 cursor-pointer"
                          />
                        </div>
                        <span className="text-sm font-mono text-white">{primaryColor || "Non défini"}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block mb-3 font-medium">Couleurs suggérées :</span>
                    <div className="flex flex-wrap gap-3">
                      {["#f59e0b", "#8b5cf6", "#0ea5e9", "#10b981", "#ef4444", "#18181b"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPrimaryColor(c)}
                          className={\`w-8 h-8 rounded-full border-2 transition-transform \${
                            primaryColor === c ? "scale-125 border-white ring-2 ring-amber-500" : "border-neutral-700 hover:scale-110"
                          }\`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCT PAGE SUBMENU */}
            {activeMenu === "product_page" && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-neutral-800 flex items-center gap-2 bg-amber-500/10">
                  <button onClick={() => {setActiveMenu("main"); setPreviewView("home");}} className="text-neutral-400 hover:text-amber-500 flex items-center gap-1 text-xs">
                    <ChevronDown className="w-4 h-4 rotate-90" /> Retour
                  </button>
                  <span className="text-sm font-bold text-amber-500 ml-2 flex items-center gap-2">
                    <ShoppingBag size={14} /> Page Produit
                  </span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                     <ShoppingBag className="w-6 h-6 text-neutral-400" />
                   </div>
                   <p className="text-sm font-bold text-white mb-1">Configuration de la page</p>
                   <p className="text-xs text-neutral-500">Ici, vous pourrez modifier l'ordre des sections, l'affichage du carrousel d'images, etc.</p>
                </div>
              </div>
            )}

            {/* CHECKOUT SUBMENU */}
            {activeMenu === "checkout_page" && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-neutral-800 flex items-center gap-2 bg-amber-500/10">
                  <button onClick={() => {setActiveMenu("main"); setPreviewView("home");}} className="text-neutral-400 hover:text-amber-500 flex items-center gap-1 text-xs">
                    <ChevronDown className="w-4 h-4 rotate-90" /> Retour
                  </button>
                  <span className="text-sm font-bold text-amber-500 ml-2 flex items-center gap-2">
                    <Check size={14} /> Page de paiement
                  </span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                     <Check className="w-6 h-6 text-neutral-400" />
                   </div>
                   <p className="text-sm font-bold text-white mb-1">Configuration du formulaire</p>
                   <p className="text-xs text-neutral-500">Ici, vous pourrez masquer certains champs, modifier les textes de paiement, etc.</p>
                </div>
              </div>
            )}

          </div>
          
          {/* Live Preview Window Container */}
`;

const newCustomizeCode = parts[0] + newSidebar + parts2[1];
fs.writeFileSync('src/pages/Customize.tsx', newCustomizeCode);

console.log("Updated Visual Builder UI successfully!");
