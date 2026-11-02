/**
 * T2 — Assistant IA bilingue de l'éditeur.
 * Génère des textes de boutique (hero, annonce, bannière, FAQ) à partir du
 * prompt du marchand, SANS appel externe : gabarits FR/AR alimentés par le nom
 * de la boutique et les mots-clés détectés. Rien n'est appliqué avant que le
 * marchand clique sur « Appliquer » (validation explicite).
 */
import React, { useMemo, useState } from "react";
import { Sparkles, RefreshCw, Check, X } from "lucide-react";

export type AssistantTarget = "hero" | "announcement" | "promoBanner" | "faq";

export interface AssistantProposal {
  target: AssistantTarget;
  /** Titre principal (hero : H1 ; annonce : message ; bannière : titre ; FAQ : ignoré). */
  title: { fr: string; ar: string };
  /** Texte secondaire. */
  body: { fr: string; ar: string };
  /** Texte du bouton (hero / bannière). */
  cta: { fr: string; ar: string };
  /** FAQ générée (cible faq uniquement). */
  faq?: Array<{ question: { fr: string; ar: string }; answer: { fr: string; ar: string } }>;
}

const TARGET_LABELS: Record<AssistantTarget, string> = {
  hero: "Section Hero",
  announcement: "Barre d'annonce",
  promoBanner: "Bannière promotionnelle",
  faq: "FAQ (3 questions)",
};

function isArabic(text: string): boolean {
  return (text.match(/[\u0600-\u06FF]/g) || []).length > text.replace(/[^\u0600-\u06FF]/g, "").length / 2;
}

/** Mots-clés utiles du prompt (fr + ar), pour personnaliser les gabarits. */
function keywordsOf(prompt: string): string[] {
  const stop = new Set(["le", "la", "les", "de", "des", "du", "un", "une", "et", "pour", "avec", "sur", "en", "au", "aux", "ma", "mon", "mes", "notre", "boutique", "store", "متجر", "محل", "في", "من", "على", "مع", "الى", "إلى"]);
  return prompt
    .split(/[\s,.;:!?()"'«»]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()))
    .slice(0, 6);
}

export function generateProposal(prompt: string, storeName: string, target: AssistantTarget): AssistantProposal {
  const ar = isArabic(prompt);
  const kws = keywordsOf(prompt);
  const main = kws[0] ?? (ar ? "منتجاتنا" : "nos produits");
  const second = kws[1] ?? (ar ? "الجودة" : "la qualité");
  const name = storeName.trim() || (ar ? "متجرنا" : "notre boutique");
  const rnd = Date.now() % 3;

  if (target === "hero") {
    const titles: Array<{ fr: string; ar: string }> = [
      { fr: `${capitalize(main)} de qualité, livrés partout en Algérie`, ar: `${main} بجودة عالية مع التوصيل لكل الجزائر` },
      { fr: `Découvrez ${main} chez ${name}`, ar: `اكتشف ${main} في ${name}` },
      { fr: `${capitalize(main)} — le meilleur choix pour vous`, ar: `${main} — الخيار الأفضل لك` },
    ];
    return {
      target,
      title: titles[rnd],
      body: {
        fr: `Une sélection de ${main} choisis avec soin : ${second}, prix justes et paiement à la livraison.`,
        ar: `تشكيلة مختارة بعناية من ${main}: ${second}، أسعار مناسبة، والدفع عند الاستلام.`,
      },
      cta: { fr: "Acheter maintenant", ar: "اشتر الآن" },
    };
  }
  if (target === "announcement") {
    return {
      target,
      title: {
        fr: `🚚 Livraison rapide — ${capitalize(main)} disponibles chez ${name}`,
        ar: `🚚 توصيل سريع — ${main} متوفرة في ${name}`,
      },
      body: { fr: "Paiement à la livraison, toutes wilayas", ar: "الدفع عند الاستلام، لكل الولايات" },
      cta: { fr: "", ar: "" },
    };
  }
  if (target === "promoBanner") {
    return {
      target,
      title: { fr: `Offres spéciales sur ${main}`, ar: `عروض خاصة على ${main}` },
      body: {
        fr: `Profitez de remises sur une sélection de ${main} — ${second} garantie, quantités limitées.`,
        ar: `استفد من تخفيضات على تشكيلة من ${main} — ${second} مضمونة، الكمية محدودة.`,
      },
      cta: { fr: "Profiter de l'offre", ar: "استفد من العرض" },
    };
  }
  return {
    target: "faq",
    title: { fr: "Questions fréquentes", ar: "أسئلة شائعة" },
    body: { fr: "", ar: "" },
    cta: { fr: "", ar: "" },
    faq: [
      {
        question: { fr: "Comment passer commande ?", ar: "كيف أطلب من المتجر؟" },
        answer: { fr: `Choisissez ${main}, cliquez sur « Commander » et remplissez vos coordonnées. Nous vous appelons pour confirmer.`, ar: `اختر ${main}، اضغط « اطلب » واملأ معلوماتك. سنتصل بك للتأكيد.` },
      },
      {
        question: { fr: "Le paiement est-il à la livraison ?", ar: "هل الدفع عند الاستلام؟" },
        answer: { fr: "Oui, vous payez à la réception. Aucun paiement en ligne n'est demandé.", ar: "نعم، تدفع عند وصول الطلب، دون أي دفع مسبق." },
      },
      {
        question: { fr: "Quels sont les délais de livraison ?", ar: "كم يستغرق التوصيل؟" },
        answer: { fr: "24 à 48 h pour Alger, 2 à 5 jours pour les autres wilayas.", ar: "من 24 إلى 48 ساعة للجزائر العاصمة، ومن 2 إلى 5 أيام لباقي الولايات." },
      },
    ],
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* -------------------------------------------------------------------------- */
/* Panneau Assistant                                                          */
/* -------------------------------------------------------------------------- */

export function AssistantIAPanel({
  storeName,
  onApply,
}: {
  storeName: string;
  onApply: (proposal: AssistantProposal) => void;
}): React.ReactElement {
  const [prompt, setPrompt] = useState("");
  const [target, setTarget] = useState<AssistantTarget>("hero");
  const [proposal, setProposal] = useState<AssistantProposal | null>(null);

  const generate = () => {
    if (prompt.trim().length < 3) return;
    setProposal(generateProposal(prompt, storeName, target));
  };
  const draft = useMemo(() => prompt.trim().length >= 3, [prompt]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" /> Assistant IA
      </h3>
      <p className="text-xs text-neutral-500">
        Décris ta boutique ou ton envie (français ou العربية) — l'assistant propose des textes bilingues.
        <strong className="text-neutral-400"> Rien n'est modifié avant ta validation.</strong>
      </p>

      <div className="p-3 bg-[#1e1e24] border border-neutral-800 rounded-xl space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Ex. boutique de robes d'été pour femme, style moderne, prix abordables… / مثال: متجر فساتين صيفية للنساء…"
          className="w-full bg-[#16161a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TARGET_LABELS) as AssistantTarget[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${target === t ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}
              aria-pressed={target === t}
            >
              {TARGET_LABELS[t]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={!draft}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> Générer une proposition
        </button>
      </div>

      {proposal && (
        <div className="p-3 bg-[#1e1e24] border border-amber-500/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">Proposition — {TARGET_LABELS[proposal.target]}</span>
            <button type="button" onClick={() => setProposal(generateProposal(prompt, storeName, target))} className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white cursor-pointer">
              <RefreshCw className="w-3 h-3" /> Régénérer
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {proposal.title.fr && (
              <div>
                <div className="text-white font-bold" dir="ltr">🇫🇷 {proposal.title.fr}</div>
                <div className="text-white font-bold" dir="rtl">🇩🇿 {proposal.title.ar}</div>
              </div>
            )}
            {proposal.body.fr && (
              <div>
                <div className="text-neutral-300 text-xs" dir="ltr">🇫🇷 {proposal.body.fr}</div>
                <div className="text-neutral-300 text-xs" dir="rtl">🇩🇿 {proposal.body.ar}</div>
              </div>
            )}
            {proposal.cta.fr && (
              <div className="text-xs text-neutral-400">
                Bouton : <span dir="ltr">{proposal.cta.fr}</span> / <span dir="rtl">{proposal.cta.ar}</span>
              </div>
            )}
            {proposal.faq?.map((f, i) => (
              <div key={i} className="p-2 bg-[#16161a] rounded-lg text-xs">
                <div className="font-bold text-white" dir="ltr">Q : {f.question.fr}</div>
                <div className="text-neutral-400" dir="ltr">R : {f.answer.fr}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onApply(proposal); setProposal(null); setPrompt(""); }}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" /> Appliquer à la section
            </button>
            <button type="button" onClick={() => setProposal(null)} className="px-3 py-2 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer" aria-label="Refuser">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-neutral-500">« Appliquer » modifie le brouillon de la section concernée — pense à Enregistrer (Ctrl+S) pour publier.</p>
        </div>
      )}
    </div>
  );
}
