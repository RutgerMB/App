# Launching RepLock — pointer doc

**Start here for status:** [`docs/LAUNCH-NOW.md`](./docs/LAUNCH-NOW.md)

RepLock is a **native Capacitor app** (iOS + Android), not a PWA launch. Screen Time blocking and IAP are implemented in-repo.

| ID | Value |
|----|--------|
| iOS bundle | `app.replock.bleeker` |
| Android package | `com.replock.app` |
| Billing | RevenueCat + Apple/Google IAP (Stripe is legacy/dev only) |

## Where to go

| Goal | Doc |
|------|-----|
| What’s done vs what only you can do | `docs/LAUNCH-NOW.md` |
| Numbered Mac / App Store / RevenueCat steps | `docs/LAUNCH-USER-CHECKLIST.md` |
| Mac + iPhone day-to-day + Shield / DeviceActivityReport | `IOS_SETUP.md` |
| App Review notes | `APP_STORE_REVIEW.md` |
| RevenueCat dashboard | `docs/REVENUECAT_SETUP.md` |
| API rate limits / bans | `docs/API-SECURITY.md` |

## Production Archive (short)

```bash
# .env on Mac (gitignored)
VITE_API_URL=https://YOUR-API-DOMAIN
VITE_REVENUECAT_API_KEY_IOS=appl_…

npm run cap:ios:prod
open ios/App/App.xcodeproj   # Archive
```

Family Controls **distribution** approval ([request form](https://developer.apple.com/contact/request/family-controls-distribution)), physical device QA, store listing, and production API secrets are **you** — see LAUNCH-NOW. Enabling the App ID checkbox alone is Development-only.
