import { Capacitor } from '@capacitor/core'

export const DEV_LOGIN_CODE = import.meta.env.VITE_DEV_LOGIN_CODE ?? 'replock'
export const DEV_LOGIN_PASSWORD = import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? 'dev123'
export const DEV_TOKEN = 'dev-token'

/** Web dev server, or native builds made with `npm run cap:ios:sync` (--mode iphone-dev). */
export function isDevLoginEnabled(): boolean {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true') {
    return true
  }
  if (!Capacitor.isNativePlatform()) return false
  return (
    import.meta.env.MODE === 'iphone-dev' ||
    import.meta.env.VITE_ENABLE_DEV_LOGIN_NATIVE === 'true'
  )
}

export function isDevToken(token: string | null | undefined): boolean {
  return token === DEV_TOKEN
}

export function validateDevLogin(code: string, password: string): boolean {
  return code.trim() === DEV_LOGIN_CODE && password === DEV_LOGIN_PASSWORD
}
