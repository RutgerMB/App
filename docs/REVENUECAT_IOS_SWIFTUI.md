# RevenueCat iOS — Native Swift Package + SwiftUI

RepLock ships a **native RevenueCat layer** (Swift Package Manager + SwiftUI Paywall + Customer Center) alongside the existing **Capacitor JS layer** (`@revenuecat/purchases-capacitor`).

| Layer | Path | Purpose |
|-------|------|---------|
| Native Swift SPM | `ios/App/LocalPackages/RepLockRevenueCat/` | RevenueCat SDK, PaywallView, Customer Center, Capacitor bridge |
| Capacitor JS | `src/lib/revenuecat.ts` | React pricing page, package fetch, purchase/restore |
| JS → Native bridge | `src/lib/replock-revenuecat-native.ts` | Present native paywall / customer center from React |

Both layers share the same RevenueCat `Purchases.shared` singleton and entitlement identifier **`pro`** (dashboard display name: **RepLocks Pro**).

---

## 1. Prerequisites

- macOS with **Xcode 15+** (iOS 16 deployment target)
- Apple Developer account with **In-App Purchase** capability enabled
- RevenueCat project with iOS app `app.replock.bleeker`
- Test API key: `test_cSXFKgGWQiSeYSJqQpUrEKbhwCi`

---

## 2. RevenueCat dashboard setup

### 2.1 App

1. RevenueCat → **Project** → **Apps** → Add iOS app
2. Bundle ID: `app.replock.bleeker`
3. Copy the **public iOS API key** (test key above for sandbox)

### 2.2 Entitlement

| Field | Value |
|-------|-------|
| Identifier | `pro` |
| Display name | RepLocks Pro |

> Must match `REVENUECAT_ENTITLEMENT` in `src/types/index.ts` and `RepLockRevenueCatConstants.entitlementIdentifier` in Swift.

### 2.3 Products (App Store Connect)

| Product ID | Type | Price |
|------------|------|-------|
| `replock_pro_monthly` | Auto-renewable subscription | €7.99/mo |
| `replock_pro_yearly` | Auto-renewable subscription | €59.99/yr |

Link both products to the **`pro`** entitlement in RevenueCat.

### 2.4 Offering

Create offering **`default`** (current):

| Package | Product |
|---------|---------|
| `$rc_monthly` | `replock_pro_monthly` |
| `$rc_annual` | `replock_pro_yearly` |

Set **annual** as the default package for best conversion.

### 2.5 Paywall (server-driven UI)

1. RevenueCat → **Paywalls** → Create paywall for offering `default`
2. Pick a template or use the AI editor
3. Publish — no app update required for design changes

Requires RevenueCat iOS SDK **≥ 5.27.1** (configured in `RepLockRevenueCat/Package.swift`).

### 2.6 Customer Center

1. RevenueCat → **Customer Center** → Enable for iOS
2. Configure restore, manage subscription, and refund flows
3. Requires RevenueCatUI **≥ 5.14.0**

---

## 3. Swift Package Manager installation

### 3.1 What is already in the repo

The repo adds RevenueCat via a **local SPM wrapper** at:

```
ios/App/LocalPackages/RepLockRevenueCat/
```

`Package.swift` pulls the official SPM mirror:

```
https://github.com/RevenueCat/purchases-ios-spm.git  (from 5.27.1)
```

Products linked: **`RevenueCat`** + **`RevenueCatUI`**.

The package is wired into Capacitor through `ios/App/CapApp-SPM/Package.swift` and survives `npx cap sync ios` via `scripts/ios-remove-stripe.mjs`.

### 3.2 Manual Xcode verification (required on Mac)

After cloning or syncing:

```bash
npm run cap:ios:sync
# or: npx cap sync ios && node scripts/ios-remove-stripe.mjs
```

Then in Xcode:

1. Open `ios/App/App.xcodeproj`
2. Confirm **Package Dependencies** includes:
   - `CapApp-SPM` (local)
   - `purchases-ios-spm` (remote, transitive via RepLockRevenueCat)
3. **File → Packages → Reset Package Caches**
4. **Product → Clean Build Folder** (⇧⌘K)
5. Build on a device or simulator (StoreKit requires signed builds for real purchases)

### 3.3 Alternative: add RevenueCat directly to App target

If the local package approach fails, add manually:

1. **File → Add Package Dependencies…**
2. URL: `https://github.com/RevenueCat/purchases-ios-spm.git`
3. Dependency rule: **Up to Next Major** `5.0.0 < 6.0.0`
4. Add products: **RevenueCat**, **RevenueCatUI**
5. Target: **App**

Prefer the repo's local package — it keeps Capacitor plugin registration consistent.

### 3.4 API key configuration

**Default (repo):** `RepLockRevenueCatConstants.defaultAPIKey` = test key.

**Production override:** add to `ios/App/App/Info.plist`:

```xml
<key>REVENUECAT_API_KEY</key>
<string>appl_your_production_key</string>
```

**JS layer:** set in `.env`:

```env
VITE_REVENUECAT_API_KEY_IOS=test_cSXFKgGWQiSeYSJqQpUrEKbhwCi
```

Use the same key in both places for consistent customer records.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React (Capacitor WebView)                                  │
│  src/lib/revenuecat.ts          — purchases-capacitor       │
│  src/lib/replock-revenuecat-native.ts — native bridge       │
└──────────────────────────┬──────────────────────────────────┘
                           │ Capacitor bridge
┌──────────────────────────▼──────────────────────────────────┐
│  RepLockRevenueCatPlugin (Capacitor)                        │
│  RevenueCatManager — configure, purchase, entitlements      │
│  RepLockPaywallView — RevenueCatUI PaywallView              │
│  RepLockCustomerCenterView — CustomerCenterView             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  RevenueCat SDK (Purchases.shared) + StoreKit 2             │
└─────────────────────────────────────────────────────────────┘
```

**Configuration timing:** `RepLockRevenueCatPlugin.load()` calls `RevenueCatManager.shared.configure()` when Capacitor loads plugins. For earlier init, call `configureRepLockRevenueCat()` from `CapApp-SPM` in `AppDelegate`.

---

## 5. Swift source files (in repo)

| File | Role |
|------|------|
| `RepLockRevenueCatConstants.swift` | API key, entitlement `pro`, product IDs |
| `RevenueCatManager.swift` | Singleton: configure, purchase, restore, entitlements |
| `SubscriptionViewModel.swift` | ObservableObject for custom UI (optional) |
| `RepLockPaywallView.swift` | `PaywallView` + `CustomerCenterView` wrappers |
| `PaywallPresenter.swift` | UIKit sheet presentation from Capacitor |
| `RepLockRevenueCatPlugin.swift` | Capacitor bridge (`RepLockRevenueCat` JS name) |

---

## 6. Code examples

### 6.1 RevenueCatManager — configuration & entitlements

```swift
import RevenueCat

// Called automatically in RepLockRevenueCatPlugin.load()
@MainActor
RevenueCatManager.shared.configure(appUserID: nil)

// After Firebase sign-in
let info = try await RevenueCatManager.shared.logIn(appUserID: firebaseUID)

// Check RepLocks Pro
let isPro = RevenueCatManager.shared.hasProEntitlement()
// or refresh from network:
let info = try await RevenueCatManager.shared.refreshCustomerInfo()
```

### 6.2 Purchase monthly / yearly

```swift
do {
    let info = try await RevenueCatManager.shared.purchase(period: "yearly")
    print("Pro active:", RevenueCatManager.shared.hasProEntitlement())
} catch let error as RevenueCatManagerError {
    switch error {
    case .packageUnavailable(let period):
        print("\(period) not in current offering")
    case .purchaseSucceededWithoutEntitlement:
        print("Purchase OK but entitlement missing — check dashboard")
    case .underlying(let underlying):
        print("StoreKit error:", underlying.localizedDescription)
    default:
        print(error.localizedDescription)
    }
}
```

### 6.3 Restore purchases

```swift
let info = try await RevenueCatManager.shared.restorePurchases()
let restored = RevenueCatManager.shared.hasProEntitlement()
```

### 6.4 RevenueCat Paywall (SwiftUI)

```swift
import SwiftUI
import RevenueCatUI

struct ContentView: View {
    @State private var showPaywall = false

    var body: some View {
        Button("Upgrade") { showPaywall = true }
            .sheet(isPresented: $showPaywall) {
                RepLockPaywallView()
            }
    }
}
```

**Entitlement-gated (built-in modifier):**

```swift
ContentView()
    .presentPaywallIfNeeded(requiredEntitlementIdentifier: "pro")
```

**RepLock wrapper with Customer Center button:**

```swift
RepLockPaywallView()  // includes Close + Manage subscription
```

### 6.5 Customer Center

```swift
import SwiftUI

struct SettingsView: View {
    @State private var showCenter = false

    var body: some View {
        Button("Manage Subscription") { showCenter = true }
            .sheet(isPresented: $showCenter) {
                RepLockCustomerCenterView()
            }
    }
}
```

### 6.6 Present from UIKit / Capacitor

```swift
PaywallPresenter.presentPaywall()
PaywallPresenter.presentCustomerCenter()
```

### 6.7 AppDelegate early configuration (optional)

```swift
import UIKit
import CapApp_SPM  // module name may vary — check Xcode autocomplete

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        configureRepLockRevenueCat()
        return true
    }
}
```

### 6.8 Settings integration (React / Capacitor)

On iOS, Settings opens the native paywall or Customer Center:

```typescript
// src/pages/Settings.tsx
import {
  isNativeRevenueCatAvailable,
  presentNativePaywall,
  presentNativeCustomerCenter,
} from '@/lib/replock-revenuecat-native'

// Subscription row: paywall if free, Customer Center if Pro
if (isNativeRevenueCatAvailable()) {
  profile.isPro ? await presentNativeCustomerCenter() : await presentNativePaywall()
} else {
  navigate('/pricing')
}
```

A dedicated **Manage subscription** row always calls `presentNativeCustomerCenter()` on iOS.

### 6.9 SubscriptionViewModel — custom SwiftUI plan picker

Use when you build your own plan picker instead of the server-driven paywall:

```swift
import SwiftUI
import RevenueCat

struct RepLockSubscriptionPlansView: View {
    @StateObject private var viewModel = SubscriptionViewModel()

    var body: some View {
        VStack(spacing: 16) {
            if viewModel.isPro {
                Label("RepLocks Pro active", systemImage: "checkmark.seal.fill")
            }

            if let yearly = viewModel.yearlyPackage {
                Button("Yearly — \(yearly.storeProduct.localizedPriceString)") {
                    Task { await viewModel.purchaseYearly() }
                }
            }

            if let monthly = viewModel.monthlyPackage {
                Button("Monthly — \(monthly.storeProduct.localizedPriceString)") {
                    Task { await viewModel.purchaseMonthly() }
                }
            }

            Button("Restore purchases") {
                Task { await viewModel.restore() }
            }

            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
        }
        .task {
            await viewModel.loadOfferings()
            await viewModel.refreshEntitlement()
        }
    }
}
```

---

## 7. JavaScript bridge (Capacitor)

Register plugin name: **`RepLockRevenueCat`**

```typescript
import {
  presentNativePaywall,
  presentNativeCustomerCenter,
  hasNativeProEntitlement,
  identifyNativeRevenueCatUser,
} from '@/lib/replock-revenuecat-native'

// Show native RevenueCat paywall from React
await presentNativePaywall()

// Customer Center (Settings)
await presentNativeCustomerCenter()

// Entitlement check
const isPro = await hasNativeProEntitlement()
```

**From Pricing page (example):**

```typescript
import { presentNativePaywall } from '@/lib/replock-revenuecat-native'

<button onClick={() => presentNativePaywall()}>
  View plans (native paywall)
</button>
```

---

## 8. Coexistence with `@revenuecat/purchases-capacitor`

| Concern | Approach |
|---------|----------|
| Double `configure()` | Safe — `RevenueCatManager` guards with `isConfigured`; Capacitor plugin uses same singleton |
| User identity | `identifyRevenueCatUser()` in `revenuecat.ts` also calls `identifyNativeRevenueCatUser()` on iOS |
| Purchase surface | **React Pricing** uses JS plugin; **native paywall** optional via `presentNativePaywall()` |
| Entitlement ID | Both use `pro` — keep dashboard + `src/types/index.ts` aligned |

**Recommended flow:**

1. User signs in → `initMobilePurchases(uid)` → JS + native `logIn`
2. Pricing page → `purchaseRevenueCatPackage()` (JS) **or** `presentNativePaywall()` (native UI)
3. Settings → `presentNativeCustomerCenter()` for subscription management
4. Server webhook (`server/revenuecat-webhook.ts`) remains source of truth for `isPro` in Firestore

---

## 9. Error handling best practices

1. **Never assume purchase = entitlement** — always verify `entitlements.active["pro"]`
2. **Handle user cancel** — StoreKit cancellation is not an error; map `ErrorCode.purchaseCancelledError` to a silent `RevenueCatManagerError.purchaseCancelled` (see `RevenueCatManager.purchase`)
3. **Refresh on foreground** — `PurchasesDelegate` in `RevenueCatManager` listens for `receivedUpdated`
4. **Log level** — `.debug` in DEBUG, `.warn` in Release
5. **Offerings empty** — means dashboard/App Store Connect misconfiguration, not a code bug
6. **Sandbox testing** — use Sandbox Apple ID; RevenueCat test key `test_…` for sandbox only

```swift
// Delegate receives subscription renewals, refunds, family sharing changes
extension RevenueCatManager: PurchasesDelegate {
    nonisolated public func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in self.applyCustomerInfo(customerInfo) }
    }
}
```

---

## 10. Testing checklist

- [ ] Xcode builds without SPM errors
- [ ] `RepLockRevenueCat` appears under CapApp-SPM dependencies
- [ ] Sandbox purchase activates `pro` entitlement
- [ ] Restore purchases works on second device
- [ ] Native paywall renders dashboard template
- [ ] Customer Center opens from paywall toolbar
- [ ] JS `purchaseRevenueCatPackage('yearly')` still works
- [ ] `identifyRevenueCatUser` syncs Firebase UID to both layers
- [ ] Webhook updates server `isPro` after purchase

---

## 11. Troubleshooting

| Symptom | Fix |
|---------|-----|
| SPM resolve fails | Reset package caches; check network; verify `purchases-ios-spm` URL |
| `cap sync` drops RepLockRevenueCat | Run `node scripts/ios-remove-stripe.mjs` |
| Paywall blank | Create + publish paywall for `default` offering in dashboard |
| Products not found | App Store Connect agreements; product IDs match `replock_pro_*` |
| Entitlement not active | Link products to `pro` entitlement in RevenueCat |
| Plugin not found in JS | Rebuild iOS app; confirm `CapApp-SPM.swift` imports `RepLockRevenueCatPlugin` |
| Duplicate configure warning | Ignore if both layers init — singleton is idempotent |

---

## 12. Production checklist

1. Replace test API key with `appl_…` production key (Info.plist + `.env`)
2. Verify App Store Connect subscriptions are **Ready to Submit**
3. Upload App Store review subscription screenshot (`docs/app-store/`)
4. Configure RevenueCat webhook → `server/revenuecat-webhook.ts`
5. Set `REVENUECAT_WEBHOOK_SECRET` on server
6. Remove `APPLE_IAP_VERIFY_SKIP` if set

---

## 13. File reference

```
ios/App/LocalPackages/RepLockRevenueCat/
  Package.swift
  ios/Sources/RepLockRevenueCatPlugin/
    RepLockRevenueCatConstants.swift
    RevenueCatManager.swift
    SubscriptionViewModel.swift
    RepLockPaywallView.swift
    PaywallPresenter.swift
    RepLockRevenueCatPlugin.swift

ios/App/CapApp-SPM/
  Package.swift                    # links RepLockRevenueCat
  Sources/CapApp-SPM/CapApp-SPM.swift

src/lib/revenuecat.ts              # Capacitor JS purchases
src/lib/replock-revenuecat-native.ts
src/lib/mobile-purchases.ts
scripts/ios-remove-stripe.mjs      # post-sync SPM patcher
```

**External docs:**

- [RevenueCat iOS installation](https://www.revenuecat.com/docs/getting-started/installation/ios)
- [Paywalls](https://www.revenuecat.com/docs/tools/paywalls)
- [Customer Center iOS](https://www.revenuecat.com/docs/tools/customer-center/customer-center-integration-ios)
