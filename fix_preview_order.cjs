const fs = require('fs');

let pubCode = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

pubCode = pubCode.replace(
  'const refNumber = `CMD-${Date.now().toString().slice(-6)}`;\n    setOrderReference(refNumber);\n\n    try {',
  `const refNumber = \`CMD-\${Date.now().toString().slice(-6)}\`;
    setOrderReference(refNumber);

    if (isPreview && onOrderPlaced) {
      onOrderPlaced({ fullName, phone, total: grandTotal, bundle: selectedBundleId, refNumber, wilaya: curWilaya.name, address, deliveryType, quantity, productName: page.product?.name || page.title, itemsTotal, deliveryFee });
      setOrderSuccess(true);
      return;
    }

    try {`
);

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', pubCode);

let lpCode = fs.readFileSync('src/pages/LandingPages.tsx', 'utf8');

const importReplacement = `import { doc, onSnapshot, updateDoc, collection, getDocs, writeBatch, setDoc, deleteField, addDoc } from "firebase/firestore";`;
lpCode = lpCode.replace(/import \{ doc, onSnapshot.*?\} from "firebase\/firestore";/, importReplacement);

const newOnOrderPlaced1 = `onOrderPlaced={async (orderData) => {
                    showToast(\`🎉 Simulation de commande reçue : \${orderData.fullName} (\${orderData.phone}) !\`);
                    if (user) {
                      try {
                        await addDoc(collection(db, "tenants", user.uid, "orders"), {
                          orderNumber: orderData.refNumber,
                          customerName: orderData.fullName,
                          customerPhone: orderData.phone,
                          wilaya: orderData.wilaya,
                          address: orderData.address || "Adresse de test",
                          deliveryType: orderData.deliveryType,
                          quantity: orderData.quantity,
                          productName: orderData.productName,
                          itemsTotal: orderData.itemsTotal,
                          deliveryFee: orderData.deliveryFee,
                          total: orderData.total,
                          status: "pending",
                          source: \`Aperçu Landing Page\`,
                          createdAt: new Date().toISOString()
                        });
                      } catch(e) { console.error(e); }
                    }
                  }}`;

lpCode = lpCode.replace(
  /onOrderPlaced=\{\(orderData\) => \{\s*showToast\([^)]+\);\s*\}\}/,
  newOnOrderPlaced1
);

const newOnOrderPlaced2 = `onOrderPlaced={async (orderData) => {
                  showToast(\`Commande test validée pour \${orderData.fullName} !\`);
                  if (user) {
                      try {
                        await addDoc(collection(db, "tenants", user.uid, "orders"), {
                          orderNumber: orderData.refNumber,
                          customerName: orderData.fullName,
                          customerPhone: orderData.phone,
                          wilaya: orderData.wilaya,
                          address: orderData.address || "Adresse de test",
                          deliveryType: orderData.deliveryType,
                          quantity: orderData.quantity,
                          productName: orderData.productName,
                          itemsTotal: orderData.itemsTotal,
                          deliveryFee: orderData.deliveryFee,
                          total: orderData.total,
                          status: "pending",
                          source: \`Aperçu IA\`,
                          createdAt: new Date().toISOString()
                        });
                      } catch(e) { console.error(e); }
                    }
                }}`;

lpCode = lpCode.replace(
  /onOrderPlaced=\{\(order\) => \{\s*showToast\([^)]+\);\s*\}\}/,
  newOnOrderPlaced2
);

fs.writeFileSync('src/pages/LandingPages.tsx', lpCode);
