const fs = require('fs');

const path = 'src/lib/firebase.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove the experimentalForceLongPolling, which might be causing the 10-second timeout if long polling is malfunctioning,
// and replace it with default behavior (WebSockets, falling back to long polling automatically).
content = content.replace(
  /export const db = initializeFirestore\(\s*app,\s*\{\s*experimentalForceLongPolling:\s*true,?\s*\},\s*firebaseConfig\.firestoreDatabaseId\s*\);/g,
  'export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);'
);

fs.writeFileSync(path, content);
console.log("Updated firebase.ts");
