/**
 * T2 — Primitives UI de l'éditeur « Personnaliser » (panneau gauche).
 * Style sombre cohérent avec l'existant (bg #1e1e24, bordures neutral-800,
 * accents ambre). Composants purs, réutilisés par tous les groupes de réglages.
 */
import React, { useId } from "react";
import { RotateCcw } from "lucide-react";

/** Enveloppe d'un groupe de réglages (titre + bouton reset du groupe). */
export function GroupShell({
  title,
  icon,
  hint,
  onReset,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  hint?: string;
  onReset?: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Réinitialiser ce groupe aux valeurs enregistrées"
            className="shrink-0 p-2 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/** Ligne de champ générique (label + contrôle + aide). */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-neutral-300">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-neutral-500">{hint}</span>}
    </label>
  );
}

/** Interrupteur afficher/masquer. */
export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-bold text-white truncate">{label}</div>
        {hint && <div className="text-[11px] text-neutral-500">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`shrink-0 w-10 h-5 rounded-full relative cursor-pointer transition-colors ${value ? "bg-amber-500" : "bg-neutral-600"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

const inputCls =
  "w-full bg-[#16161a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors";

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  dir,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  dir?: "ltr" | "rtl" | "auto";
}): React.ReactElement {
  return (
    <input
      type="text"
      value={value}
      dir={dir}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}): React.ReactElement {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
    />
  );
}

export function ColorInput({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (v: string) => void;
  presets?: string[];
}): React.ReactElement {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="relative w-9 h-9 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0" style={{ backgroundColor: value }}>
        <input id={id} type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Choisir une couleur" />
      </label>
      <input type="text" value={value} dir="ltr" onChange={(e) => onChange(e.target.value)} className={inputCls + " font-mono"} maxLength={7} />
      {presets && presets.length > 0 && (
        <div className="flex gap-1">
          {presets.slice(0, 5).map((p) => (
            <button key={p} type="button" onClick={() => onChange(p)} title={p} className="w-5 h-5 rounded-md border border-neutral-700 hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: p }} aria-label={`Preset ${p}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}): React.ReactElement {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={inputCls + " cursor-pointer"}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Champ bilingue : français + arabe côte à côte (ou empilé en mobile). */
export function BiTextInput({
  fr,
  ar,
  onChange,
  placeholderFr,
  placeholderAr,
  maxLength,
}: {
  fr: string;
  ar: string;
  onChange: (next: { fr: string; ar: string }) => void;
  placeholderFr?: string;
  placeholderAr?: string;
  maxLength?: number;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input type="text" value={fr} maxLength={maxLength} placeholder={placeholderFr ?? "Français"} onChange={(e) => onChange({ fr: e.target.value, ar })} className={inputCls} dir="ltr" />
      <input type="text" value={ar} maxLength={maxLength} placeholder={placeholderAr ?? "العربية"} onChange={(e) => onChange({ fr, ar: e.target.value })} className={inputCls} dir="rtl" />
    </div>
  );
}

/** Sélecteur segmenté (petits choix exclusifs : style, format…). */
export function SegmentedInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-[#16161a] border border-neutral-800 rounded-xl">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 min-w-[64px] px-2 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${value === o.value ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Carte de sous-section répétable (badges confiance, canaux aide…). */
export function RepeatCard({
  children,
  onRemove,
  onMoveUp,
  onMoveDown,
  index,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  index: number;
}): React.ReactElement {
  return (
    <div className="p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl space-y-3">
      <div className="flex items-center justify-end gap-1 -mt-1 -mr-1">
        {onMoveUp && (
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 cursor-pointer" title="Monter" aria-label="Monter">↑</button>
        )}
        {onMoveDown && (
          <button type="button" onClick={onMoveDown} className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer" title="Descendre" aria-label="Descendre">↓</button>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer" title="Supprimer" aria-label="Supprimer">✕</button>
        )}
      </div>
      {children}
    </div>
  );
}
