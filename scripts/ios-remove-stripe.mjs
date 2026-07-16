#!/usr/bin/env node
/**
 * Post-process iOS project after `npx cap sync ios`.
 * - Removes Stripe/StatusBar/SplashScreen SPM entries (web-only on iOS)
 * - Re-injects RepLockControls + CapgoNativePurchases + RepLockRevenueCat (cap sync wipes local SPM plugins)
 * - Ensures CapApp-SPM.swift imports + force-links plugin classes
 * - Injects local plugin class names into capacitor.config.json packageClassList
 *   (Capacitor only auto-registers plugins listed there via NSClassFromString)
 * - Normalizes Windows backslashes in Package.swift paths
 *
 * Usage: node scripts/ios-remove-stripe.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const spmPackagePath = join(root, 'ios', 'App', 'CapApp-SPM', 'Package.swift')
const capAppSpmSwiftPath = join(root, 'ios', 'App', 'CapApp-SPM', 'Sources', 'CapApp-SPM', 'CapApp-SPM.swift')
const capacitorConfigJsonPath = join(root, 'ios', 'App', 'App', 'capacitor.config.json')
const podfilePath = join(root, 'ios', 'App', 'Podfile')
const LOCAL_REPLOCK_CONTROLS_PATH = '../LocalPackages/RepLockControls'
const LOCAL_CAPGO_NATIVE_PURCHASES_PATH = '../LocalPackages/CapgoNativePurchases'

const LOCAL_REPLOCK_REVENUECAT_PATH = '../LocalPackages/RepLockRevenueCat'
const LOCAL_REVENUECAT_PURCHASES_CAPACITOR_PATH = '../LocalPackages/RevenuecatPurchasesCapacitor'

const REQUIRED_LOCAL_PACKAGES = [
  { name: 'RepLockControls', path: LOCAL_REPLOCK_CONTROLS_PATH },
  { name: 'CapgoNativePurchases', path: LOCAL_CAPGO_NATIVE_PURCHASES_PATH },
  { name: 'RepLockRevenueCat', path: LOCAL_REPLOCK_REVENUECAT_PATH },
  { name: 'RevenuecatPurchasesCapacitor', path: LOCAL_REVENUECAT_PURCHASES_CAPACITOR_PATH },
]

const REQUIRED_PRODUCTS = [
  { product: 'RepLockControls', package: 'RepLockControls' },
  { product: 'CapgoNativePurchases', package: 'CapgoNativePurchases' },
  { product: 'RepLockRevenueCat', package: 'RepLockRevenueCat' },
  { product: 'RevenuecatPurchasesCapacitor', package: 'RevenuecatPurchasesCapacitor' },
]

/** ObjC @objc names Capacitor looks up in packageClassList */
const REQUIRED_PACKAGE_CLASS_LIST = [
  'RepLockControlsPlugin',
  'NativePurchasesPlugin',
  'PurchasesPlugin',
  'RepLockRevenueCatPlugin',
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

const PLUGIN_FORCE_LINK_MARKER = '// CAP_PLUGIN_FORCE_LINK'

const CAP_APP_SPM_FORCE_LINK_BLOCK = `public let isCapacitorApp: Bool = {
    CapAppLocalPlugins.touch()
    return true
}
${PLUGIN_FORCE_LINK_MARKER}
enum CapAppLocalPlugins {
    static func touch() {
        _ = RepLockControlsPlugin.self
        _ = NativePurchasesPlugin.self
        _ = RepLockRevenueCatPlugin.self
    }
}
`

function ensureCapAppSpmImports() {
  if (!existsSync(capAppSpmSwiftPath)) {
    console.log('No CapApp-SPM.swift — skip import patch')
    return false
  }

  const requiredImports = [
    'import RepLockControlsPlugin',
    'import NativePurchasesPlugin',
    'import RepLockRevenueCatPlugin',
  ]
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

  // Strip any previous isCapacitorApp / force-link definitions so re-runs stay idempotent.
  content = content
    .replace(/\r\n/g, '\n')
    .replace(/\n*public let isCapacitorApp(?:: Bool)?\s*=\s*(?:true|\{[\s\S]*?\n\})\s*/g, '\n')
    .replace(
      new RegExp(
        `\\n*${PLUGIN_FORCE_LINK_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\nenum CapAppLocalPlugins \\{[\\s\\S]*?\\n\\}\\s*`,
        'g'
      ),
      '\n'
    )
    .replace(/\n*@objc public enum CapAppLocalPlugins[\\s\\S]*?\\n\\}\\s*/g, '\n')
    .trimEnd()

  // Preserve trailing helpers (e.g. configureRepLockRevenueCat) after the force-link block.
  const helperMatch = content.match(/\n(\/\/\/[^\n]*\n)?public func configureRepLockRevenueCat[\s\S]*$/)
  let helpers = ''
  if (helperMatch) {
    helpers = helperMatch[0].replace(/^\n+/, '\n\n')
    content = content.slice(0, helperMatch.index).trimEnd()
  }

  content = `${content}\n\n${CAP_APP_SPM_FORCE_LINK_BLOCK.trimEnd()}${helpers}\n`

  if (content !== before) {
    writeFileSync(capAppSpmSwiftPath, content)
    console.log('Patched CapApp-SPM.swift (imports + force-link RepLockControls / NativePurchases / RepLockRevenueCat)')
    return true
  }

  console.log('CapApp-SPM.swift already up to date')
  return false
}

function ensurePackageClassList() {
  if (!existsSync(capacitorConfigJsonPath)) {
    console.log('No capacitor.config.json — skip packageClassList patch (run cap sync first)')
    return false
  }

  let config
  try {
    const raw = readFileSync(capacitorConfigJsonPath, 'utf8').replace(/^\uFEFF/, '')
    config = JSON.parse(raw)
  } catch (err) {
    console.warn('Could not parse capacitor.config.json:', err)
    return false
  }

  const existing = Array.isArray(config.packageClassList) ? config.packageClassList : []
  const merged = [...existing]
  let added = false
  for (const className of REQUIRED_PACKAGE_CLASS_LIST) {
    if (!merged.includes(className)) {
      merged.push(className)
      added = true
    }
  }

  if (!added) {
    console.log('capacitor.config.json packageClassList already includes local plugins')
    return false
  }

  config.packageClassList = merged
  writeFileSync(capacitorConfigJsonPath, `${JSON.stringify(config, null, '\t')}\n`)
  console.log(
    `Patched capacitor.config.json packageClassList (+ ${REQUIRED_PACKAGE_CLASS_LIST.filter((c) => !existing.includes(c)).join(', ')})`
  )
  return true
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
    console.log('Patched CapApp-SPM/Package.swift (RepLockControls + CapgoNativePurchases + RepLockRevenueCat + RevenuecatPurchasesCapacitor, iOS 16+)')
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

if (ensurePackageClassList()) {
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
  '\nNote: Native Apple IAP (CapgoNativePurchases), RevenueCat Capacitor (RevenuecatPurchasesCapacitor), RevenueCat SwiftUI (RepLockRevenueCat), and app blocking (RepLockControls) are linked via local SPM packages.'
)
