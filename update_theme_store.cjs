const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

if (!content.includes('tenantId?: string;')) {
  content = content.replace(
    'initialProductId?: string;',
    'initialProductId?: string;\n  tenantId?: string;'
  );
}

if (!content.includes('tenantId }')) {
  content = content.replace(
    'actualCategories, currentView = "home", onSectionSelect, initialProductId }: ThemeStorePreviewProps) {',
    'actualCategories, currentView = "home", onSectionSelect, initialProductId, tenantId }: ThemeStorePreviewProps) {'
  );
}

// Ensure Firebase imports
if (!content.includes('addDoc,')) {
  content = content.replace(
    'import React, { useState, useMemo, FormEvent, useEffect } from "react";',
    'import React, { useState, useMemo, FormEvent, useEffect } from "react";\nimport { collection, addDoc, serverTimestamp } from "firebase/firestore";\nimport { db } from "../../lib/firebase";'
  );
}

// Modify handleOrderSubmit
const oldSubmit = `  const handleOrderSubmit = (e: FormEvent) => {
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

const newSubmit = `  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    setIsSubmitting(true);
    
    try {
      const generatedOrderId = \`ORD-\${Math.floor(Math.random() * 90000) + 10000}-20260908-\${Math.random().toString(16).substring(2, 10).toUpperCase()}\`;
      
      if (tenantId) {
        // Save to real database
        const orderData = {
          orderNumber: generatedOrderId.substring(4, 10), // Short number for dashboard display
          reference: generatedOrderId,
          userId: tenantId,
          client: customerName,
          phone: customerPhone,
          wilaya: currentWilaya.name,
          commune: commune || "",
          address: deliveryType === "home" ? "Livraison à domicile" : "Point de relais",
          itemsSummary: \`\${quantity}x \${selectedProduct.nameAr || selectedProduct.name}\`,
          total: totalPrice,
          status: "En attente",
          date: new Date().toLocaleDateString('fr-CA').replace(/-/g, '/'),
          createdAt: serverTimestamp(),
          items: [{
            productId: selectedProduct.id,
            name: selectedProduct.nameAr || selectedProduct.name,
            price: selectedProduct.price,
            quantity: quantity,
            variants: selectedVariants
          }],
          shippingMethod: deliveryType === "home" ? "Livraison à domicile" : "Point de relais",
          shippingCost: currentWilaya.deliveryCost,
        };
        
        await addDoc(collection(db, "orders"), orderData);
        // Also save to tenant subcollection to ensure compatibility
        await addDoc(collection(db, "tenants", tenantId, "orders"), orderData);
      }
      
      setOrderId(generatedOrderId);
      setOrderSuccess(true);
      setCartCount(prev => prev + 1);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Une erreur est survenue lors de la confirmation de votre commande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };`;

if (content.includes(oldSubmit)) {
   content = content.replace(oldSubmit, newSubmit);
}

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
