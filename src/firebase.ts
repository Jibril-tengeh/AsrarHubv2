import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCBVhSydPvMiiX9QJNkt2n3rbrxyjzuzeU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "asrarhub-v2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "asrarhub-v2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "asrarhub-v2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "971931000572",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:971931000572:web:43583c670b363a172b0179"
};

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)";
export const db = getFirestore(app, firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth(app);

export const signInGuest = async () => {
  try {
    await signInAnonymously(auth);
    return true;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    return false;
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
    } else {
      throw error;
    }
  }
};
