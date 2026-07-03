import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, findUserById, updateUserAppState } from './db.js'
import type { AppState } from '../src/types/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'replock-dev-secret-change-in-production'
const TOKEN_EXPIRY = '30d'

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

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const payload = verifyToken(header.slice(7))
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' })
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
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      appState: user.appState,
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
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = signToken({ userId: user.id, email: user.email })
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      appState: user.appState,
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
  res.json({ appState: user.appState })
}

export function handlePutSync(req: Request, res: Response) {
  const { auth } = req as Request & { auth: AuthPayload }
  const { appState } = req.body as { appState?: AppState }
  if (!appState?.profile) {
    return res.status(400).json({ error: 'Invalid app state' })
  }
  const updated = updateUserAppState(auth.userId, {
    ...appState,
    profile: { ...appState.profile, email: auth.email },
  })
  if (!updated) return res.status(404).json({ error: 'User not found' })
  res.json({ ok: true })
}
