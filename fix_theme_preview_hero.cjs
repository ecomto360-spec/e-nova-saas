const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

content = content.replace(
  /src=\{theme\.bannerImage \|\| "https:\/\/images\.unsplash\.com\/photo-1441986300917-64674bd600d8\?w=1600&q=80"\}/g,
  `src={c_heroBg || (isActivated ? undefined : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80")}`
);

content = content.replace(
  /\{theme\.bannerHeadlineAr \|\| "أزياء عصرية لكل المناسبات"\}/g,
  `{c_heroTitle || (isActivated ? "" : "أزياء عصرية لكل المناسبات")}`
);

content = content.replace(
  /\{theme\.bannerSubheadlineAr \|\| "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة وجودة عالية مع توصيل سريع لجميع الولايات\."\}/g,
  `{c_heroSubtitle || (isActivated ? "" : "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة وجودة عالية مع توصيل سريع لجميع الولايات.")}`
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
console.log("Fixed ThemeStorePreview variables in Hero block");
