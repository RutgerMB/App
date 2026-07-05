#!/usr/bin/env node
/**
 * Post-process iOS project after `npx cap sync ios`.
 * - Vendors @capgo/native-purchases into ios/App/LocalPackages (Mac has no node_modules)
 * - Removes Stripe/StatusBar/SplashScreen SPM entries (Xcode 15.4)
 * - Normalizes Windows backslashes in Package.swift paths
 *
 * Usage: node scripts/ios-remove-stripe.mjs
 */
import { readFileSync, writeFileSync, existsSync, cpSync, rmSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const spmPackagePath = join(root, 'ios', 'App', 'CapApp-SPM', 'Package.swift')
const podfilePath = join(root, 'ios', 'App', 'Podfile')
const nativePurchasesSrc = join(root, 'node_modules', '@capgo', 'native-purchases')
const nativePurchasesDest = join(root, 'ios', 'App', 'LocalPackages', 'CapgoNativePurchases')
const LOCAL_PURCHASES_SPM_PATH = '../LocalPackages/CapgoNativePurchases'

const spmPackageRemovals = [
  /^\s*\.package\(name: "CapacitorCommunityStripe".*\n/gm,
  /^\s*\.product\(name: "CapacitorCommunityStripe".*\n/gm,
  /^\s*\.package\(name: "CapacitorStatusBar".*\n/gm,
  /^\s*\.product\(name: "CapacitorStatusBar".*\n/gm,
  /^\s*\.package\(name: "CapacitorSplashScreen".*\n/gm,
  /^\s*\.product\(name: "CapacitorSplashScreen".*\n/gm,
]

let changed = false

if (existsSync(nativePurchasesSrc)) {
  if (existsSync(nativePurchasesDest)) {
    rmSync(nativePurchasesDest, { recursive: true, force: true })
  }
  cpSync(nativePurchasesSrc, nativePurchasesDest, { recursive: true })
  console.log('Vendored @capgo/native-purchases → ios/App/LocalPackages/CapgoNativePurchases')
} else if (existsSync(nativePurchasesDest)) {
  console.log('Using existing ios/App/LocalPackages/CapgoNativePurchases (no node_modules)')
} else {
  console.error(
    '\n@capgo/native-purchases not found in node_modules and no vendored copy exists.\n' +
      'Run: npm install --legacy-peer-deps && node scripts/ios-remove-stripe.mjs\n'
  )
  process.exit(1)
}

if (existsSync(spmPackagePath)) {
  let pkg = readFileSync(spmPackagePath, 'utf8')
  const before = pkg
  for (const pattern of spmPackageRemovals) {
    pkg = pkg.replace(pattern, '')
  }
  pkg = pkg.replace(/path: "([^"]*)"/g, (_, p) => `path: "${p.replace(/\\/g, '/')}"`)
  pkg = pkg.replace(
    /\.package\(name: "CapgoNativePurchases", path: "[^"]+"\)/g,
    `.package(name: "CapgoNativePurchases", path: "${LOCAL_PURCHASES_SPM_PATH}")`
  )
  if (pkg !== before) {
    writeFileSync(spmPackagePath, pkg)
    console.log('Patched CapApp-SPM/Package.swift')
    changed = true
  } else {
    console.log('CapApp-SPM/Package.swift already clean')
  }
} else {
  console.log('No ios/App/CapApp-SPM/Package.swift — skip SPM patch')
}

if (existsSync(podfilePath)) {
  let podfile = readFileSync(podfilePath, 'utf8')
  const before = podfile
  podfile = podfile.replace(/^\s*pod 'CapacitorCommunityStripe'.*\n/gm, '')
  podfile = podfile.replace(/^\s*pod 'CapacitorStatusBar'.*\n/gm, '')
  podfile = podfile.replace(/^\s*pod 'CapacitorSplashScreen'.*\n/gm, '')
  podfile = podfile.replace(/^\s*pod 'Stripe.*'.*\n/gm, '')
  if (podfile !== before) {
    writeFileSync(podfilePath, podfile)
    console.log('Removed plugin pods from Podfile')
    changed = true
  }
}

if (changed) {
  console.log('\nIn Xcode: File → Packages → Reset Package Caches, then Clean Build Folder (⇧⌘K)')
}
