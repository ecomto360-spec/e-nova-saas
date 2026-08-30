import { useState, useRef, useEffect } from "react";
import { Globe, Moon, Sun, Eye, Bell, Check, ChevronDown, ChevronUp, UserCog, HelpCircle, LogOut, User, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Utilisateur";
  const email = user?.email || "";
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 dark:border-neutral-800 dark:bg-[#16161a]">
      <div className="flex flex-1 items-center gap-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={langRef}>
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
          >
            <Globe className="h-5 w-5" />
          </button>
          
          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white border border-gray-200 shadow-lg z-50 py-1 dark:bg-[#1e1e24] dark:border-neutral-800">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('header.chooseLanguage')}
              </div>
              <button
                onClick={() => { setLanguage('ar'); setIsLangOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>🇩🇿</span>
                  <span className="font-medium text-gray-900 dark:text-white">{t('header.arabic')}</span>
                  <span className="text-xs text-gray-500 dark:text-neutral-500">Arabic</span>
                </div>
                {language === 'ar' && <Check className="w-4 h-4 text-yellow-500" />}
              </button>
              <button
                onClick={() => { setLanguage('fr'); setIsLangOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>🇫🇷</span>
                  <span className="font-medium text-gray-900 dark:text-white">{t('header.french')}</span>
                  <span className="text-xs text-gray-500 dark:text-neutral-500">French</span>
                </div>
                {language === 'fr' && <Check className="w-4 h-4 text-yellow-500" />}
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        
        <Link 
          to="/store"
          className="flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 transition-colors"
        >
          <Eye className="h-4 w-4" />
          {t('header.viewStore')}
        </Link>

        <div className="h-8 w-px bg-gray-200 dark:bg-neutral-800 mx-2" />

        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors mr-2">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#16161a]" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-1.5 pr-3 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-[#1a1a20] dark:hover:bg-neutral-800"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-blue-100 dark:bg-neutral-700">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-blue-600 dark:text-neutral-300" />
              )}
            </div>
            <div className="flex flex-col items-start text-left max-w-[120px]">
              <span className="text-sm font-bold text-gray-900 truncate w-full dark:text-white leading-tight">
                {displayName}
              </span>
              <span className="text-xs text-gray-500 truncate w-full dark:text-neutral-400 leading-tight">
                {email}
              </span>
            </div>
            {isUserMenuOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
            )}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-[#1a1a20] z-50 overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-blue-100 dark:bg-neutral-700 flex-shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-blue-600 dark:text-neutral-300" />
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-base font-bold text-gray-900 truncate dark:text-white">
                    {displayName}
                  </span>
                  <span className="text-sm text-gray-500 truncate dark:text-neutral-400">
                    {email}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-neutral-800/50" />

              <div className="p-2">
                <Link 
                  to="/dashboard/account" 
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <UserCog className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                  Paramètres du compte
                </Link>
                <Link 
                  to="/dashboard/support" 
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                  Centre d'aide
                </Link>
              </div>

              <div className="h-px bg-gray-200 dark:bg-neutral-800/50" />

              <div className="p-2">
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
