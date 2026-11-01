import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
// Import STATIQUE de la configuration : embarquée dans le bundle au build,
// donc toujours disponible dans la fonction Vercel (une lecture dynamique
// via fs.readFileSync/process.cwd() n'est pas tracée par le packaging et
// la config serait absente dans le lambda).
import bundledRawConfig from '../../firebase-applet-config.json';

let rawConfig: any = bundledRawConfig ?? {};
// Fallback : si un fichier local existe (dev), il prime (sans crash sinon).
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Failed to load firebase-applet-config.json:', e);
}

export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || rawConfig.apiKey || "COLLER_ICI",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || "e-nova-119f6.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || "e-nova-119f6",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || "e-nova-119f6.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || "COLLER_ICI",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || rawConfig.appId || "COLLER_ICI",
  firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId || "(default)"
};

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
  ? initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    )
  : initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      }
    );
