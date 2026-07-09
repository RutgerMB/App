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

const ip = getLanIp()
const apiUrl = `http://${ip}:3001`
const vitePort = process.env.VITE_PORT || '5173'
const viteUrl = `http://${ip}:${vitePort}`

console.log(`\n📱 RepLock iPhone dev setup`)
console.log(`   Mac LAN IP: ${ip}`)
console.log(`   API URL:    ${apiUrl}`)
if (live) console.log(`   Live UI:    ${viteUrl} (npm run dev must be running)\n`)
else console.log('')

let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
if (env.includes('VITE_API_URL_NATIVE=')) {
  env = env.replace(/VITE_API_URL_NATIVE=.*/g, `VITE_API_URL_NATIVE=${apiUrl}`)
} else {
  env += `\nVITE_API_URL_NATIVE=${apiUrl}\n`
}
writeFileSync(envPath, env, 'utf8')
console.log(`✓ Updated .env.iphone-dev`)

console.log('✓ Building web app (iphone-dev mode)...')
execSync('npx vite build --mode iphone-dev', { cwd: root, stdio: 'inherit' })

const capEnv = live ? { ...process.env, CAPACITOR_DEV_SERVER: viteUrl } : process.env
console.log('✓ Syncing Capacitor iOS...')
execSync('npx cap sync ios', { cwd: root, stdio: 'inherit', env: capEnv })

try {
  execSync('node scripts/ios-remove-stripe.mjs', { cwd: root, stdio: 'inherit' })
} catch {
  /* optional */
}

console.log(`
✅ Done. Next steps:
   1. Keep "npm run dev" running on this Mac (API on port 3001)
   2. iPhone on same Wi‑Fi as Mac
   3. Open ios/App/App.xcodeproj → Run ▶ on your iPhone

   Test API from Mac:  curl ${apiUrl}/api/health
   If curl fails, the iPhone cannot reach the API either.
`)
