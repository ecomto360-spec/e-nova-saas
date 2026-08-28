import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { auth, db } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTenant } from "../../contexts/TenantContext";
import { 
  LayoutDashboard, 
  Palette, 
  FolderTree, 
  Package, 
  ShoppingCart, 
  Ghost, 
  Users, 
  Truck, 
  MonitorPlay, 
  Radar, 
  Puzzle, 
  Star, 
  Settings, 
  CreditCard,
  Gem,
  ChevronDown,
  Banknote,
  Link as LinkIcon,
  Store,
  User,
  Bell,
  Globe,
  Code,
  Paintbrush,
  SlidersHorizontal
} from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isTrialExpired } = useTenant();
  const [storeName, setStoreName] = useState(localStorage.getItem("dzbuild_store_name") || "Boutique DZ");

  useEffect(() => {
    const fetchTenantData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "tenants", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().storeName) {
            const name = docSnap.data().storeName;
            setStoreName(name);
            localStorage.setItem("dzbuild_store_name", name); // Sync local storage
          }
        } catch (error) {
          console.error("Error fetching tenant data:", error);
        }
      }
    };
    
    // Fetch immediately
    fetchTenantData();

    // Listen to auth state changes to re-fetch if user changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchTenantData();
    });

    return () => unsubscribe();
  }, []);
  
  const fullNavigation = [
    { name: t("sidebar.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { 
      name: t("sidebar.customize"), 
      href: "/dashboard/themes", 
      icon: Palette,
      children: [
        { name: "Thèmes", href: "/dashboard/themes", icon: Paintbrush },
        { name: "Personnaliser", href: "/dashboard/customize", icon: SlidersHorizontal }
      ]
    },
    { name: t("sidebar.categories"), href: "/dashboard/categories", icon: FolderTree },
    { name: t("sidebar.products"), href: "/dashboard/products", icon: Package },
    { name: t("sidebar.orders"), href: "/dashboard/orders", icon: ShoppingCart },
    { name: t("sidebar.abandonedCarts"), href: "/dashboard/abandoned-carts", icon: Ghost },
    { name: t("sidebar.customers"), href: "/dashboard/customers", icon: Users },
    { 
      name: t("sidebar.delivery"), 
      href: "/dashboard/shipping",
      icon: Truck,
      children: [
        { name: "Tarifs de livraison", href: "/dashboard/shipping/rates", icon: Banknote },
        { name: "Connecter un transporteur", href: "/dashboard/shipping/carriers", icon: LinkIcon }
      ]
    },
    { name: t("sidebar.landingPages"), href: "/dashboard/landing-pages", icon: MonitorPlay },
    { name: t("sidebar.pixel"), href: "/dashboard/pixels", icon: Radar },
    { name: t("sidebar.extensions"), href: "/dashboard/extensions", icon: Puzzle, badge: t("sidebar.new") },
    { name: "Avis clients", href: "/dashboard/reviews", icon: Star },
    { 
      name: t("sidebar.settings"), 
      href: "/dashboard/settings", 
      icon: Settings,
      children: [
        { name: t("sidebar.storeSettings"), href: "/dashboard/settings", icon: Store },
        { name: t("sidebar.accountSettings"), href: "/dashboard/account", icon: User },
        { name: t("sidebar.notifications"), href: "/dashboard/notifications", icon: Bell },
        { name: t("sidebar.domains"), href: "/dashboard/domains", icon: Globe },
        { name: t("sidebar.referral"), href: "/dashboard/referral", icon: Users },
        { name: t("sidebar.api"), href: "/dashboard/api", icon: Code }
      ]
    },
    { 
      name: t("sidebar.subscription"), 
      href: "/dashboard/subscription", 
      icon: Gem,
      badge: isTrialExpired ? "Expiré" : undefined,
      badgeColor: isTrialExpired ? "red" : undefined
    },
  ];

  const navigation = isTrialExpired 
    ? fullNavigation.filter(n => ["/dashboard", "/dashboard/settings", "/dashboard/subscription"].includes(n.href))
    : fullNavigation;

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    [t("sidebar.customize")]: location.pathname.startsWith("/themes") || location.pathname.startsWith("/customize"),
    [t("sidebar.delivery")]: location.pathname.startsWith("/shipping"),
    [t("sidebar.settings")]: location.pathname.startsWith("/settings") || location.pathname.startsWith("/account") || location.pathname.startsWith("/notifications") || location.pathname.startsWith("/domains") || location.pathname.startsWith("/referral") || location.pathname.startsWith("/api")
  });

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col overflow-y-auto border-r border-gray-200 bg-white px-3 py-4 text-gray-600 dark:border-neutral-800 dark:bg-[#1e1e24] dark:text-neutral-300">
      <div className="mb-6 flex items-center px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center">
            <img src="/api/images/a3541b19-7b57-41db-b6dc-8ef440ae09ba" alt="E nova" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentHTML('afterend', '<div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-black"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>'); }} />
          </div>
          <span className="text-sm font-semibold tracking-wider text-gray-900 truncate max-w-[150px] dark:text-white">{storeName}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isParentActive = item.children?.some(child => location.pathname === child.href) || location.pathname === item.href;
          const isActive = location.pathname === item.href;
          const isOpen = openMenus[item.name];

          if (item.children) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isParentActive || isOpen
                      ? "text-orange-600 dark:text-orange-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isParentActive || isOpen ? "text-orange-600 dark:text-orange-500" : "text-gray-400 group-hover:text-gray-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen ? "rotate-180 text-orange-600 dark:text-orange-500" : "text-gray-400 dark:text-neutral-500"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2 dark:border-neutral-800">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border-l-2",
                            isChildActive
                              ? "bg-orange-50 border-orange-500 text-orange-700 dark:bg-neutral-800 dark:border-transparent dark:text-white"
                              : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
                          )}
                        >
                          <child.icon
                            className={cn(
                              "h-5 w-5 flex-shrink-0",
                              isChildActive ? "text-orange-600 dark:text-neutral-300" : "text-gray-400 group-hover:text-gray-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                            )}
                            aria-hidden="true"
                          />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors border-l-2",
                isActive 
                  ? "bg-orange-50 border-orange-500 text-orange-700 dark:bg-neutral-800 dark:border-transparent dark:text-orange-500" 
                  : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-orange-600 dark:text-orange-500" : "text-gray-400 group-hover:text-gray-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </div>
              {item.badge && (
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-bold",
                  (item as any).badgeColor === 'red' 
                    ? "bg-red-500/10 text-red-500" 
                    : "bg-emerald-500/10 text-emerald-500"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 space-y-1 border-t border-gray-200 pt-4 dark:border-neutral-800">
        <Link
          to="/community"
          className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
        >
          <Users className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:text-neutral-500 dark:group-hover:text-neutral-300" />
          {t("sidebar.community")}
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-colors"
        >
          <Ghost className="h-5 w-5 flex-shrink-0 text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300" />
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
}
