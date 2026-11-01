import React, { useState } from "react";
import { RotateCw, UploadCloud, Image as ImageIcon, Languages } from "lucide-react";
import type { BilingualText, StorefrontLang } from "../../../types/storefront";

/* ---------------------------------------------------------------------- */
/* Helpers image (Base64 compressé -> Firestore, pas de Storage)          */
/* ---------------------------------------------------------------------- */

export function resizeAndConvertImageToBase64(
  file: File,
  maxWidth: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scaleSize = maxWidth / img.width;
        let width = img.width;
        let height = img.height;

        if (scaleSize < 1) {
          width = img.width * scaleSize;
          height = img.height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Image illisible"));
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
  });
}

export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/* ---------------------------------------------------------------------- */
/* Primitives d'interface                                                 */
/* ---------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-400 block mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-10 h-5 shrink-0 rounded-full relative cursor-pointer transition-colors ${
          checked ? "bg-amber-500" : "bg-neutral-600"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 left-0.5 bottom-0.5 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-white">{label}</span>
        {hint && <span className="text-[11px] text-neutral-500 mt-0.5">{hint}</span>}
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500";

export function TextInput({
  value,
  onChange,
  placeholder,
  dir,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <input
      type="text"
      value={value}
      dir={dir}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  dir,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      dir={dir}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

/**
 * Champ bilingue FR / AR avec onglets. L'onglet arabe tape en RTL.
 * Chaque frappe met à jour l'état local du customizer (aperçu en direct).
 */
export function BilingualField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholderFr,
  placeholderAr,
  hint,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
  rows?: number;
  placeholderFr?: string;
  placeholderAr?: string;
  hint?: string;
}) {
  const [tab, setTab] = useState<StorefrontLang>("fr");

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <Languages size={13} />
          {label}
        </label>
        <div className="flex bg-[#16161a] p-0.5 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => setTab("fr")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
              tab === "fr" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setTab("ar")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
              tab === "ar" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            العربية
          </button>
        </div>
      </div>

      {multiline ? (
        <TextArea
          value={value[tab]}
          onChange={(v) => onChange({ ...value, [tab]: v })}
          rows={rows}
          dir={tab === "ar" ? "rtl" : "ltr"}
          placeholder={tab === "ar" ? placeholderAr : placeholderFr}
        />
      ) : (
        <TextInput
          value={value[tab]}
          onChange={(v) => onChange({ ...value, [tab]: v })}
          dir={tab === "ar" ? "rtl" : "ltr"}
          placeholder={tab === "ar" ? placeholderAr : placeholderFr}
        />
      )}
      {hint && <p className="text-[11px] text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * Zone d'upload d'image (Base64 compressé WebP, stocké dans Firestore).
 * Reprise du comportement de l'éditeur Hero historique.
 */
export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  maxWidth = 1600,
  aspect = "wide",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (base64: string) => void;
  maxWidth?: number;
  aspect?: "wide" | "tall";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const base64 = await resizeAndConvertImageToBase64(file, maxWidth);
      onChange(base64);
    } catch {
      setError("Impossible de traiter cette image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 hover:bg-[#1e1e24] relative overflow-hidden group">
        <label className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center z-10">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {uploading ? (
          <div className="flex flex-col items-center justify-center text-amber-500 z-0">
            <RotateCw className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs font-medium">Traitement...</span>
          </div>
        ) : value ? (
          <div
            className={`relative w-full flex flex-col items-center justify-center z-0 ${
              aspect === "tall" ? "h-32" : "h-24"
            }`}
          >
            <img src={value} alt={label} className="w-full h-full object-cover rounded mb-2" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] text-white bg-[#111111]/80 px-2 py-1 rounded">
                Cliquez pour modifier
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }}
                className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium px-3 py-1 rounded relative z-20 cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none flex flex-col items-center z-0">
            <UploadCloud size={24} className="text-neutral-400 mb-2" />
            <p className="text-sm font-bold text-white text-center flex items-center gap-1.5">
              <ImageIcon size={14} /> {label}
            </p>
            {hint && <p className="text-xs text-neutral-500 text-center mt-1">{hint}</p>}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
