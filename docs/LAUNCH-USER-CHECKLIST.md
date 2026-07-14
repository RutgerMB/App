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

### 5. Set production API URL (release build)

Ensure `.env` or Xcode build settings use your deployed API — not `127.0.0.1`.

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
JWT_SECRET=<strong-random>
CLIENT_URL=https://your-api-domain.com
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx
REVENUECAT_WEBHOOK_SECRET=<from RevenueCat>
```

**Never** set `VITE_ENABLE_DEV_LOGIN` or `VITE_ENABLE_DEV_LOGIN_NATIVE` in store builds.

---

## Support

- Issues: RepLockIssue@outlook.com  
- Status doc: `docs/LAUNCH-READY.md`
