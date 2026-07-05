import { apiFetch } from '@/lib/api'
import type { AppState } from '@/types'

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
  appState: AppState
}

export async function registerAccount(email: string, password: string, name: string): Promise<AuthResponse> {
  let res: Response
  try {
    res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
  } catch (err) {
    throw err instanceof Error ? err : new Error('Registration failed')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Registration failed')
  return data
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  let res: Response
  try {
    res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    throw err instanceof Error ? err : new Error('Login failed')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Login failed')
  return data
}

export async function syncAppState(token: string, appState: AppState): Promise<void> {
  const res = await apiFetch('/api/auth/sync', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appState }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Sync failed')
  }
}

export async function deleteAccount(token: string, password: string): Promise<void> {
  const res = await apiFetch('/api/auth/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Could not delete account')
}

export async function fetchAppState(token: string): Promise<AppState> {
  const res = await apiFetch('/api/auth/sync', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to load data')
  return data.appState
}
