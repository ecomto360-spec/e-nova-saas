/**
 * T2 — Gestionnaire des sections de la page d'accueil (panneau gauche).
 * Liste avec recherche, réordonnancement (flèches + glisser-déposer),
 * visibilité, duplication, suppression, ajout (25 max, 12 types) et
 * éditeur détaillé par type de section.
 */
import React, { useState } from "react";
import {
  GripVertical, ArrowUp, ArrowDown, ChevronRight, Eye, EyeOff, Copy, Trash2, Plus, X, Search,
  Image as ImageIcon, Layers, Star, ShieldCheck, Megaphone, LayoutGrid, MessageSquare,
  HelpCircle, Package, Info, FileText, Video,
} from "lucide-react";
import type {
  HomeSection, HomeSectionType, CollectionSection, TextImageSection, VideoSection,
  FaqSection, ReviewsSection, TrustSection, PromoBannerSection, BrandInfoSection,
  AllProductsSection, HeroSection, CategoriesSection, FeaturedSection,
} from "../../../types/storefrontSections";
import { createHomeSection, duplicateHomeSection } from "../../../data/storefrontDefaults";
import { Field, TextInput, NumberInput, SelectInput, BiTextInput, SegmentedInput, ToggleRow, RepeatCard } from "./editorUI";

/** Métadonnées d'affichage des types de section (label FR court). */
export const SECTION_TYPE_META: Array<{ type: HomeSectionType; label: string; icon: React.ReactNode; description: string }> = [
  { type: "hero", label: "Hero", icon: <ImageIcon className="w-4 h-4" />, description: "Grande bannière avec titre et bouton" },
  { type: "categories", label: "Catégories", icon: <LayoutGrid className="w-4 h-4" />, description: "Grille de catégories avec images" },
  { type: "featured", label: "Produits vedettes", icon: <Star className="w-4 h-4" />, description: "Sélection mise en avant" },
  { type: "trust", label: "Badges de confiance", icon: <ShieldCheck className="w-4 h-4" />, description: "Livraison, paiement, échange…" },
  { type: "promoBanner", label: "Bannière promo", icon: <Megaphone className="w-4 h-4" />, description: "Image, titre, bouton" },
  { type: "collection", label: "Collection produits", icon: <Layers className="w-4 h-4" />, description: "Promotions, nouveautés, ventes, choix manuel" },
  { type: "reviews", label: "Avis clients", icon: <MessageSquare className="w-4 h-4" />, description: "Note /5, prénom, ville" },
  { type: "faq", label: "FAQ", icon: <HelpCircle className="w-4 h-4" />, description: "Questions en accordéon" },
  { type: "allProducts", label: "Tous les produits", icon: <Package className="w-4 h-4" />, description: "Pastilles, tri, afficher plus" },
  { type: "brandInfo", label: "Infos de la marque", icon: <Info className="w-4 h-4" />, description: "Logo, description, stats, réseaux" },
  { type: "textImage", label: "Texte + image", icon: <FileText className="w-4 h-4" />, description: "Bloc éditorial avec visuel" },
  { type: "video", label: "Vidéo", icon: <Video className="w-4 h-4" />, description: "YouTube, Dailymotion, Vimeo" },
];

function metaOf(type: HomeSectionType): { label: string; icon: React.ReactNode } {
  const m = SECTION_TYPE_META.find((x) => x.type === type);
  return { label: m ? m.label : type, icon: m ? m.icon : <Layers className="w-4 h-4" /> };
}

export function sectionTitleLabel(sec: HomeSection): string {
  const anySec = sec as unknown as { title?: { fr: string } };
  return anySec.title?.fr ? anySec.title.fr : metaOf(sec.type).label;
}

/* -------------------------------------------------------------------------- */
/* Liste des sections (panneau principal)                                     */
/* -------------------------------------------------------------------------- */

export function HomeSectionsList({
  sections,
  search,
  activeSectionId,
  onSelect,
  onReorder,
  onToggleVisible,
  onDuplicate,
  onDelete,
  onAdd,
}: {
  sections: HomeSection[];
  search: string;
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onToggleVisible: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: HomeSectionType) => void;
}): React.ReactElement {
  const [adding, setAdding] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const q = search.trim().toLowerCase();
  const visibleSections = sections
    .map((sec, index) => ({ sec, index }))
    .filter(({ sec }) => !q || sectionTitleLabel(sec).toLowerCase().includes(q) || metaOf(sec.type).label.toLowerCase().includes(q));

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= sections.length) return;
    onReorder(index, to);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Sections de la page d'accueil ({sections.length}/25)
        </span>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          disabled={sections.length >= 25}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-bold hover:bg-amber-500/20 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {adding && (
        <div className="mb-3 p-2 bg-[#1e1e24] border border-neutral-800 rounded-xl space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-bold text-neutral-400">Choisir un type de section</span>
            <button type="button" onClick={() => setAdding(false)} className="p-1 rounded text-neutral-500 hover:text-white cursor-pointer" aria-label="Fermer"><X className="w-3.5 h-3.5" /></button>
          </div>
          {SECTION_TYPE_META.map((m) => (
            <button
              key={m.type}
              type="button"
              onClick={() => { onAdd(m.type); setAdding(false); }}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-800 transition-colors text-start cursor-pointer"
            >
              <span className="text-neutral-400">{m.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-white">{m.label}</span>
                <span className="block text-[11px] text-neutral-500 truncate">{m.description}</span>
              </span>
              <Plus className="w-3.5 h-3.5 text-neutral-600" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {visibleSections.map(({ sec, index }) => {
          const m = metaOf(sec.type);
          const active = activeSectionId === sec.id;
          return (
            <div
              key={sec.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); setDropIndex(index); }}
              onDragEnd={() => { setDragIndex(null); setDropIndex(null); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
                setDragIndex(null);
                setDropIndex(null);
              }}
              className={`flex items-center gap-1 p-2.5 bg-[#1e1e24] border rounded-xl transition-colors ${active ? "border-amber-500" : dropIndex === index && dragIndex !== null && dragIndex !== index ? "border-amber-500/50 border-dashed" : "border-neutral-800 hover:border-neutral-600"} ${dragIndex === index ? "opacity-40" : ""}`}
            >
              <span className="text-neutral-600 cursor-grab active:cursor-grabbing shrink-0" title="Glisser pour réordonner"><GripVertical size={14} /></span>
              <button type="button" onClick={() => onSelect(sec.id)} className="flex items-center gap-2 flex-1 min-w-0 text-start cursor-pointer">
                <span className={sec.visible ? "text-neutral-400" : "text-neutral-600"}>{m.icon}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold truncate ${sec.visible ? "text-white" : "text-neutral-500 line-through"}`}>{sectionTitleLabel(sec)}</span>
                  <span className="block text-[10px] text-neutral-500">{m.label}</span>
                </span>
              </button>
              <div className="flex items-center gap-0.5 shrink-0">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors cursor-pointer" title="Monter" aria-label="Monter la section"><ArrowUp size={13} /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === sections.length - 1} className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors cursor-pointer" title="Descendre" aria-label="Descendre la section"><ArrowDown size={13} /></button>
                <button type="button" onClick={() => onToggleVisible(sec.id)} className={`p-1 rounded-lg transition-colors cursor-pointer ${sec.visible ? "text-amber-400 hover:text-amber-300" : "text-neutral-600 hover:text-neutral-400"} hover:bg-neutral-800`} title={sec.visible ? "Masquer" : "Afficher"} aria-label={sec.visible ? "Masquer la section" : "Afficher la section"}>{sec.visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                <button type="button" onClick={() => onDuplicate(sec.id)} disabled={sections.length >= 25} className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors cursor-pointer" title="Dupliquer" aria-label="Dupliquer la section"><Copy size={13} /></button>
                <button type="button" onClick={() => onDelete(sec.id)} className="p-1 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" title="Supprimer" aria-label="Supprimer la section"><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
        {visibleSections.length === 0 && (
          <p className="text-xs text-neutral-500 p-3 text-center">
            {q ? "Aucune section ne correspond à la recherche." : "Aucune section — clique sur « Ajouter »."}
          </p>
        )}
      </div>
      <p className="text-[11px] text-neutral-500 mt-2 px-1">
        Glisser la poignée ou flèches = réordonner · Œil = afficher/masquer · Clic = modifier
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Éditeur détaillé d'une section                                             */
/* -------------------------------------------------------------------------- */

export function SectionDetailEditor({
  section,
  products,
  categories,
  onChange,
  onBack,
}: {
  section: HomeSection;
  products: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  onChange: (next: HomeSection) => void;
  onBack: () => void;
}): React.ReactElement {
  const set = (patch: Partial<HomeSection>) => onChange({ ...section, ...patch } as HomeSection);
  const title = "title" in section ? (section as { title: { fr: string; ar: string } }).title : null;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm font-medium cursor-pointer">
        <ChevronRight className="w-4 h-4 rotate-180" /> Retour aux sections
      </button>
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        {metaOf(section.type).icon} {sectionTitleLabel(section)}
      </h3>

      {title && (
        <Field label="Titre (FR / AR)">
          <BiTextInput fr={title.fr} ar={title.ar} onChange={(next) => set({ title: next } as Partial<HomeSection>)} maxLength={80} />
        </Field>
      )}
      {"subtitle" in section && section.subtitle && (
        <Field label="Sous-titre (FR / AR)">
          <BiTextInput fr={section.subtitle.fr} ar={section.subtitle.ar} onChange={(next) => set({ subtitle: next } as Partial<HomeSection>)} maxLength={120} />
        </Field>
      )}

      <SectionTypeFields section={section} products={products} categories={categories} onChange={onChange} />
    </div>
  );
}

/** Champs spécifiques au type de section. */
function SectionTypeFields({
  section,
  products,
  categories,
  onChange,
}: {
  section: HomeSection;
  products: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  onChange: (next: HomeSection) => void;
}): React.ReactElement | null {
  if (section.type === "collection") {
    const sec = section as CollectionSection;
    const set = (patch: Partial<CollectionSection>) => onChange({ ...sec, ...patch });
    const toggleProduct = (id: string) => {
      const has = sec.productIds.includes(id);
      set({ productIds: has ? sec.productIds.filter((x) => x !== id) : [...sec.productIds, id] });
    };
    return (
      <>
        <Field label="Source des produits">
          <SelectInput
            value={sec.source}
            onChange={(v) => set({ source: v })}
            options={[
              { value: "onSale", label: "Promotions (ancien prix)" },
              { value: "newest", label: "Nouveautés" },
              { value: "bestSellers", label: "Meilleures ventes" },
              { value: "category", label: "Une catégorie" },
              { value: "manual", label: "Produits choisis manuellement" },
            ]}
          />
        </Field>
        {sec.source === "category" && (
          <Field label="Catégorie">
            <SelectInput value={sec.categoryId} onChange={(v) => set({ categoryId: v })} options={[{ value: "", label: "— Choisir —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          </Field>
        )}
        {sec.source === "manual" && (
          <Field label={`Produits choisis (${sec.productIds.length})`} hint="Clique pour ajouter/retirer ; l'ordre de clic définit l'ordre d'affichage.">
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#16161a] border border-neutral-800 rounded-xl">
              {products.map((p) => {
                const on = sec.productIds.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => toggleProduct(p.id)} className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${on ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`} aria-pressed={on}>
                    {on ? `${sec.productIds.indexOf(p.id) + 1}. ` : ""}{p.name}
                  </button>
                );
              })}
              {products.length === 0 && <span className="text-[11px] text-neutral-500">Aucun produit dans la boutique.</span>}
            </div>
          </Field>
        )}
        <Field label="Style d'affichage">
          <SegmentedInput value={sec.style} onChange={(v) => set({ style: v })} options={[{ value: "carousel", label: "Carrousel" }, { value: "grid", label: "Grille" }]} />
        </Field>
        <Field label="Nombre maximum de produits">
          <NumberInput value={sec.maxItems} onChange={(v) => set({ maxItems: Math.max(1, Math.min(24, v)) })} min={1} max={24} />
        </Field>
      </>
    );
  }

  if (section.type === "allProducts") {
    const sec = section as AllProductsSection;
    const set = (patch: Partial<AllProductsSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Tri par défaut (client peut changer)">
          <SelectInput
            value={sec.defaultSort}
            onChange={(v) => set({ defaultSort: v })}
            options={[
              { value: "recent", label: "Plus récents (défaut)" },
              { value: "priceAsc", label: "Prix croissant" },
              { value: "priceDesc", label: "Prix décroissant" },
              { value: "bestSelling", label: "Meilleures ventes" },
              { value: "manual", label: "Ordre manuel" },
              { value: "stockFirst", label: "En stock d'abord" },
            ]}
          />
        </Field>
        <Field label="Produits par « Afficher plus »">
          <NumberInput value={sec.pageSize} onChange={(v) => set({ pageSize: Math.max(4, Math.min(48, v)) })} min={4} max={48} />
        </Field>
      </>
    );
  }

  if (section.type === "trust") {
    const sec = section as TrustSection;
    const set = (patch: Partial<TrustSection>) => onChange({ ...sec, ...patch });
    const iconOptions: Array<{ value: TrustSection["items"][number]["icon"]; label: string }> = [
      { value: "truck", label: "🚚 Livraison" }, { value: "package", label: "📦 Paiement livraison" },
      { value: "rotate", label: "↩️ Échange/retour" }, { value: "shield", label: "🛡️ Garantie" },
      { value: "phone", label: "📞 Téléphone" }, { value: "clock", label: "🕐 Horaires" },
      { value: "star", label: "⭐ Qualité" }, { value: "check", label: "✓ Validé" },
    ];
    return (
      <div className="space-y-3">
        {sec.items.map((b, i) => (
          <React.Fragment key={b.id}>
            <RepeatCard
              index={i}
              onMoveUp={() => { if (i > 0) { const next = [...sec.items]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set({ items: next }); } }}
              onMoveDown={() => { if (i < sec.items.length - 1) { const next = [...sec.items]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; set({ items: next }); } }}
              onRemove={() => set({ items: sec.items.filter((x) => x.id !== b.id) })}
            >
              <Field label={`Badge ${i + 1} — icône`}>
                <SelectInput value={b.icon} onChange={(v) => { const next = [...sec.items]; next[i] = { ...b, icon: v }; set({ items: next }); }} options={iconOptions} />
              </Field>
              <Field label="Titre (FR / AR)">
                <BiTextInput fr={b.title.fr} ar={b.title.ar} onChange={(next) => { const nb = [...sec.items]; nb[i] = { ...b, title: next }; set({ items: nb }); }} maxLength={60} />
              </Field>
              <Field label="Sous-titre (FR / AR)">
                <BiTextInput fr={b.subtitle.fr} ar={b.subtitle.ar} onChange={(next) => { const nb = [...sec.items]; nb[i] = { ...b, subtitle: next }; set({ items: nb }); }} maxLength={90} />
              </Field>
            </RepeatCard>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => set({ items: [...sec.items, { id: `b${Date.now().toString(36)}`, icon: "star", title: { fr: "Nouveau badge", ar: "شارة جديدة" }, subtitle: { fr: "Description", ar: "الوصف" } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter un badge
        </button>
      </div>
    );
  }

  if (section.type === "faq") {
    const sec = section as FaqSection;
    const set = (patch: Partial<FaqSection>) => onChange({ ...sec, ...patch });
    return (
      <div className="space-y-3">
        {sec.items.map((item, i) => (
          <React.Fragment key={item.id}>
          <RepeatCard
            index={i}
            onMoveUp={() => { if (i > 0) { const next = [...sec.items]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set({ items: next }); } }}
            onMoveDown={() => { if (i < sec.items.length - 1) { const next = [...sec.items]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; set({ items: next }); } }}
            onRemove={() => set({ items: sec.items.filter((x) => x.id !== item.id) })}
          >
            <Field label={`Question ${i + 1} (FR / AR)`}>
              <BiTextInput fr={item.question.fr} ar={item.question.ar} onChange={(next) => { const ni = [...sec.items]; ni[i] = { ...item, question: next }; set({ items: ni }); }} maxLength={120} />
            </Field>
            <Field label="Réponse (FR / AR)">
              <BiTextInput fr={item.answer.fr} ar={item.answer.ar} onChange={(next) => { const ni = [...sec.items]; ni[i] = { ...item, answer: next }; set({ items: ni }); }} maxLength={400} />
            </Field>
          </RepeatCard>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => set({ items: [...sec.items, { id: `q${Date.now().toString(36)}`, question: { fr: "Nouvelle question ?", ar: "سؤال جديد؟" }, answer: { fr: "Réponse…", ar: "الجواب…" } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter une question
        </button>
      </div>
    );
  }

  if (section.type === "reviews") {
    const sec = section as ReviewsSection;
    const set = (patch: Partial<ReviewsSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <ToggleRow label="Inclure les avis produits" hint="Avis laissés sur les fiches produits" value={sec.includeProductReviews} onChange={(v) => set({ includeProductReviews: v })} />
        <Field label="Nombre maximum d'avis">
          <NumberInput value={sec.maxItems} onChange={(v) => set({ maxItems: Math.max(1, Math.min(12, v)) })} min={1} max={12} />
        </Field>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-neutral-300">Avis manuels ({sec.manualReviews.length})</span>
          {sec.manualReviews.map((r, i) => (
            <React.Fragment key={r.id}>
            <RepeatCard index={i} onRemove={() => set({ manualReviews: sec.manualReviews.filter((x) => x.id !== r.id) })}>
              <Field label="Avis (FR / AR)">
                <BiTextInput fr={r.text.fr} ar={r.text.ar} onChange={(next) => { const nr = [...sec.manualReviews]; nr[i] = { ...r, text: next }; set({ manualReviews: nr }); }} maxLength={220} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Auteur"><TextInput value={r.author} onChange={(v) => { const nr = [...sec.manualReviews]; nr[i] = { ...r, author: v }; set({ manualReviews: nr }); }} maxLength={40} /></Field>
                <Field label="Ville"><TextInput value={r.city} onChange={(v) => { const nr = [...sec.manualReviews]; nr[i] = { ...r, city: v }; set({ manualReviews: nr }); }} maxLength={40} /></Field>
                <Field label="Note"><NumberInput value={r.rating} onChange={(v) => { const nr = [...sec.manualReviews]; nr[i] = { ...r, rating: Math.max(1, Math.min(5, Math.round(v))) as 1 | 2 | 3 | 4 | 5 }; set({ manualReviews: nr }); }} min={1} max={5} /></Field>
              </div>
            </RepeatCard>
            </React.Fragment>
          ))}
          <button type="button" onClick={() => set({ manualReviews: [...sec.manualReviews, { id: `r${Date.now().toString(36)}`, text: { fr: "Excellent service !", ar: "خدمة ممتازة!" }, author: "Prénom", city: "Ville", rating: 5, manual: true }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
            + Ajouter un avis
          </button>
        </div>
      </>
    );
  }

  if (section.type === "promoBanner") {
    const sec = section as PromoBannerSection;
    const set = (patch: Partial<PromoBannerSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Description (FR / AR)">
          <BiTextInput fr={sec.description.fr} ar={sec.description.ar} onChange={(next) => set({ description: next })} maxLength={160} />
        </Field>
        <Field label="Image (URL ou vide = dégradé)" hint="JPG/PNG/WebP — recadrage automatique">
          <TextInput value={sec.image} onChange={(v) => set({ image: v })} placeholder="https://…" dir="ltr" />
        </Field>
        <Field label="Texte du bouton (FR / AR)">
          <BiTextInput fr={sec.buttonText.fr} ar={sec.buttonText.ar} onChange={(next) => set({ buttonText: next })} maxLength={30} />
        </Field>
        <Field label="Lien du bouton">
          <TextInput value={sec.buttonLink} onChange={(v) => set({ buttonLink: v })} placeholder="#products" dir="ltr" />
        </Field>
      </>
    );
  }

  if (section.type === "textImage") {
    const sec = section as TextImageSection;
    const set = (patch: Partial<TextImageSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Texte (FR / AR)">
          <BiTextInput fr={sec.body.fr} ar={sec.body.ar} onChange={(next) => set({ body: next })} maxLength={600} />
        </Field>
        <Field label="Image (URL ou vide = illustré)">
          <TextInput value={sec.image} onChange={(v) => set({ image: v })} placeholder="https://…" dir="ltr" />
        </Field>
        <Field label="Position de l'image">
          <SegmentedInput value={sec.imagePosition} onChange={(v) => set({ imagePosition: v })} options={[{ value: "start", label: "Gauche (début)" }, { value: "end", label: "Droite (fin)" }]} />
        </Field>
        <ToggleRow label="Afficher un bouton" value={sec.button.visible} onChange={(v) => set({ button: { ...sec.button, visible: v } })} />
        {sec.button.visible && (
          <>
            <Field label="Texte du bouton (FR / AR)">
              <BiTextInput fr={sec.button.text.fr} ar={sec.button.text.ar} onChange={(next) => set({ button: { ...sec.button, text: next } })} maxLength={30} />
            </Field>
            <Field label="Lien">
              <TextInput value={sec.button.link} onChange={(v) => set({ button: { ...sec.button, link: v } })} placeholder="#products" dir="ltr" />
            </Field>
          </>
        )}
      </>
    );
  }

  if (section.type === "video") {
    const sec = section as VideoSection;
    const set = (patch: Partial<VideoSection>) => onChange({ ...sec, ...patch });
    return (
      <Field label="URL d'intégration (embed)" hint="Ex. https://www.youtube.com/embed/VIDÉO — chargez la vidéo puis « Partager → Intégrer » et copiez l'URL du src.">
        <TextInput value={sec.embedUrl} onChange={(v) => set({ embedUrl: v })} placeholder="https://www.youtube.com/embed/…" dir="ltr" />
      </Field>
    );
  }

  if (section.type === "hero") {
    const sec = section as HeroSection;
    const set = (patch: Partial<HeroSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Sous-titre (FR / AR)">
          <BiTextInput fr={sec.description.fr} ar={sec.description.ar} onChange={(next) => set({ description: next })} maxLength={160} />
        </Field>
        <Field label="Image desktop (1920×600 recommandé)">
          <TextInput value={sec.desktopImage} onChange={(v) => set({ desktopImage: v })} placeholder="https://…" dir="ltr" />
        </Field>
        <Field label="Image mobile (600×800 recommandé)">
          <TextInput value={sec.mobileImage} onChange={(v) => set({ mobileImage: v })} placeholder="https://… (vide = desktop)" dir="ltr" />
        </Field>
        <Field label={`Assombrissement de l'image (${sec.overlayOpacity}%)`}>
          <input type="range" min={0} max={70} value={sec.overlayOpacity} onChange={(e) => set({ overlayOpacity: Number(e.target.value) })} className="w-full accent-amber-500 cursor-pointer" />
        </Field>
        <Field label="Alignement du contenu">
          <SegmentedInput value={sec.align} onChange={(v) => set({ align: v })} options={[{ value: "start", label: "Début" }, { value: "center", label: "Centre" }, { value: "end", label: "Fin" }]} />
        </Field>
        <Field label="Hauteur minimale (px)">
          <NumberInput value={sec.minHeightPx} onChange={(v) => set({ minHeightPx: Math.max(280, Math.min(900, v)) })} min={280} max={900} />
        </Field>
        <Field label="Bouton principal (FR / AR)">
          <BiTextInput fr={sec.primaryButton.text.fr} ar={sec.primaryButton.text.ar} onChange={(next) => set({ primaryButton: { ...sec.primaryButton, text: next } })} maxLength={30} />
        </Field>
        <Field label="Lien du bouton" hint="#products, #categories, ou une URL">
          <TextInput value={sec.primaryButton.link} onChange={(v) => set({ primaryButton: { ...sec.primaryButton, link: v } })} placeholder="#products" dir="ltr" />
        </Field>
      </>
    );
  }

  if (section.type === "categories") {
    const sec = section as CategoriesSection;
    const set = (patch: Partial<CategoriesSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Catégories affichées" hint="Vide = toutes les catégories actives.">
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#16161a] border border-neutral-800 rounded-xl">
            {categories.map((c) => {
              const on = sec.onlyIds.includes(c.id);
              return (
                <button key={c.id} type="button" onClick={() => set({ onlyIds: on ? sec.onlyIds.filter((x) => x !== c.id) : [...sec.onlyIds, c.id] })} className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${on ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`} aria-pressed={on}>
                  {c.name}
                </button>
              );
            })}
            {categories.length === 0 && <span className="text-[11px] text-neutral-500">Aucune catégorie.</span>}
          </div>
        </Field>
        <Field label="Nombre maximum de catégories">
          <NumberInput value={sec.maxItems} onChange={(v) => set({ maxItems: Math.max(1, Math.min(12, v)) })} min={1} max={12} />
        </Field>
        <Field label="Style">
          <SegmentedInput value={sec.style} onChange={(v) => set({ style: v })} options={[{ value: "grid", label: "Grille" }, { value: "carousel", label: "Carrousel" }]} />
        </Field>
      </>
    );
  }

  if (section.type === "featured") {
    const sec = section as FeaturedSection;
    const set = (patch: Partial<FeaturedSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Nombre de produits">
          <NumberInput value={sec.maxItems} onChange={(v) => set({ maxItems: Math.max(1, Math.min(12, v)) })} min={1} max={12} />
        </Field>
        <Field label="Style">
          <SegmentedInput value={sec.style} onChange={(v) => set({ style: v })} options={[{ value: "grid", label: "Grille" }, { value: "carousel", label: "Carrousel" }]} />
        </Field>
      </>
    );
  }

  if (section.type === "brandInfo") {
    const sec = section as BrandInfoSection;
    const set = (patch: Partial<BrandInfoSection>) => onChange({ ...sec, ...patch });
    return (
      <>
        <Field label="Description (FR / AR)">
          <BiTextInput fr={sec.description.fr} ar={sec.description.ar} onChange={(next) => set({ description: next })} maxLength={400} />
        </Field>
        <ToggleRow label="Afficher les statistiques de la boutique" value={sec.showStats} onChange={(v) => set({ showStats: v })} />
        <Field label="WhatsApp"><TextInput value={sec.whatsapp} onChange={(v) => set({ whatsapp: v })} placeholder="213xxxxxxxxx" dir="ltr" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Facebook"><TextInput value={sec.facebook} onChange={(v) => set({ facebook: v })} dir="ltr" /></Field>
          <Field label="Instagram"><TextInput value={sec.instagram} onChange={(v) => set({ instagram: v })} dir="ltr" /></Field>
          <Field label="TikTok"><TextInput value={sec.tiktok} onChange={(v) => set({ tiktok: v })} dir="ltr" /></Field>
        </div>
      </>
    );
  }

  return null;
}
