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
  BarChart3, Briefcase, Images, ListOrdered, Wallet, Zap, CalendarClock, Users,
} from "lucide-react";
import type {
  HomeSection, HomeSectionType, CollectionSection, TextImageSection, VideoSection,
  FaqSection, ReviewsSection, TrustSection, PromoBannerSection, BrandInfoSection,
  AllProductsSection, HeroSection, CategoriesSection, FeaturedSection,
  StatsSection, ServicesCardsSection, GallerySection, ProcessSection,
  PricingSection, CtaBannerSection, ContactFormSection, TeamSection,
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
  { type: "stats", label: "Chiffres clés", icon: <BarChart3 className="w-4 h-4" />, description: "Valeurs fortes + bande de clients (T6)" },
  { type: "servicesCards", label: "Cartes services", icon: <Briefcase className="w-4 h-4" />, description: "Services avec image ou icône (T6)" },
  { type: "gallery", label: "Galerie", icon: <Images className="w-4 h-4" />, description: "Réalisations / cas clients imagés (T6)" },
  { type: "process", label: "Processus", icon: <ListOrdered className="w-4 h-4" />, description: "Étapes numérotées avec icônes (T6)" },
  { type: "pricing", label: "Forfaits", icon: <Wallet className="w-4 h-4" />, description: "Basic / Pro / Premium, plan mis en avant (T6)" },
  { type: "ctaBanner", label: "Bande CTA", icon: <Zap className="w-4 h-4" />, description: "Appel à l'action avec image de fond (T6)" },
  { type: "contactForm", label: "Formulaire devis/RDV", icon: <CalendarClock className="w-4 h-4" />, description: "Crée un lead dans le dashboard (T6)" },
  { type: "team", label: "Équipe", icon: <Users className="w-4 h-4" />, description: "Membres avec avatars à initiales (T6)" },
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
  /* T6 — les sections riches gèrent elles-mêmes leur titre/sous-titre
   * (champs optionnels nullable) : pas de double édition. */
  const RICH_T6 = new Set(["stats", "servicesCards", "gallery", "process", "pricing", "ctaBanner", "contactForm", "team"]);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm font-medium cursor-pointer">
        <ChevronRight className="w-4 h-4 rotate-180" /> Retour aux sections
      </button>
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        {metaOf(section.type).icon} {sectionTitleLabel(section)}
      </h3>

      {title && !RICH_T6.has(section.type) && (
        <Field label="Titre (FR / AR)">
          <BiTextInput fr={title.fr} ar={title.ar} onChange={(next) => set({ title: next } as Partial<HomeSection>)} maxLength={80} />
        </Field>
      )}
      {"subtitle" in section && section.subtitle && !RICH_T6.has(section.type) && (
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

/* ========================================================================== */
/* T6 — Champs spécifiques des sections riches                                */
/* ========================================================================== */

/** Icônes disponibles dans les vues RichSections (clés du dictionnaire ICONS). */
const RICH_ICON_OPTIONS: Array<{ value: string; label: string }> = [
  "trending", "award", "users", "building", "wrench", "sparkles", "clipboard",
  "calendar", "search", "handshake", "shield", "thumbsup", "phone",
].map((v) => ({ value: v, label: v }));

if (section.type === "stats") {
  const sec = section as StatsSection;
  const set = (patch: Partial<StatsSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (optionnel, FR / AR)">
        <BiTextInput fr={sec.title?.fr ?? ""} ar={sec.title?.ar ?? ""} onChange={(next) => set({ title: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={80} />
      </Field>
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-300">Chiffres clés ({sec.items.length})</span>
        {sec.items.map((it, i) => (
          <React.Fragment key={it.id}>
          <RepeatCard index={i}
            onMoveUp={() => { if (i > 0) { const n = [...sec.items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ items: n }); } }}
            onMoveDown={() => { if (i < sec.items.length - 1) { const n = [...sec.items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ items: n }); } }}
            onRemove={() => set({ items: sec.items.filter((x) => x.id !== it.id) })}
          >
            <div className="grid grid-cols-3 gap-2">
              <Field label="Valeur"><TextInput value={it.value} onChange={(v) => { const n = [...sec.items]; n[i] = { ...it, value: v }; set({ items: n }); }} maxLength={12} placeholder="15+" /></Field>
              <div className="col-span-2">
                <Field label="Libellé (FR / AR)">
                  <BiTextInput fr={it.label.fr} ar={it.label.ar} onChange={(next) => { const n = [...sec.items]; n[i] = { ...it, label: next }; set({ items: n }); }} maxLength={60} />
                </Field>
              </div>
            </div>
          </RepeatCard>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => set({ items: [...sec.items, { id: `s${Date.now().toString(36)}`, value: "100+", label: { fr: "Clients satisfaits", ar: "زبون راضٍ" } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter un chiffre
        </button>
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-300">Bande de clients ({(sec.clients ?? []).length}) — noms texte, aucun logo</span>
        {(sec.clients ?? []).map((c, i) => (
          <React.Fragment key={i}>
          <RepeatCard index={i} onRemove={() => set({ clients: (sec.clients ?? []).filter((_, j) => j !== i) })}>
            <Field label={`Client ${i + 1} (FR / AR)`}>
              <BiTextInput fr={c.fr} ar={c.ar} onChange={(next) => { const n = [...(sec.clients ?? [])]; n[i] = next; set({ clients: n }); }} maxLength={40} />
            </Field>
          </RepeatCard>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => set({ clients: [...(sec.clients ?? []), { fr: "Nom du client", ar: "اسم العميل" }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter un client
        </button>
      </div>
    </>
  );
}

if (section.type === "servicesCards") {
  const sec = section as ServicesCardsSection;
  const set = (patch: Partial<ServicesCardsSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Sous-titre (FR / AR, optionnel)">
        <BiTextInput fr={sec.subtitle?.fr ?? ""} ar={sec.subtitle?.ar ?? ""} onChange={(next) => set({ subtitle: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={120} />
      </Field>
      <div className="space-y-1.5">
      <span className="text-xs font-bold text-neutral-300">Cartes ({sec.cards.length})</span>
      {sec.cards.map((c, i) => (
        <React.Fragment key={c.id}>
          <RepeatCard index={i}
          onMoveUp={() => { if (i > 0) { const n = [...sec.cards]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ cards: n }); } }}
          onMoveDown={() => { if (i < sec.cards.length - 1) { const n = [...sec.cards]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ cards: n }); } }}
          onRemove={() => set({ cards: sec.cards.filter((x) => x.id !== c.id) })}
        >
          <Field label="Titre de la carte (FR / AR)">
            <BiTextInput fr={c.title.fr} ar={c.title.ar} onChange={(next) => { const n = [...sec.cards]; n[i] = { ...c, title: next }; set({ cards: n }); }} maxLength={60} />
          </Field>
          <Field label="Description (FR / AR)">
            <BiTextInput fr={c.text.fr} ar={c.text.ar} onChange={(next) => { const n = [...sec.cards]; n[i] = { ...c, text: next }; set({ cards: n }); }} maxLength={220} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Icône (si pas d'image)">
              <SelectInput value={c.icon ?? "sparkles"} onChange={(v) => { const n = [...sec.cards]; n[i] = { ...c, icon: v }; set({ cards: n }); }} options={RICH_ICON_OPTIONS} />
            </Field>
            <Field label="Image (URL, optionnel)">
              <TextInput value={c.image ?? ""} onChange={(v) => { const n = [...sec.cards]; n[i] = { ...c, image: v }; set({ cards: n }); }} placeholder="/themes/… ou https://…" dir="ltr" />
            </Field>
          </div>
        </RepeatCard>
        </React.Fragment>
      ))}
      <button type="button" onClick={() => set({ cards: [...sec.cards, { id: `sv${Date.now().toString(36)}`, icon: "sparkles", title: { fr: "Nouveau service", ar: "خدمة جديدة" }, text: { fr: "Décrivez ce service en une phrase.", ar: "صف هذه الخدمة في جملة واحدة." } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
        + Ajouter une carte
      </button>
      </div>
    </>
  );
}

if (section.type === "gallery") {
  const sec = section as GallerySection;
  const set = (patch: Partial<GallerySection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Sous-titre (FR / AR, optionnel)">
        <BiTextInput fr={sec.subtitle?.fr ?? ""} ar={sec.subtitle?.ar ?? ""} onChange={(next) => set({ subtitle: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={120} />
      </Field>
      <div className="space-y-1.5">
      <span className="text-xs font-bold text-neutral-300">Réalisations ({sec.items.length})</span>
      {sec.items.map((it, i) => (
        <React.Fragment key={it.id}>
          <RepeatCard index={i}
          onMoveUp={() => { if (i > 0) { const n = [...sec.items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ items: n }); } }}
          onMoveDown={() => { if (i < sec.items.length - 1) { const n = [...sec.items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ items: n }); } }}
          onRemove={() => set({ items: sec.items.filter((x) => x.id !== it.id) })}
        >
          <Field label="Titre (FR / AR)">
            <BiTextInput fr={it.title.fr} ar={it.title.ar} onChange={(next) => { const n = [...sec.items]; n[i] = { ...it, title: next }; set({ items: n }); }} maxLength={80} />
          </Field>
          <Field label="Légende (FR / AR, optionnel)">
            <BiTextInput fr={it.text?.fr ?? ""} ar={it.text?.ar ?? ""} onChange={(next) => { const n = [...sec.items]; n[i] = { ...it, text: next.fr.trim() || next.ar.trim() ? next : null }; set({ items: n }); }} maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Étiquette (FR / AR)">
              <BiTextInput fr={it.tag?.fr ?? ""} ar={it.tag?.ar ?? ""} onChange={(next) => { const n = [...sec.items]; n[i] = { ...it, tag: next.fr.trim() || next.ar.trim() ? next : null }; set({ items: n }); }} maxLength={30} />
            </Field>
            <Field label="Image (URL)">
              <TextInput value={it.image} onChange={(v) => { const n = [...sec.items]; n[i] = { ...it, image: v }; set({ items: n }); }} placeholder="/themes/… ou https://…" dir="ltr" />
            </Field>
          </div>
        </RepeatCard>
        </React.Fragment>
      ))}
      <button type="button" onClick={() => set({ items: [...sec.items, { id: `g${Date.now().toString(36)}`, image: "", title: { fr: "Nouvelle réalisation", ar: "إنجاز جديد" }, text: null, tag: null }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
        + Ajouter une réalisation
      </button>
      </div>
    </>
  );
}

if (section.type === "process") {
  const sec = section as ProcessSection;
  const set = (patch: Partial<ProcessSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Sous-titre (FR / AR, optionnel)">
        <BiTextInput fr={sec.subtitle?.fr ?? ""} ar={sec.subtitle?.ar ?? ""} onChange={(next) => set({ subtitle: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={120} />
      </Field>
      <div className="space-y-1.5">
      <span className="text-xs font-bold text-neutral-300">Étapes ({sec.steps.length})</span>
      {sec.steps.map((st, i) => (
        <React.Fragment key={st.id}>
          <RepeatCard index={i}
          onMoveUp={() => { if (i > 0) { const n = [...sec.steps]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ steps: n }); } }}
          onMoveDown={() => { if (i < sec.steps.length - 1) { const n = [...sec.steps]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ steps: n }); } }}
          onRemove={() => set({ steps: sec.steps.filter((x) => x.id !== st.id) })}
        >
          <div className="grid grid-cols-3 gap-2">
            <Field label="Icône">
              <SelectInput value={st.icon ?? "phone"} onChange={(v) => { const n = [...sec.steps]; n[i] = { ...st, icon: v }; set({ steps: n }); }} options={RICH_ICON_OPTIONS} />
            </Field>
            <div className="col-span-2">
              <Field label="Titre de l'étape (FR / AR)">
                <BiTextInput fr={st.title.fr} ar={st.title.ar} onChange={(next) => { const n = [...sec.steps]; n[i] = { ...st, title: next }; set({ steps: n }); }} maxLength={60} />
              </Field>
            </div>
          </div>
          <Field label="Description (FR / AR)">
            <BiTextInput fr={st.text.fr} ar={st.text.ar} onChange={(next) => { const n = [...sec.steps]; n[i] = { ...st, text: next }; set({ steps: n }); }} maxLength={180} />
          </Field>
        </RepeatCard>
        </React.Fragment>
      ))}
      <button type="button" onClick={() => set({ steps: [...sec.steps, { id: `p${Date.now().toString(36)}`, icon: "clipboard", title: { fr: `Étape ${sec.steps.length + 1}`, ar: `المرحلة ${sec.steps.length + 1}` }, text: { fr: "Décrivez cette étape.", ar: "صف هذه المرحلة." } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
        + Ajouter une étape
      </button>
      </div>
    </>
  );
}

if (section.type === "pricing") {
  const sec = section as PricingSection;
  const set = (patch: Partial<PricingSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Sous-titre (FR / AR, optionnel)">
        <BiTextInput fr={sec.subtitle?.fr ?? ""} ar={sec.subtitle?.ar ?? ""} onChange={(next) => set({ subtitle: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={120} />
      </Field>
      <div className="space-y-1.5">
      <span className="text-xs font-bold text-neutral-300">Forfaits ({sec.plans.length})</span>
      {sec.plans.map((pl, i) => (
        <React.Fragment key={pl.id}>
          <RepeatCard index={i}
          onMoveUp={() => { if (i > 0) { const n = [...sec.plans]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ plans: n }); } }}
          onMoveDown={() => { if (i < sec.plans.length - 1) { const n = [...sec.plans]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ plans: n }); } }}
          onRemove={() => set({ plans: sec.plans.filter((x) => x.id !== pl.id) })}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nom du forfait (FR / AR)">
              <BiTextInput fr={pl.name.fr} ar={pl.name.ar} onChange={(next) => { const n = [...sec.plans]; n[i] = { ...pl, name: next }; set({ plans: n }); }} maxLength={30} />
            </Field>
            <Field label="Prix affiché">
              <TextInput value={pl.price} onChange={(v) => { const n = [...sec.plans]; n[i] = { ...pl, price: v }; set({ plans: n }); }} maxLength={24} placeholder="6 500 DA ou Sur devis" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Période (FR / AR, optionnel)">
              <BiTextInput fr={pl.period?.fr ?? ""} ar={pl.period?.ar ?? ""} onChange={(next) => { const n = [...sec.plans]; n[i] = { ...pl, period: next.fr.trim() || next.ar.trim() ? next : null }; set({ plans: n }); }} maxLength={24} />
            </Field>
            <Field label="Texte du bouton (FR / AR)">
              <BiTextInput fr={pl.buttonText?.fr ?? ""} ar={pl.buttonText?.ar ?? ""} onChange={(next) => { const n = [...sec.plans]; n[i] = { ...pl, buttonText: next.fr.trim() || next.ar.trim() ? next : null }; set({ plans: n }); }} maxLength={24} />
            </Field>
          </div>
          <ToggleRow label="Forfait mis en avant" value={Boolean(pl.highlighted)} onChange={(v) => { const n = [...sec.plans]; n[i] = { ...pl, highlighted: v }; set({ plans: n }); }} />
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-300">Inclus ({pl.features.length})</span>
            {pl.features.map((f, j) => (
              <div key={j} className="flex items-end gap-2">
                <div className="flex-1">
                  <BiTextInput fr={f.fr} ar={f.ar} onChange={(next) => { const nf = [...pl.features]; nf[j] = next; const n = [...sec.plans]; n[i] = { ...pl, features: nf }; set({ plans: n }); }} maxLength={80} />
                </div>
                <button type="button" onClick={() => { const nf = pl.features.filter((_, k) => k !== j); const n = [...sec.plans]; n[i] = { ...pl, features: nf }; set({ plans: n }); }} className="mb-1 p-2 rounded-lg text-neutral-500 hover:text-red-400 cursor-pointer" title="Retirer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => { const nf = [...pl.features, { fr: "Nouvel avantage", ar: "ميزة جديدة" }]; const n = [...sec.plans]; n[i] = { ...pl, features: nf }; set({ plans: n }); }} className="w-full py-1.5 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
              + Ajouter un avantage
            </button>
          </div>
        </RepeatCard>
        </React.Fragment>
      ))}
      <button type="button" onClick={() => set({ plans: [...sec.plans, { id: `pl${Date.now().toString(36)}`, name: { fr: "Nouveau forfait", ar: "باقة جديدة" }, price: "Sur devis", period: null, features: [{ fr: "Avantage 1", ar: "الميزة 1" }], buttonText: { fr: "Réserver", ar: "احجز" } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
        + Ajouter un forfait
      </button>
      </div>
    </>
  );
}

if (section.type === "ctaBanner") {
  const sec = section as CtaBannerSection;
  const set = (patch: Partial<CtaBannerSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Texte d'accroche (FR / AR)">
        <BiTextInput fr={sec.text.fr} ar={sec.text.ar} onChange={(next) => set({ text: next })} maxLength={200} />
      </Field>
      <Field label="Image de fond (URL, optionnel)">
        <TextInput value={sec.image ?? ""} onChange={(v) => set({ image: v })} placeholder="/themes/… ou https://…" dir="ltr" />
      </Field>
      <Field label="Texte du bouton (FR / AR)">
        <BiTextInput fr={sec.buttonText.fr} ar={sec.buttonText.ar} onChange={(next) => set({ buttonText: next })} maxLength={30} />
      </Field>
      <Field label="Lien du bouton">
        <TextInput value={sec.buttonLink} onChange={(v) => set({ buttonLink: v })} placeholder="#contact" dir="ltr" />
      </Field>
      <Field label="Texte WhatsApp (FR / AR, optionnel)">
        <BiTextInput fr={sec.whatsappText?.fr ?? ""} ar={sec.whatsappText?.ar ?? ""} onChange={(next) => set({ whatsappText: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={30} />
      </Field>
    </>
  );
}

if (section.type === "contactForm") {
  const sec = section as ContactFormSection;
  const set = (patch: Partial<ContactFormSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Sous-titre (FR / AR, optionnel)">
        <BiTextInput fr={sec.subtitle?.fr ?? ""} ar={sec.subtitle?.ar ?? ""} onChange={(next) => set({ subtitle: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={120} />
      </Field>
      <Field label="Type de formulaire">
        <SegmentedInput value={sec.kind} onChange={(v) => set({ kind: v })} options={[{ value: "quote", label: "Devis" }, { value: "appointment", label: "Rendez-vous" }]} />
      </Field>
      <Field label="Titre du formulaire (FR / AR)">
        <BiTextInput fr={sec.formTitle.fr} ar={sec.formTitle.ar} onChange={(next) => set({ formTitle: next })} maxLength={60} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Champ nom (FR / AR)"><BiTextInput fr={sec.nameLabel.fr} ar={sec.nameLabel.ar} onChange={(next) => set({ nameLabel: next })} maxLength={40} /></Field>
        <Field label="Champ téléphone (FR / AR)"><BiTextInput fr={sec.phoneLabel.fr} ar={sec.phoneLabel.ar} onChange={(next) => set({ phoneLabel: next })} maxLength={40} /></Field>
        <Field label="Champ email (FR / AR)"><BiTextInput fr={sec.emailLabel.fr} ar={sec.emailLabel.ar} onChange={(next) => set({ emailLabel: next })} maxLength={40} /></Field>
        <Field label="Champ besoin (FR / AR)"><BiTextInput fr={sec.needLabel.fr} ar={sec.needLabel.ar} onChange={(next) => set({ needLabel: next })} maxLength={40} /></Field>
        <Field label="Champ message (FR / AR)"><BiTextInput fr={sec.messageLabel.fr} ar={sec.messageLabel.ar} onChange={(next) => set({ messageLabel: next })} maxLength={40} /></Field>
        <Field label="Bouton envoyer (FR / AR)"><BiTextInput fr={sec.submitText.fr} ar={sec.submitText.ar} onChange={(next) => set({ submitText: next })} maxLength={40} /></Field>
      </div>
      {sec.kind === "appointment" ? (
        <Field label="Champ date/heure (FR / AR)">
          <BiTextInput fr={sec.dateLabel?.fr ?? ""} ar={sec.dateLabel?.ar ?? ""} onChange={(next) => set({ dateLabel: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={40} />
        </Field>
      ) : null}
      <Field label="Message de succès (FR / AR)">
        <BiTextInput fr={sec.successText.fr} ar={sec.successText.ar} onChange={(next) => set({ successText: next })} maxLength={140} />
      </Field>
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-300">Options du champ besoin ({(sec.services ?? []).length})</span>
        {(sec.services ?? []).map((sv, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <BiTextInput fr={sv.fr} ar={sv.ar} onChange={(next) => { const n = [...(sec.services ?? [])]; n[i] = next; set({ services: n }); }} maxLength={40} />
            </div>
            <button type="button" onClick={() => set({ services: (sec.services ?? []).filter((_, j) => j !== i) })} className="mb-1 p-2 rounded-lg text-neutral-500 hover:text-red-400 cursor-pointer" title="Retirer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set({ services: [...(sec.services ?? []), { fr: "Nouvelle option", ar: "خيار جديد" }] })} className="w-full py-1.5 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter une option
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Adresse (FR / AR)"><BiTextInput fr={sec.info.address.fr} ar={sec.info.address.ar} onChange={(next) => set({ info: { ...sec.info, address: next } })} maxLength={80} /></Field>
        <Field label="Horaires (FR / AR)"><BiTextInput fr={sec.info.hours.fr} ar={sec.info.hours.ar} onChange={(next) => set({ info: { ...sec.info, hours: next } })} maxLength={80} /></Field>
        <Field label="Téléphone"><TextInput value={sec.info.phone} onChange={(v) => set({ info: { ...sec.info, phone: v } })} maxLength={24} dir="ltr" /></Field>
        <Field label="Email"><TextInput value={sec.info.email ?? ""} onChange={(v) => set({ info: { ...sec.info, email: v } })} maxLength={60} dir="ltr" /></Field>
      </div>
      <ToggleRow label="Afficher le bouton WhatsApp direct" value={sec.showWhatsApp} onChange={(v) => set({ showWhatsApp: v })} />
    </>
  );
}

if (section.type === "team") {
  const sec = section as TeamSection;
  const set = (patch: Partial<TeamSection>) => onChange({ ...sec, ...patch });
  return (
    <>
      <Field label="Photo d'équipe (URL, optionnel)">
        <TextInput value={sec.image ?? ""} onChange={(v) => set({ image: v })} placeholder="/themes/… ou https://…" dir="ltr" />
      </Field>
      <Field label="Titre (FR / AR)">
        <BiTextInput fr={sec.title.fr} ar={sec.title.ar} onChange={(next) => set({ title: next })} maxLength={80} />
      </Field>
      <Field label="Sous-titre (FR / AR, optionnel)">
        <BiTextInput fr={sec.subtitle?.fr ?? ""} ar={sec.subtitle?.ar ?? ""} onChange={(next) => set({ subtitle: next.fr.trim() || next.ar.trim() ? next : null })} maxLength={120} />
      </Field>
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-300">Membres ({sec.members.length}) — avatars à initiales, jamais de visage</span>
        {sec.members.map((m, i) => (
          <React.Fragment key={m.id}>
          <RepeatCard index={i}
            onMoveUp={() => { if (i > 0) { const n = [...sec.members]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ members: n }); } }}
            onMoveDown={() => { if (i < sec.members.length - 1) { const n = [...sec.members]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ members: n }); } }}
            onRemove={() => set({ members: sec.members.filter((x) => x.id !== m.id) })}
          >
            <div className="grid grid-cols-4 gap-2">
              <Field label="Initiales"><TextInput value={m.initials} onChange={(v) => { const n = [...sec.members]; n[i] = { ...m, initials: v.slice(0, 3).toUpperCase() }; set({ members: n }); }} maxLength={3} /></Field>
              <div className="col-span-3">
                <Field label="Nom (FR / AR)">
                  <BiTextInput fr={m.name.fr} ar={m.name.ar} onChange={(next) => { const n = [...sec.members]; n[i] = { ...m, name: next }; set({ members: n }); }} maxLength={40} />
                </Field>
              </div>
            </div>
            <Field label="Rôle (FR / AR)">
              <BiTextInput fr={m.role.fr} ar={m.role.ar} onChange={(next) => { const n = [...sec.members]; n[i] = { ...m, role: next }; set({ members: n }); }} maxLength={60} />
            </Field>
          </RepeatCard>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => set({ members: [...sec.members, { id: `m${Date.now().toString(36)}`, initials: "AB", name: { fr: "Prénom Nom", ar: "الاسم واللقب" }, role: { fr: "Fonction", ar: "الوظيفة" } }] })} className="w-full py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-bold hover:border-amber-500 hover:text-amber-400 transition-colors cursor-pointer">
          + Ajouter un membre
        </button>
      </div>
    </>
  );
}

  return null;
}
