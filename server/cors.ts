/**
 * Production CORS for Capacitor + optional web clients.
 *
 * Store builds call the API from WKWebView / Android WebView with origins like
 * `capacitor://localhost` and `http://localhost` — NOT the API host URL.
 * Allowing only CLIENT_URL (often the API URL) breaks native apps in production.
 */

const NATIVE_APP_ORIGINS = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
] as const

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, '')
}

export function buildProductionAllowedOrigins(
  clientUrl: string,
  extraOriginsEnv?: string
): Set<string> {
  const allowed = new Set<string>(NATIVE_APP_ORIGINS)
  const primary = normalizeOrigin(clientUrl)
  if (primary) allowed.add(primary)
  for (const part of (extraOriginsEnv ?? '').split(',')) {
    const origin = normalizeOrigin(part)
    if (origin) allowed.add(origin)
  }
  return allowed
}

export type CorsOriginCallback = (err: Error | null, allow?: boolean) => void

/** Options for the `cors` package. Empty object = reflect all (dev). */
export function createCorsOptions(
  nodeEnv: string | undefined,
  clientUrl: string,
  extraOriginsEnv?: string
): { origin: (origin: string | undefined, cb: CorsOriginCallback) => void } | Record<string, never> {
  if (nodeEnv !== 'production') return {}

  const allowed = buildProductionAllowedOrigins(clientUrl, extraOriginsEnv)

  return {
    origin(origin: string | undefined, callback: CorsOriginCallback) {
      // Non-browser clients (webhooks, curl, same-origin) often omit Origin.
      if (!origin) {
        callback(null, true)
        return
      }
      callback(null, allowed.has(normalizeOrigin(origin)))
    },
  }
}
