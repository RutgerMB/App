#!/usr/bin/env node
/**
 * Mac: prepares iPhone dev — sets LAN IP in .env.iphone-dev, builds, syncs Capacitor.
 * Usage: node scripts/ios-dev-sync.mjs [--live]
 *   --live  also point Capacitor at Vite (npm run dev must be running)
 */
import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.iphone-dev')
const rootEnvPath = path.join(root, '.env')
const infoPlistPath = path.join(root, 'ios', 'App', 'App', 'Info.plist')
const live = process.argv.includes('--live')

function getLanIp() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  throw new Error('No LAN IPv4 found. Connect to Wi‑Fi and try again.')
}

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

function setEnvVar(envText, key, value) {
  const line = `${key}=${value}`
  if (new RegExp(`^${key}=`, 'm').test(envText)) {
    return envText.replace(new RegExp(`^${key}=.*$`, 'm'), line)
  }
  const needsNewline = envText.length > 0 && !envText.endsWith('\n')
  return `${envText}${needsNewline ? '\n' : ''}${line}\n`
}

/**
 * Device / sandbox StoreKit needs the App Store public SDK key (appl_…).
 * RevenueCat Test Store keys (test_…) only work with RC's simulated store — not a real iPhone.
 */
function resolveIosRevenueCatKey() {
  const fromRoot = parseEnvFile(rootEnvPath).VITE_REVENUECAT_API_KEY_IOS?.trim()
  const fromIphone = parseEnvFile(envPath).VITE_REVENUECAT_API_KEY_IOS?.trim()
  const candidates = [
    { source: '.env', value: fromRoot },
    { source: '.env.iphone-dev', value: fromIphone },
  ].filter((c) => c.value)

  const appl = candidates.find((c) => c.value.startsWith('appl_'))
  if (appl) {
    return { key: appl.value, source: appl.source }
  }

  const testKey = candidates.find((c) => c.value.startsWith('test_'))
  if (testKey) {
    throw new Error(
      [
        '',
        '❌ RevenueCat Test Store key detected for iPhone sync.',
        `   Found in ${testKey.source}: ${testKey.value.slice(0, 8)}…`,
        '',
        '   Physical iPhone / sandbox IAP needs the App Store public SDK key (appl_…),',
        '   NOT the Test Store key (test_…). Test Store offerings do not map to App Store products.',
        '',
        '   Fix:',
        '   1. Open https://app.revenuecat.com → Project → API keys',
        '   2. Copy the iOS App Store public key for bundle app.replock.bleeker (starts with appl_)',
        '   3. Add to .env (gitignored) OR .env.iphone-dev:',
        '      VITE_REVENUECAT_API_KEY_IOS=appl_YOUR_KEY',
        '   4. Re-run: npm run cap:ios:sync',
        '',
      ].join('\n')
    )
  }

  throw new Error(
    [
      '',
      '❌ Missing VITE_REVENUECAT_API_KEY_IOS (App Store public SDK key).',
      '',
      '   Device builds require appl_… from RevenueCat → Project → API keys',
      '   for iOS app bundle ID app.replock.bleeker.',
      '',
      '   Add to .env (preferred, gitignored) or .env.iphone-dev:',
      '     VITE_REVENUECAT_API_KEY_IOS=appl_YOUR_KEY',
      '',
      '   Do NOT use a test_… Test Store key for physical device / sandbox StoreKit.',
      '   See IOS_SETUP.md and docs/REVENUECAT_SETUP.md.',
      '',
    ].join('\n')
  )
}

function upsertInfoPlistRevenueCatKey(apiKey) {
  if (!existsSync(infoPlistPath)) {
    console.warn(`⚠ Info.plist not found at ${infoPlistPath} — skip native key inject`)
    return
  }
  let plist = readFileSync(infoPlistPath, 'utf8')
  const keyBlock = `\t<key>REVENUECAT_API_KEY</key>\n\t<string>${apiKey}</string>`
  if (plist.includes('<key>REVENUECAT_API_KEY</key>')) {
    plist = plist.replace(
      /<key>REVENUECAT_API_KEY<\/key>\s*<string>[^<]*<\/string>/,
      `<key>REVENUECAT_API_KEY</key>\n\t<string>${apiKey}</string>`
    )
  } else {
    plist = plist.replace('</dict>\n</plist>', `${keyBlock}\n</dict>\n</plist>`)
  }
  writeFileSync(infoPlistPath, plist, 'utf8')
  console.log('✓ Wrote REVENUECAT_API_KEY to ios/App/App/Info.plist (native SDK)')
}

const ip = getLanIp()
const apiUrl = `http://${ip}:3001`
const vitePort = process.env.VITE_PORT || '5173'
const viteUrl = `http://${ip}:${vitePort}`

console.log(`\n📱 RepLock iPhone dev setup`)
console.log(`   Mac LAN IP: ${ip}`)
console.log(`   API URL:    ${apiUrl}`)
if (live) console.log(`   Live UI:    ${viteUrl} (npm run dev must be running)\n`)
else console.log('')

const { key: revenueCatIosKey, source: revenueCatSource } = resolveIosRevenueCatKey()
console.log(
  `✓ RevenueCat iOS key: appl_… (from ${revenueCatSource}) — App Store / sandbox StoreKit`
)

let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
env = setEnvVar(env, 'VITE_API_URL_NATIVE', apiUrl)
env = setEnvVar(env, 'VITE_REVENUECAT_API_KEY_IOS', revenueCatIosKey)
writeFileSync(envPath, env, 'utf8')
console.log(`✓ Updated .env.iphone-dev`)

upsertInfoPlistRevenueCatKey(revenueCatIosKey)

console.log('✓ Building web app (iphone-dev mode)...')
execSync('npx vite build --mode iphone-dev', { cwd: root, stdio: 'inherit' })

const capEnv = live ? { ...process.env, CAPACITOR_DEV_SERVER: viteUrl } : process.env
console.log('✓ Syncing Capacitor iOS...')
execSync('npx cap sync ios', { cwd: root, stdio: 'inherit', env: capEnv })

console.log('✓ Post-processing iOS packages (local plugins)...')
execSync('node scripts/ios-remove-stripe.mjs', { cwd: root, stdio: 'inherit' })

console.log(`
✅ Done. Next steps:
   1. Keep "npm run dev" running on this Mac (API on port 3001)
   2. iPhone on same Wi‑Fi as Mac
   3. Open ios/App/App.xcodeproj → Run ▶ on your iPhone

   Test API from Mac:  curl ${apiUrl}/api/health
   If curl fails, the iPhone cannot reach the API either.
`)
