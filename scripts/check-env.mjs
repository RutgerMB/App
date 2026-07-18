#!/usr/bin/env node
/**
 * Reports whether required .env keys are missing / empty / placeholder / set.
 * Never prints secret values — only status labels.
 *
 * Usage: node scripts/check-env.mjs [--file .env]
 */
import fs from 'node:fs'
import path from 'node:path'

const fileArg = process.argv.includes('--file')
  ? process.argv[process.argv.indexOf('--file') + 1]
  : '.env'
const envPath = path.resolve(process.cwd(), fileArg || '.env')

/** @typedef {'missing'|'empty'|'placeholder'|'set'} EnvStatus */

/**
 * @param {string} text
 * @returns {Record<string, string>}
 */
function parseEnv(text) {
  /** @type {Record<string, string>} */
  const map = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    map[key] = value
  }
  return map
}

/**
 * @param {Record<string, string>} map
 * @param {string} key
 * @param {(v: string) => boolean} [isPlaceholder]
 * @returns {EnvStatus}
 */
function statusOf(map, key, isPlaceholder) {
  if (!(key in map)) return 'missing'
  const v = map[key]
  if (!v) return 'empty'
  if (isPlaceholder?.(v)) return 'placeholder'
  return 'set'
}

/** Keys checked for production readiness (client bake + API host). */
const CHECKS = [
  {
    group: 'Client bake-in (required for npm run cap:ios:prod)',
    keys: [
      {
        key: 'VITE_API_URL',
        isPlaceholder: (v) =>
          /YOUR-API|example\.com|localhost|127\.0\.0\.1/i.test(v) || !/^https:\/\//i.test(v),
      },
      {
        key: 'VITE_REVENUECAT_API_KEY_IOS',
        isPlaceholder: (v) =>
          /YOUR_|xxx|changeme/i.test(v) || v.startsWith('test_') || !v.startsWith('appl_'),
      },
    ],
  },
  {
    group: 'API host (required to run Express in production)',
    keys: [
      {
        key: 'JWT_SECRET',
        isPlaceholder: (v) =>
          /your-long|change-in|replock-dev|changeme|secret/i.test(v) || v.length < 24,
      },
      {
        key: 'CLIENT_URL',
        isPlaceholder: (v) => /YOUR-API|example\.com/i.test(v),
      },
      {
        key: 'REVENUECAT_WEBHOOK_SECRET',
        isPlaceholder: (v) => /from_revenuecat|xxx|changeme|your_/i.test(v),
      },
      { key: 'APP_REVIEW_EMAIL' },
      {
        key: 'APP_REVIEW_PASSWORD',
        isPlaceholder: (v) => /ChooseAStrong|changeme|password123/i.test(v),
      },
      { key: 'PORT' },
      { key: 'TRUST_PROXY' },
    ],
  },
  {
    group: 'Firebase (optional but primary auth/sync when configured)',
    keys: [
      {
        key: 'VITE_FIREBASE_API_KEY',
        isPlaceholder: (v) => /YOUR_|xxx|changeme/i.test(v),
      },
      {
        key: 'VITE_FIREBASE_AUTH_DOMAIN',
        isPlaceholder: (v) => /your-project/i.test(v),
      },
      {
        key: 'VITE_FIREBASE_PROJECT_ID',
        isPlaceholder: (v) => /your-project/i.test(v),
      },
      {
        key: 'VITE_FIREBASE_APP_ID',
        isPlaceholder: (v) => /YOUR_|xxx/i.test(v),
      },
      {
        key: 'FIREBASE_SERVICE_ACCOUNT_JSON',
        isPlaceholder: (v) => v.length < 40,
      },
      { key: 'GOOGLE_APPLICATION_CREDENTIALS' },
    ],
  },
]

function main() {
  if (!fs.existsSync(envPath)) {
    console.log(`File: ${fileArg} — MISSING`)
    console.log('Copy .env.example → .env and fill values. Never commit secrets.')
    process.exitCode = 1
    return
  }

  const map = parseEnv(fs.readFileSync(envPath, 'utf8'))
  console.log(`File: ${fileArg} — present (values not shown)`)
  console.log('')

  /** Optional on host — code has defaults. */
  const optionalHost = new Set(['PORT', 'TRUST_PROXY'])
  /** Firebase is optional path — report only, don't fail the script. */
  const criticalGroups = new Set([
    'Client bake-in (required for npm run cap:ios:prod)',
    'API host (required to run Express in production)',
  ])

  let blockers = 0
  for (const group of CHECKS) {
    console.log(`## ${group.group}`)
    for (const { key, isPlaceholder } of group.keys) {
      const status = statusOf(map, key, isPlaceholder)
      const mark =
        status === 'set' ? 'ok' : status === 'placeholder' ? 'PLACEHOLDER' : status.toUpperCase()
      console.log(`  ${key}: ${mark}`)
      if (criticalGroups.has(group.group) && !optionalHost.has(key) && status !== 'set') {
        blockers++
      }
    }
    console.log('')
  }

  console.log('Notes:')
  console.log('- Firebase Auth can sign users in without the Express API.')
  console.log('- You still need ONE deployed Express API for RevenueCat webhooks,')
  console.log('  Pro entitlement sync (/api/subscription/status), App Review JWT account,')
  console.log('  and production bake (VITE_API_URL https://…).')
  console.log('- This script never prints secret values.')

  if (blockers > 0) {
    console.log('')
    console.log(`Result: ${blockers} production-critical key(s) missing/empty/placeholder.`)
    process.exitCode = 1
  } else {
    console.log('')
    console.log('Result: production-critical keys look set (not placeholders).')
  }
}

main()
