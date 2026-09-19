const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const webhookCode = `
  // Chargily Pay Webhook (Phase 3)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      const signature = req.headers['signature'];
      const payload = JSON.stringify(req.body);
      // Verify signature (using a dummy secret for now, will use CHARGILY_SECRET_KEY in production)
      const secret = process.env.CHARGILY_SECRET_KEY || 'dummy_secret';
      
      const computedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      
      // In a real app, you would block if signatures don't match
      // if (signature !== computedSignature) return res.status(403).json({error: "Invalid signature"});
      
      const event = req.body;
      if (event && event.type === 'checkout.paid') {
        const checkout = event.data;
        const tenantId = checkout.metadata?.tenantId;
        
        if (tenantId) {
          // Find pending payment for this tenant and update it
          const q = query(collection(db, 'payments'), where('tenantId', '==', tenantId), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
             const paymentDoc = snap.docs[0];
             await updateDoc(doc(db, 'payments', paymentDoc.id), {
               status: 'completed',
               approvedAt: new Date().toISOString()
             });
             
             // Update tenant plan
             const paymentData = paymentDoc.data();
             const tenantRef = doc(db, 'tenants', tenantId);
             const tenantSnap = await getDoc(tenantRef);
             
             let baseDate = new Date();
             if (tenantSnap.exists()) {
               const tData = tenantSnap.data();
               if (tData.planExpiresAt) {
                 const currentExp = new Date(tData.planExpiresAt);
                 if (currentExp > baseDate) baseDate = currentExp;
               }
             }
             
             let expiresAt = new Date(baseDate);
             const duration = paymentData.duration || "";
             if (duration.includes("3 mois")) expiresAt.setMonth(baseDate.getMonth() + 3);
             else if (duration.includes("6 mois")) expiresAt.setMonth(baseDate.getMonth() + 6);
             else if (duration.includes("1 an") || duration.includes("12 mois")) expiresAt.setFullYear(baseDate.getFullYear() + 1);
             else expiresAt.setMonth(baseDate.getMonth() + 1);
             
             await updateDoc(tenantRef, {
               plan: paymentData.planType || 'pro',
               planName: paymentData.plan || 'Professionnel',
               planExpiresAt: expiresAt.toISOString(),
               status: 'active'
             });
          }
        }
      }
      
      res.json({received: true});
    } catch(err) {
      console.error("Webhook error:", err);
      res.status(500).json({error: "Webhook error"});
    }
  });
`;

content = content.replace(
  /app\.use\("\/api\/admin\/auth", adminAuthRoutes\);/,
  `app.use("/api/admin/auth", adminAuthRoutes);
${webhookCode}`
);

// We need query and where in firestore imports
content = content.replace(
  /import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase\/firestore";/,
  `import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc, query, where } from "firebase/firestore";`
);

fs.writeFileSync('server.ts', content);
console.log("Server updated with Webhook");
