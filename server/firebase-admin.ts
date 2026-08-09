import { existsSync } from 'node:fs'
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let adminApp: App | null = null
let adminAuth: Auth | null = null
let adminFirestore: Firestore | null = null
let adminInitFailed = false

function credentialsFileExists(): boolean {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  return Boolean(path && existsSync(path))
}

/**
 * Parse FIREBASE_SERVICE_ACCOUNT_JSON from Railway/env.
 * Accepts raw JSON, or base64-encoded JSON (recommended on Railway).
 */
export function parseServiceAccountJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is empty')
  }

  // Common mistake: project id like "replock-7b9ac" instead of the service-account JSON file
  if (!trimmed.startsWith('{') && !trimmed.includes(' ')) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON looks like a project id, not a service-account key. ' +
        'In Firebase Console → Project settings → Service accounts → Generate new private key, ' +
        'then paste the full JSON (or base64-encode that JSON) into Railway.'
    )
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    // Railway often mangles multiline JSON — allow base64
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim()
      return JSON.parse(decoded) as Record<string, unknown>
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full service-account JSON, ' +
          'or set it to base64 of that file (openssl base64 -A -in key.json).'
      )
    }
  }
}

/** True when we have usable Admin credentials (not just a project id env var). */
export function isFirebaseAdminConfigured(): boolean {
  if (adminInitFailed) return false
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return true
  if (credentialsFileExists()) return true
  // ADC / GCP only — project id alone cannot verify ID tokens locally
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT && !process.env.GOOGLE_APPLICATION_CREDENTIALS)
}

function ensureFirebaseAdminApp(): App | null {
  if (!isFirebaseAdminConfigured()) return null
  if (adminInitFailed) return null

  try {
    if (getApps().length === 0) {
      const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
      if (json) {
        const serviceAccount = parseServiceAccountJson(json)
        adminApp = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) })
      } else if (credentialsFileExists()) {
        adminApp = initializeApp()
      } else {
        adminApp = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })
      }
    }

    return adminApp ?? getApps()[0]
  } catch (err) {
    adminInitFailed = true
    console.warn(
      'Firebase Admin failed to initialize — Firebase ID tokens will not verify:',
      err instanceof Error ? err.message : err
    )
    return null
  }
}

export function getFirebaseAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth
  const app = ensureFirebaseAdminApp()
  if (!app) return null
  adminAuth = getAuth(app)
  return adminAuth
}

export function getFirebaseAdminFirestore(): Firestore | null {
  if (adminFirestore) return adminFirestore
  const app = ensureFirebaseAdminApp()
  if (!app) return null
  adminFirestore = getFirestore(app)
  return adminFirestore
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
