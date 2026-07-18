import type { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'

/** Comma-separated IPs/CIDR-free exact matches from BANNED_IPS env. */
export function parseBannedIps(raw: string | undefined = process.env.BANNED_IPS): Set<string> {
  if (!raw?.trim()) return new Set()
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

let bannedIps = parseBannedIps()

/** Reload ban list from env (tests / ops after process env change). */
export function reloadBannedIps(raw?: string): void {
  bannedIps = parseBannedIps(raw ?? process.env.BANNED_IPS)
}

/** Prefer Express `req.ip` (honors `trust proxy`). Do not trust raw X-Forwarded-For when proxy is off. */
export function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || ''
}

export function ipBanMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req)
  if (ip && bannedIps.has(ip)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

const JSON_TYPE = /^application\/(?:[\w.+-]+\+)?json\s*(?:;|$)/i

/**
 * Reject non-JSON Content-Type on mutating /api routes that expect JSON bodies.
 * Stripe webhook uses express.raw and is registered before this middleware.
 */
export function requireJsonContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next()
  }
  if (!req.path.startsWith('/api')) {
    return next()
  }
  // Webhooks may send application/json; Stripe is handled earlier with raw parser.
  if (req.path.startsWith('/api/webhooks/stripe')) {
    return next()
  }

  const contentType = req.headers['content-type']
  if (!contentType) {
    // Empty-body DELETE/POST without Content-Type is allowed (clients sometimes omit it).
    return next()
  }
  if (!JSON_TYPE.test(contentType)) {
    return res.status(415).json({
      error: 'Unsupported Media Type — Content-Type must be application/json',
    })
  }
  next()
}

/** Map express.json SyntaxError / entity-too-large to clean JSON responses. */
export function jsonBodyErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!err || typeof err !== 'object') return next(err)

  const e = err as { type?: string; status?: number; statusCode?: number; message?: string }
  if (e.type === 'entity.parse.failed' || (e instanceof SyntaxError && 'body' in e)) {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  if (e.type === 'entity.too.large' || e.status === 413 || e.statusCode === 413) {
    return res.status(413).json({ error: 'Request body too large' })
  }
  next(err)
}

/** General API limiter — covers health, sync, subscription, and any future /api/recent. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => req.path === '/api/health',
})

/** Stricter limiter for credential endpoints. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
})

/** Webhook limiter — generous for provider retries, still caps abuse. */
export const webhookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook requests' },
})
