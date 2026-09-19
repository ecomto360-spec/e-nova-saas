const fs = require('fs');
let content = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

// H1 adjustments (26-28px, font-bold)
content = content.replace(
  /<h1 className="text-3xl md:text-4xl font-black text-neutral-900 leading-tight mb-4 tracking-tight">/g,
  '<h1 className="text-[26px] md:text-[28px] font-bold text-neutral-900 leading-tight mb-4 tracking-tight">'
);

// H2 adjustments (20-22px, font-bold)
content = content.replace(
  /className="text-2xl font-black text-neutral-900/g,
  'className="text-[20px] md:text-[22px] font-bold text-neutral-900'
);

// H3 Form Title adjustments (20-22px, font-bold)
// Handled by the generic 2xl font-black replace above, but let's be sure.
// Wait, the form title is: <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
// So the above regex caught it. Excellent.

// H4 Success Title adjustments (24px, font-bold)
content = content.replace(
  /className="text-3xl font-black text-neutral-900/g,
  'className="text-[24px] font-bold text-neutral-900'
);

// Top Banner (increase from 11px to 12-13px)
content = content.replace(
  /text-\[11px\] font-bold tracking-wider py-2\.5/g,
  'text-[12px] md:text-[13px] font-bold tracking-wider py-2.5'
);

// Promo Badge on image (-30% Promo)
content = content.replace(
  /text-xs font-black uppercase tracking-widest px-3 py-1\.5/g,
  'text-[12px] font-bold uppercase tracking-widest px-3 py-1.5'
);

// Replace all remaining font-black with font-bold globally
content = content.replace(/font-black/g, 'font-bold');

// Bundle badges (Le plus vendu, Livraison Offerte) (were text-[10px], increase to 12px)
content = content.replace(
  /text-\[10px\] font-bold uppercase px-2 py-1/g,
  'text-[12px] font-bold uppercase px-2 py-1'
);

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', content);
