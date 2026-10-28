import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// Configuration Firebase intégrée en dur (copie conforme de firebase-applet-config.json).
// Obligatoire pour le serverless Vercel : dans la fonction api/, le bundle
// n'a pas accès au fichier JSON via process.cwd(). Le fichier firebase-applet-config.json
// reste utilisé côté client (src/lib/firebase.ts). Penser à synchroniser les deux.
// Projet : e-nova-119f6 (nouveau projet Firebase, l'ancien gen-lang-client étant suspendu).
const firebaseConfig = {
  projectId: "e-nova-119f6",
  appId: "1:795929637617:web:02d543cbd8b4dcea04af50",
  apiKey: "AIzaSyAPba-JHcnm3oJhfOK49UIliaif4d346Is",
  authDomain: "e-nova-119f6.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "e-nova-119f6.firebasestorage.app",
  messagingSenderId: "795929637617",
  measurementId: "G-P72KWQ5N5E",
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
