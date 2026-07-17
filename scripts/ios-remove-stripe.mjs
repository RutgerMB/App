#!/usr/bin/env node
/**
 * Post-process iOS project after `npx cap sync ios`.
 * - Removes Stripe/StatusBar/SplashScreen/PushNotifications SPM entries (unused / Cap 8 SPM broken on Xcode 15.4)
 * - Redirects LocalNotifications to vendored LocalPackages (Xcode 15.4 patches)
 * - Re-injects RepLockControls + CapgoNativePurchases + RepLockRevenueCat (cap sync wipes local SPM plugins)
 * - Ensures CapApp-SPM.swift imports + force-links plugin classes
 * - Ensures packageClassList has local plugins and NEVER PushNotificationsPlugin
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
const pbxprojPath = join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')

const LOCAL_REPLOCK_CONTROLS_PATH = '../LocalPackages/RepLockControls'
const LOCAL_CAPGO_NATIVE_PURCHASES_PATH = '../LocalPackages/CapgoNativePurchases'
const LOCAL_REPLOCK_REVENUECAT_PATH = '../LocalPackages/RepLockRevenueCat'
const LOCAL_REVENUECAT_PURCHASES_CAPACITOR_PATH = '../LocalPackages/RevenuecatPurchasesCapacitor'
const LOCAL_LOCAL_NOTIFICATIONS_PATH = '../LocalPackages/CapacitorLocalNotifications'

const REQUIRED_LOCAL_PACKAGES = [
  { name: 'RepLockControls', path: LOCAL_REPLOCK_CONTROLS_PATH },
  { name: 'CapgoNativePurchases', path: LOCAL_CAPGO_NATIVE_PURCHASES_PATH },
  { name: 'RepLockRevenueCat', path: LOCAL_REPLOCK_REVENUECAT_PATH },
  { name: 'RevenuecatPurchasesCapacitor', path: LOCAL_REVENUECAT_PURCHASES_CAPACITOR_PATH },
  { name: 'CapacitorLocalNotifications', path: LOCAL_LOCAL_NOTIFICATIONS_PATH },
]

const REQUIRED_PRODUCTS = [
  { product: 'RepLockControls', package: 'RepLockControls' },
  { product: 'CapgoNativePurchases', package: 'CapgoNativePurchases' },
  { product: 'RepLockRevenueCat', package: 'RepLockRevenueCat' },
  { product: 'RevenuecatPurchasesCapacitor', package: 'RevenuecatPurchasesCapacitor' },
  { product: 'CapacitorLocalNotifications', package: 'CapacitorLocalNotifications' },
]

/** ObjC @objc names Capacitor looks up in packageClassList */
const REQUIRED_PACKAGE_CLASS_LIST = [
  'RepLockControlsPlugin',
  'NativePurchasesPlugin',
  'PurchasesPlugin',
  'RepLockRevenueCatPlugin',
  'LocalNotificationsPlugin',
]

/** Must never remain after sync — Cap 8 SPM fails on Xcode 15.4 */
const FORBIDDEN_PACKAGE_CLASS_LIST = [
  'PushNotificationsPlugin',
  'StatusBarPlugin',
  'SplashScreenPlugin',
]

/** Package / product names to strip from CapApp-SPM Package.swift (CRLF-safe, line-based) */
const SPM_STRIP_NAMES = [
  'CapacitorCommunityStripe',
  'CapacitorStatusBar',
  'CapacitorSplashScreen',
  'CapacitorPushNotifications',
]

const SPM_STRIP_PATH_SNIPPETS = [
  '@capacitor-community/stripe',
  '@capacitor/status-bar',
  '@capacitor/splash-screen',
  '@capacitor/push-notifications',
]

function stripSpmLines(pkg) {
  const nl = pkg.includes('\r\n') ? '\r\n' : '\n'
  const lines = pkg.split(/\r?\n/)
  const kept = lines.filter((line) => {
    if (SPM_STRIP_NAMES.some((name) => line.includes(`"${name}"`))) return false
    if (SPM_STRIP_PATH_SNIPPETS.some((snip) => line.includes(snip))) return false
    return true
  })
  // Drop trailing commas left on the previous dependency/product line before `]`
  for (let i = 0; i < kept.length - 1; i++) {
    const next = kept[i + 1].trim()
    if (next === '],' || next === ']') {
      kept[i] = kept[i].replace(/,(\s*)$/, '$1')
    }
  }
  return kept.join(nl)
}

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
  // Cap sync may have left a node_modules-backed product; ensure ours exists
  if (pkg.includes(`.product(name: "${product}", package: "${packageName}")`)) return pkg
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

// No IIFE (`}()`) — earlier templates stripped the closure but left stray `()` / `}()`,
// which Xcode reports as top-level expression / consecutive-statement errors.
const CAP_APP_SPM_FORCE_LINK_BLOCK = `public let isCapacitorApp: Bool = CapAppLocalPlugins.linkAndReturnTrue()

${PLUGIN_FORCE_LINK_MARKER}
enum CapAppLocalPlugins {
    static func touch() {
        _ = RepLockControlsPlugin.self
        _ = NativePurchasesPlugin.self
        _ = RepLockRevenueCatPlugin.self
        _ = LocalNotificationsPlugin.self
    }

    static func linkAndReturnTrue() -> Bool {
        touch()
        return true
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
    'import LocalNotificationsPlugin',
  ]
  let content = readFileSync(capAppSpmSwiftPath, 'utf8')
  const before = content

  content = content
    .replace(/^import CapgoNativePurchases\r?\n/gm, '')
    .replace(/^import RepLockControls\r?\n/gm, '')
    .replace(/^import CapacitorLocalNotifications\r?\n/gm, '')

  for (const requiredImport of requiredImports) {
    if (!content.includes(requiredImport)) {
      content = `${requiredImport}\n${content}`
    }
  }

  // Strip any previous isCapacitorApp / force-link definitions so re-runs stay idempotent.
  content = content
    .replace(/\r\n/g, '\n')
    .replace(
      /\n*public let isCapacitorApp(?:: Bool)?\s*=\s*(?:true|CapAppLocalPlugins\.[A-Za-z0-9_]+\(\)|\{[\s\S]*?\n\}(?:\(\))?)\s*/g,
      '\n'
    )
    .replace(/^\s*(?:\}\(\)|\(\))\s*$/gm, '')
    .replace(
      new RegExp(
        `\\n*${PLUGIN_FORCE_LINK_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\nenum CapAppLocalPlugins \\{[\\s\\S]*?\\n\\}\\s*`,
        'g'
      ),
      '\n'
    )
    .replace(/\n*(?:@objc\s+)?(?:public\s+)?enum CapAppLocalPlugins\s*\{[\s\S]*?\n\}\s*/g, '\n')
    .trimEnd()

  const helperMatch = content.match(/\n(\/\/\/[^\n]*\n)?public func configureRepLockRevenueCat[\s\S]*$/)
  let helpers = ''
  if (helperMatch) {
    helpers = helperMatch[0].replace(/^\n+/, '\n\n')
    content = content.slice(0, helperMatch.index).trimEnd()
  }

  content = `${content}\n\n${CAP_APP_SPM_FORCE_LINK_BLOCK.trimEnd()}${helpers}\n`

  if (content !== before) {
    writeFileSync(capAppSpmSwiftPath, content)
    console.log('Patched CapApp-SPM.swift (imports + force-link including LocalNotifications)')
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
  let merged = existing.filter((c) => !FORBIDDEN_PACKAGE_CLASS_LIST.includes(c))
  const removed = existing.filter((c) => FORBIDDEN_PACKAGE_CLASS_LIST.includes(c))
  let added = false
  for (const className of REQUIRED_PACKAGE_CLASS_LIST) {
    if (!merged.includes(className)) {
      merged.push(className)
      added = true
    }
  }

  const changed =
    added || removed.length > 0 || merged.length !== existing.length || merged.some((c, i) => c !== existing[i])

  if (!changed) {
    console.log('capacitor.config.json packageClassList already up to date (no Push)')
    return false
  }

  config.packageClassList = merged
  writeFileSync(capacitorConfigJsonPath, `${JSON.stringify(config, null, '\t')}\n`)
  const notes = []
  if (added) {
    notes.push(`+ ${REQUIRED_PACKAGE_CLASS_LIST.filter((c) => !existing.includes(c)).join(', ')}`)
  }
  if (removed.length) {
    notes.push(`- ${removed.join(', ')}`)
  }
  console.log(`Patched capacitor.config.json packageClassList (${notes.join('; ')})`)
  return true
}

function stripPodfile() {
  if (!existsSync(podfilePath)) return false
  let podfile = readFileSync(podfilePath, 'utf8')
  const before = podfile
  const pods = [
    'CapacitorCommunityStripe',
    'CapacitorStatusBar',
    'CapacitorSplashScreen',
    'CapacitorPushNotifications',
  ]
  for (const pod of pods) {
    podfile = podfile.replace(new RegExp(`^\\s*pod ['"]${pod}['"].*\\r?\\n`, 'gm'), '')
  }
  podfile = podfile.replace(/^\s*pod ['"]Stripe.*['"].*\r?\n/gm, '')
  if (podfile !== before) {
    writeFileSync(podfilePath, podfile)
    console.log('Removed plugin pods from Podfile')
    return true
  }
  return false
}

function stripPbxprojPush() {
  if (!existsSync(pbxprojPath)) return false
  let pbx = readFileSync(pbxprojPath, 'utf8')
  const before = pbx
  // Remove any stray PushNotifications product / package refs if Cap sync left them
  pbx = pbx.replace(/^[^\n]*PushNotifications[^\n]*\r?\n/gm, '')
  pbx = pbx.replace(/^[^\n]*push-notifications[^\n]*\r?\n/gm, '')
  if (pbx !== before) {
    writeFileSync(pbxprojPath, pbx)
    console.log('Removed PushNotifications refs from project.pbxproj')
    return true
  }
  return false
}

let changed = false

if (existsSync(spmPackagePath)) {
  let pkg = readFileSync(spmPackagePath, 'utf8')
  const before = pkg
  pkg = stripSpmLines(pkg)
  pkg = pkg.replace(/path: "([^"]*)"/g, (_, p) => `path: "${p.replace(/\\/g, '/')}"`)
  pkg = ensureLocalPackagesAndProducts(pkg)
  // After ensure, strip again in case Cap sync re-added Push alongside LocalNotifications
  pkg = stripSpmLines(pkg)
  if (pkg !== before) {
    writeFileSync(spmPackagePath, pkg)
    console.log(
      'Patched CapApp-SPM/Package.swift (stripped Push; LocalNotifications → LocalPackages; local plugins; iOS 16+)'
    )
    changed = true
  } else {
    console.log('CapApp-SPM/Package.swift already up to date')
  }

  // Hard verify — never leave Push in Package.swift
  const verify = readFileSync(spmPackagePath, 'utf8')
  if (/CapacitorPushNotifications|push-notifications/i.test(verify)) {
    console.error('ERROR: CapacitorPushNotifications still present in Package.swift after strip')
    process.exitCode = 1
  } else {
    console.log('Verified: CapApp-SPM/Package.swift has no PushNotifications')
  }
  if (!/LocalPackages\/CapacitorLocalNotifications/.test(verify)) {
    console.warn('WARN: CapacitorLocalNotifications is not pointing at LocalPackages')
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

if (stripPodfile()) {
  changed = true
}

if (stripPbxprojPush()) {
  changed = true
}

if (changed) {
  console.log('\nIn Xcode: File → Packages → Reset Package Caches, then Clean Build Folder (⇧⌘K)')
}

console.log(
  '\nNote: LocalNotifications is vendored under ios/App/LocalPackages/CapacitorLocalNotifications (Xcode 15.4 Cap 8 SPM patches). PushNotifications is stripped.'
)
