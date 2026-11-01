import { Monitor, ImageIcon } from "lucide-react";
import type { HeroSettings } from "../../../types/storefront";
import {
  BilingualField,
  Field,
  ImageUploadField,
  TextInput,
  Toggle,
} from "./editorUI";

/**
 * Éditeur de la section Hero (bannière d'accueil).
 * Chaque frappe met à jour l'état local -> aperçu en direct.
 */
export function HeroEditor({
  value,
  onChange,
}: {
  value: HeroSettings;
  onChange: (patch: Partial<HeroSettings>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <ImageIcon size={20} className="text-amber-500" />
        Section Hero
      </h3>

      <Toggle
        checked={value.visible}
        onChange={(v) => onChange({ visible: v })}
        label="Afficher la section"
      />

      <Toggle
        checked={value.badge.visible}
        onChange={(v) => onChange({ badge: { ...value.badge, visible: v } })}
        label="Afficher le badge"
        hint="Petit badge au-dessus du titre (ex : « Nouvelle collection »)"
      />

      {value.badge.visible && (
        <BilingualField
          label="Texte du badge"
          value={value.badge.text}
          onChange={(text) => onChange({ badge: { ...value.badge, text } })}
        />
      )}

      <BilingualField
        label="Titre principal (H1)"
        value={value.title}
        onChange={(title) => onChange({ title })}
        placeholderFr="Titre principal"
        placeholderAr="العنوان الرئيسي"
      />

      <BilingualField
        label="Description courte"
        value={value.description}
        onChange={(description) => onChange({ description })}
        multiline
        rows={3}
      />

      <div className="border-t border-neutral-800 pt-4 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Bouton principal
        </p>
        <Toggle
          checked={value.primaryButton.visible}
          onChange={(v) => onChange({ primaryButton: { ...value.primaryButton, visible: v } })}
          label="Afficher le bouton principal"
        />
        {value.primaryButton.visible && (
          <>
            <BilingualField
              label="Texte du bouton principal"
              value={value.primaryButton.text}
              onChange={(text) => onChange({ primaryButton: { ...value.primaryButton, text } })}
            />
            <Field label="Lien du bouton principal" hint="Ex : #all-products ou https://...">
              <TextInput
                value={value.primaryButton.link}
                onChange={(link) => onChange({ primaryButton: { ...value.primaryButton, link } })}
                placeholder="#all-products"
              />
            </Field>
          </>
        )}
      </div>

      <div className="border-t border-neutral-800 pt-4 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Bouton secondaire
        </p>
        <Toggle
          checked={value.secondaryButton.visible}
          onChange={(v) => onChange({ secondaryButton: { ...value.secondaryButton, visible: v } })}
          label="Afficher le bouton secondaire"
        />
        {value.secondaryButton.visible && (
          <>
            <BilingualField
              label="Texte du bouton secondaire"
              value={value.secondaryButton.text}
              onChange={(text) => onChange({ secondaryButton: { ...value.secondaryButton, text } })}
            />
            <Field label="Lien du bouton secondaire" hint="Ex : #categories">
              <TextInput
                value={value.secondaryButton.link}
                onChange={(link) => onChange({ secondaryButton: { ...value.secondaryButton, link } })}
                placeholder="#categories"
              />
            </Field>
          </>
        )}
      </div>

      <div className="border-t border-neutral-800 pt-4 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
          <Monitor size={12} /> Images de fond
        </p>
        <ImageUploadField
          label="Image d'arrière-plan (ordinateur)"
          hint="1920x600 pixels recommandé"
          value={value.desktopImage}
          onChange={(desktopImage) => onChange({ desktopImage })}
          maxWidth={1920}
        />
        <ImageUploadField
          label="Image d'arrière-plan (mobile)"
          hint="600x800 pixels recommandé — si vide, l'image ordinateur est utilisée"
          value={value.mobileImage}
          onChange={(mobileImage) => onChange({ mobileImage })}
          maxWidth={900}
          aspect="tall"
        />
      </div>

      <div className="border-t border-neutral-800 pt-4 space-y-4">
        <Field
          label={`Opacité du voile sombre : ${value.overlayOpacity}%`}
          hint="Assombrit l'image de fond pour rendre le texte lisible"
        >
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={value.overlayOpacity}
            onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
            className="w-full accent-amber-500"
          />
        </Field>

        <Field label="Alignement du contenu">
          <select
            value={value.align}
            onChange={(e) => onChange({ align: e.target.value as HeroSettings["align"] })}
            className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="start">Aligné au début (logique selon la langue)</option>
            <option value="center">Centré</option>
            <option value="end">Aligné à la fin (logique selon la langue)</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
