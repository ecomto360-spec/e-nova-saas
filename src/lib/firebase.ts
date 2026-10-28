/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import rawConfig from "../../firebase-applet-config.json";

const metaEnv = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || rawConfig.apiKey || "COLLER_ICI",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || "e-nova-119f6.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || "e-nova-119f6",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || "e-nova-119f6.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || "COLLER_ICI",
  appId: metaEnv.VITE_FIREBASE_APP_ID || rawConfig.appId || "COLLER_ICI",
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId || "(default)"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore with forced long polling for iframe/sandbox reliability
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });

export const storage = getStorage(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});
