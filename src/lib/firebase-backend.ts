import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// Configuration Firebase intégrée en dur (copie conforme de firebase-applet-config.json).
// Obligatoire pour le serverless Vercel : dans la fonction api/[...path].ts, le bundle
// n'a pas accès au fichier JSON via process.cwd(). Le fichier firebase-applet-config.json
// reste utilisé côté client (src/lib/firebase.ts). Penser à synchroniser les deux si besoin.
const firebaseConfig = {
  projectId: "gen-lang-client-0686340569",
  appId: "1:949317596065:web:3218c506c00bbfaddb11e0",
  apiKey: "AIzaSyD0VgLiJIrghBO3_yPu92q4mnAg0JTsbco",
  authDomain: "gen-lang-client-0686340569.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-enova-f2d71f7e-58e8-4083-985b-40a7a193ad0c",
  storageBucket: "gen-lang-client-0686340569.firebasestorage.app",
  messagingSenderId: "949317596069",
  measurementId: "",
  oAuthClientId: "949317596069-mdoonfovjad5v0p83536l5neujif1lnm.apps.googleusercontent.com",
  recaptchaSiteKey: "",
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
