import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { AppState } from '../src/types/index.js'
import {
  entitlementFromAppState,
  mergeEntitlementIntoAppState,
  type ProEntitlement,
} from './entitlement.js'
import { DEFAULT_DAILY_OPENINGS, DEFAULT_MAX_DAILY_HOURS } from '../src/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

export interface StoredUser {
  id: string
  email: string
  passwordHash: string
  name: string
  createdAt: number
  appState: AppState
  entitlement?: ProEntitlement
}

interface UserDatabase {
  users: StoredUser[]
  usedAppleTransactionIds?: string[]
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2))
  }
}

function readDb(): UserDatabase {
  ensureDataFile()
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as UserDatabase
}

function writeDb(db: UserDatabase) {
  ensureDataFile()
  fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2))
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const db = readDb()
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id: string): StoredUser | undefined {
  const db = readDb()
  return db.users.find((u) => u.id === id)
}

export function findUserIdByStripeCustomerId(customerId: string): string | undefined {
  const db = readDb()
  for (const user of db.users) {
    const entitlement = user.entitlement ?? entitlementFromAppState(user.appState)
    if (entitlement.stripeCustomerId === customerId) return user.id
  }
  return undefined
}

export function createUser(data: Omit<StoredUser, 'appState'> & { appState?: AppState }): StoredUser {
  const db = readDb()
  const user: StoredUser = {
    ...data,
    appState: data.appState ?? createEmptyAppState(data.name, data.email),
  }
  db.users.push(user)
  writeDb(db)
  return user
}

/**
 * Ensure a row exists for Firebase / RevenueCat app_user_id so entitlements and webhooks work.
 * Password hash is empty — email/password login cannot succeed for these rows.
 */
export function ensureExternalUser(userId: string, email?: string, name?: string): StoredUser {
  const existing = findUserById(userId)
  if (existing) return existing

  const resolvedEmail = (email?.trim() || `${userId}@firebase.replock.local`).toLowerCase()
  const resolvedName = name?.trim() || resolvedEmail.split('@')[0] || 'User'

  return createUser({
    id: userId,
    email: resolvedEmail,
    passwordHash: '',
    name: resolvedName,
    createdAt: Date.now(),
  })
}

export function deleteUser(userId: string): boolean {
  const db = readDb()
  const idx = db.users.findIndex((u) => u.id === userId)
  if (idx === -1) return false
  db.users.splice(idx, 1)
  writeDb(db)
  return true
}

export function updateUserAppState(userId: string, appState: AppState): StoredUser | undefined {
  const db = readDb()
  const idx = db.users.findIndex((u) => u.id === userId)
  if (idx === -1) return undefined
  db.users[idx].appState = appState
  db.users[idx].name = appState.profile.name || db.users[idx].name
  writeDb(db)
  return db.users[idx]
}

export function getEntitlement(userId: string): ProEntitlement | undefined {
  const user = findUserById(userId)
  if (!user) return undefined
  if (user.entitlement) return user.entitlement
  return entitlementFromAppState(user.appState)
}

export function setEntitlement(userId: string, entitlement: ProEntitlement): StoredUser | undefined {
  ensureExternalUser(userId)

  const db = readDb()
  const idx = db.users.findIndex((u) => u.id === userId)
  if (idx === -1) return undefined

  db.users[idx].entitlement = entitlement
  db.users[idx].appState = mergeEntitlementIntoAppState(db.users[idx].appState, entitlement)
  writeDb(db)
  return db.users[idx]
}

export function isAppleTransactionUsed(transactionId: string): boolean {
  const db = readDb()
  return (db.usedAppleTransactionIds ?? []).includes(transactionId)
}

export function markAppleTransactionUsed(transactionId: string): void {
  const db = readDb()
  if (!db.usedAppleTransactionIds) db.usedAppleTransactionIds = []
  if (!db.usedAppleTransactionIds.includes(transactionId)) {
    db.usedAppleTransactionIds.push(transactionId)
    writeDb(db)
  }
}

function createEmptyAppState(name: string, email: string): AppState {
  return {
    profile: {
      name,
      email,
      locale: 'en',
      difficulty: 'medium',
      onboardingComplete: false,
      isPro: false,
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
      notificationsEnabled: true,
      dailyOpenings: DEFAULT_DAILY_OPENINGS,
      maxDailyHours: DEFAULT_MAX_DAILY_HOURS,
      earnedMinutesToday: 0,
      earnedDate: null,
      createdAt: Date.now(),
    },
    screenTimeBalance: 0,
    totalEarnedMinutes: 0,
    totalExercises: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastExerciseDate: null,
    apps: [],
    sessions: [],
    workoutPlanSessions: [],
    usageHistory: [],
  }
}
