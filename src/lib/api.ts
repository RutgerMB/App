import { Capacitor } from '@capacitor/core'

const API_PORT = 3001

let resolvedApiBase: string | null = null

export function resetApiBaseCache(): void {
  resolvedApiBase = null
}

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

    // Android emulator: 10.0.2.2 = host PC localhost
    if (Capacitor.getPlatform() === 'android') {
      bases.push(`http://10.0.2.2:${API_PORT}`)
    }

    const lanHost = lanHostFromWindow()
    if (lanHost) {
      bases.push(`http://${lanHost}:${API_PORT}`)
    }

    if (Capacitor.getPlatform() === 'ios') {
      // localhost on a physical iPhone is the phone itself — only useful on simulator
      bases.push(`http://127.0.0.1:${API_PORT}`)
    } else if (Capacitor.getPlatform() === 'android') {
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

const FETCH_TIMEOUT_MS = 8000

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const bases = getApiBases()
  let lastError: unknown
  const tried: string[] = []

  for (const base of bases) {
    const url = `${base}${path}`
    tried.push(url)
    try {
      const res = await fetchWithTimeout(url, init)
      resolvedApiBase = base
      return res
    } catch (err) {
      lastError = err
    }
  }

  resetApiBaseCache()

  if (
    lastError instanceof TypeError ||
    (lastError instanceof Error && lastError.name === 'AbortError')
  ) {
    const triedList = [...new Set(tried)].join(', ')
    const iosHint =
      Capacitor.getPlatform() === 'ios'
        ? ' On a real iPhone, set VITE_API_URL_NATIVE=http://YOUR_MAC_LAN_IP:3001 in .env (same Wi‑Fi), run npm run dev on the Mac, then rebuild the app.'
        : ' Emulator uses http://10.0.2.2:3001'
    throw new TypeError(
      Capacitor.isNativePlatform()
        ? `Cannot reach server (tried: ${triedList}). Keep "npm run dev" running on your dev machine, then rebuild the app.${iosHint}`
        : 'Cannot reach server. Run npm run dev in the project folder.'
    )
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed')
}
