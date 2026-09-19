const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /\/\/ 2\. Update tenant doc\s*const now = new Date\(\);\s*let expiresAt = new Date\(\);\s*if \(payment\.duration\.includes\("3 mois"\)\) expiresAt\.setMonth\(now\.getMonth\(\) \+ 3\);\s*else if \(payment\.duration\.includes\("6 mois"\)\) expiresAt\.setMonth\(now\.getMonth\(\) \+ 6\);\s*else if \(payment\.duration\.includes\("1 an"\)\) expiresAt\.setFullYear\(now\.getFullYear\(\) \+ 1\);\s*else expiresAt\.setMonth\(now\.getMonth\(\) \+ 1\);/,
  `// 2. Fetch current tenant data to stack renewal
      const tenantRef = doc(db, 'tenants', payment.tenantId);
      const tenantSnap = await getDoc(tenantRef);
      
      let baseDate = new Date();
      if (tenantSnap.exists()) {
        const tData = tenantSnap.data();
        if (tData.planExpiresAt) {
          const currentExp = new Date(tData.planExpiresAt);
          if (currentExp > baseDate) {
            baseDate = currentExp; // Stack from current expiration
          }
        }
      }
      
      let expiresAt = new Date(baseDate);
      if (payment.duration.includes("3 mois")) expiresAt.setMonth(baseDate.getMonth() + 3);
      else if (payment.duration.includes("6 mois")) expiresAt.setMonth(baseDate.getMonth() + 6);
      else if (payment.duration.includes("1 an") || payment.duration.includes("12 mois")) expiresAt.setFullYear(baseDate.getFullYear() + 1);
      else expiresAt.setMonth(baseDate.getMonth() + 1);`
);

content = content.replace(
  /import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase\/firestore';/,
  `import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';`
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
console.log("AdminDashboard updated");
