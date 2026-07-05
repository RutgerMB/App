import { Capacitor } from '@capacitor/core'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to .env')
  }
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp()
    // WKWebView (Capacitor iOS): avoid IndexedDB auth persistence hangs
    if (Capacitor.isNativePlatform()) {
      auth = initializeAuth(firebaseApp, { persistence: browserLocalPersistence })
    } else {
      auth = getAuth(firebaseApp)
    }
  }
  return auth
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp()
    // Firestore WebChannel often hangs in Capacitor iOS without long polling
    if (Capacitor.isNativePlatform()) {
      db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true })
    } else {
      db = getFirestore(firebaseApp)
    }
  }
  return db
}
