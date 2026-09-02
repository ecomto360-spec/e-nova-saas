const fs = require('fs');

// 1. Update VariantManager.tsx
let vm = fs.readFileSync('src/components/admin/VariantManager.tsx', 'utf8');

vm = vm.replace(
  'interface VariantManagerProps {',
  `interface VariantManagerProps {
  onAddProductImage?: (image: string) => void;`
);

vm = vm.replace(
  'export function VariantManager({ variants, onChange, productImages = [] }: VariantManagerProps) {',
  'export function VariantManager({ variants, onChange, productImages = [], onAddProductImage }: VariantManagerProps) {'
);

const uploadOld = `    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateOption(imageModalOpen.gIdx, imageModalOpen.oIdx, { image: base64 });
    };`;

const uploadNew = `    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateOption(imageModalOpen.gIdx, imageModalOpen.oIdx, { image: base64 });
      if (onAddProductImage) onAddProductImage(base64);
      setImageModalOpen(null);
    };`;
vm = vm.replace(uploadOld, uploadNew);

fs.writeFileSync('src/components/admin/VariantManager.tsx', vm);

// 2. Update Products.tsx
let prod = fs.readFileSync('src/pages/Products.tsx', 'utf8');
prod = prod.replace(
  '<VariantManager variants={formVariants} onChange={setFormVariants} productImages={formImages} />',
  '<VariantManager variants={formVariants} onChange={setFormVariants} productImages={formImages} onAddProductImage={(img) => setFormImages(prev => [...prev, img])} />'
);
fs.writeFileSync('src/pages/Products.tsx', prod);

console.log("Updated both");
