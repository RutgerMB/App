export const DEV_LOGIN_CODE = import.meta.env.VITE_DEV_LOGIN_CODE ?? 'replock'
export const DEV_LOGIN_PASSWORD = import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? 'dev123'
export const DEV_TOKEN = 'dev-token'

export function isDevLoginEnabled(): boolean {
  return import.meta.env.DEV === true && import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true'
}

export function isDevToken(token: string | null | undefined): boolean {
  return token === DEV_TOKEN
}

export function validateDevLogin(code: string, password: string): boolean {
  return code.trim() === DEV_LOGIN_CODE && password === DEV_LOGIN_PASSWORD
}
