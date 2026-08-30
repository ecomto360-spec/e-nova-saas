import { Outlet, useLocation, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTenant } from "../../contexts/TenantContext";
import { AlertTriangle, Rocket } from "lucide-react";

export function AppLayout() {
  const location = useLocation();
  const { tenantData, isTrialExpired, showBanner, bannerMessage } = useTenant();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allowedExpiredRoutes = [
    "/",
    "/dashboard",
    "/dashboard/settings",
    "/dashboard/account",
    "/dashboard/notifications",
    "/dashboard/domains",
    "/dashboard/referral",
    "/dashboard/api",
    "/dashboard/subscription",
    "/dashboard/subscribe",
  ];

  if (isTrialExpired && !allowedExpiredRoutes.includes(location.pathname)) {
    return <Navigate to="/dashboard/subscription" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-[#16161a] dark:text-neutral-200">
      
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative w-full">
        {showBanner && (
          <div className="w-full bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-4 text-sm z-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                {bannerMessage}
              </span>
            </div>
            <Link 
              to="/dashboard/subscription" 
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition-colors"
            >
              <Rocket className="w-3.5 h-3.5" />
              Mettre à niveau
            </Link>
          </div>
        )}
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
