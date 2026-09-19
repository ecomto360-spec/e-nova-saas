const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

// Add states
if (!content.includes('const [orderId, setOrderId] = useState')) {
  content = content.replace(
    'const [orderSuccess, setOrderSuccess] = useState(false);',
    'const [orderSuccess, setOrderSuccess] = useState(false);\n  const [orderId, setOrderId] = useState("");\n  const [trackingView, setTrackingView] = useState(false);'
  );
}

// Modify handleOrderSubmit
const oldSubmit = `  const handleOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSuccess(true);
      setCartCount(prev => prev + 1);
    }, 800);
  };`;

const newSubmit = `  const handleOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderId(\`ORD-\${Math.floor(Math.random() * 90000) + 10000}-20260908-\${Math.random().toString(16).substring(2, 10).toUpperCase()}\`);
      setOrderSuccess(true);
      setCartCount(prev => prev + 1);
    }, 800);
  };`;

if (content.includes(oldSubmit)) {
   content = content.replace(oldSubmit, newSubmit);
}

// Ensure reset clears tracking
const oldClose = `    setSelectedVariants(initialVariants);
    setQuantity(1);
    setOrderSuccess(false);
  };`;
const newClose = `    setSelectedVariants(initialVariants);
    setQuantity(1);
    setOrderSuccess(false);
    setTrackingView(false);
  };`;
if (content.includes(oldClose)) {
   content = content.replace(oldClose, newClose);
}

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
console.log("Updated states");
