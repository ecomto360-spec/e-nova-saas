import { Outlet, useLocation, Navigate, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTenant } from "../../contexts/TenantContext";
import { AlertTriangle, Rocket } from "lucide-react";

export function AppLayout() {
  const location = useLocation();
  const { tenantData, isTrialExpired, remainingTrialDays } = useTenant();

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

  const showBanner = !tenantData?.subscriptionActive;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-[#16161a] dark:text-neutral-200">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {showBanner && (
          <div className="w-full bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-4 text-sm z-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                Vous explorez E-Nova ! Il reste dans votre essai gratuit <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{remainingTrialDays} jours</span>
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
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
