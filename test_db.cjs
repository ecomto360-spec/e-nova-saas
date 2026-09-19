const admin = require('firebase-admin');
const fs = require('fs');

if (fs.existsSync('./firebase-applet-config.json')) {
  const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  async function checkSize() {
    const db = admin.firestore();
    const snap = await db.collection('tenants').get();
    snap.docs.forEach(doc => {
      const data = doc.data();
      const pages = data.landingPages || [];
      const json = JSON.stringify(pages);
      console.log(`Tenant ${doc.id}: ${pages.length} pages, size: ${(json.length / 1024).toFixed(2)} KB`);
    });
  }
  checkSize();
}
