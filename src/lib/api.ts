import { Capacitor } from '@capacitor/core'

const API_PORT = 3001

let resolvedApiBase: string | null = null

function trimBase(url: string): string {
  return url.replace(/\/$/, '')
}

function lanHostFromWindow(): string | null {
  if (typeof window === 'undefined') return null
  const { hostname } = window.location
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) && hostname !== '127.0.0.1') {
    return hostname
  }
  return null
}

/** Ordered API base URLs to try (first success is cached). */
export function getApiBases(): string[] {
  if (resolvedApiBase) return [resolvedApiBase]

  const bases: string[] = []

  if (import.meta.env.VITE_API_URL) {
    bases.push(trimBase(import.meta.env.VITE_API_URL))
  }

  if (Capacitor.isNativePlatform()) {
    if (import.meta.env.VITE_API_URL_NATIVE) {
      bases.push(trimBase(import.meta.env.VITE_API_URL_NATIVE))
    }

    const lanHost = lanHostFromWindow()
    if (lanHost) {
      bases.push(`http://${lanHost}:${API_PORT}`)
    }

    if (Capacitor.getPlatform() === 'android') {
      bases.push(`http://10.0.2.2:${API_PORT}`)
      bases.push(`http://127.0.0.1:${API_PORT}`)
    } else {
      bases.push(`http://localhost:${API_PORT}`)
    }
  } else if (import.meta.env.DEV) {
    bases.push(`http://localhost:${API_PORT}`)
    bases.push('')
  }

  if (!bases.length) {
    bases.push('')
  }

  return [...new Set(bases)]
}

/** @deprecated Use getApiBases — kept for callers that need a single URL. */
export function getApiBase(): string {
  return getApiBases()[0] ?? ''
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const bases = getApiBases()
  let lastError: unknown

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, init)
      resolvedApiBase = base
      return res
    } catch (err) {
      lastError = err
    }
  }

  if (lastError instanceof TypeError) {
    throw new TypeError(
      Capacitor.isNativePlatform()
        ? 'Cannot reach server. Run npm run dev on your PC. On a physical phone, add VITE_API_URL_NATIVE=http://YOUR_PC_IP:3001 to .env and rebuild.'
        : 'Cannot reach server. Run npm run dev in the project folder.'
    )
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed')
}
