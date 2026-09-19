const fs = require('fs');

let content = fs.readFileSync('src/pages/Subscription.tsx', 'utf8');

content = content.replace(
  /\/\/ Calculate expiration date\s*const now = new Date\(\);\s*let expiresAt = new Date\(\);\s*if \(selectedDuration === "1m"\) expiresAt\.setMonth\(now\.getMonth\(\) \+ 1\);\s*else if \(selectedDuration === "3m"\) expiresAt\.setMonth\(now\.getMonth\(\) \+ 3\);\s*else if \(selectedDuration === "6m"\) expiresAt\.setMonth\(now\.getMonth\(\) \+ 6\);\s*else if \(selectedDuration === "1y"\) expiresAt\.setFullYear\(now\.getFullYear\(\) \+ 1\);/,
  `// Calculate expiration date by stacking from current if active
      let baseDate = new Date();
      if (tenantData?.planExpiresAt) {
        const currentExp = new Date(tenantData.planExpiresAt);
        if (currentExp > baseDate) {
          baseDate = currentExp;
        }
      }
      
      let expiresAt = new Date(baseDate);
      if (selectedDuration === "1m") expiresAt.setMonth(baseDate.getMonth() + 1);
      else if (selectedDuration === "3m") expiresAt.setMonth(baseDate.getMonth() + 3);
      else if (selectedDuration === "6m") expiresAt.setMonth(baseDate.getMonth() + 6);
      else if (selectedDuration === "1y") expiresAt.setFullYear(baseDate.getFullYear() + 1);`
);

fs.writeFileSync('src/pages/Subscription.tsx', content);
console.log("Subscription updated");
