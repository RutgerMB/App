# RepLock Launch Readiness

Last verified: automated test suite **61/61 pass**, production build succeeds.

## App status

| Area | Status |
|------|--------|
| Onboarding + auth | ✓ Slider, app picker, sign-in flow |
| Pro entitlement | ✓ Server-authoritative; client cannot bypass |
| Stripe | ✓ Auth-protected checkout + webhooks |
| Apple IAP (iOS) | ✓ Native plugin restored; sandbox via `APPLE_IAP_VERIFY_SKIP` |
| Screen Time blocking | ✓ RepLockControls (iOS 16+) |
| Data integrity | ✓ Local dates, streaks, daily openings |
| Tests | ✓ 61 unit tests |

## iOS build (on Mac)

```bash
npm run cap:ios:sync   # builds + syncs + re-injects native plugins
open ios/App/App.xcodeproj
# Run ▶ on physical iPhone (iOS 16–18)
```

Requires Xcode 16+ recommended. Family Controls + App Group entitlements must be configured in Apple Developer.

## Production env (required)

```env
JWT_SECRET=<strong-random>
CLIENT_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
# App Review only:
APPLE_IAP_VERIFY_SKIP=true
```

Deploy `firestore.rules` if using Firebase: `firebase deploy --only firestore:rules`

## TikTok launch

- **Post-ready PNGs:** `docs/marketing/slides/slideshow-1/` … `slideshow-5/`
- **Posting guide:** `docs/marketing/POST-READY.md`
- **Figma storyboards:** https://www.figma.com/slides/XyrQQqqQWJxi4h6ODvDl7a

## Pre-submission blockers

1. **Apple App Store Server API** — replace `APPLE_IAP_VERIFY_SKIP` with real verification before public launch
2. **Stripe webhook** — register `POST /api/webhooks/stripe` in Stripe Dashboard
3. **Physical device QA** — exercise flow, IAP sandbox purchase, Screen Time picker (requires Mac + iPhone)
