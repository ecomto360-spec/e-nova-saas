import { useState } from "react";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  X, 
  Check, 
  Lock, 
  RotateCw, 
  ExternalLink, 
  CheckCircle,
  Sparkles,
  Layers,
  Palette
} from "lucide-react";
import { StoreTheme } from "../../data/themesData";
import { ThemeStorePreview } from "./ThemeStorePreview";

interface ThemePreviewModalProps {
  theme: StoreTheme;
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (theme: StoreTheme) => void;
  isCurrentTheme?: boolean;
}

export function ThemePreviewModal({
  theme,
  isOpen,
  onClose,
  onApplyTheme,
  isCurrentTheme = false
}: ThemePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsApplying(true);
    await onApplyTheme(theme);
    setIsApplying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#121214] text-white animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <header className="h-16 bg-[#1a1a1e] border-b border-neutral-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-md">
        {/* Left: Theme Info */}
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-sm"
            style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
          >
            {theme.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{theme.name}</span>
              {theme.version && (
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                  {theme.version}
                </span>
              )}
              {isCurrentTheme && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check size={10} /> Thème Actuel
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block truncate max-w-xs">{theme.description}</p>
          </div>
        </div>

        {/* Center: Device Switcher & URL Bar */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-4">
          {/* Device buttons */}
          <div className="flex bg-[#121214] rounded-lg border border-neutral-800 p-1">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`p-1.5 rounded transition-all ${
                deviceMode === "desktop"
                  ? "bg-neutral-700 text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Aperçu Ordinateur"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setDeviceMode("tablet")}
              className={`p-1.5 rounded transition-all ${
                deviceMode === "tablet"
                  ? "bg-neutral-700 text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Aperçu Tablette"
            >
              <Tablet size={16} />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`p-1.5 rounded transition-all ${
                deviceMode === "mobile"
                  ? "bg-neutral-700 text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Aperçu Mobile"
            >
              <Smartphone size={16} />
            </button>
          </div>

          {/* Fake Browser URL */}
          <div className="flex-1 bg-[#121214] rounded-lg px-3 py-1.5 text-xs text-neutral-400 font-mono border border-neutral-800 flex items-center justify-between gap-2 truncate">
            <div className="flex items-center gap-1.5 truncate">
              <Lock size={12} className="text-emerald-500 shrink-0" />
              <span className="truncate">{theme.demoUrl}</span>
            </div>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
              DÉMO LIVE
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <X size={14} />
            <span className="hidden sm:inline">Fermer</span>
          </button>

          {!isCurrentTheme ? (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-black shadow-lg hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
            >
              {isApplying ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Installation...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Appliquer ce thème</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle size={14} />
              <span>Actif sur votre boutique</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Preview Container */}
      <div className="flex-1 bg-[#0d0d0f] overflow-y-auto flex items-start justify-center p-2 sm:p-6">
        <div
          className={`transition-all duration-300 shadow-2xl overflow-hidden bg-white ${
            deviceMode === "desktop"
              ? "w-full max-w-full rounded-none"
              : deviceMode === "tablet"
              ? "w-[768px] my-4 rounded-2xl border-4 border-neutral-800 shadow-2xl"
              : "w-[414px] my-4 rounded-3xl border-8 border-neutral-800 shadow-2xl"
          }`}
        >
          {/* Mobile Phone Speaker/Notch simulation in mobile mode */}
          {deviceMode === "mobile" && (
            <div className="bg-neutral-900 py-1.5 flex justify-center items-center">
              <div className="w-16 h-1 bg-neutral-700 rounded-full"></div>
            </div>
          )}

          {/* Actual Storefront Component */}
          <div className="w-full bg-[#fafafa]">
            <ThemeStorePreview theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
