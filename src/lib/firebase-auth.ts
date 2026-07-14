import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'
import { withTimeout } from '@/lib/with-timeout'
import { stripProFieldsFromSnapshot } from '@/lib/entitlement-sanitize'
import type { AppState } from '@/types'
import { DEFAULT_APPS, DEFAULT_DAILY_OPENINGS } from '@/types'

export interface FirebaseAuthUser {
  id: string
  email: string
  name: string
}

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
    apps: DEFAULT_APPS.map((app) => ({ ...app, id: generateId() })),
    sessions: [],
    workoutPlanSessions: [],
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

  let appState: AppState
  try {
    const snap = await withTimeout(
      getDoc(userDocRef(credential.user.uid)),
      15000,
      'Could not load your data. Check your internet connection and try again.'
    )
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
  } catch {
    appState = createEmptyAppState(
      credential.user.displayName ?? email.split('@')[0],
      credential.user.email ?? email
    )
    setDoc(userDocRef(credential.user.uid), {
      email: credential.user.email,
      name: appState.profile.name,
      appState,
      updatedAt: serverTimestamp(),
    }).catch(() => {})
  }

  const idToken = await credential.user.getIdToken()
  return {
    user: mapFirebaseUser(credential.user, appState.profile.name),
    appState,
    idToken,
  }
}

export async function firebaseLogout(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export async function firebaseGetIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser
  if (!user) return null
  return user.getIdToken()
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
  appState: AppState
  idToken: string
} | null> {
  const user = getFirebaseAuth().currentUser
  if (!user) return null

  let appState: AppState
  try {
    appState =
      (await withTimeout(firebaseLoadAppState(user.uid), 10000, 'restore timeout')) ??
      createEmptyAppState(
        user.displayName ?? user.email?.split('@')[0] ?? 'User',
        user.email ?? ''
      )
  } catch {
    appState = createEmptyAppState(
      user.displayName ?? user.email?.split('@')[0] ?? 'User',
      user.email ?? ''
    )
  }

  return {
    user: mapFirebaseUser(user, appState.profile.name),
    appState,
    idToken: await user.getIdToken(),
  }
}
