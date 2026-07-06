# iPhone setup — what you do vs what’s already in the repo

RepLock’s **iOS blocking code is in the repo** (`ios/App/LocalPackages/RepLockControls/`).  
Apple still requires **you** to approve entitlements, configure Xcode, and test on a **physical iPhone**.

---

## What’s already done (in code)

- Native Capacitor plugin: `RepLockControls` (authorize, app picker, shields)
- TypeScript bridges: `src/lib/replock-controls.ts`, updated `device-apps.ts`, `app-blocker.ts`, `screen-time.ts`
- UI: iOS app picker in onboarding + Apps page, Screen Time authorize flow, blocker setup card
- Entitlements template: `ios/App/App/App.entitlements`
- SPM wiring: `ios/App/CapApp-SPM/Package.swift`

**Not yet in code (Phase 2–3, optional later):**

- Shield Configuration extension (custom block screen branding)
- Device Activity Monitor extension (schedules)
- Device Activity Report extension (real daily screen-time totals)

---

## Your checklist (on Mac)

### 1. Request Family Controls entitlement (one-time, Apple)

1. Go to [Apple Developer](https://developer.apple.com/account/resourcesIdentifiers/list) → Identifiers → **com.replock.app**
2. Enable **Family Controls** (or request access if prompted)
3. Explain use case: *digital wellbeing / self-control app that blocks user-selected distracting apps after workouts*
4. Wait for Apple approval (can take days)

Without this, Xcode builds that link `FamilyControls` may fail signing.

### 2. Open project in Xcode

```bash
npm run build
npx cap sync ios
open ios/App/App.xcodeproj
```

### 3. Link entitlements file

1. Select **App** target → **Signing & Capabilities**
2. Click **+ Capability** → **Family Controls**
3. Click **+ Capability** → **App Groups** → add `group.com.replock.app`
4. In **Build Settings**, set **Code Signing Entitlements** to `App/App.entitlements`

(If Xcode created its own entitlements file, merge the keys from `App.entitlements` into it.)

### 4. Signing

1. Select your **Team** (Apple Developer account)
2. Use a unique bundle id if needed: `com.replock.app`
3. Connect a **physical iPhone** (Simulator has limited Family Controls support)

### 5. Build & run

```bash
npx cap run ios --target <your-device-id>
```

Or Run (▶) in Xcode with your iPhone selected.

### 6. Test flow on device

1. **Onboarding** → Screen Time step → tap **Authorize Screen Time access** → approve Apple dialog
2. **Select apps** → **Choose apps to block** → pick Instagram/TikTok etc. in Apple’s picker
3. Finish onboarding → **Authorize Screen Time** prompt → shields should apply
4. Open a blocked app → Apple’s shield screen should appear
5. In RepLock, unlock with earned time → app should open until timer expires

### 7. If build fails

| Error | Fix |
|-------|-----|
| Family Controls entitlement missing | Complete step 1 |
| App Group mismatch | Same group on target: `group.com.replock.app` |
| SPM / Capacitor version | Use Xcode version compatible with Capacitor 8 (see `capacitor.config.ts` comment) |
| Plugin not found | `npx cap sync ios`, clean build folder in Xcode |

---

## What still uses estimates on iOS

- **Daily screen time number** in onboarding → still uses slider until Device Activity Report extension is added
- **App names** in list → show as “App 1”, “App 2” (Apple hides bundle names; icons need Shield extension / SwiftUI `Label`)

---

## RevenueCat

Keep `@capgo/native-purchases` for now. Switch to RevenueCat only if Apple IAP keeps breaking.

---

## Need help?

After step 1–4 on your Mac, if Xcode shows a specific error, send the exact message and we can fix the native project.
