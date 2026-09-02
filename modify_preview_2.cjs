const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf-8');

// Insert helpers inside the component
const helperStr = `
  const isActivated = config?.isActivated || false;

  // Helpers to get value based on state
  const getVal = (configVal, fallbackDemo, placeholder = "") => {
    if (!isActivated) return fallbackDemo;
    return configVal || placeholder;
  };
  
  const getBool = (configVal, fallbackDemo) => {
    if (!isActivated) return fallbackDemo;
    return configVal;
  };

  const c_primaryColor = getVal(config?.primaryColor, theme.primaryColor, "#dddddd");
  const c_fontFamily = getVal(config?.fontFamily, "sans", "sans");
  const c_lang = getVal(config?.language, "ar", "ar");
  const isRtl = c_lang === "ar";
  
  // Header
  const c_storeName = getVal(config?.storeName, theme.nameAr || theme.name || "أزياء الموضة", "Nom de la boutique");
  const c_logoUrl = getVal(config?.logoUrl, customLogoUrl || "", "");
  
  // Hero
  const c_heroShow = getBool(config?.showHero, true);
  const c_heroBg = getVal(config?.heroDesktopBg, theme.bannerImage, "");
  const c_heroTitle = getVal(config?.heroTitle, theme.bannerHeadlineAr || theme.bannerHeadline, "Titre principal");
  const c_heroSubtitle = getVal(config?.heroSubtitle, theme.bannerSubheadlineAr || theme.bannerSubheadline, "Description de votre boutique");
  const c_heroBtn = getVal(config?.heroButtonText, theme.bannerCtaAr || "تسوق الآن", "Bouton");
  
  // Announcement
  const c_announcementShow = getBool(config?.showAnnouncement, true);
  const c_announcementBg = getVal(config?.announcementBgColor, theme.primaryColor || "#f59e0b", "#999999");
  const c_announcementText = getVal(config?.announcementText, "التوصيل متوفر لـ 58 ولاية والدفع عند الاستلام 🇩🇿", "Votre message d'annonce");
  const c_announcementTextColor = getVal(config?.announcementTextColor, "#ffffff", "#ffffff");

  // Trust
  const c_trustShow = getBool(config?.showTrustBadges, true);
  
  // Categories
  const c_categoriesShow = getBool(config?.showCategories, true);

  // Featured
  const c_featuredShow = getBool(config?.showFeatured, true);
`;

content = content.replace(
  'const storeName = customStoreName !== undefined ? customStoreName : (theme.nameAr || theme.name || "أزياء الموضة");',
  helperStr
);

// Update announcement bar
content = content.replace(
  /{theme\.primaryColor \|\| "#f59e0b"}/g,
  '{c_announcementBg}'
);
content = content.replace(
  /التوصيل متوفر لـ 58 ولاية والدفع عند الاستلام 🇩🇿/g,
  '{c_announcementText}'
);
content = content.replace(
  /ضمان استبدال وإرجاع مجاني لمدة 7 أيام/g,
  '{isActivated ? "" : "ضمان استبدال وإرجاع مجاني لمدة 7 أيام"}'
);

// Hide announcement if false
content = content.replace(
  /<div\s+className="text-white text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-3 font-medium transition-colors shadow-sm"/,
  '{c_announcementShow && (<div className="text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-3 font-medium transition-colors shadow-sm" style={{ backgroundColor: c_announcementBg, color: c_announcementTextColor }}'
);
content = content.replace(
  /<\/span>\s*<\/div>\s*\{\/\* Main Store Header \*\/\}/,
  '</span></div>)}\n\n      {/* Main Store Header */}'
);

// Update Header Store Name
content = content.replace(
  /\{storeName\}/g,
  '{c_storeName}'
);

// Update Logo
content = content.replace(
  /\{customLogoUrl \? \(/g,
  '{c_logoUrl ? ('
);
content = content.replace(
  /src=\{customLogoUrl\}/g,
  'src={c_logoUrl}'
);

// Conditional hero
content = content.replace(
  /<EditableSection id="hero_banner">/,
  '{c_heroShow && <EditableSection id="hero_banner">'
);
content = content.replace(
  /<\/section><\/EditableSection>\s*\{\/\* Trust Badges \*\/\}/,
  '</section></EditableSection>}\n\n      {/* Trust Badges */}'
);

// Update hero background
content = content.replace(
  /const hasBg = !!theme\.bannerImage;/,
  'const hasBg = !!c_heroBg;'
);
content = content.replace(
  /backgroundImage: theme\.bannerImage \? `url\(\$\{theme\.bannerImage\}\)` : undefined/,
  'backgroundImage: c_heroBg ? `url(${c_heroBg})` : undefined, backgroundColor: hasBg ? undefined : (isActivated ? "#e5e5e5" : undefined)'
);
content = content.replace(
  /\{hasBg && \(\s*<div className="absolute inset-0 bg-black\/50"\s*\/>\s*\)\}/,
  '{hasBg && (<div className="absolute inset-0 bg-black/50" />)}'
);

// Update hero text
content = content.replace(
  /\{theme\.bannerHeadlineAr \|\| theme\.bannerHeadline\}/g,
  '{c_heroTitle}'
);
content = content.replace(
  /\{theme\.bannerSubheadlineAr \|\| theme\.bannerSubheadline\}/g,
  '{c_heroSubtitle}'
);
content = content.replace(
  /\{theme\.bannerCtaAr \|\| "تسوق الآن"\}/g,
  '{c_heroBtn}'
);

// Update categories conditional
content = content.replace(
  /<EditableSection id="categories">/,
  '{c_categoriesShow && <EditableSection id="categories">'
);
content = content.replace(
  /<\/section><\/EditableSection>\s*\{\/\* Featured Product/,
  '</section></EditableSection>}\n\n      {/* Featured Product'
);

// Update featured conditional
content = content.replace(
  /<EditableSection id="featured">/,
  '{c_featuredShow && <EditableSection id="featured">'
);
content = content.replace(
  /<\/section><\/EditableSection>\s*\{\/\* All Products/,
  '</section></EditableSection>}\n\n      {/* All Products'
);

// Update trust conditional
content = content.replace(
  /<EditableSection id="trust">/,
  '{c_trustShow && <EditableSection id="trust">'
);
content = content.replace(
  /<\/section><\/EditableSection>\s*\{\/\* Categories/,
  '</section></EditableSection>}\n\n      {/* Categories'
);

// Make categories placeholders
content = content.replace(
  /src=\{cat\.image\}/g,
  'src={isActivated ? "" : cat.image}'
);
content = content.replace(
  /alt=\{cat\.nameAr\}/g,
  'alt={cat.nameAr} className={isActivated && !cat.image ? "bg-neutral-200" : ""}'
);

// Update RTL/LTR
content = content.replace(
  /dir="rtl"/,
  'dir={isRtl ? "rtl" : "ltr"}'
);

// Make products placeholders
content = content.replace(
  /src=\{product\.image\}/g,
  'src={isActivated ? "" : product.image} className={isActivated ? "bg-neutral-200 w-full h-full object-cover" : "w-full h-full object-cover"}'
);


fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
