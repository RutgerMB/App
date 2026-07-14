# RepLocks Launch Readiness

Last verified: **2026-07-14** — 66/66 tests passing, production build OK.

## Launch readiness: **Almost ready** (not submit yet)

The app is feature-complete for a v1.0 mobile launch, but **physical device QA and store configuration** are still required before App Store / Play submission.

| Score | Meaning |
|-------|---------|
| **Not ready** | Blockers in core flows |
| **Almost ready** ← current | Code ready; needs device QA + store wiring |
| **Ready** | Sandbox IAP verified on real devices, listings complete |

---

## Launch model

**Mobile-only.** RepLocks ships on App Store + Google Play. The web build is for development and testing — subscriptions are not offered on web.

## App status

| Area | Status | Notes |
|------|--------|-------|
| Onboarding + auth | ✓ | Shortened by 2 steps (skip potential/week-one stats) |
| Home screen | ✓ | Apps strip, ProPromo, trial banner, empty-balance CTA |
| Pro entitlement | ✓ | Server-authoritative |
| Mobile billing | ✓ | RevenueCat (iOS + Android) with Capgo/Apple fallback |
| Yearly plan | ✓ | €59.99/yr (37% off monthly) |
| Screen Time blocking | ✓ | RepLockControls (iOS 16+) |
| Dev login | ✓ | Disabled in production builds (`dev-auth.ts`) |
| i18n | ✓ | en + nl/de/fr/es for core flows |
| Marketing | ✓ | 10 visual slideshow packs (5 slides each) |
| Tests / build | ✓ | 66 tests, `npm run build` passes |

## Pricing (recommended)

| Plan | Price |
|------|-------|
| Monthly | €7.99/mo |
| Yearly | €59.99/yr (~€5/mo) |

See `docs/marketing/ECONOMY.md`

## Store setup (required before public launch)

1. **App Store Connect** — `replock_pro_monthly` + `replock_pro_yearly` → Ready to Submit
2. **Google Play Console** — `replock_pro` with `monthly-plan` + `yearly-plan`
3. **RevenueCat** — entitlement `pro`, webhook → `POST /api/webhooks/revenuecat`
4. **Version 1.0** — attach subscriptions to first app version after Xcode upload
5. See `docs/REVENUECAT_SETUP.md`

## iOS build (on Mac)

```bash
npm run cap:ios:sync
open ios/App/App.xcodeproj
```

Run on physical iPhone (iOS 16–18). **Sandbox IAP test required.**

## Production env

```env
JWT_SECRET=<strong-random>
CLIENT_URL=https://your-api-domain.com
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx
REVENUECAT_WEBHOOK_SECRET=<from RevenueCat dashboard>
```

**Do not set** `VITE_ENABLE_DEV_LOGIN` or `VITE_ENABLE_DEV_LOGIN_NATIVE` in store builds.

Deploy `firestore.rules` if using Firebase.

## Legal / support (live)

- Privacy: https://rutgermb.github.io/App/legal/privacy.html
- Support: https://rutgermb.github.io/App/legal/support.html
- Terms: https://rutgermb.github.io/App/legal/terms.html
- Email: RepLockIssue@outlook.com

## TikTok launch

- **Slides:** `docs/marketing/slides/slideshow-1/` … `slideshow-10/` (5 visual slides each)
- **Quick start:** `docs/marketing/POST-READY.md`
- **30-day calendar:** `docs/marketing/CONTENT-CALENDAR.md`
- **Regenerate:** `npm run marketing:slides`

## Pre-submission blockers

1. **Physical device QA** — exercise flow, IAP sandbox, Screen Time picker (Mac + iPhone required)
2. **RevenueCat production keys + webhook** — register production URL before scaling marketing
3. **App Store version 1.0 listing** — screenshots, description, App Privacy, attach subs to build
4. **Play Store** — app blocker permissions + billing declarations
5. **End-to-end sandbox purchase** — yearly + monthly, restore purchases

## Known limitations (not launch blockers)

- Stripe web checkout — dev/legacy only
- Web PWA — testing surface only
- iOS daily usage totals from Screen Time — future update (blocking works via shield UI)
- Push notification scheduling — permission requested; full local/push scheduling planned

## Recent polish (this review)

- Home: apps status strip, Pro promo, earn-first empty state
- Onboarding: trial step CTA cleanup, 2 fewer stat slides, app-selection skip toast
- Settings: reset toast fix, notifications copy aligned with push permission
- Pricing: localized trial hours + checkout error message
- TikTok: visual 5-slide format with gym backgrounds + phone mockup solution slide
