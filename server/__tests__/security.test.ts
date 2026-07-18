import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseBannedIps,
  reloadBannedIps,
  getClientIp,
  requireJsonContentType,
  jsonBodyErrorHandler,
} from '../security.js'
import type { Request, Response, NextFunction } from 'express'

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res as unknown as Response & { statusCode: number; body: unknown }
}

describe('parseBannedIps', () => {
  it('parses comma-separated list', () => {
    expect([...parseBannedIps('1.2.3.4, 5.6.7.8')].sort()).toEqual(['1.2.3.4', '5.6.7.8'])
  })

  it('returns empty set for blank', () => {
    expect(parseBannedIps('')).toEqual(new Set())
    expect(parseBannedIps(undefined)).toEqual(new Set())
  })
})

describe('getClientIp', () => {
  it('uses Express req.ip (trust-proxy aware)', () => {
    const req = {
      ip: '9.9.9.9',
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request
    expect(getClientIp(req)).toBe('9.9.9.9')
  })
})

describe('requireJsonContentType', () => {
  beforeEach(() => {
    reloadBannedIps('')
  })

  it('allows GET without Content-Type', () => {
    const req = { method: 'GET', path: '/api/auth/sync', headers: {} } as unknown as Request
    const res = mockRes()
    let nextCalled = false
    requireJsonContentType(req, res, (() => {
      nextCalled = true
    }) as NextFunction)
    expect(nextCalled).toBe(true)
  })

  it('rejects XML Content-Type on POST /api', () => {
    const req = {
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'content-type': 'application/xml' },
    } as unknown as Request
    const res = mockRes()
    let nextCalled = false
    requireJsonContentType(req, res, (() => {
      nextCalled = true
    }) as NextFunction)
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(415)
  })

  it('allows application/json', () => {
    const req = {
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'content-type': 'application/json; charset=utf-8' },
    } as unknown as Request
    const res = mockRes()
    let nextCalled = false
    requireJsonContentType(req, res, (() => {
      nextCalled = true
    }) as NextFunction)
    expect(nextCalled).toBe(true)
  })
})

describe('jsonBodyErrorHandler', () => {
  it('maps parse failures to 400', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), {
      type: 'entity.parse.failed',
      body: '<xml/>',
    })
    const res = mockRes()
    let nextCalled = false
    jsonBodyErrorHandler(err, {} as Request, res, (() => {
      nextCalled = true
    }) as NextFunction)
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid JSON body' })
  })

  it('maps oversized bodies to 413', () => {
    const err = { type: 'entity.too.large', status: 413 }
    const res = mockRes()
    jsonBodyErrorHandler(err, {} as Request, res, (() => undefined) as NextFunction)
    expect(res.statusCode).toBe(413)
  })
})

describe('reloadBannedIps', () => {
  it('updates the in-memory set used by ipBanMiddleware', async () => {
    const { ipBanMiddleware } = await import('../security.js')
    reloadBannedIps('10.0.0.1')
    const req = {
      ip: '10.0.0.1',
      socket: { remoteAddress: '10.0.0.1' },
    } as unknown as Request
    const res = mockRes()
    let nextCalled = false
    ipBanMiddleware(req, res, (() => {
      nextCalled = true
    }) as NextFunction)
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(403)
    reloadBannedIps('')
  })
})
