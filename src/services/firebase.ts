import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let db: ReturnType<typeof getFirestore> | null = null

export function initFirebase() {
  if (db) return db
  // only initialize when env vars are present (tests and local fallback expect null)
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return null
  try {
    const app = initializeApp(firebaseConfig as any)
    db = getFirestore(app)
    return db
  } catch (e) {
    console.warn('Firebase init failed, falling back to localStorage', e)
    return null
  }
}

export { db }
