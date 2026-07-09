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

### 1. Enable the right capabilities on your App ID

Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers** → select **`app.replock.bleeker`** (create it first if missing: App IDs → **+** → App → bundle id **`app.replock.bleeker`**).

> **Bundle ID note:** The iOS Xcode project uses **`app.replock.bleeker`** (see `ios/App/App.xcodeproj`). Android uses `com.replock.app`. Keep Xcode as `app.replock.bleeker` — do not change it to match the docs’ old `com.replock.app` example.

Under **Capabilities**, enable these:

| Capability | Enable now? | What RepLock uses it for |
|------------|-------------|--------------------------|
| **Family Controls (Development)** | **Yes — required** | Authorize Screen Time, show Apple’s app picker, apply shields (`ManagedSettings`). Lets you build and test on your own devices. |
| **Family Controls App and Website Usage** | **Optional for now** | Real app names/icons and daily usage totals (Phase 3). Often **missing from Xcode 15.4’s + Capability list** — that’s normal. Blocking works without it. |
| **App Groups** | **Yes — required** | Add `group.com.replock.fitness` so the main app and future extensions share picked apps + rules. |

> **App Group “not available”?** IDs are **globally unique** across all Apple developers. This repo uses `group.com.replock.fitness`. If you had to pick a different string, update `SelectionStore.swift` and `App.entitlements` to match.

**Do you need both Family Controls options?**

- **Blocking + picker only (minimum):** Family Controls **(Development)** alone is enough to start testing.
- **Full RepLock experience (blocking + real usage data):** enable **both** Family Controls **(Development)** and **Family Controls App and Website Usage**.

**Production (TestFlight / App Store):** Development entitlements are not enough for public release. Before submitting, request **distribution** approval for Family Controls (and App and Website Usage if enabled) — Apple reviews wellbeing apps. You can develop on device while that approval is pending.

Suggested justification when Apple asks:

> RepLock is a digital wellbeing app. Users voluntarily select distracting apps and earn screen time through workouts. We use Screen Time APIs only for self-control (individual authorization), not parental monitoring.

Save the App ID, then in Xcode: **Signing & Capabilities** → same capabilities → Xcode refreshes your provisioning profile.

### Xcode 15.4 — where is Signing & Capabilities?

This tab **does exist** in Xcode 15.4. You only see it after opening the **project** and selecting the **App target** (not a single file).

**1. Open the right file**

```bash
open ios/App/App.xcodeproj
```

Do **not** open only a folder or `Package.swift` — open **`App.xcodeproj`** (blue Xcode icon).

**2. Show the project navigator**

Menu: **View → Navigators → Project** (or press **⌘1**).

Left sidebar: click the **blue “App” icon at the very top** (the project root).

**3. Select the App *target* (critical)**

In the **center** panel you see two sections:

| Section | What it is | Select this? |
|---------|------------|--------------|
| **PROJECT** → App | The Xcode project container | ❌ No |
| **TARGETS** → App | The actual iPhone app | ✅ **Yes** |

Click **App** under **TARGETS** (row with the app icon).

**4. Open Signing & Capabilities**

At the top of the center panel you should see tabs:

`General` | **`Signing & Capabilities`** | `Resource Tags` | `Info` | `Build Settings` | `Build Phases` | `Build Rules`

Click **`Signing & Capabilities`**.

If you only see **General**, you selected **PROJECT** instead of **TARGET** — go back to step 3.

**5. Signing (top of that tab)**

- ✅ **Automatically manage signing**
- **Team** → your Apple Developer team (must show your name / company, not “None”)
- **Bundle Identifier** → `app.replock.bleeker` (leave what Xcode filled in)

**6. Add capabilities**

Click **+ Capability** (top left of the capabilities area, under the tabs).

Add one at a time:

1. **Family Controls** (or **Family Controls (Development)** if that’s the label)
2. **App Groups** → click **+** under App Groups → enter `group.com.replock.fitness`
3. If listed: **Family Controls App and Website Usage** (optional — skip if not in the list)

**If “App and Website Usage” never appears in Xcode 15.4:** You do **not** need it to test blocking. Only **Family Controls (Development)** + **App Groups** are required for Phase 1. Enable “App and Website Usage” on [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list) under your App ID if the checkbox exists there; otherwise add it later when you upgrade Xcode or build the usage-report extension.

**Build Settings step (yes — do this):** Even when capabilities look correct, link the entitlements file:

1. **TARGETS → App** → **Build Settings**
2. Search: `entitlements`
3. **Code Signing Entitlements** → `App/App.entitlements`

If the build fails with a provisioning error mentioning `app-and-website-usage`, open `App/App.entitlements` and **remove** the `com.apple.developer.family-controls.app-and-website-usage` key temporarily (blocking still works with only `family-controls` + App Group).

**7. Link entitlements file (if capabilities don’t appear)**

Some Xcode 15 setups don’t list Family Controls in **+ Capability** until the portal App ID is saved. You can still wire the file manually:

1. Select **App** target → **Build Settings** tab
2. Search: `entitlements`
3. **Code Signing Entitlements** → set to: `App/App.entitlements`

That file in the repo already contains Family Controls + App Group keys.

**8. Trust the developer on iPhone**

First install: iPhone **Settings → General → VPN & Device Management** → trust your developer certificate.

**9. Run on a physical iPhone**

Family Controls barely works in Simulator. Connect iPhone via USB → pick it in the device dropdown next to the Run ▶ button → Run.

**Xcode 15.4 + Capacitor note:** This repo uses Swift Package Manager for Capacitor 8. If the build fails on SPM/Capacitor errors, update Xcode when you can (Apple’s current toolchain works best with Capacitor 8). You can still complete signing/capabilities steps above on 15.4.


```bash
npm run build
npx cap sync ios
open ios/App/App.xcodeproj
```

### 3. Link entitlements file

1. Select **App** target → **Signing & Capabilities**
2. Click **+ Capability** → **Family Controls**
3. Click **+ Capability** → **App Groups** → add `group.com.replock.fitness`
4. In **Build Settings**, set **Code Signing Entitlements** to `App/App.entitlements`

(If Xcode created its own entitlements file, merge the keys from `App.entitlements` into it.)

### 4. Signing

1. Select your **Team** (Apple Developer account)
2. Bundle ID should stay **`app.replock.bleeker`** (must match your Apple Developer App ID)
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
| App Group mismatch | Same group on target: `group.com.replock.fitness` |
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

## Dev login on iPhone (cannot reach server)

On a **physical iPhone**, `127.0.0.1` is the phone itself — not your Mac. The app must know your Mac’s Wi‑Fi IP.

**1. On Mac, keep the API running**

```bash
npm run dev
```

Note the **Network** IP (e.g. `http://192.168.2.37:5174/`). API is always port **3001**.

**2. Update `.env.iphone-dev`**

```bash
ipconfig getifaddr en0
```

Set `VITE_API_URL_NATIVE=http://YOUR_MAC_IP:3001` (e.g. `http://192.168.2.37:3001`).

**3. Rebuild and sync iOS**

```bash
npm run cap:ios:sync
```

Then **Run ▶** again in Xcode (same Wi‑Fi as Mac).

**Optional live reload** (skip rebuild after every UI change):

```bash
CAPACITOR_DEV_SERVER=http://192.168.2.37:5174 npx cap sync ios
```

Use the port Vite actually prints (5173 or 5174). iPhone and Mac must be on the same Wi‑Fi.

---

## Need help?

After step 1–4 on your Mac, if Xcode shows a specific error, send the exact message and we can fix the native project.
