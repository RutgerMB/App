import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let adminApp: App | null = null
let adminAuth: Auth | null = null

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_PROJECT_ID
  )
}

export function getFirebaseAdminAuth(): Auth | null {
  if (!isFirebaseAdminConfigured()) return null
  if (adminAuth) return adminAuth

  if (getApps().length === 0) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (json) {
      const serviceAccount = JSON.parse(json)
      adminApp = initializeApp({ credential: cert(serviceAccount) })
    } else if (process.env.FIREBASE_PROJECT_ID) {
      adminApp = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })
    } else {
      adminApp = initializeApp()
    }
  }

  adminAuth = getAuth(adminApp ?? getApps()[0])
  return adminAuth
}

export async function verifyFirebaseIdToken(
  token: string
): Promise<{ uid: string; email: string } | null> {
  const auth = getFirebaseAdminAuth()
  if (!auth) return null
  try {
    const decoded = await auth.verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
    }
  } catch {
    return null
  }
}
