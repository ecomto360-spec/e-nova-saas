/**
 * T2 — Groupes de réglages globaux de l'éditeur (modèle v2).
 * Chaque groupe modifie une partie de StoreV2Settings via `onChange(patch)`.
 * Le bouton reset (dans GroupShell) est câblé par Customize.tsx.
 */
import React from "react";
import { Plus } from "lucide-react";
import type {
  StoreV2Settings, StoreHelpWidgetSettings, StoreSeoSettings,
  StoreProductPageSettings, StoreCheckoutSettings, ProductCardSettings,
} from "../../../types/storefrontSections";
import type { ProductBlockId } from "../../../types/storefrontSections";
import { GroupShell, Field, TextInput, NumberInput, ColorInput, SelectInput, BiTextInput, SegmentedInput, ToggleRow, RepeatCard } from "./editorUI";

type Patch = (patch: Partial<StoreV2Settings>) => void;

/* ------------------------------ LANGUE ------------------------------------ */

export function LanguageGroup({
  language,
  onLanguageChange,
}: {
  language: "fr" | "ar";
  onLanguageChange: (v: "fr" | "ar") => void;
}): React.ReactElement {
  return (
    <GroupShell title="Langue de la boutique" hint="L'arabe passe toute la boutique en RTL.">
      <SegmentedInput
        value={language}
        onChange={onLanguageChange}
        options={[
          { value: "fr", label: "🇫🇷 Français (LTR)" },
          { value: "ar", label: "🇩🇿 العربية (RTL)" },
        ]}
      />
      <p className="text-[11px] text-neutral-500">
        Les textes bilingues (titres, boutons, FAQ…) basculent automatiquement dans la langue choisie.
      </p>
    </GroupShell>
  );
}

/* ---------------------------- EN-TÊTE V2 ---------------------------------- */

export function HeaderV2Group({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  const h = v2.header;
  const set = (patch: Partial<StoreV2Settings["header"]>) => onChange({ header: { ...h, ...patch } });
  return (
    <GroupShell title="Éléments de l'en-tête" hint="Logo, couleurs et nom : voir « En-tête et Logo » ci-dessus.">
      <ToggleRow label="Barre de recherche" value={h.showSearch} onChange={(v) => set({ showSearch: v })} />
      <ToggleRow label="Icône du panier" value={h.showCartIcon} onChange={(v) => set({ showCartIcon: v })} />
      <ToggleRow label="En-tête collant (sticky)" value={h.sticky} onChange={(v) => set({ sticky: v })} />
      <ToggleRow label="Menu déroulant des catégories" value={h.showCategoriesDropdown} onChange={(v) => set({ showCategoriesDropdown: v })} />
      <ToggleRow label="Lien « Suivre ma commande »" value={h.showTrackOrderLink} onChange={(v) => set({ showTrackOrderLink: v })} />
      <ToggleRow label="Sélecteur de langue AR/FR" value={h.showLanguageSwitcher} onChange={(v) => set({ showLanguageSwitcher: v })} />
      <ToggleRow label="Bouton WhatsApp + téléphone" value={h.showWhatsApp} onChange={(v) => set({ showWhatsApp: v })} />
    </GroupShell>
  );
}

/* --------------------------- CARTE PRODUIT -------------------------------- */

export function ProductCardGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  const c = v2.productCard;
  const set = (patch: Partial<ProductCardSettings>) => onChange({ productCard: { ...c, ...patch } });
  return (
    <GroupShell title="Carte produit" hint="Apparence des cartes sur l'accueil et les collections.">
      <ToggleRow label="Masquer le bouton d'achat" value={c.hideAddToCartButton} onChange={(v) => set({ hideAddToCartButton: v })} />
      <ToggleRow label="Ajout rapide au survol (desktop)" value={c.quickAddOnHover} onChange={(v) => set({ quickAddOnHover: v })} />
      <ToggleRow label="Afficher la catégorie" value={c.showCategoryName} onChange={(v) => set({ showCategoryName: v })} />
      <ToggleRow label="Afficher le prix" value={c.showPrice} onChange={(v) => set({ showPrice: v })} />
      <ToggleRow label="Afficher l'ancien prix (barré)" value={c.showOldPrice} onChange={(v) => set({ showOldPrice: v })} />
      <ToggleRow label="Afficher les badges (-% , vedette, épuisé)" value={c.showBadge} onChange={(v) => set({ showBadge: v })} />
      <Field label="Forme des cartes / boutons">
        <SegmentedInput value={c.cardBorders} onChange={(v) => set({ cardBorders: v })} options={[{ value: "rounded", label: "Arrondi" }, { value: "square", label: "Carré" }, { value: "pill", label: "Pilule" }]} />
      </Field>
      <Field label="Action du bouton">
        <SelectInput
          value={c.buttonAction}
          onChange={(v) => set({ buttonAction: v })}
          options={[
            { value: "chooseOptions", label: "Choisir les options (ouvre la modale)" },
            { value: "addToCart", label: "Ajouter au panier directement" },
            { value: "orderNow", label: "Commander maintenant (rapide)" },
          ]}
        />
      </Field>
      <Field label="Style du bouton">
        <SegmentedInput value={c.buttonStyle} onChange={(v) => set({ buttonStyle: v })} options={[{ value: "text", label: "Texte" }, { value: "roundIcon", label: "Icône ronde" }]} />
      </Field>
      <Field label="Texte du bouton (FR / AR)" hint="Vide = texte par défaut du thème.">
        <BiTextInput
          fr={c.buttonText?.fr ?? ""}
          ar={c.buttonText?.ar ?? ""}
          onChange={(next) => set({ buttonText: next.fr.trim() === "" && next.ar.trim() === "" ? null : next })}
          maxLength={24}
        />
      </Field>
    </GroupShell>
  );
}

/* --------------------------- TRI + FORMAT PRIX ----------------------------- */

export function SortingGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  return (
    <GroupShell title="Tri des produits" hint="Ordre appliqué quand le client n'a rien choisi.">
      <Field label="Tri par défaut">
        <SelectInput
          value={v2.defaultProductSort}
          onChange={(v) => onChange({ defaultProductSort: v })}
          options={[
            { value: "recent", label: "Plus récents" },
            { value: "priceAsc", label: "Prix croissant" },
            { value: "priceDesc", label: "Prix décroissant" },
            { value: "bestSelling", label: "Meilleures ventes" },
            { value: "manual", label: "Ordre manuel" },
            { value: "stockFirst", label: "En stock d'abord" },
          ]}
        />
      </Field>
      <ToggleRow label="Toujours mettre les produits en stock en premier" value={v2.stockFirst} onChange={(v) => onChange({ stockFirst: v })} />
    </GroupShell>
  );
}

export function PriceFormatGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  return (
    <GroupShell title="Format des prix" hint="Appliqué partout : cartes, fiches, panier, commandes.">
      <SegmentedInput
        value={v2.priceFormat}
        onChange={(v) => onChange({ priceFormat: v })}
        options={[
          { value: "plain", label: "15000 DA" },
          { value: "comma", label: "15,000 DA" },
          { value: "space", label: "15 000 DA" },
        ]}
      />
    </GroupShell>
  );
}

/* ---------------------------- PAGE PRODUIT -------------------------------- */

const PRODUCT_BLOCK_LABELS: Record<ProductBlockId, string> = {
  gallery: "Images du produit",
  category: "Catégorie",
  name: "Nom",
  price: "Prix + ancien prix",
  offers: "Offres de livraison",
  variants: "Variantes (taille, couleur…)",
  options: "Options",
  buyButtons: "Boutons d'achat",
  quickOrder: "Commande rapide",
  description: "Description",
  reviews: "Avis",
  related: "Produits similaires",
};

export function ProductPageGroup({ v2, onChange, onResetBlocks }: { v2: StoreV2Settings; onChange: Patch; onResetBlocks: () => void }): React.ReactElement {
  const p = v2.productPage;
  const set = (patch: Partial<StoreProductPageSettings>) => onChange({ productPage: { ...p, ...patch } });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= p.blocksOrder.length) return;
    const next = [...p.blocksOrder];
    [next[from], next[to]] = [next[to], next[from]];
    set({ blocksOrder: next });
  };
  return (
    <GroupShell title="Page produit" hint="Ordre des blocs, galerie, barre d'achat mobile.">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300">Ordre des blocs</span>
          <button type="button" onClick={onResetBlocks} className="text-[11px] text-neutral-400 hover:text-amber-400 cursor-pointer">Réinitialiser l'ordre</button>
        </div>
        {p.blocksOrder.map((b, i) => (
          <div key={b} className="flex items-center gap-2 p-2 bg-[#1e1e24] border border-neutral-800 rounded-lg">
            <span className="text-[11px] font-mono text-neutral-600 w-4">{i + 1}</span>
            <span className="flex-1 text-sm text-white">{PRODUCT_BLOCK_LABELS[b] ?? b}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 cursor-pointer" aria-label="Monter">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === p.blocksOrder.length - 1} className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 cursor-pointer" aria-label="Descendre">↓</button>
          </div>
        ))}
      </div>
      <Field label="Affichage des images">
        <SegmentedInput value={p.galleryLayout} onChange={(v) => set({ galleryLayout: v })} options={[{ value: "carousel", label: "Carrousel (défaut)" }, { value: "grid", label: "Grille" }]} />
      </Field>
      <ToggleRow label="Barre d'achat collante (mobile)" value={p.stickyBuyBarMobile} onChange={(v) => set({ stickyBuyBarMobile: v })} />
      <ToggleRow label="Quantité dans la barre d'achat" value={p.showQuantityInBar} onChange={(v) => set({ showQuantityInBar: v })} />
      <ToggleRow label="Quantité dans le formulaire" value={p.showQuantityInForm} onChange={(v) => set({ showQuantityInForm: v })} />
      <Field label="Taille des boutons">
        <SegmentedInput value={p.buttonSize} onChange={(v) => set({ buttonSize: v })} options={[{ value: "normal", label: "Normale" }, { value: "large", label: "Grande" }]} />
      </Field>
    </GroupShell>
  );
}

/* ---------------------------- PAGE PAIEMENT -------------------------------- */

export function CheckoutGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  const c = v2.checkout;
  const set = (patch: Partial<StoreCheckoutSettings>) => onChange({ checkout: { ...c, ...patch } });
  const t = c.texts;
  const setText = (key: keyof typeof t, next: { fr: string; ar: string }) => set({ texts: { ...t, [key]: next } });
  return (
    <GroupShell title="Page de paiement" hint="Champs affichés, disposition et textes personnalisables.">
      <ToggleRow label="Masquer le champ email" value={c.hideEmail} onChange={(v) => set({ hideEmail: v })} />
      <ToggleRow label="Masquer le champ adresse" value={c.hideAddress} onChange={(v) => set({ hideAddress: v })} />
      <ToggleRow label="Masquer le champ notes" value={c.hideNotes} onChange={(v) => set({ hideNotes: v })} />
      <ToggleRow label="Adresse obligatoire" value={c.addressRequired} onChange={(v) => set({ addressRequired: v })} />
      <Field label="Disposition">
        <SegmentedInput value={c.layout} onChange={(v) => set({ layout: v })} options={[{ value: "twoColumns", label: "Deux colonnes (défaut)" }, { value: "oneColumn", label: "Une colonne" }]} />
      </Field>
      <div className="space-y-3 pt-2 border-t border-neutral-800">
        <span className="text-xs font-bold text-neutral-300">Textes personnalisables (FR / AR)</span>
        <Field label="Titre de la page"><BiTextInput fr={t.pageTitle.fr} ar={t.pageTitle.ar} onChange={(n) => setText("pageTitle", n)} maxLength={40} /></Field>
        <Field label="Informations personnelles"><BiTextInput fr={t.personalInfo.fr} ar={t.personalInfo.ar} onChange={(n) => setText("personalInfo", n)} maxLength={40} /></Field>
        <Field label="Adresse de livraison"><BiTextInput fr={t.address.fr} ar={t.address.ar} onChange={(n) => setText("address", n)} maxLength={40} /></Field>
        <Field label="Méthode de livraison"><BiTextInput fr={t.deliveryMethod.fr} ar={t.deliveryMethod.ar} onChange={(n) => setText("deliveryMethod", n)} maxLength={40} /></Field>
        <Field label="Récapitulatif"><BiTextInput fr={t.summary.fr} ar={t.summary.ar} onChange={(n) => setText("summary", n)} maxLength={40} /></Field>
        <Field label="Bouton de confirmation"><BiTextInput fr={t.confirmButton.fr} ar={t.confirmButton.ar} onChange={(n) => setText("confirmButton", n)} maxLength={40} /></Field>
        <Field label="Mode de paiement"><BiTextInput fr={t.paymentMode.fr} ar={t.paymentMode.ar} onChange={(n) => setText("paymentMode", n)} maxLength={60} /></Field>
        <Field label="Message de confirmation"><BiTextInput fr={t.successMessage.fr} ar={t.successMessage.ar} onChange={(n) => setText("successMessage", n)} maxLength={120} /></Field>
      </div>
    </GroupShell>
  );
}

/* ------------------------------ PIED DE PAGE ------------------------------- */

export function FooterGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  const f = v2.footer;
  const set = (patch: Partial<StoreV2Settings["footer"]>) => onChange({ footer: { ...f, ...patch } });
  return (
    <GroupShell title="Pied de page" hint="À propos, réseaux sociaux, lien personnalisé.">
      <Field label="Texte « À propos » (FR / AR)">
        <BiTextInput fr={f.about.fr} ar={f.about.ar} onChange={(next) => set({ about: next })} maxLength={400} />
      </Field>
      <ToggleRow label="Afficher les liens rapides" value={f.showQuickLinks} onChange={(v) => set({ showQuickLinks: v })} />
      <ToggleRow label="Afficher la liste des catégories" value={f.showCategories} onChange={(v) => set({ showCategories: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="WhatsApp"><TextInput value={f.whatsapp} onChange={(v) => set({ whatsapp: v })} placeholder="213xxxxxxxxx" dir="ltr" /></Field>
        <Field label="Facebook"><TextInput value={f.facebook} onChange={(v) => set({ facebook: v })} dir="ltr" /></Field>
        <Field label="Instagram"><TextInput value={f.instagram} onChange={(v) => set({ instagram: v })} dir="ltr" /></Field>
        <Field label="TikTok"><TextInput value={f.tiktok} onChange={(v) => set({ tiktok: v })} dir="ltr" /></Field>
        <Field label="Telegram"><TextInput value={f.telegram} onChange={(v) => set({ telegram: v })} dir="ltr" /></Field>
        <Field label="GitHub"><TextInput value={f.github} onChange={(v) => set({ github: v })} dir="ltr" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Lien perso — nom"><TextInput value={f.customLink.name} onChange={(v) => set({ customLink: { ...f.customLink, name: v } })} maxLength={40} /></Field>
        <Field label="Lien perso — URL"><TextInput value={f.customLink.url} onChange={(v) => set({ customLink: { ...f.customLink, url: v } })} dir="ltr" /></Field>
      </div>
      <ToggleRow label="Masquer la marque Enova" hint="Selon votre plan — vérifiez les conditions." value={f.hideBrand} onChange={(v) => set({ hideBrand: v })} />
    </GroupShell>
  );
}

/* ---------------------------- WIDGET D'AIDE -------------------------------- */

export function HelpWidgetGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  const w = v2.helpWidget;
  const set = (patch: Partial<StoreHelpWidgetSettings>) => onChange({ helpWidget: { ...w, ...patch } });
  return (
    <GroupShell title="Widget d'aide" hint="Bouton flottant + canaux + FAQ (configuration max 48 Ko).">
      <ToggleRow label="Activer le widget" value={w.enabled} onChange={(v) => set({ enabled: v })} />
      <Field label="Titre (FR / AR)"><BiTextInput fr={w.title.fr} ar={w.title.ar} onChange={(next) => set({ title: next })} maxLength={40} /></Field>
      <Field label="Sous-titre (FR / AR)"><BiTextInput fr={w.subtitle.fr} ar={w.subtitle.ar} onChange={(next) => set({ subtitle: next })} maxLength={60} /></Field>
      <Field label="Position"><SegmentedInput value={w.position} onChange={(v) => set({ position: v })} options={[{ value: "right", label: "À droite" }, { value: "left", label: "À gauche" }]} /></Field>
      <Field label="Couleur du bouton"><ColorInput value={w.buttonColor} onChange={(v) => set({ buttonColor: v })} presets={["#22c55e", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"]} /></Field>
      <Field label="Icône du bouton"><SelectInput value={w.buttonIcon} onChange={(v) => set({ buttonIcon: v })} options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "chat", label: "Discussion" }, { value: "help", label: "Aide ( ? )" }]} /></Field>
      <ToggleRow label="Inclure le nom du produit dans le message WhatsApp" value={w.includeProductNameInWaMessage} onChange={(v) => set({ includeProductNameInWaMessage: v })} />

      <div className="space-y-1.5 pt-2 border-t border-neutral-800">
        <span className="text-xs font-bold text-neutral-300">Canaux ({w.channels.length})</span>
        {w.channels.map((c, i) => (
          <React.Fragment key={c.id}>
            <RepeatCard
              index={i}
              onMoveUp={() => { if (i > 0) { const next = [...w.channels]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set({ channels: next }); } }}
              onMoveDown={() => { if (i < w.channels.length - 1) { const next = [...w.channels]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; set({ channels: next }); } }}
              onRemove={() => set({ channels: w.channels.filter((x) => x.id !== c.id) })}
            >
              <Field label="Type">
                <SelectInput value={c.type} onChange={(v) => { const next = [...w.channels]; next[i] = { ...c, type: v }; set({ channels: next }); }} options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "telegram", label: "Telegram" }, { value: "phone", label: "Téléphone" }]} />
              </Field>
              <Field label="Libellé (FR / AR)"><BiTextInput fr={c.label.fr} ar={c.label.ar} onChange={(n) => { const next = [...w.channels]; next[i] = { ...c, label: n }; set({ channels: next }); }} maxLength={30} /></Field>
              <Field label="Numéro / identifiant"><TextInput value={c.value} onChange={(n) => { const next = [...w.channels]; next[i] = { ...c, value: n }; set({ channels: next }); }} dir="ltr" /></Field>
            </RepeatCard>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => set({ channels: [...w.channels, { id: `c${Date.now().toString(36)}`, type: "whatsapp", label: { fr: "WhatsApp", ar: "واتساب" }, value: "213" }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter un canal
        </button>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-neutral-800">
        <span className="text-xs font-bold text-neutral-300">FAQ du widget ({w.faqs.length}/30)</span>
        {w.faqs.map((f, i) => (
          <React.Fragment key={f.id}>
            <RepeatCard index={i} onRemove={() => set({ faqs: w.faqs.filter((x) => x.id !== f.id) })}>
              <Field label={`Question ${i + 1} (FR / AR)`}><BiTextInput fr={f.question.fr} ar={f.question.ar} onChange={(n) => { const next = [...w.faqs]; next[i] = { ...f, question: n }; set({ faqs: next }); }} maxLength={120} /></Field>
              <Field label="Réponse (FR / AR)"><BiTextInput fr={f.answer.fr} ar={f.answer.ar} onChange={(n) => { const next = [...w.faqs]; next[i] = { ...f, answer: n }; set({ faqs: next }); }} maxLength={300} /></Field>
            </RepeatCard>
          </React.Fragment>
        ))}
        {w.faqs.length < 30 && (
          <button type="button" onClick={() => set({ faqs: [...w.faqs, { id: `f${Date.now().toString(36)}`, question: { fr: "Nouvelle question ?", ar: "سؤال جديد؟" }, answer: { fr: "Réponse…", ar: "الجواب…" } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
            + Ajouter une question
          </button>
        )}
      </div>

      <div className="space-y-1.5 pt-2 border-t border-neutral-800">
        <span className="text-xs font-bold text-neutral-300">Textes libres ({w.freeTexts.length}/6)</span>
        {w.freeTexts.map((tx, i) => (
          <React.Fragment key={i}>
            <RepeatCard index={i} onRemove={() => set({ freeTexts: w.freeTexts.filter((_, j) => j !== i) })}>
              <BiTextInput fr={tx.fr} ar={tx.ar} onChange={(n) => { const next = [...w.freeTexts]; next[i] = n; set({ freeTexts: next }); }} maxLength={120} />
            </RepeatCard>
          </React.Fragment>
        ))}
        {w.freeTexts.length < 6 && (
          <button type="button" onClick={() => set({ freeTexts: [...w.freeTexts, { fr: "Texte libre…", ar: "نص حر…" }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
            + Ajouter un texte
          </button>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t border-neutral-800">
        <span className="text-xs font-bold text-neutral-300">Message de bienvenue</span>
        <Field label="Texte (FR / AR)"><BiTextInput fr={w.welcome.text.fr} ar={w.welcome.text.ar} onChange={(n) => set({ welcome: { ...w.welcome, text: n } })} maxLength={120} /></Field>
        <Field label="Délai d'apparition (secondes)"><NumberInput value={w.welcome.delaySeconds} onChange={(v) => set({ welcome: { ...w.welcome, delaySeconds: Math.max(0, Math.min(60, v)) } })} min={0} max={60} /></Field>
        <Field label="Fréquence">
          <SelectInput
            value={w.welcome.frequency}
            onChange={(v) => set({ welcome: { ...w.welcome, frequency: v } })}
            options={[
              { value: "oncePerSession", label: "Une fois par session" },
              { value: "oncePerDay", label: "Une fois par jour" },
              { value: "always", label: "À chaque visite" },
            ]}
          />
        </Field>
      </div>
    </GroupShell>
  );
}

/* --------------------------------- SEO ------------------------------------ */

export function SeoGroup({ v2, onChange }: { v2: StoreV2Settings; onChange: Patch }): React.ReactElement {
  const seo = v2.seo;
  const set = (patch: Partial<StoreSeoSettings>) => onChange({ seo: { ...seo, ...patch } });
  return (
    <GroupShell title="SEO" hint="Title, description, mots-clés et image de partage.">
      <Field label="Titre (title)" hint="60 caractères recommandés. Vide = nom de la boutique.">
        <TextInput value={seo.title} onChange={(v) => set({ title: v })} maxLength={70} />
      </Field>
      <Field label="Description (meta)" hint="160 caractères recommandés.">
        <TextInput value={seo.description} onChange={(v) => set({ description: v })} maxLength={170} />
      </Field>
      <Field label="Mots-clés (séparés par des virgules)">
        <TextInput value={seo.keywords} onChange={(v) => set({ keywords: v })} maxLength={200} />
      </Field>
      <Field label="Image de partage (OG)" hint="URL carrée 1200×1200 recommandée.">
        <TextInput value={seo.shareImage} onChange={(v) => set({ shareImage: v })} placeholder="https://…" dir="ltr" />
      </Field>
    </GroupShell>
  );
}
