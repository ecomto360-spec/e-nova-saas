const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const target = `  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    return (selectedProduct.price * quantity) + deliveryPrice;
  }, [selectedProduct, quantity, deliveryPrice]);`;

const replacement = `  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    
    // Calculate variant price differences
    let variantPriceDiff = 0;
    if (selectedProduct.variants && Object.keys(selectedVariants).length > 0) {
      selectedProduct.variants.forEach(v => {
        const selectedValue = selectedVariants[v.name];
        if (selectedValue) {
          const optMatch = v.options.find(o => typeof o === 'string' ? o === selectedValue : o.value === selectedValue);
          if (optMatch && typeof optMatch !== 'string' && optMatch.priceDiff) {
            variantPriceDiff += optMatch.priceDiff;
          }
        }
      });
    }

    return ((selectedProduct.price + variantPriceDiff) * quantity) + deliveryPrice;
  }, [selectedProduct, quantity, deliveryPrice, selectedVariants]);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Total price calculation updated!");
