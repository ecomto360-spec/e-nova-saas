const fs = require('fs');

// Update LandingPages.tsx
let lpCode = fs.readFileSync('src/pages/LandingPages.tsx', 'utf8');

// Update savePagesToFirestore
lpCode = lpCode.replace(
  /const savePagesToFirestore = async \(newPages: LandingPage\[\]\) => \{[\s\S]*?\}\s*catch \(err\) \{/,
  `const savePagesToFirestore = async (newPages: LandingPage[]) => {
    setPages(newPages);
    if (!user) return;
    try {
      const tenantRef = doc(db, "tenants", user.uid);
      const batch = writeBatch(db);
      
      // Update tenant timestamp
      batch.update(tenantRef, { updatedAt: new Date().toISOString() });
      
      // Add all pages to batch
      for (const p of newPages) {
        const pageRef = doc(db, "tenants", user.uid, "landingPages", p.id);
        batch.set(pageRef, p);
      }
      
      // Delete any pages that were removed
      const currentIds = newPages.map(p => p.id);
      const snapshot = await getDocs(collection(db, "tenants", user.uid, "landingPages"));
      snapshot.docs.forEach(docSnap => {
        if (!currentIds.includes(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });
      
      await batch.commit();
    } catch (err) {`
);

// We need writeBatch, collection, getDocs, setDoc, deleteField
lpCode = lpCode.replace(
  'import { doc, onSnapshot, updateDoc } from "firebase/firestore";',
  'import { doc, onSnapshot, updateDoc, collection, getDocs, writeBatch, setDoc, deleteField } from "firebase/firestore";'
);

// Update load logic
const loadMatch = /if \(data\.landingPages && Array\.isArray\(data\.landingPages\)\) \{[\s\S]*?\} else \{/;
if (lpCode.match(loadMatch)) {
  const newLoad = `const landingPagesRef = collection(db, "tenants", user.uid, "landingPages");
        const pagesSnap = await getDocs(landingPagesRef);
        
        if (!pagesSnap.empty) {
          const loadedPages = pagesSnap.docs.map(d => d.data() as LandingPage);
          // Sort by creation date descending (assuming id contains timestamp or use createdAt)
          loadedPages.sort((a, b) => b.id.localeCompare(a.id));
          setPages(loadedPages);
        } else if (data.landingPages && Array.isArray(data.landingPages)) {
          // Migration from old array to subcollection
          const batch = writeBatch(db);
          data.landingPages.forEach((p: LandingPage) => {
            const pageRef = doc(db, "tenants", user.uid, "landingPages", p.id);
            batch.set(pageRef, p);
          });
          batch.update(tenantRef, { landingPages: deleteField() });
          await batch.commit();
          setPages(data.landingPages);
        } else {`;
  lpCode = lpCode.replace(loadMatch, newLoad);
}

fs.writeFileSync('src/pages/LandingPages.tsx', lpCode);


// Update LandingPagePublicView.tsx
let pubCode = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

const findMatch = /for \(const tenantDoc of tenantsSnap\.docs\) \{[\s\S]*?if \(match\) \{[\s\S]*?break;\n\s*\}\n\s*\}\n\s*\}/;
if (pubCode.match(findMatch)) {
  const newFind = `for (const tenantDoc of tenantsSnap.docs) {
          const tData = tenantDoc.data();
          
          // First check subcollection
          const pagesSnap = await getDocs(collection(db, "tenants", tenantDoc.id, "landingPages"));
          const match = pagesSnap.docs.map(d => d.data() as LandingPage).find(p => p.slug === slug || p.id === slug);
          
          if (match) {
            foundPage = match;
            foundTenantId = tenantDoc.id;
            setIsExpired(isTenantExpired(tData));
            break;
          }
          
          // Fallback to array for backward compatibility
          if (!match && tData.landingPages && Array.isArray(tData.landingPages)) {
            const arrMatch = tData.landingPages.find((p: LandingPage) => p.slug === slug || p.id === slug);
            if (arrMatch) {
              foundPage = arrMatch;
              foundTenantId = tenantDoc.id;
              setIsExpired(isTenantExpired(tData));
              break;
            }
          }
        }`;
  pubCode = pubCode.replace(findMatch, newFind);
}

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', pubCode);

