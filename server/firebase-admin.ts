import { existsSync } from 'node:fs'
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let adminApp: App | null = null
let adminAuth: Auth | null = null
let adminInitFailed = false

function credentialsFileExists(): boolean {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  return Boolean(path && existsSync(path))
}

/** True when we have usable Admin credentials (not just a project id env var). */
export function isFirebaseAdminConfigured(): boolean {
  if (adminInitFailed) return false
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return true
  if (credentialsFileExists()) return true
  // ADC / GCP only — project id alone cannot verify ID tokens locally
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT && !process.env.GOOGLE_APPLICATION_CREDENTIALS)
}

export function getFirebaseAdminAuth(): Auth | null {
  if (!isFirebaseAdminConfigured()) return null
  if (adminAuth) return adminAuth
  if (adminInitFailed) return null

  try {
    if (getApps().length === 0) {
      const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      if (json) {
        const serviceAccount = JSON.parse(json)
        adminApp = initializeApp({ credential: cert(serviceAccount) })
      } else if (credentialsFileExists()) {
        adminApp = initializeApp()
      } else {
        adminApp = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })
      }
    }

    adminAuth = getAuth(adminApp ?? getApps()[0])
    return adminAuth
  } catch (err) {
    adminInitFailed = true
    console.warn(
      'Firebase Admin failed to initialize — Firebase ID tokens will not verify:',
      err instanceof Error ? err.message : err
    )
    return null
  }
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

/** Heuristic: Firebase ID tokens are JWTs with three segments (not our short JWT shape check). */
export function looksLikeFirebaseIdToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      aud?: string
      iss?: string
      user_id?: string
      sub?: string
    }
    return Boolean(
      payload.user_id ||
        (typeof payload.iss === 'string' && payload.iss.includes('securetoken.google.com'))
    )
  } catch {
    return false
  }
}
