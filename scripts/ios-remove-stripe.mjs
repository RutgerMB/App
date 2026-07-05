#!/usr/bin/env node
/**
 * Post-process iOS project after `npx cap sync ios`.
 * - Vendors @capgo/native-purchases into ios/App/LocalPackages (Mac has no node_modules)
 * - Patches native-purchases for Xcode 15.4 (STOREKIT_26_5 probe + winBack SDK gate)
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

/** Xcode 15.4 compatibility patches for vendored @capgo/native-purchases */
function patchNativePurchasesForXcode154(baseDir) {
  const patches = [
    {
      rel: 'Package.swift',
      from: `func hasStoreKit265SDK() -> Bool {
    let environment = ProcessInfo.processInfo.environment
    let developerDirs = [
        environment["DEVELOPER_DIR"],
        "/Applications/Xcode.app/Contents/Developer"
    ].compactMap { $0 }
    var sdkRoots = [environment["SDKROOT"]].compactMap { $0 }`,
      to: `func hasStoreKit265SDK() -> Bool {
    // Only inspect the active Xcode/SDK for this build. Probing /Applications/Xcode.app
    // can enable STOREKIT_26_5 when a newer Xcode is installed but xcode-select points
    // at Xcode 15.x — that mismatch causes dozens of compile errors in this target.
    let environment = ProcessInfo.processInfo.environment
    guard environment["DEVELOPER_DIR"] != nil || environment["SDKROOT"] != nil else {
        return false
    }
    let developerDirs = [environment["DEVELOPER_DIR"]].compactMap { $0 }
    var sdkRoots = [environment["SDKROOT"]].compactMap { $0 }`,
    },
    {
      rel: 'CapgoNativePurchases.podspec',
      from: `def has_storekit_265_sdk?
  developer_dirs = [
    ENV['DEVELOPER_DIR'],
    '/Applications/Xcode.app/Contents/Developer'
  ].compact`,
      to: `def has_storekit_265_sdk?
  # Match Package.swift: only the active DEVELOPER_DIR / SDKROOT, not default Xcode.app.
  return false unless ENV['DEVELOPER_DIR'] || ENV['SDKROOT']

  developer_dirs = [ENV['DEVELOPER_DIR']].compact`,
    },
    {
      rel: 'ios/Sources/NativePurchasesPlugin/NativePurchasesPlugin.swift',
      from: `import Foundation
import Capacitor
import StoreKit`,
      to: `import Foundation
import UIKit
import Capacitor
import StoreKit`,
    },
    {
      rel: 'ios/Sources/NativePurchasesPlugin/Product+CapacitorPurchasesPlugin.swift',
      from: `        if self == .promotional {
            return 1
        }
        if #available(iOS 18.0, *), self == .winBack {
            return 2
        }`,
      to: `        if self == .promotional {
            return 1
        }
        #if swift(>=6.0)
        if #available(iOS 18.0, *), self == .winBack {
            return 2
        }
        #endif`,
    },
  ]

  let patched = 0
  for (const { rel, from, to } of patches) {
    const filePath = join(baseDir, rel)
    if (!existsSync(filePath)) continue
    const content = readFileSync(filePath, 'utf8')
    if (content.includes(to)) continue
    if (!content.includes(from)) {
      console.warn(`  skip ${rel} (upstream changed — re-check Xcode 15.4 patch)`)
      continue
    }
    writeFileSync(filePath, content.replace(from, to))
    patched++
  }
  if (patched > 0) {
    console.log(`Applied ${patched} Xcode 15.4 patch(es) to CapgoNativePurchases`)
  }
}

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

patchNativePurchasesForXcode154(nativePurchasesDest)

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
