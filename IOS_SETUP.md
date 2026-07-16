# Run RepLock on Mac + iPhone (complete guide)

Your error (`tried: http://127.0.0.1:3001 only`) means the **iPhone app was never rebuilt** with your Mac’s Wi‑Fi IP. On a real iPhone, `127.0.0.1` is the phone itself — not your Mac.

Follow **every step** below on your **Mac** (not Windows).

---

## Prerequisites

- Mac with the project cloned (same repo as this guide)
- iPhone on the **same Wi‑Fi** as the Mac
- **Xcode 15.4+** (RepLock local SPM plugins use `RepLockPluginBridge` Obj-C helper for plugin call errors on Xcode 15.4 with Capacitor 8 SPM)
- Signing set up (`app.replock.bleeker`, Family Controls, App Group `group.com.replock.fitness`)
- **iOS 16–18** on the test iPhone (Family Controls / app blocking requires iOS 16+; deployment target is 16.0)
- Node.js installed (`node -v`)



### Native iOS features


| Feature                        | Status                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| Login / API                    | Works (`npm run cap:ios:sync`)                                                        |
| Screen Time / app blocking     | Native (`RepLockControls` local SPM plugin)                                           |
| Daily Screen Time totals (iOS) | Needs **DeviceActivityReport** extension target in Xcode (sources in repo; see below) |
| Apple In-App Purchase          | Native (`CapgoNativePurchases` local SPM plugin)                                      |


`CapgoNativePurchases` enables StoreKit 2.6.5 APIs only when the active Xcode SDK supports them — older Xcode builds skip those symbols automatically.

---



## Step 1 — Open Terminal on the Mac

```bash
cd ~/Documents/GitHub/App
```

(Use your actual clone path.)

---



## Step 2 — Install dependencies (once)

```bash
npm install
```

---



## Step 3 — Start the dev servers (leave this running)

**Terminal window 1:**

```bash
npm run dev
```

You should see:

```
🚀 RepLock server running on http://localhost:3001
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

**Leave this terminal open.** Note the `192.168.x.x` address — that’s your Mac on Wi‑Fi.

---



## Step 4 — Verify the API is reachable on your network

**Terminal window 2** (new tab):

Replace `192.168.x.x` with the IP from Step 3:

```bash
curl http://192.168.x.x:3001/api/health
```

Expected: `{"ok":true}` (or similar JSON).

If this **fails**:

- Mac firewall may block Node — **System Settings → Network → Firewall** → allow incoming for Node/Terminal, or turn firewall off temporarily for testing
- Make sure `npm run dev` is still running in Terminal 1

---



## Step 5 — Build & sync the iPhone app (fixes the login error)

Still in **Terminal 2**:

```bash
npm run cap:ios:sync
```

This script automatically:

1. Detects your Mac’s LAN IP
2. Writes it to `.env.iphone-dev` as `VITE_API_URL_NATIVE=http://YOUR_IP:3001`
3. Builds the web app with that URL baked in
4. Copies it into the Xcode iOS project

You should see `✓ Updated .env.iphone-dev` and `✅ Done`.

**You must run this after every** `git pull` that changes the web app, and whenever your Mac’s Wi‑Fi IP changes.

---



## Step 6 — Open Xcode and run on iPhone

```bash
open ios/App/App.xcodeproj
```

1. **TARGETS → App** (app icon, not folder)
2. **Signing & Capabilities** → your Team selected
3. Connect iPhone via USB
4. Select your **iPhone** in the device dropdown (not Simulator)
5. Press **Run ▶**

First install: on iPhone → **Settings → General → VPN & Device Management** → trust your developer certificate.

---



## Step 7 — Test login

1. Open RepLock on the iPhone
2. Try email login again

If it still fails, the error should now list `http://192.168.x.x:3001` in “tried:” — not only `127.0.0.1`.

---



## Optional — Live reload (UI updates without full rebuild)

**Terminal 1:** `npm run dev` (running)

**Terminal 2:**

```bash
npm run cap:ios:live
```

Then Run ▶ in Xcode. The app loads the UI from your Mac’s Vite server; API uses the same LAN IP automatically.

---



## Checklist (quick reference)


| Step              | Command                               | Must stay running?         |
| ----------------- | ------------------------------------- | -------------------------- |
| Dev servers       | `npm run dev`                         | ✅ Yes (Terminal 1)         |
| Test API          | `curl http://YOUR_IP:3001/api/health` | —                          |
| Sync iPhone build | `npm run cap:ios:sync`                | Run before each Xcode test |
| Xcode             | Run ▶ on physical iPhone              | —                          |


---



## Still broken?

**Error still only shows** `127.0.0.1`

You skipped Step 5 or ran Xcode without syncing. Run `npm run cap:ios:sync` again, then **Run ▶** in Xcode (not just reopening the app).

**Error shows your** `192.168.x.x` **but still fails**

- iPhone not on same Wi‑Fi as Mac
- Mac firewall blocking port 3001
- `npm run dev` not running

**Browser on Mac works, iPhone doesn’t**

That’s expected if you didn’t run `cap:ios:sync` — browser uses `localhost`, iPhone needs LAN IP.

### Do I need a local server?

- **Dev device builds** (`cap:ios:sync`): **Yes** — keep `npm run dev` running; the app uses your Mac’s LAN IP (`VITE_API_URL_NATIVE`).
- **Production / TestFlight builds** with `VITE_API_URL=https://YOUR-DEPLOYED-API` baked in at build time: **No** — the phone talks to the deployed API only. Production builds no longer fall back to `127.0.0.1`.

**"Blocking plugin not loaded" (Screen Time / app blocking)**

`npx cap sync ios` resets `ios/App/CapApp-SPM/Package.swift` and regenerates `capacitor.config.json`. Local plugins are **not** npm packages, so they disappear from Capacitor’s `packageClassList` unless re-injected. Capacitor only registers classes listed there (`NSClassFromString`).

`npm run cap:ios:sync` runs `scripts/ios-remove-stripe.mjs`, which:

- Re-adds **RepLockControls**, **CapgoNativePurchases**, **RepLockRevenueCat** to CapApp-SPM
- Injects `RepLockControlsPlugin` (and related) into `packageClassList`

1. Run `npm run cap:ios:sync` (not bare `npx cap sync ios`).
2. Open `ios/App/App.xcodeproj` in Xcode.
3. **Product → Clean Build Folder** (⇧⌘K).
4. **Run ▶** on a **physical iPhone** (Family Controls does not work in Simulator).
5. Tap **Authorize Screen Time** — Apple’s permission dialog should appear.

If it still fails: **File → Packages → Reset Package Caches**, Clean Build Folder, Run again. Confirm `ios/App/App/capacitor.config.json` includes `"RepLockControlsPlugin"` in `packageClassList`.

**"Screen Time was denied" after you tapped Allow**

Family Controls authorization is **not** the same toggle as Screen Time preferences. RepLock reads `AuthorizationCenter.shared.authorizationStatus` (`.approved` / `.denied` / `.notDetermined`).

1. Tap **Authorize Screen Time** in the app again (onboarding or Apps → blocking card). Apple’s dialog should appear once; after Allow, status should be **approved**.
2. If the toast still says denied: on the iPhone open **Settings → Screen Time** and ensure Screen Time is on. Look for RepLock / Family Controls restrictions and allow the app.
3. Return to RepLock (app re-checks on focus) and tap **Authorize Screen Time** again.
4. Approved ≠ apps picked: after authorization you still need Apple’s **app picker** to choose which apps to shield. That is normal and is **not** a denial.

**Why apps show as “App 1” / gray letter in the web UI**

Apple’s `ApplicationToken` is opaque — the host app **cannot** read the real app name, icon, or bundle ID into JavaScript. Family Controls only lets you render them with SwiftUI `Label(token)` on a **native** surface.

RepLock therefore:

1. Shows a native confirmation sheet after the picker (`Label(token)` = real name + icon)
2. Lets you type a **nickname** (and optional emoji) that is stored and shown in the WebView Apps tab
3. Offers **View real names & icons (system)** on the Apps page for the same native labels anytime

**Daily Screen Time totals (DeviceActivityReport)** — scaffold is in the repo; you must add the Xcode extension target once (next section). After that, onboarding “actual hours” reads from the App Group via `RepLockControls.getDailyScreenTimeHours`.

---



## DeviceActivityReport extension (one-time Mac / Apple Developer setup)

Apple does **not** let the main app process read OS Screen Time totals. A **Device Activity Report** extension receives usage data, writes today’s total minutes into App Group `group.com.replock.fitness`, and the main app reads them.

### What is already in the repo


| Path                                                                   | Role                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `ios/App/RepLockDeviceActivityReport/*.swift`                          | Extension sources (sum today’s activity → App Group) |
| `ios/App/RepLockDeviceActivityReport/*.entitlements`                   | Family Controls + App Group                          |
| `ios/App/LocalPackages/RepLockControls/.../ScreenTimeReportHost.swift` | Hosts a tiny `DeviceActivityReport` probe            |
| `RepLockControls.getDailyScreenTimeHours`                              | Triggers probe + returns hours/minutes to JS         |


**Not automated from Windows:** creating the `.appex` target and embedding it in `App.xcodeproj` (fragile to hand-edit). Do that once in Xcode on a Mac.

### A. Apple Developer portal

1. Open [developer.apple.com/account](https://developer.apple.com/account) → **Identifiers**.
2. Confirm App ID `app.replock.bleeker` has:
  - **Family Controls** (request approval if not yet granted; wellbeing / Screen Time justification)
  - **App Groups** → `group.com.replock.fitness`
3. **+** → Register a new **App ID** (type: App):
  - Description: `RepLock Device Activity Report`
  - Bundle ID (Explicit): `app.replock.bleeker.DeviceActivityReport`
  - Capabilities: **Family Controls**, **App Groups** → same group `group.com.replock.fitness`
4. If you use manual provisioning profiles, create a Development (and later Distribution) profile for the new App ID. With **AutomaticI do Signing** in Xcode this is usually unnecessary.
5. **Family Controls Development** (Xcode 15.4): for local device builds, Development Family Controls is enough once the capability is on both App IDs. Production/TestFlight still needs Apple’s Family Controls entitlement approval for the main app (and typically the extension).

Optional later (schedules / thresholds only — **not** needed for daily totals):

- App ID `app.replock.bleeker.DeviceActivityMonitor` + Device Activity Monitor extension.



### B. Add the target in Xcode (required)

```bash
cd ~/Documents/GitHub/App
git pull
npm run cap:ios:sync
open ios/App/App.xcodeproj
```

1. **File → New → Target…**
2. Choose **Device Activity Report Extension** (iOS) → Next.
3. Set:
  - **Product Name:** `RepLockDeviceActivityReport`
  - **Team:** same as App
  - **Bundle Identifier:** `app.replock.bleeker.DeviceActivityReport`
  - Language: Swift
  - Embed in Application: **App**
4. Activate the scheme if prompted.
5. **Delete** the template Swift files Xcode generated (keep the target).
6. In the Project Navigator, right-click the `RepLockDeviceActivityReport` group → **Add Files to "App"…** → select everything under `ios/App/RepLockDeviceActivityReport/` **except** `README.md` (`.swift`, `Info.plist`, `.entitlements`). Check **Add to targets: RepLockDeviceActivityReport** only.
7. Target **RepLockDeviceActivityReport** → **Signing & Capabilities**:
  - Team = same as App
  - **Automatically manage signing**
  - CODE_SIGN_ENTITLEMENTS = `RepLockDeviceActivityReport/RepLockDeviceActivityReport.entitlements`
  - Add capability **Family Controls** (if not pulled from entitlements file)
  - Add capability **App Groups** → `group.com.replock.fitness`
8. Target **App** → **General** → **Frameworks, Libraries, and Embedded Content** (or Build Phases → **Embed Foundation Extensions**): confirm `RepLockDeviceActivityReport.appex` is listed and **Embed & Sign**.
9. Deployment target **iOS 16.0** for the extension (same as App).
10. **Product → Clean Build Folder**, then **Run ▶** on a **physical iPhone**.

**Products in red** (`RepLockDeviceActivityReport.appex`) is OK until the first successful build of that target.

### If you see duplicates / Multiple commands produce

**What went wrong:** Xcode template files + manually adding repo files = each Swift file in **Compile Sources** twice; `Info.plist` also in **Copy Bundle Resources**.

**Fix on Mac:**

1. Select **RepLockDeviceActivityReport** target → **Build Phases**.
2. **Compile Sources:** only **ONE** of each: `TotalActivityReport.swift`, `TotalActivityView.swift`, `ScreenTimeSharedStore.swift` (or whatever repo files). Remove duplicates and remove Xcode template leftovers (e.g. a template `RepLockDeviceActivityReport.swift` if unused — keep the repo `@main` entry if that is your only copy).
3. **Copy Bundle Resources:** **REMOVE `Info.plist` entirely** (`Info.plist` is set via `INFOPLIST_FILE` build setting, not copied).
4. In **Project Navigator**, remove duplicate file references (delete reference only if the same file is listed twice; don’t delete the real repo files on disk).
5. Prefer referencing the repo folder `ios/App/RepLockDeviceActivityReport/` sources **once** — don’t keep both the template group **and** repo copies.
6. **Product → Clean Build Folder**, rebuild.



### C. Verify end-to-end

1. Authorize Screen Time in RepLock (Family Controls approved).
2. Open onboarding Screen Time permission / reveal step (or call `getDailyScreenTimeHours` from the Apps flow).
3. Native host embeds a 2×2pt `DeviceActivityReport`; the extension writes `replock.dailyScreenTime.*` into the App Group.
4. JS receives `{ hours, minutes, totalMinutes, source: "deviceActivityReport" }`.

If JS still gets no hours:

- Extension not embedded / wrong bundle ID
- Family Controls not approved on device
- App Group mismatch between App and extension
- Report context string mismatch (`RepLock.TotalActivity` must match host + extension)

**Mac rebuild after this fix**

```bash
git pull
npm run cap:ios:sync
# Xcode: Clean Build Folder (⇧⌘K), then Run ▶ on a physical iPhone
```

**Swift compile errors (**`NativePurchases`**, StoreKit, or Capacitor plugin errors)**

1. Run `npm run cap:ios:sync` (pull latest first).
2. In Xcode: **File → Packages → Reset Package Caches**, **Clean Build Folder**, **Run ▶**.
3. Confirm **RepLockControls**, **RepLockRevenueCat**, and **CapgoNativePurchases** appear under SPM packages in the project navigator.
4. `CAPPluginCallError` **/** `call.reject` **compile errors on Xcode 15.4** — RepLock plugins use `RepLockPluginBridge` (Obj-C) with `init:message:code:error:data:` (not `initWithMessage:…`). If that still fails, reset package caches and clean build. Last resort: resolve `{ "__repLockError": true, "message", "code" }` from native and treat `__repLockError` as reject in JS wrappers (see comment in `RepLockPluginBridge.m`).
5. **StoreKit 2.6.5 symbol errors** — `CapgoNativePurchases` skips those APIs automatically on Xcode 15.x; use **Xcode 16+** only if you need StoreKit 2.6.5 features.

---



## Simulator vs physical iPhone


| Device              | API URL                                                       |
| ------------------- | ------------------------------------------------------------- |
| **Physical iPhone** | `http://MAC_LAN_IP:3001` (this guide)                         |
| **iOS Simulator**   | `http://127.0.0.1:3001` can work if `npm run dev` runs on Mac |


Family Controls / app blocking only works properly on a **physical iPhone**.

---



## RevenueCat API key (required for IAP on device)

Physical iPhone + App Store **sandbox** needs the **App Store public SDK key** (`appl_…`), not the RevenueCat **Test Store** key (`test_…`).


| Key      | When to use                                                            |
| -------- | ---------------------------------------------------------------------- |
| `appl_…` | Real device / sandbox / TestFlight / App Store                         |
| `test_…` | RevenueCat Test Store simulator flow only — **not** StoreKit on iPhone |


**One-time setup on the Mac:**

1. [RevenueCat](https://app.revenuecat.com) → **Project** → **API keys**
2. Copy the **iOS** public key for bundle `app.replock.bleeker` (starts with `appl_`)
3. Add to gitignored `.env` (preferred) or `.env.iphone-dev`:

```bash
VITE_REVENUECAT_API_KEY_IOS=appl_YOUR_KEY_HERE
```

1. Re-run `npm run cap:ios:sync` — it copies the key into the Vite build and `Info.plist` so JS and native Swift use the same key. Sync **fails** if the key is missing or starts with `test_`.

Xcode warning *"Using a Test Store API key"* / *"No packages could be found for offering defaults"* means a `test_` key was still baked — fix the env and sync again.