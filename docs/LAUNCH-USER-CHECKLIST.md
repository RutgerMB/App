# RepLock — User Launch Checklist

Numbered steps for what **only you** can do on Mac, App Store Connect, RevenueCat, and Google Play. Complete in order.

---

## Phase 1 — Mac + Xcode (iOS build)

### 1. Clone and install (on Mac)

```bash
cd ~/Documents/GitHub/App
npm install
```

### 2. Sync Capacitor iOS

```bash
npm run cap:ios:sync
```

### 3. Open Xcode

```bash
open ios/App/App.xcodeproj
```

### 4. Configure signing

- Team: your Apple Developer account  
- Bundle ID: `app.replock.bleeker`  
- Capabilities: **Family Controls**, App Group `group.com.replock.fitness`

**Screen Time / “Authorize Screen Time” / app picker:**

1. In [Apple Developer](https://developer.apple.com) → Identifiers → your App ID → enable **Family Controls** (this checkbox = **Development**). There is usually **no “distribution” label** on that screen.
2. For **TestFlight / App Store**, Account Holder requests the separate distribution entitlement: [Family Controls distribution](https://developer.apple.com/contact/request/family-controls-distribution) (or App ID → **Capability Requests** → Family Controls). Check status until **Assigned** + App Store provisioning. Repeat for extension App IDs. Full explanation: `IOS_SETUP.md`.
3. In Xcode → Signing & Capabilities: **Family Controls** + App Group `group.com.replock.fitness` must be present (see `App.entitlements`).
4. Always sync with `npm run cap:ios:sync` (not bare `npx cap sync`) so `RepLockControls` stays linked **and** `RepLockControlsPlugin` is injected into `capacitor.config.json` → `packageClassList` (required for Capacitor to load it).
5. Test on a **physical iPhone** (Simulator cannot authorize Screen Time). Development builds can work after step 1; store builds need step 2.
6. If you tapped **Allow** but the app still says denied: return to RepLock and tap **Authorize** again; or **Settings → Screen Time** → allow RepLock, then Authorize in-app. After approval you still must use the **app picker** (that is not a denial).

Without Family Controls on the App ID (dev) or distribution approval (store), Authorize and the app picker will appear to do nothing or fail immediately.

### 4b. DeviceActivityReport extension (daily Screen Time totals)

Sources live under `ios/App/RepLockDeviceActivityReport/`. Target is already in `App.xcodeproj`.

1. Apple Developer → App ID **`app.replock.bleeker.RepLockDeviceActivityReport`** with **Family Controls** + App Group **`group.com.replock.fitness`** (must match Xcode).
2. Xcode → confirm appex is embedded (**Embed ExtensionKit Extensions**) and both targets have the App Group.
3. On device, numeric JS export via App Group is usually blocked by Apple’s DAR sandbox — onboarding uses **`presentDailyScreenTimeReport`** so the user still sees today’s total. Soft `NO_DATA` in JS is expected.
4. Full click-path: **`IOS_SETUP.md` → DeviceActivityReport extension**.

Until the `.appex` is embedded and you rebuild on a physical iPhone, onboarding falls back to the estimate path for projections.

### 5. Set production API URL (release build)

**Do you need a local server on the PC/Mac?**

| Build type | Need local `npm run dev`? |
|------------|---------------------------|
| **Release / production** with `VITE_API_URL=https://YOUR-DEPLOYED-API` baked in | **No** — phone talks to the deployed API |
| **Dev** (`npm run cap:ios:sync` / LAN IP in `.env.iphone-dev`) | **Yes** — Mac/PC must run the API on port 3001, same Wi‑Fi |

For App Store / TestFlight / production device builds, set in `.env` (gitignored) on your Mac:

```env
VITE_API_URL=https://YOUR-API-DOMAIN
VITE_REVENUECAT_API_KEY_IOS=appl_…
```

Then bake + sync (fails closed if URL/key missing):

```bash
npm run cap:ios:prod
open ios/App/App.xcodeproj
# Product → Archive
```

Do **not** ship builds that only have `VITE_API_URL_NATIVE=http://127.0.0.1:3001` or a LAN IP — those require your computer to be online. Do **not** use `npm run cap:ios:sync` for store archives (that is the LAN dev path).

Webhook URL (RevenueCat): `https://YOUR-API-DOMAIN/api/webhooks/revenuecat`

### 6. Run on physical iPhone (smoke test)

- iPhone on same Wi‑Fi as Mac (dev) or use release build  
- iOS **16+** required for Screen Time blocking  
- Test: login → onboarding → pick apps → authorize Screen Time → exercise → unlock app

### 7. Archive and upload

1. Xcode → **Product → Archive**  
2. **Distribute App → App Store Connect → Upload**  
3. Wait for processing in ASC (15–60 min)

Full dev workflow: see `IOS_SETUP.md`.

---

## Phase 2 — App Store Connect

### 8. Create subscription products (if not done)

| Product ID | Price |
|------------|-------|
| `replock_pro_monthly` | €7.99/mo |
| `replock_pro_yearly` | €59.99/yr |

Status must be **Ready to Submit**.

### 9. Attach subscriptions to version 1.0

1. App Store Connect → your app → **Version 1.0**  
2. **In-App Purchases** → add both subscriptions to this version  
3. Required after first build upload

### 10. App Privacy

- Data types: account info, fitness/workout data, purchase history  
- No data sold to third parties  
- Link privacy URL: `https://rutgermb.github.io/App/legal/privacy.html`

### 11. Store listing

- Screenshots (use `docs/app-store/` or device captures)  
- Description, keywords, support URL  
- Support: `https://rutgermb.github.io/App/legal/support.html`

### 12. Sandbox IAP test (physical iPhone)

1. Settings → App Store → Sandbox Account  
2. In RepLock: **Pricing** → purchase **monthly**  
3. Purchase **yearly**  
4. **Restore purchases** from Settings  
5. Confirm Pro unlocks: unlimited apps, difficulty picker, activity insights

---

## Phase 3 — RevenueCat

### 13. Production API keys

1. [RevenueCat dashboard](https://app.revenuecat.com) → Project **RepLock**  
2. Copy **iOS public key** (`appl_…`) and **Android public key** (`goog_…`)  
3. Add to production env:

```env
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx
```

Rebuild iOS/Android after setting keys.

### 14. Entitlement and offering

- Entitlement ID: **`pro`**  
- Offering `default`: `$rc_annual` (yearly, default), `$rc_monthly` (monthly)  
- Publish paywall template if using RevenueCat Paywalls

### 15. Webhook

1. RevenueCat → Integrations → Webhooks  
2. URL: `https://YOUR-API-DOMAIN/api/webhooks/revenuecat`  
3. Authorization header → set same value as server env:

```env
REVENUECAT_WEBHOOK_SECRET=your_secret_here
```

4. Enable: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE

Details: `docs/REVENUECAT_SETUP.md`

### 16. Redeploy API server

Deploy with `JWT_SECRET`, `CLIENT_URL`, and `REVENUECAT_WEBHOOK_SECRET`. Verify webhook with a sandbox purchase.

---

## Phase 4 — Google Play (when ready)

### 17. Play Console listing

- App details, screenshots, content rating  
- Data safety form (align with privacy policy)

### 18. Subscriptions

- Product `replock_pro` with base plans `monthly-plan`, `yearly-plan`  
- Link same prices: €7.99/mo, €59.99/yr

### 19. Permissions / declarations

- Declare app-blocking / usage access as required  
- Billing permission for subscriptions

### 20. Internal testing track

Upload AAB, add testers, verify RevenueCat Android key + purchase flow.

---

## Phase 5 — Submit

### 21. Final checks

```bash
npm test
npm run build
npx tsc --noEmit
```

### 22. Submit iOS for review

- App Store Connect → Version 1.0 → **Submit for Review**  
- Attach subscription review screenshots if requested (`docs/app-store/`)

### 23. Submit Android (when Play setup complete)

- Promote internal test → production when IAP verified

---

## Quick reference — env vars

```env
# API host
JWT_SECRET=<strong-random>
CLIENT_URL=https://your-api-domain.com
REVENUECAT_WEBHOOK_SECRET=<from RevenueCat>

# Client bake-in (before npm run cap:ios:prod)
VITE_API_URL=https://your-api-domain.com
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx
```

**Never** set `VITE_ENABLE_DEV_LOGIN` or `VITE_ENABLE_DEV_LOGIN_NATIVE` in store builds.

Full template: `.env.example` · Status: `docs/LAUNCH-NOW.md`

---

## Support

- Issues: RepLockIssue@outlook.com  
- Status doc: `docs/LAUNCH-NOW.md`
