# Launching RepLock on iPhone & Android

This guide explains how to go from the current web app to downloadable apps on the **Apple App Store** and **Google Play Store**, and what's required for **real OS-level app blocking**.

---

## Current state vs. ultimate goal

| Capability | Web app (now) | Native app (goal) |
|------------|---------------|-------------------|
| Exercise tracking | ✅ Yes | ✅ Yes |
| Screen time balance | ✅ Yes | ✅ Yes |
| In-app lock status | ✅ Yes | ✅ Yes |
| **Block Instagram/TikTok at OS level** | ❌ No | ✅ Possible |

**The current RepLock is a mobile-first PWA.** It cannot prevent users from opening other apps on their phone — browsers and web apps are sandboxed and have no access to Screen Time or Android Usage Access.

**Real blocking requires a native shell** with platform-specific APIs (see below).

---

## Recommended path: React Native or Capacitor

Your React + TypeScript codebase can be wrapped for app stores:

### Option A — **Capacitor** (fastest path)
Keep most of your React web UI, wrap it in a native container.

1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init RepLock com.replock.app`
3. `npm run build` then `npx cap add ios` and `npx cap add android`
4. Open in Xcode / Android Studio
5. Add **native plugins** for app blocking (custom plugin or community)

**Pros:** Reuse 90% of current code  
**Cons:** OS blocking still needs custom native code

### Option B — **React Native + Expo** (best for blocking)
Rebuild UI in React Native for full native API access.

1. `npx create-expo-app replock-native`
2. Port screens and Zustand store
3. Use native modules for Screen Time / Usage Access
4. EAS Build for App Store / Play Store binaries

**Pros:** Full native control, best UX  
**Cons:** More rewrite effort

---

## iOS — App Store

### Requirements
- **Apple Developer Program** — €99/year → [developer.apple.com](https://developer.apple.com)
- Mac with **Xcode** (for building & signing)
- App icons, screenshots, privacy policy URL

### Real app blocking on iOS

Apple provides the **Family Controls** / **Screen Time API** (not third-party libraries like on AppBlock’s license screen):

| Framework | Purpose |
|-----------|---------|
| `FamilyControls` | User authorization + `FamilyActivityPicker` (user picks apps to limit) |
| `ManagedSettings` | Apply/remove shields (`ManagedSettingsStore.shield.applications`) |
| `DeviceActivity` | Schedules, thresholds, monitor extension callbacks |

**Apple constraints (different from Android):**

- You **cannot** list installed apps like `InstalledAppsPlugin` on Android — the user picks apps in Apple’s system picker.
- App identity is an opaque `ApplicationToken` (store encoded token in App Group, not bundle id).
- Total daily screen time is **not** one API call — needs a **Device Activity Report** extension (or keep estimate fallback).

**Entitlements & extensions (Xcode on Mac):**

1. Request `com.apple.developer.family-controls` from Apple (wellbeing justification).
2. App Group: `group.com.replock.fitness` on main app + extensions.
3. Extension targets: **Device Activity Report** (real usage totals — scaffold in `ios/App/RepLockDeviceActivityReport/`), **Device Activity Monitor** (enforce schedules, later), **Shield Configuration** (branded block screen, later).

**Repo status:** Android has `ScreenTimePlugin`, `InstalledAppsPlugin`, `AppBlockerPlugin`. iOS has `RepLockControls` (authorize, picker, shields, screen-time probe) + DeviceActivityReport **sources**; Xcode target must be added on Mac (see `IOS_SETUP.md`).

**Implementation phases (Capacitor 8 + LocalPackages SPM, mirror `CapgoNativePurchases`):**

| Phase | Work | Key paths |
|-------|------|-----------|
| 0 | Entitlement + App Group + `App.entitlements` | `ios/App/App/` |
| 1 | `RepLockControls` plugin: authorize + present `FamilyActivityPicker` | `ios/App/LocalPackages/RepLockControls/`, `src/lib/device-apps.ts`, `BlocklistPicker.tsx` |
| 2 | `ManagedSettings` shields + unlock flow | `src/lib/app-blocker.ts`, `BlockerSetupCard.tsx`, Shield Configuration extension |
| 3 | `DeviceActivityReport` for real screen time (+ Monitor later for schedules) | `ios/App/RepLockDeviceActivityReport/`, `src/lib/screen-time.ts`, onboarding reveal |

New iOS plugins go in **LocalPackages SPM** (same pattern as purchases); `capacitor.config.ts` `ios.includePlugins` currently lists only `@capgo/native-purchases`. Test on a **physical iPhone** — Simulator has limited Family Controls support.

### Submission steps
1. Build signed `.ipa` via Xcode or EAS
2. Upload to **App Store Connect**
3. Fill metadata (description, keywords, age rating, privacy nutrition labels)
4. Submit for review (typically 1–3 days)
5. Stripe: use in-app purchases OR link to web checkout (Apple takes 15–30% on IAP)

---

## Android — Google Play (Samsung, etc.)

### Requirements
- **Google Play Developer** account — $25 one-time → [play.google.com/console](https://play.google.com/console)
- Android Studio
- Privacy policy URL

### Real app blocking on Android
- **Usage Access API** — detect foreground app
- **Accessibility Service** — intercept app launches (common for focus apps)
- **Device Admin** — enterprise-style restrictions (heavier UX)

Apps like ActionDash and StayFree use Usage Access + overlay/block screens.

### Submission steps
1. Build signed `.aab` (Android App Bundle)
2. Upload to Play Console
3. Complete store listing, content rating questionnaire, data safety form
4. Internal testing → closed beta → production
5. Review typically hours to a few days

---

## Backend & payments in production

| Item | Recommendation |
|------|----------------|
| Hosting | Vercel/Railway/Fly.io for API + static frontend |
| Domain | `replock.app` with HTTPS |
| Stripe | Live keys, EUR prices, webhooks for subscription status |
| Database | PostgreSQL for user accounts (if adding sync) |
| Auth | Clerk, Supabase Auth, or Firebase |

Update `.env`:
```
STRIPE_SECRET_KEY=sk_live_...
CLIENT_URL=https://replock.app
```

---

## Checklist before launch

- [ ] Privacy policy & terms of service
- [ ] GDPR compliance (EU users — data export/delete)
- [ ] App icons (1024×1024) + screenshots for all device sizes
- [ ] Test on real iPhone and Samsung devices
- [ ] Stripe live mode tested end-to-end
- [ ] Crash reporting (Sentry)
- [ ] Analytics (optional, with consent)

---

## Suggested roadmap

1. **Now** — Ship PWA, gather feedback, validate pricing (€7.99/mo)
2. **Phase 2** — Capacitor wrapper → App Store / Play listing (tracking only, honest about blocking limits)
3. **Phase 3** — iOS Family Controls (picker + shields + extensions); Android blocking already in repo
4. **Phase 4** — Account sync, family plans, wearable integrations

---

## Cost summary

| Item | Cost |
|------|------|
| Apple Developer | €99/year |
| Google Play | $25 one-time |
| Domain + hosting | ~€10–30/month |
| Stripe | 1.5% + €0.25 per EU card transaction |

---

For questions about a specific step (Capacitor setup, Apple entitlement application, or Play Store listing), say which platform you want to tackle first.
