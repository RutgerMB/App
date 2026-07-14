import { Capacitor } from '@capacitor/core'

export const DEV_LOGIN_CODE = import.meta.env.VITE_DEV_LOGIN_CODE ?? 'replock'
export const DEV_LOGIN_PASSWORD = import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? 'dev123'
export const DEV_TOKEN = 'dev-token'

/**
 * Dev login is never available in production or App Store builds (`build:mobile`).
 * Enabled only on the Vite dev server or native `iphone-dev` builds from cap:ios:sync.
 */
export function isDevLoginEnabled(): boolean {
  if (import.meta.env.PROD) return false
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true') {
    return true
  }
  return Capacitor.isNativePlatform() && import.meta.env.MODE === 'iphone-dev'
}

export function isDevToken(token: string | null | undefined): boolean {
  return token === DEV_TOKEN
}

export function validateDevLogin(code: string, password: string): boolean {
  return code.trim() === DEV_LOGIN_CODE && password === DEV_LOGIN_PASSWORD
}
