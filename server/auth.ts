import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserAppState,
  deleteUser,
  getEntitlement,
  ensureExternalUser,
} from './db.js'
import {
  isFirebaseAdminConfigured,
  looksLikeFirebaseIdToken,
  verifyFirebaseIdToken,
} from './firebase-admin.js'
import {
  entitlementFromAppState,
  mergeEntitlementIntoAppState,
  sanitizeAppStateForSync,
} from './entitlement.js'
import type { AppState } from '../src/types/index.js'

const DEFAULT_JWT_SECRET = 'replock-dev-secret-change-in-production'
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET
const TOKEN_EXPIRY = '30d'

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET must be set to a secure value in production')
  }
}

export interface AuthPayload {
  userId: string
  email: string
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = header.slice(7)

  const firebaseUser = await verifyFirebaseIdToken(token)
  if (firebaseUser) {
    ensureExternalUser(firebaseUser.uid, firebaseUser.email)
    ;(req as Request & { auth: AuthPayload }).auth = {
      userId: firebaseUser.uid,
      email: firebaseUser.email,
    }
    return next()
  }

  // Firebase clients send ID tokens; without Admin credentials jwt.verify fails with a
  // misleading "Invalid or expired token". Surface a clearer, actionable error.
  if (looksLikeFirebaseIdToken(token) && !isFirebaseAdminConfigured()) {
    return res.status(401).json({
      error:
        'Server cannot verify Firebase login. Add firebase-service-account.json (or FIREBASE_SERVICE_ACCOUNT_JSON) on the API host, then restart.',
      code: 'FIREBASE_ADMIN_MISSING',
    })
  }

  const payload = verifyToken(token)
  if (!payload) {
    if (looksLikeFirebaseIdToken(token)) {
      return res.status(401).json({
        error: 'Firebase session expired. Sign out and sign in again.',
        code: 'FIREBASE_TOKEN_INVALID',
      })
    }
    return res.status(401).json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' })
  }
  ;(req as Request & { auth: AuthPayload }).auth = payload
  next()
}

export async function handleRegister(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string }

    if (!email?.trim() || !password || !name?.trim()) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    if (findUserByEmail(email.trim())) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = createUser({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      createdAt: Date.now(),
    })

    const token = signToken({ userId: user.id, email: user.email })
    const entitlement = getEntitlement(user.id) ?? entitlementFromAppState(user.appState)
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      appState: mergeEntitlementIntoAppState(user.appState, entitlement),
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = findUserByEmail(email.trim().toLowerCase())
    if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = signToken({ userId: user.id, email: user.email })
    const entitlement = getEntitlement(user.id) ?? entitlementFromAppState(user.appState)
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      appState: mergeEntitlementIntoAppState(user.appState, entitlement),
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
}

export function handleGetSync(req: Request, res: Response) {
  const { auth } = req as Request & { auth: AuthPayload }
  const user = findUserById(auth.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const entitlement = getEntitlement(auth.userId) ?? entitlementFromAppState(user.appState)
  res.json({ appState: mergeEntitlementIntoAppState(user.appState, entitlement) })
}

export function handlePutSync(req: Request, res: Response) {
  const { auth } = req as Request & { auth: AuthPayload }
  const { appState } = req.body as { appState?: AppState }
  if (!appState?.profile) {
    return res.status(400).json({ error: 'Invalid app state' })
  }

  const user = findUserById(auth.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const entitlement = getEntitlement(auth.userId) ?? entitlementFromAppState(user.appState)
  const sanitized = sanitizeAppStateForSync(user.appState, appState, entitlement)
  const updated = updateUserAppState(auth.userId, {
    ...sanitized,
    profile: { ...sanitized.profile, email: auth.email },
  })
  if (!updated) return res.status(404).json({ error: 'User not found' })
  res.json({ ok: true })
}

export async function handleDeleteAccount(req: Request, res: Response) {
  const { auth } = req as Request & { auth: AuthPayload }
  const { password } = req.body as { password?: string }

  const user = findUserById(auth.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password' })
  }

  const deleted = deleteUser(auth.userId)
  if (!deleted) return res.status(500).json({ error: 'Could not delete account' })

  res.json({ ok: true })
}
