# RepLock Launch Readiness

Last verified: automated test suite, production build.

## Launch model

**Mobile-only.** RepLock ships on App Store + Google Play. The web build is for development and testing — subscriptions are not offered on web.

## App status

| Area | Status |
|------|--------|
| Onboarding + auth | ✓ |
| Pro entitlement | ✓ Server-authoritative |
| Mobile billing | ✓ RevenueCat (iOS + Android) with Capgo/Apple fallback |
| Yearly plan | ✓ €59.99/yr (37% off monthly) |
| Screen Time blocking | ✓ RepLockControls (iOS 16+) |
| Data integrity | ✓ |
| Marketing | ✓ 10 slideshow packs + 30-day calendar |

## Pricing (recommended)

| Plan | Price |
|------|-------|
| Monthly | €7.99/mo |
| Yearly | €59.99/yr (~€5/mo) |

See `docs/marketing/ECONOMY.md`

## Store setup (required before public launch)

1. **App Store Connect** — `replock_pro_monthly` + `replock_pro_yearly`
2. **Google Play Console** — `replock_pro` with `monthly-plan` + `yearly-plan`
3. **RevenueCat** — entitlement `pro`, webhook → `POST /api/webhooks/revenuecat`
4. See `docs/REVENUECAT_SETUP.md`

## iOS build (on Mac)

```bash
npm run cap:ios:sync
open ios/App/App.xcodeproj
```

Run on physical iPhone (iOS 16–18). Sandbox IAP test required.

## Production env

```env
JWT_SECRET=<strong-random>
CLIENT_URL=https://your-api-domain.com
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx
REVENUECAT_WEBHOOK_SECRET=<from RevenueCat dashboard>
```

Deploy `firestore.rules` if using Firebase.

## TikTok launch

- **Slides:** `docs/marketing/slides/slideshow-1/` … `slideshow-10/`
- **5-day quick start:** `docs/marketing/POST-READY.md`
- **30-day calendar:** `docs/marketing/CONTENT-CALENDAR.md`
- **Regenerate:** `npm run marketing:slides`

## Pre-submission blockers

1. **Physical device QA** — exercise flow, IAP sandbox, Screen Time picker (Mac + iPhone required)
2. **RevenueCat webhook** — register production URL before scaling marketing
3. **Store listings** — screenshots, privacy policy URL, age rating
4. **Play Store** — app blocker permissions + billing declarations

## Not launch blockers (web)

- Stripe web checkout — dev/legacy only, not part of launch
- Web PWA — testing surface only
