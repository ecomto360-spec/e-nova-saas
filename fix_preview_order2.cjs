const fs = require('fs');

let lpCode = fs.readFileSync('src/pages/LandingPages.tsx', 'utf8');

const newOnOrderPlaced1 = `onOrderPlaced={async (orderData: any) => {
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
  /onOrderPlaced=\{\(orderData\) => \{\s*showToast\(\`🎉 Simulation de commande reçue : \$\{orderData\.fullName\} \(\$\{orderData\.phone\}\) !`\);\s*\}\}/,
  newOnOrderPlaced1
);

fs.writeFileSync('src/pages/LandingPages.tsx', lpCode);
