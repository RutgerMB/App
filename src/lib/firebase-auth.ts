import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'
import { withTimeout } from '@/lib/with-timeout'
import { stripProFieldsFromSnapshot } from '@/lib/entitlement-sanitize'
import type { AppState } from '@/types'
import { DEFAULT_DAILY_OPENINGS } from '@/types'

export interface FirebaseAuthUser {
  id: string
  email: string
  name: string
}

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid)
}

export function createEmptyAppState(name: string, email: string): AppState {
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

function mapFirebaseUser(user: User, displayName?: string): FirebaseAuthUser {
  return {
    id: user.uid,
    email: user.email ?? '',
    name: displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'User',
  }
}

export async function firebaseRegister(
  email: string,
  password: string,
  name: string
): Promise<{ user: FirebaseAuthUser; appState: AppState; idToken: string }> {
  const auth = getFirebaseAuth()
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await updateProfile(credential.user, { displayName: name.trim() })

  // Firebase sends the verification email; do not block account creation if it fails.
  try {
    await sendEmailVerification(credential.user)
  } catch {
    // Account is still usable; user can verify later from Firebase console / re-register path.
  }

  const appState = createEmptyAppState(name.trim(), email.trim().toLowerCase())
  await setDoc(userDocRef(credential.user.uid), {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    appState,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const idToken = await credential.user.getIdToken()
  return {
    user: mapFirebaseUser(credential.user, name.trim()),
    appState,
    idToken,
  }
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth()
  await sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

export async function firebaseLogin(
  email: string,
  password: string
): Promise<{ user: FirebaseAuthUser; appState: AppState; idToken: string }> {
  const auth = getFirebaseAuth()
  const credential = await withTimeout(
    signInWithEmailAndPassword(auth, email.trim(), password),
    20000,
    'Sign-in timed out. Check your internet connection and try again.'
  )

  // Never invent an empty appState on load failure — that used to overwrite
  // Firestore with onboardingComplete:false and force returning users through setup again.
  const snap = await withTimeout(
    getDoc(userDocRef(credential.user.uid)),
    15000,
    'Could not load your data. Check your internet connection and try again.'
  )

  let appState: AppState
  if (snap.exists() && snap.data().appState) {
    appState = snap.data().appState as AppState
    appState.profile.email = credential.user.email ?? appState.profile.email
    appState.profile.name =
      credential.user.displayName ?? snap.data().name ?? appState.profile.name
  } else {
    appState = createEmptyAppState(
      credential.user.displayName ?? email.split('@')[0],
      credential.user.email ?? email
    )
    await setDoc(userDocRef(credential.user.uid), {
      email: credential.user.email,
      name: appState.profile.name,
      appState,
      updatedAt: serverTimestamp(),
    })
  }

  const idToken = await credential.user.getIdToken()
  return {
    user: mapFirebaseUser(credential.user, appState.profile.name),
    appState,
    idToken,
  }
}

export async function firebaseUpdateDisplayName(name: string): Promise<void> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Not signed in')
  await updateProfile(user, { displayName: name.trim() })
}

export async function firebaseLogout(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export async function firebaseGetIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser
  if (!user) return null
  return user.getIdToken(forceRefresh)
}

export async function firebaseLoadAppState(uid: string): Promise<AppState | null> {
  const snap = await getDoc(userDocRef(uid))
  if (!snap.exists()) return null
  return (snap.data().appState as AppState) ?? null
}

export async function firebaseSaveAppState(uid: string, appState: AppState): Promise<void> {
  const sanitized = stripProFieldsFromSnapshot(appState)
  await setDoc(
    userDocRef(uid),
    {
      appState: sanitized,
      name: sanitized.profile.name,
      email: sanitized.profile.email,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export function firebaseIsEmailPasswordUser(): boolean {
  const user = getFirebaseAuth().currentUser
  if (!user) return false
  return user.providerData.some((p) => p.providerId === 'password')
}

export async function firebaseChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not signed in')
  if (!firebaseIsEmailPasswordUser()) {
    throw new Error('Password change is only available for email accounts')
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export async function firebaseDeleteAccount(password: string): Promise<void> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not signed in')

  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
  await deleteDoc(userDocRef(user.uid))
  await deleteUser(user)
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

export async function restoreFirebaseSession(): Promise<{
  user: FirebaseAuthUser
  /** Remote snapshot when loaded; null means keep local Zustand state (load failed or no doc). */
  appState: AppState | null
  idToken: string
} | null> {
  const user = getFirebaseAuth().currentUser
  if (!user) return null

  let appState: AppState | null = null
  try {
    // On timeout/network error, return null appState so callers keep localStorage —
    // inventing createEmptyAppState here was resetting onboarding and syncing that wipe to cloud.
    appState = await withTimeout(firebaseLoadAppState(user.uid), 10000, 'restore timeout')
  } catch {
    appState = null
  }

  return {
    user: mapFirebaseUser(user, appState?.profile.name),
    appState,
    idToken: await user.getIdToken(),
  }
}
