# App Store Review Guide — RepLock

Use this when submitting to **App Store Connect** and as a pre-submission checklist.

**Bundle ID:** `app.replock.bleeker`  
**Billing:** Apple In-App Purchase via RevenueCat (not Stripe on iOS)

---

## Demo login (required in Review Notes)

Paste into **App Review Information → Notes**:

```
Demo account (email login):
Email: RepLockIssue@outlook.com
Password: [your APP_REVIEW_PASSWORD from server .env]

How to test:
1. Open app → Sign in with credentials above
2. Tap Exercise → pick any workout → complete sets
3. Settings → Subscription shows Pro status on review account
4. Settings → Delete account is available (do not delete review account during review)
5. Manage / cancel subscription: Settings or Pricing → Manage or cancel subscription (opens Apple subscription management)

No AI-generated content in this app. Exercise demos open MuscleWiki in Safari.
Subscriptions on iOS use Apple In-App Purchase via RevenueCat
(product IDs: replock_pro_monthly, replock_pro_yearly).
```

### Server setup

Add to production `.env` on the API host:

```env
APP_REVIEW_EMAIL=RepLockIssue@outlook.com
APP_REVIEW_PASSWORD=ChooseAStrongReviewPassword1!
JWT_SECRET=generate-a-long-random-secret
REVENUECAT_WEBHOOK_SECRET=from-revenuecat-webhook-auth-header
```

The server auto-creates this account on startup with onboarding complete and Pro enabled.

---

## Pre-submission checklist

### Login & accounts
- [x] Email/password login works
- [x] Demo credentials documented for reviewers
- [x] **Delete account** in Settings (password required)
- [x] No Google login → Sign in with Apple not required
- [ ] Confirm `VITE_ENABLE_DEV_LOGIN` / `VITE_ENABLE_DEV_LOGIN_NATIVE` are **unset** in store builds

### Payments (iOS)
- [x] Stripe **disabled** on iOS; Apple IAP via RevenueCat (+ Capgo fallback)
- [x] Products: `replock_pro_monthly`, `replock_pro_yearly`
- [x] Auto-renew disclosure on pricing screen
- [ ] Attach both subscriptions to version 1.0 in App Store Connect
- [ ] Sandbox IAP test on physical iPhone (purchase + restore)
- [ ] No “buy on our website” links in the iOS app

### Legal
- [x] Privacy: https://rutgermb.github.io/App/legal/privacy.html
- [x] Terms: https://rutgermb.github.io/App/legal/terms.html
- [x] Support: https://rutgermb.github.io/App/legal/support.html
- [x] Delete account + cancel subscription paths documented in-app and on legal pages

### Permissions (`Info.plist`)
- [x] `NSUserNotificationsUsageDescription` — local reminders for exercise / screen-time habits
- [x] No camera, microphone, or location requested
- [x] Family Controls / Screen Time — justified for wellbeing app blocking (Apple approval required)

### Screenshots
- [ ] Match **actual** app UI
- [ ] Do not show features not in the build
- [ ] Show Screen Time / blocking only if the archived build includes working Family Controls

---

## iOS project (already in repo)

```bash
# On Mac — production Archive path
# 1. Set in .env:
#    VITE_API_URL=https://YOUR-API-DOMAIN
#    VITE_REVENUECAT_API_KEY_IOS=appl_…
npm install
npm run cap:ios:prod
open ios/App/App.xcodeproj
# Signing: Team + Family Controls + App Group group.com.replock.fitness
# Product → Archive → App Store Connect
```

Dev device builds (LAN API): see `IOS_SETUP.md` / `npm run cap:ios:sync`.

---

## Android (Google Play) — later

- Package: `com.replock.app`
- Billing: RevenueCat + Play Billing (not Stripe for digital subscriptions on Play)
- See `docs/LAUNCH-USER-CHECKLIST.md` Phase 4

---

## Environment variables (production)

```env
# API host (server)
JWT_SECRET=
APP_REVIEW_EMAIL=RepLockIssue@outlook.com
APP_REVIEW_PASSWORD=
REVENUECAT_WEBHOOK_SECRET=
CLIENT_URL=https://YOUR-API-DOMAIN
TRUST_PROXY=1

# Client bake-in (before cap:ios:prod / vite build)
VITE_API_URL=https://YOUR-API-DOMAIN
VITE_REVENUECAT_API_KEY_IOS=appl_xxx
VITE_REVENUECAT_API_KEY_ANDROID=goog_xxx
VITE_APPLE_PRODUCT_ID=replock_pro_monthly

# Legal (optional — defaults to GitHub Pages)
VITE_PRIVACY_URL=https://rutgermb.github.io/App/legal/privacy.html
VITE_TERMS_URL=https://rutgermb.github.io/App/legal/terms.html
VITE_SUPPORT_URL=https://rutgermb.github.io/App/legal/support.html
VITE_SUPPORT_EMAIL=RepLockIssue@outlook.com

# Do NOT set in store builds:
# VITE_ENABLE_DEV_LOGIN
# VITE_ENABLE_DEV_LOGIN_NATIVE
```

Legacy Stripe keys may remain on the server for old web/dev routes; they are **not** used for iOS store billing.

---

## What Apple reviewers test (~90 seconds)

1. Tap through — nothing broken or placeholder
2. Log in with demo account
3. Subscription uses **Apple IAP** (not Stripe)
4. Permission prompts justified (`NSUserNotificationsUsageDescription` + Family Controls)
5. Screenshots match app
6. Account deletion works in Settings
7. Privacy policy accessible

---

## Remaining before submit (ops — not code)

| Item | Priority |
|------|----------|
| Family Controls **distribution** approval on App ID | Blocker |
| `VITE_API_URL` + `npm run cap:ios:prod` + Archive | Blocker |
| App Store Connect products + attach to v1.0 | Blocker |
| Sandbox IAP on physical iPhone | Blocker |
| Screenshots / listing / Submit for Review | Blocker |
| RevenueCat webhook + production API secrets | Blocker |

Full user steps: `docs/LAUNCH-USER-CHECKLIST.md` · Status: `docs/LAUNCH-NOW.md`
