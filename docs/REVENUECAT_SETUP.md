# RevenueCat Setup (Mobile Launch)

RepLock uses **RevenueCat** for iOS + Android subscriptions. Web is dev/testing only — no web checkout for launch.

## Bundle IDs (must match stores + RevenueCat apps)

| Platform | Bundle / application ID |
|----------|-------------------------|
| **iOS** | `app.replock.bleeker` |
| **Android** | `com.replock.app` |

## 1. RevenueCat dashboard

1. Create project **RepLock**
2. Add **iOS** app with bundle ID `app.replock.bleeker`
3. Add **Android** app with package name `com.replock.app`
4. Create entitlement: `pro`
5. Add products:
   - iOS: `replock_pro_monthly`, `replock_pro_yearly`
   - Android: `replock_pro` with base plans `monthly-plan`, `yearly-plan`
6. Create offering `default`:
   - `$rc_annual` → yearly product (**default package**)
   - `$rc_monthly` → monthly product

## 2. Store products

| Store | Product | Price |
|-------|---------|-------|
| App Store | `replock_pro_monthly` | €7.99/mo |
| App Store | `replock_pro_yearly` | €59.99/yr |
| Play Store | `replock_pro` / `monthly-plan` | €7.99/mo |
| Play Store | `replock_pro` / `yearly-plan` | €59.99/yr |

## 3. Environment variables

```env
# Client (Vite) — App Store / Play public SDK keys (NOT Test Store)
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx

# Server
REVENUECAT_WEBHOOK_SECRET=your_webhook_authorization_header_value
```

| Key prefix | Use |
|------------|-----|
| `appl_…` | **Required** for physical iPhone + App Store sandbox / production StoreKit |
| `test_…` | RevenueCat **Test Store** only (simulated catalog) — empty offerings on a real device |
| `goog_…` | Android Play Store |

`npm run cap:ios:sync` / `npm run cap:ios:prod` refuse to bake a `test_` key and inject `appl_…` into `Info.plist` `REVENUECAT_API_KEY` so JS (`Purchases.configure`) and native (`RepLockRevenueCat`) share the same key.

## 4. Webhook

1. RevenueCat → Integrations → Webhooks
2. URL: `https://your-api.com/api/webhooks/revenuecat`
3. Set authorization header → same value as `REVENUECAT_WEBHOOK_SECRET`
4. Enable: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE

**Important:** `app_user_id` in RevenueCat must match your auth user ID (Firebase UID or server user id). The app calls `Purchases.logIn({ appUserID })` on sign-in.

## 5. Fallback (no RevenueCat keys)

- **iOS:** Capgo native purchases + server Apple verify (sandbox)
- **Android:** Configure RevenueCat before Play launch (do not rely on legacy Stripe for store builds)

## 6. Pricing

**€7.99/mo**, **€59.99/yr** (37% annual discount).
