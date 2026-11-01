import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Store, ScrollText, LogOut, Menu, X, ShieldCheck, Loader2, ExternalLink
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * LOT A — Layout Super Admin (/admin).
 * Sidebar complète (les modules non livrés affichent une page « lot suivant »),
 * responsive, fr/ar + RTL, filtrée selon les permissions du rôle
 * (GET /api/admin/v1/me — vérifié côté serveur à chaque requête API).
 */

interface AdminMe {
  admin: { id: string; email: string; role: string; via: string };
  permissions: string[];
}

const MODULES: Array<{ to: string; key: string; icon: typeof LayoutDashboard; permission: string }> = [
  { to: "/admin/dashboard", key: "admin.nav.dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { to: "/admin/members", key: "admin.nav.members", icon: Users, permission: "members" },
  { to: "/admin/stores", key: "admin.nav.stores", icon: Store, permission: "stores" },
  { to: "/admin/audit", key: "admin.nav.audit", icon: ScrollText, permission: "audit" },
];

export default function AdminLayout() {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/v1/me", { credentials: "include" });
        if (!alive) return;
        if (res.status === 403 || res.status === 401) {
          setDenied(true);
          window.setTimeout(() => navigate("/admin", { replace: true }), 1200);
          return;
        }
        const j = (await res.json()) as AdminMe;
        if (alive) setMe(j);
      } catch {
        if (alive) setDenied(true);
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  // Heartbeat de présence admin (toutes les 60 s, onglet actif uniquement)
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/admin/v1/heartbeat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: "admin" })
      }).catch(() => {});
    };
    beat();
    const id = window.setInterval(beat, 60_000);
    const onVis = () => { if (document.visibilityState === "visible") beat(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    navigate("/admin", { replace: true });
  };

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white font-bold text-lg">{t("admin.denied")}</p>
          <p className="text-neutral-500 text-sm mt-2">{t("admin.deniedDetail")}</p>
        </div>
      </div>
    );
  }

  const perms = new Set(me?.permissions || []);
  const visibleModules = MODULES.filter((m) => perms.size === 0 || perms.has(m.permission));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex" dir={isRtl ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-64 bg-[#111114] border-e border-neutral-800/80 z-40 flex flex-col transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : isRtl ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-neutral-800/80 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">E-Nova Admin</p>
            <p className="text-[10px] text-neutral-500 truncate">{me ? me.admin.email : "…"}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ms-auto p-1.5 text-neutral-400 hover:text-white" aria-label={t("admin.nav.closeMenu")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleModules.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? "bg-red-500/10 text-red-400 border border-red-500/25"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent"
              }`}
            >
              <m.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t(m.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-800/80 space-y-0.5 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/60"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{t("admin.viewSite")}</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("admin.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <button aria-label={t("admin.nav.closeMenu")} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/70 z-30 lg:hidden" />
      )}

      {/* Contenu */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 bg-[#0a0a0a]/90 backdrop-blur border-b border-neutral-800/80 flex items-center gap-3 px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-neutral-400 hover:text-white" aria-label={t("admin.nav.openMenu")}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm truncate">
              {t(MODULES.find((m) => location.pathname.startsWith(m.to))?.key || "admin.title")}
            </h1>
            <p className="text-[10px] text-neutral-500">
              {me ? (
                <>
                  <span className="text-red-400 font-bold uppercase">{me.admin.role.replace("_", " ")}</span>
                  {" · "}{t("admin.via")} {me.admin.via === "admin_session" ? "session 2FA" : me.admin.via}
                </>
              ) : (
                <Loader2 className="w-3 h-3 animate-spin inline" />
              )}
            </p>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
