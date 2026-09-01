const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Add formImages state
code = code.replace(
  'const [formImage, setFormImage] = useState("");',
  'const [formImages, setFormImages] = useState<string[]>([]);'
);

// 2. Change image init in handleEditProduct
code = code.replace(
  'setFormImage(product.image || "");',
  'setFormImages(product.images || (product.image ? [product.image] : []));'
);

// 3. Clear images in create product form init
code = code.replace(
  'setFormImage("");',
  'setFormImages([]);'
);

// 4. Update the handleImageFileChange logic to append to formImages
code = code.replace(
  /const handleImageFileChange = \[\.\.\.\]/, // This might be complex, I'll just rewrite the function
  ""
);

fs.writeFileSync('src/pages/Products.tsx', code);
