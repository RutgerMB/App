#!/usr/bin/env node
/**
 * Post-process iOS project after `npx cap sync ios`.
 * - Removes Stripe/StatusBar/SplashScreen SPM entries (web-only on iOS)
 * - Re-injects RepLockControls + CapgoNativePurchases (cap sync wipes local SPM plugins)
 * - Ensures CapApp-SPM.swift imports RepLockControlsPlugin + NativePurchasesPlugin
 * - Normalizes Windows backslashes in Package.swift paths
 *
 * Usage: node scripts/ios-remove-stripe.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const spmPackagePath = join(root, 'ios', 'App', 'CapApp-SPM', 'Package.swift')
const capAppSpmSwiftPath = join(root, 'ios', 'App', 'CapApp-SPM', 'Sources', 'CapApp-SPM', 'CapApp-SPM.swift')
const podfilePath = join(root, 'ios', 'App', 'Podfile')
const LOCAL_REPLOCK_CONTROLS_PATH = '../LocalPackages/RepLockControls'
const LOCAL_CAPGO_NATIVE_PURCHASES_PATH = '../LocalPackages/CapgoNativePurchases'

const REQUIRED_LOCAL_PACKAGES = [
  { name: 'RepLockControls', path: LOCAL_REPLOCK_CONTROLS_PATH },
  { name: 'CapgoNativePurchases', path: LOCAL_CAPGO_NATIVE_PURCHASES_PATH },
]

const REQUIRED_PRODUCTS = [
  { product: 'RepLockControls', package: 'RepLockControls' },
  { product: 'CapgoNativePurchases', package: 'CapgoNativePurchases' },
]

const spmPackageRemovals = [
  /^\s*\.package\(name: "CapacitorCommunityStripe".*\n/gm,
  /^\s*\.product\(name: "CapacitorCommunityStripe".*\n/gm,
  /^\s*\.package\(name: "CapacitorStatusBar".*\n/gm,
  /^\s*\.product\(name: "CapacitorStatusBar".*\n/gm,
  /^\s*\.package\(name: "CapacitorSplashScreen".*\n/gm,
  /^\s*\.product\(name: "CapacitorSplashScreen".*\n/gm,
]

function ensureLocalPackage(pkg, { name, path }) {
  const line = `.package(name: "${name}", path: "${path}")`
  const existing = new RegExp(`\\.package\\(name: "${name}", path: "[^"]+"\\)`)
  if (existing.test(pkg)) {
    return pkg.replace(existing, line)
  }
  return pkg.replace(/dependencies: \[\r?\n/, `dependencies: [\n        ${line},\n`)
}

function ensureProduct(pkg, { product, package: packageName }) {
  const line = `.product(name: "${product}", package: "${packageName}")`
  if (pkg.includes(line)) return pkg
  return pkg.replace(
    /\.product\(name: "Cordova", package: "capacitor-swift-pm"\)/,
    (match) => `${match},\n                ${line}`
  )
}

function ensureMinimumIos16(pkg) {
  return pkg.replace(/platforms: \[\.iOS\(\.v15\)\]/, 'platforms: [.iOS(.v16)]')
}

function ensureLocalPackagesAndProducts(pkg) {
  pkg = ensureMinimumIos16(pkg)
  for (const entry of REQUIRED_LOCAL_PACKAGES) {
    pkg = ensureLocalPackage(pkg, entry)
  }
  for (const entry of REQUIRED_PRODUCTS) {
    pkg = ensureProduct(pkg, entry)
  }
  return pkg
}

function ensureCapAppSpmImports() {
  if (!existsSync(capAppSpmSwiftPath)) {
    console.log('No CapApp-SPM.swift — skip import patch')
    return false
  }

  const requiredImports = ['import RepLockControlsPlugin', 'import NativePurchasesPlugin']
  let content = readFileSync(capAppSpmSwiftPath, 'utf8')
  const before = content

  content = content
    .replace(/^import CapgoNativePurchases\r?\n/gm, '')
    .replace(/^import RepLockControls\r?\n/gm, '')

  for (const requiredImport of requiredImports) {
    if (!content.includes(requiredImport)) {
      content = `${requiredImport}\n${content}`
    }
  }

  if (!content.includes('public let isCapacitorApp = true')) {
    content = content.trimEnd() + '\npublic let isCapacitorApp = true\n'
  }

  if (content !== before) {
    writeFileSync(capAppSpmSwiftPath, content)
    console.log('Patched CapApp-SPM.swift (RepLockControls + NativePurchases)')
    return true
  }

  console.log('CapApp-SPM.swift already up to date')
  return false
}

let changed = false

if (existsSync(spmPackagePath)) {
  let pkg = readFileSync(spmPackagePath, 'utf8')
  const before = pkg
  for (const pattern of spmPackageRemovals) {
    pkg = pkg.replace(pattern, '')
  }
  pkg = pkg.replace(/path: "([^"]*)"/g, (_, p) => `path: "${p.replace(/\\/g, '/')}"`)
  pkg = ensureLocalPackagesAndProducts(pkg)
  if (pkg !== before) {
    writeFileSync(spmPackagePath, pkg)
    console.log('Patched CapApp-SPM/Package.swift (RepLockControls + CapgoNativePurchases, iOS 16+)')
    changed = true
  } else {
    console.log('CapApp-SPM/Package.swift already up to date')
  }
} else {
  console.log('No ios/App/CapApp-SPM/Package.swift — skip SPM patch')
}

if (ensureCapAppSpmImports()) {
  changed = true
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

console.log(
  '\nNote: Native Apple IAP (CapgoNativePurchases) and app blocking (RepLockControls) are linked via local SPM packages.'
)
