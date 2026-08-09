import { describe, expect, it } from 'vitest'
import { parseServiceAccountJson } from '../firebase-admin.js'

describe('parseServiceAccountJson', () => {
  it('parses raw service-account JSON', () => {
    const parsed = parseServiceAccountJson(
      JSON.stringify({ type: 'service_account', project_id: 'replock-7b9ac' })
    )
    expect(parsed.project_id).toBe('replock-7b9ac')
  })

  it('parses base64-encoded JSON', () => {
    const raw = JSON.stringify({ type: 'service_account', project_id: 'replock-7b9ac' })
    const b64 = Buffer.from(raw, 'utf8').toString('base64')
    const parsed = parseServiceAccountJson(b64)
    expect(parsed.type).toBe('service_account')
  })

  it('rejects a bare project id', () => {
    expect(() => parseServiceAccountJson('replock-7b9ac')).toThrow(/project id/i)
  })
})
