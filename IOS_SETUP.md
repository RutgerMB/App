# Run RepLock on Mac + iPhone (complete guide)

Your error (`tried: http://127.0.0.1:3001 only`) means the **iPhone app was never rebuilt** with your Mac’s Wi‑Fi IP. On a real iPhone, `127.0.0.1` is the phone itself — not your Mac.

Follow **every step** below on your **Mac** (not Windows).

---

## Prerequisites

- Mac with the project cloned (same repo as this guide)
- iPhone on the **same Wi‑Fi** as the Mac
- **Xcode 15.4+** (RepLock local SPM plugins use `errorHandler` + `CAPPluginCallError` for Xcode 15.4 compatibility with Capacitor 8 SPM)
- Signing set up (`app.replock.bleeker`, Family Controls, App Group `group.com.replock.fitness`)
- **iOS 16–18** on the test iPhone (Family Controls / app blocking requires iOS 16+; deployment target is 16.0)
- Node.js installed (`node -v`)

### Native iOS features

| Feature | Status |
|--------|--------|
| Login / API | Works (`npm run cap:ios:sync`) |
| Screen Time / app blocking | Native (`RepLockControls` local SPM plugin) |
| Apple In-App Purchase | Native (`CapgoNativePurchases` local SPM plugin) |

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

**You must run this after every `git pull`** that changes the web app, and whenever your Mac’s Wi‑Fi IP changes.

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

If it still fails, the error should now list **`http://192.168.x.x:3001`** in “tried:” — not only `127.0.0.1`.

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

| Step | Command | Must stay running? |
|------|---------|------------------|
| Dev servers | `npm run dev` | ✅ Yes (Terminal 1) |
| Test API | `curl http://YOUR_IP:3001/api/health` | — |
| Sync iPhone build | `npm run cap:ios:sync` | Run before each Xcode test |
| Xcode | Run ▶ on physical iPhone | — |

---

## Still broken?

**Error still only shows `127.0.0.1`**

You skipped Step 5 or ran Xcode without syncing. Run `npm run cap:ios:sync` again, then **Run ▶** in Xcode (not just reopening the app).

**Error shows your `192.168.x.x` but still fails**

- iPhone not on same Wi‑Fi as Mac
- Mac firewall blocking port 3001
- `npm run dev` not running

**Browser on Mac works, iPhone doesn’t**

That’s expected if you didn’t run `cap:ios:sync` — browser uses `localhost`, iPhone needs LAN IP.

**"Blocking plugin not loaded" (Screen Time / app blocking)**

`npx cap sync ios` resets `ios/App/CapApp-SPM/Package.swift` to Capacitor-only and drops local SPM plugins. The post-sync script (`scripts/ios-remove-stripe.mjs`, run automatically by `npm run cap:ios:sync`) re-adds **RepLockControls** and **CapgoNativePurchases**.

1. Run `npm run cap:ios:sync` (not just `npx cap sync ios` alone).
2. Open `ios/App/App.xcodeproj` in Xcode.
3. **Product → Clean Build Folder** (⇧⌘K) if you synced recently.
4. **Run ▶** on a **physical iPhone** (blocking does not work in Simulator).

If it still fails, in Xcode: **File → Packages → Reset Package Caches**, then Clean Build Folder and Run again.

**Swift compile errors (`NativePurchases`, StoreKit, or Capacitor plugin errors)**

1. Run `npm run cap:ios:sync` (pull latest first).
2. In Xcode: **File → Packages → Reset Package Caches**, **Clean Build Folder**, **Run ▶**.
3. Confirm **RepLockControls**, **RepLockRevenueCat**, and **CapgoNativePurchases** appear under SPM packages in the project navigator.
4. **`RepLockPluginBridge` / `initWithMessage:code:error:data:`** — removed. RepLock plugins are Swift-only; errors use `call.errorHandler(CAPPluginCallError(...))` instead of `call.reject` or an Obj-C bridge.
5. **StoreKit 2.6.5 symbol errors** — `CapgoNativePurchases` skips those APIs automatically on Xcode 15.x; use **Xcode 16+** only if you need StoreKit 2.6.5 features.

---

## Simulator vs physical iPhone

| Device | API URL |
|--------|---------|
| **Physical iPhone** | `http://MAC_LAN_IP:3001` (this guide) |
| **iOS Simulator** | `http://127.0.0.1:3001` can work if `npm run dev` runs on Mac |

Family Controls / app blocking only works properly on a **physical iPhone**.
