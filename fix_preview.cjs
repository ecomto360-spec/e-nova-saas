const fs = require('fs');

let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf-8');

// Fix featured products syntax error
content = content.replace(
  '{featuredProducts.length > 0 && (\n          {c_featuredShow && <EditableSection id="featured">',
  '{featuredProducts.length > 0 && c_featuredShow && (\n          <EditableSection id="featured">'
);

// Fix categories syntax error
content = content.replace(
  '{theme.categories && theme.categories.length > 0 && (\n        {c_categoriesShow && <EditableSection id="categories">',
  '{theme.categories && theme.categories.length > 0 && c_categoriesShow && (\n        <EditableSection id="categories">'
);

// Fix trust badges syntax error (if any)
// It was probably not inside a condition, let's check
content = content.replace(
  '{c_trustShow && <EditableSection id="trust">',
  '{c_trustShow && (\n<EditableSection id="trust">'
);
content = content.replace(
  '</section></EditableSection>}\n\n      {/* Categories',
  '</section></EditableSection>\n)}\n\n      {/* Categories'
);

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
