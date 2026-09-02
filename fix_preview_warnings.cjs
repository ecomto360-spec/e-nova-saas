const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf-8');

// Fix Announcement duplicate style
content = content.replace(
  'style={{ backgroundColor: c_announcementBg, color: c_announcementTextColor }}\n          style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}',
  'style={{ backgroundColor: c_announcementBg, color: c_announcementTextColor }}'
);

// Fix Cat image duplicate className
content = content.replace(
  'className={isActivated && !cat.image ? "bg-neutral-200" : ""} \n                  className="w-full h-full object-cover object-center"',
  'className={`w-full h-full object-cover object-center ${isActivated && !cat.image ? "bg-neutral-200" : ""}`}'
);

// Fix Product image duplicate className (featured)
content = content.replace(
  'className={isActivated ? "bg-neutral-200 w-full h-full object-cover" : "w-full h-full object-cover"} \n                      alt={product.nameAr || product.name} \n                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"',
  'alt={product.nameAr || product.name}\n                      className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${isActivated ? "bg-neutral-200" : ""}`}'
);

// Fix Product image duplicate className (all products)
content = content.replace(
  'className={isActivated ? "bg-neutral-200 w-full h-full object-cover" : "w-full h-full object-cover"} \n                    alt={product.nameAr || product.name} \n                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"',
  'alt={product.nameAr || product.name}\n                    className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${isActivated ? "bg-neutral-200" : ""}`}'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
