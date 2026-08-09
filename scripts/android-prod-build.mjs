#!/usr/bin/env node
/**
 * Production / Play Store Android web build + Capacitor sync.
 * Bakes VITE_API_URL (HTTPS) and RevenueCat goog_… key — no LAN / localhost fallback.
 *
 * Usage (before Play upload):
 *   1. Set in .env (gitignored):
 *        VITE_API_URL=https://YOUR-API-DOMAIN
 *        VITE_REVENUECAT_API_KEY_ANDROID=goog_…
 *   2. npm run cap:android:prod
 *   3. Open Android Studio → generate signed release AAB (upload keystore required)
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const rootEnvPath = path.join(root, '.env')

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const out = {}
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = { ...parseEnvFile(rootEnvPath), ...process.env }
const apiUrl = (env.VITE_API_URL || '').trim().replace(/\/$/, '')
const rcKey = (env.VITE_REVENUECAT_API_KEY_ANDROID || '').trim()

console.log('\n🏗  RepLock Android production build\n')

if (!apiUrl) {
  console.error(
    [
      '❌ Missing VITE_API_URL.',
      '',
      '   Set your deployed HTTPS API in .env before a Play release:',
      '     VITE_API_URL=https://YOUR-API-DOMAIN',
      '',
    ].join('\n')
  )
  process.exit(1)
}

if (!/^https:\/\//i.test(apiUrl)) {
  console.error(`❌ VITE_API_URL must be https:// (got: ${apiUrl})\n`)
  process.exit(1)
}

if (!rcKey || !rcKey.startsWith('goog_')) {
  console.error(
    [
      '❌ Missing or invalid VITE_REVENUECAT_API_KEY_ANDROID.',
      '',
      '   Need Play Store public SDK key (goog_…) for package com.replock.app.',
      '   Do NOT use RevenueCat Test Store keys (test_…).',
      '',
    ].join('\n')
  )
  process.exit(1)
}

if (env.VITE_ENABLE_DEV_LOGIN === 'true' || env.VITE_ENABLE_DEV_LOGIN_NATIVE === 'true') {
  console.error(
    '❌ Refusing production build: VITE_ENABLE_DEV_LOGIN(_NATIVE) must not be set for store builds.\n'
  )
  process.exit(1)
}

console.log(`✓ VITE_API_URL=${apiUrl}`)
console.log('✓ RevenueCat Android key: goog_…')

const buildEnv = {
  ...process.env,
  VITE_API_URL: apiUrl,
  VITE_REVENUECAT_API_KEY_ANDROID: rcKey,
  VITE_API_URL_NATIVE: '',
  VITE_ENABLE_DEV_LOGIN: '',
  VITE_ENABLE_DEV_LOGIN_NATIVE: '',
}

console.log('✓ Building web app (production)...')
execSync('npx vite build', { cwd: root, stdio: 'inherit', env: buildEnv })

console.log('✓ Syncing Capacitor Android...')
execSync('npx cap sync android', { cwd: root, stdio: 'inherit', env: buildEnv })

console.log(`
✅ Production web assets synced into android/.

Next:
  1. Configure a Play upload keystore in android/app (signingConfigs) — required for Play
  2. Open Android Studio → Generate Signed Bundle / APK
  3. Declare Usage Access + Accessibility in Play Console declarations
  4. Attach Play product replock_pro (base plans monthly-plan / yearly-plan) in RevenueCat

Webhook (server): ${apiUrl}/api/webhooks/revenuecat
`)
