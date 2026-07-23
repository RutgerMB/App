# Run RepLock on Android (Samsung / Pixel / emulator)

Physical phones need your **PC’s Wi‑Fi IP** baked into the app — same idea as `IOS_SETUP.md`. On a real Samsung, `127.0.0.1` is the phone itself, not your PC.

---

## Prerequisites

- Windows/Mac/Linux with this repo
- Android Studio (Hedgehog+ recommended)
- Samsung (or any Android 8+) on the **same Wi‑Fi** as the PC
- USB cable + **Developer options → USB debugging**
- Node.js 20+

---

## Step 1 — Install & start API

```bash
npm install
cp .env.example .env   # if you don't have .env yet
npm run dev
```

Leave this running. Note the Network IP Vite prints (e.g. `192.168.x.x`).

Optional for IAP testing later:

```env
VITE_REVENUECAT_API_KEY_ANDROID=goog_YOUR_PLAY_PUBLIC_SDK_KEY
```

---

## Step 2 — Sync the Android project

**New terminal:**

```bash
npm run cap:android:sync
```

This:

1. Detects your PC LAN IP
2. Writes `VITE_API_URL_NATIVE` into `.env.android-dev`
3. Builds the web UI
4. Runs `npx cap sync android` (wires RevenueCat, App, AppLauncher, LocalNotifications, Splash, StatusBar)

---

## Step 3 — Open Android Studio & run

```bash
npm run cap:android
```

1. Wait for Gradle sync
2. Plug in Samsung → accept USB debugging prompt
3. Select your phone in the device dropdown
4. Press **Run ▶** (debug build — cleartext LAN API is allowed)

First install: if Play Protect warns about unknown apps, allow this install.

---

## Step 4 — Permissions (required for parity with iPhone)

RepLock on Android needs **two** system permissions (iOS uses one Family Controls flow):

| Permission | Where | What it unlocks |
|------------|--------|-----------------|
| **Usage access** | Settings → Apps → Special access → Usage data access → **RepLock** | Screen-time stats / onboarding compare |
| **Accessibility** | Settings → Accessibility → Installed apps → **RepLock** | Lock screen when you open a blocked app |
| **Notifications** | System prompt or App info | Reminders |

### Samsung One UI extras

Battery can kill Accessibility overnight:

1. Settings → Apps → RepLock → Battery → **Unrestricted**
2. Disable “Put unused apps to sleep” / “Auto optimize” for RepLock if present
3. After reboot, confirm Accessibility is still **On**

---

## What should match iOS

| Feature | Android |
|---------|---------|
| Login / API | Same Express API via LAN HTTPS/HTTP |
| Pick apps | Installed-app list (searchable) |
| Lock apps | Accessibility overlay (emerald brand, same copy idea as iOS shield) |
| Earn unlocks | Same workout → minutes → unlock flow |
| Activity insights | Stronger than iOS (real UsageStats + block attempts) |
| Purchases | RevenueCat when `goog_…` key is set |

---

## Smoke test checklist

1. Login works (error must show `http://192.168.x.x:3001`, not only `127.0.0.1`)
2. Onboarding → open Usage Access → enable RepLock → Continue advances with real hours when available
3. Select apps from your phone’s list
4. Enable Accessibility when prompted
5. Open a locked app → emerald “is locked” screen → Open RepLock
6. Earn minutes → unlock → app opens temporarily
7. (Optional) Notifications toggle in Settings
8. (Optional) Pricing purchase/restore with Play license tester + RC Android key

---

## Troubleshooting

**API only tries `127.0.0.1` / login fails**  
Re-run `npm run cap:android:sync`, then Run ▶ again in Android Studio (don’t just reopen the old APK).

**RepLock missing from Usage Access list**  
Manifest must include `PACKAGE_USAGE_STATS` (already in repo). Clean/rebuild the app. On some Samsungs: Settings search “Usage data access”.

**Overlay never appears**  
Accessibility off, or Samsung battery restricted RepLock. Re-enable both.

**Purchases say “not configured”**  
Add `VITE_REVENUECAT_API_KEY_ANDROID=goog_…` to `.env`, re-run `cap:android:sync`.

**Emulator instead of phone**  
`10.0.2.2:3001` maps to the host PC. Usage Access / Accessibility are awkward on emulators — prefer a real Samsung.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run cap:android:sync` | LAN bake + Cap sync |
| `npm run cap:android:live` | Same + live reload from Vite |
| `npm run cap:android` | Open Android Studio |

Production / Play Store bake can reuse `VITE_API_URL=https://…` + `npm run build && npx cap sync android` once your API is live.
