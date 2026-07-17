# RevenueCat Setup (Mobile Launch)

RepLock uses **RevenueCat** for iOS + Android subscriptions. Web is dev-only — no web checkout.

## 1. RevenueCat dashboard

1. Create project **RepLock**
2. Add iOS app (`com.replock.app`) and Android app (`com.replock.app`)
3. Create entitlement: `pro`
4. Add products:
   - iOS: `replock_pro_monthly`, `replock_pro_yearly`
   - Android: `replock_pro` with base plans `monthly-plan`, `yearly-plan`
5. Create offering `default`:
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

`npm run cap:ios:sync` refuses to bake a `test_` key and injects `appl_…` into `.env.iphone-dev` + `Info.plist` `REVENUECAT_API_KEY` so JS (`Purchases.configure`) and native (`RepLockRevenueCat`) share the same key.

## 4. Webhook

1. RevenueCat → Integrations → Webhooks
2. URL: `https://your-api.com/api/webhooks/revenuecat`
3. Set authorization header → same value as `REVENUECAT_WEBHOOK_SECRET`
4. Enable: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE

**Important:** `app_user_id` in RevenueCat must match your auth user ID (Firebase UID or server user id). The app calls `Purchases.logIn({ appUserID })` on sign-in.

## 5. Fallback (no RevenueCat keys)

- **iOS:** Capgo native purchases + server Apple verify (sandbox)
- **Android:** Legacy Stripe native (dev only) — configure RevenueCat before Play launch

## 6. Pricing rationale

Pricing: **€7.99/mo**, **€59.99/yr** (37% annual discount).
