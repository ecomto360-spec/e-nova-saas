import React, { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, HelpCircle, PackageCheck, RotateCcw, Ban, CheckCircle, Info } from "lucide-react";
import { EcoTrackScore } from "../../lib/ecotrack";

interface EcoTrackBadgeProps {
  score: EcoTrackScore;
  variant?: "pill" | "card" | "mini";
  showPopover?: boolean;
}

export function EcoTrackBadge({ score, variant = "pill", showPopover = true }: EcoTrackBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = () => {
    switch (score.trustLevel) {
      case "green":
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case "orange":
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case "red":
        return <ShieldX className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getProgressColor = () => {
    switch (score.trustLevel) {
      case "green":
        return "bg-emerald-500";
      case "orange":
        return "bg-amber-500";
      case "red":
        return "bg-red-500";
    }
  };

  if (variant === "card") {
    return (
      <div className={`p-4 rounded-xl border ${score.badgeBorder} ${score.badgeBg} relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${score.badgeBg} border ${score.badgeBorder}`}>
              {getIcon()}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <span>Facteur de Confiance EcoTrack</span>
              </div>
              <div className={`text-sm font-bold ${score.badgeText}`}>
                {score.label}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`text-xl font-extrabold ${score.badgeText}`}>
              {score.deliveryRate}%
            </span>
            <span className="text-[10px] block text-neutral-400">Taux de succès</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-800/80 rounded-full h-2 mb-3 overflow-hidden border border-neutral-700/50">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.max(5, score.deliveryRate)}%` }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3 bg-black/30 p-2 rounded-lg border border-neutral-800/50">
          <div>
            <div className="text-neutral-400 text-[10px]">Commandes</div>
            <div className="font-bold text-white text-xs">{score.totalOrders}</div>
          </div>
          <div>
            <div className="text-emerald-400 text-[10px] flex items-center justify-center gap-0.5">
              <PackageCheck className="w-2.5 h-2.5" /> Livrées
            </div>
            <div className="font-bold text-emerald-400 text-xs">{score.deliveredCount}</div>
          </div>
          <div>
            <div className="text-red-400 text-[10px] flex items-center justify-center gap-0.5">
              <RotateCcw className="w-2.5 h-2.5" /> Retours
            </div>
            <div className="font-bold text-red-400 text-xs">{score.returnedCount}</div>
          </div>
        </div>

        {/* Recommendation text */}
        <div className="text-xs text-neutral-300 flex items-start gap-1.5 bg-black/20 p-2 rounded-lg">
          <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">{score.recommendation}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block" onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${score.badgeBg} ${score.badgeText} ${score.badgeBorder} hover:brightness-110`}
        title={`EcoTrack: ${score.deliveryRate}% (${score.deliveredCount} Livrées, ${score.returnedCount} Retours)`}
      >
        {getIcon()}
        <span>EcoTrack {score.deliveryRate}%</span>
        {score.returnedCount > 0 && (
          <span className="text-[10px] bg-red-500/30 text-red-300 px-1 rounded font-bold">
            {score.returnedCount} ret.
          </span>
        )}
      </button>

      {/* Hover / Click Popover */}
      {showPopover && isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 top-full mt-1.5 w-64 p-3 rounded-xl bg-[#1c1c22] border border-neutral-700 shadow-2xl text-left backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
            <div className="flex items-center gap-1.5">
              {getIcon()}
              <span className="text-xs font-bold text-white">Score EcoTrack</span>
            </div>
            <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${score.badgeBg} ${score.badgeText} border ${score.badgeBorder}`}>
              {score.deliveryRate}%
            </span>
          </div>

          <div className="text-[11px] text-neutral-300 mb-2 font-medium">
            {score.label}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-neutral-900/80 p-2 rounded-lg mb-2.5 border border-neutral-800">
            <div>
              <span className="text-neutral-400 block">Total</span>
              <span className="font-bold text-white text-xs">{score.totalOrders}</span>
            </div>
            <div>
              <span className="text-emerald-400 block">Livrées</span>
              <span className="font-bold text-emerald-400 text-xs">{score.deliveredCount}</span>
            </div>
            <div>
              <span className="text-red-400 block">Retours</span>
              <span className="font-bold text-red-400 text-xs">{score.returnedCount}</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-300 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800/50 leading-relaxed">
            {score.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
