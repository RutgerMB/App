#!/usr/bin/env node
/**
 * Prepares an Android phone/emulator build — LAN API IP, Vite bake, Capacitor sync.
 * Usage: node scripts/android-dev-sync.mjs [--live]
 *   --live  also point Capacitor at Vite (npm run dev must be running)
 *
 * Physical Samsung: uses your PC LAN IP (same Wi‑Fi).
 * Emulator: also falls back to http://10.0.2.2:3001 in the client.
 */
import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.android-dev')
const rootEnvPath = path.join(root, '.env')
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

function resolveAndroidRevenueCatKey() {
  const fromRoot = parseEnvFile(rootEnvPath).VITE_REVENUECAT_API_KEY_ANDROID?.trim()
  const fromAndroid = parseEnvFile(envPath).VITE_REVENUECAT_API_KEY_ANDROID?.trim()
  const candidates = [
    { source: '.env', value: fromRoot },
    { source: '.env.android-dev', value: fromAndroid },
  ].filter((c) => c.value)

  const goog = candidates.find((c) => c.value.startsWith('goog_'))
  if (goog) return { key: goog.value, source: goog.source }

  const testKey = candidates.find((c) => c.value.startsWith('test_'))
  if (testKey) {
    console.warn(
      `\n⚠ Using RevenueCat Test Store key (${testKey.source}). Play Billing on a real phone needs goog_…\n`
    )
    return { key: testKey.value, source: testKey.source }
  }

  return null
}

const ip = getLanIp()
const apiUrl = `http://${ip}:3001`
const vitePort = process.env.VITE_PORT || '5173'
const viteUrl = `http://${ip}:${vitePort}`

console.log(`\n📱 RepLock Android dev setup`)
console.log(`   PC LAN IP:  ${ip}`)
console.log(`   API URL:    ${apiUrl}`)
if (live) console.log(`   Live UI:    ${viteUrl} (npm run dev must be running)\n`)
else console.log('')

let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
env = setEnvVar(env, 'VITE_API_URL_NATIVE', apiUrl)

const rc = resolveAndroidRevenueCatKey()
if (rc) {
  env = setEnvVar(env, 'VITE_REVENUECAT_API_KEY_ANDROID', rc.key)
  console.log(`✓ RevenueCat Android key from ${rc.source}`)
} else {
  console.warn(
    '⚠ No VITE_REVENUECAT_API_KEY_ANDROID found — purchases will be disabled until you add goog_… to .env'
  )
}

writeFileSync(envPath, env, 'utf8')
console.log(`✓ Updated .env.android-dev`)

console.log('✓ Building web app (android-dev mode)...')
execSync('npx vite build --mode android-dev', { cwd: root, stdio: 'inherit' })

const capEnv = live ? { ...process.env, CAPACITOR_DEV_SERVER: viteUrl } : process.env
console.log('✓ Syncing Capacitor Android...')
execSync('npx cap sync android', { cwd: root, stdio: 'inherit', env: capEnv })

console.log(`
✅ Done. Next steps:
   1. Keep "npm run dev" running (API on port 3001)
   2. Phone on same Wi‑Fi as this PC
   3. Open Android Studio: npm run cap:android
   4. Run ▶ on your Samsung (debug build)

   Permissions to enable on the phone:
   · Usage Access (screen-time stats)
   · Accessibility → RepLock (app locking)
   · Notifications (optional reminders)
   · Samsung: Battery → Unrestricted for RepLock

   Test API:  curl ${apiUrl}/api/health
`)
