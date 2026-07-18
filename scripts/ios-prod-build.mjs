#!/usr/bin/env node
/**
 * Production / TestFlight iOS web build + Capacitor sync.
 * Bakes VITE_API_URL (HTTPS) and RevenueCat appl_… key — no LAN / localhost fallback.
 *
 * Usage (on Mac, before Archive):
 *   1. Set in .env (gitignored):
 *        VITE_API_URL=https://YOUR-API-DOMAIN
 *        VITE_REVENUECAT_API_KEY_IOS=appl_…
 *   2. npm run cap:ios:prod
 *   3. open ios/App/App.xcodeproj → Product → Archive
 */
import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const rootEnvPath = path.join(root, '.env')
const infoPlistPath = path.join(root, 'ios', 'App', 'App', 'Info.plist')

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

function upsertInfoPlistRevenueCatKey(apiKey) {
  if (!existsSync(infoPlistPath)) {
    console.warn(`⚠ Info.plist not found at ${infoPlistPath} — skip native key inject`)
    return
  }
  let plist = readFileSync(infoPlistPath, 'utf8')
  if (plist.includes('<key>REVENUECAT_API_KEY</key>')) {
    plist = plist.replace(
      /<key>REVENUECAT_API_KEY<\/key>\s*<string>[^<]*<\/string>/,
      `<key>REVENUECAT_API_KEY</key>\n\t<string>${apiKey}</string>`
    )
  } else {
    const keyBlock = `\t<key>REVENUECAT_API_KEY</key>\n\t<string>${apiKey}</string>`
    plist = plist.replace('</dict>\n</plist>', `${keyBlock}\n</dict>\n</plist>`)
  }
  writeFileSync(infoPlistPath, plist, 'utf8')
  console.log('✓ Wrote REVENUECAT_API_KEY to ios/App/App/Info.plist')
}

const env = { ...parseEnvFile(rootEnvPath), ...process.env }
const apiUrl = (env.VITE_API_URL || '').trim().replace(/\/$/, '')
const rcKey = (env.VITE_REVENUECAT_API_KEY_IOS || '').trim()

console.log('\n🏗  RepLock iOS production build\n')

if (!apiUrl) {
  console.error(
    [
      '❌ Missing VITE_API_URL.',
      '',
      '   Set your deployed HTTPS API in .env before Archive:',
      '     VITE_API_URL=https://YOUR-API-DOMAIN',
      '',
      '   Do not use localhost or a LAN IP for store / TestFlight builds.',
      '',
    ].join('\n')
  )
  process.exit(1)
}

if (!/^https:\/\//i.test(apiUrl)) {
  console.error(
    [
      `❌ VITE_API_URL must be https:// (got: ${apiUrl})`,
      '',
      '   App Store builds must talk to a public HTTPS API.',
      '',
    ].join('\n')
  )
  process.exit(1)
}

if (!rcKey || !rcKey.startsWith('appl_')) {
  console.error(
    [
      '❌ Missing or invalid VITE_REVENUECAT_API_KEY_IOS.',
      '',
      '   Need App Store public SDK key (appl_…) for bundle app.replock.bleeker.',
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
console.log(`✓ RevenueCat iOS key: appl_…`)

upsertInfoPlistRevenueCatKey(rcKey)

const buildEnv = {
  ...process.env,
  VITE_API_URL: apiUrl,
  VITE_REVENUECAT_API_KEY_IOS: rcKey,
  // Ensure native/LAN overrides are not baked into production
  VITE_API_URL_NATIVE: '',
  VITE_ENABLE_DEV_LOGIN: '',
  VITE_ENABLE_DEV_LOGIN_NATIVE: '',
}

console.log('✓ Building web app (production)...')
execSync('npx vite build', { cwd: root, stdio: 'inherit', env: buildEnv })

console.log('✓ Syncing Capacitor iOS...')
execSync('npx cap sync ios', { cwd: root, stdio: 'inherit', env: buildEnv })

console.log('✓ Post-processing iOS packages (local plugins)...')
execSync('node scripts/ios-remove-stripe.mjs', { cwd: root, stdio: 'inherit' })

console.log(`
✅ Production web assets synced into ios/.

Next (on Mac):
  1. open ios/App/App.xcodeproj
  2. Confirm signing: bundle app.replock.bleeker, Family Controls, App Group
  3. Product → Archive → Distribute to App Store Connect

Webhook (server): ${apiUrl}/api/webhooks/revenuecat
`)
