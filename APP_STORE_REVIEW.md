# App Store Review Guide — RepLock

Use this document when submitting to **Apple App Store Connect** and as a pre-submission checklist.

---

## Demo login (required in Review Notes)

Paste this into **App Review Information → Notes**:

```
Demo account (email login):
Email: RepLockIssue@outlook.com
Password: [your APP_REVIEW_PASSWORD from server .env]

How to test:
1. Open app → Sign in with credentials above
2. Tap Exercise → pick any workout → complete sets
3. Settings → Subscription shows Pro status on review account
4. Settings → Delete account is available (do not delete review account during review)

No AI-generated content in this app. Exercise demos open MuscleWiki in Safari.
Subscriptions on iOS use Apple In-App Purchase (product ID: replock_pro_monthly).
```

### Server setup

Add to production `.env`:

```env
APP_REVIEW_EMAIL=RepLockIssue@outlook.com
APP_REVIEW_PASSWORD=ChooseAStrongReviewPassword1!
JWT_SECRET=generate-a-long-random-secret
```

The server auto-creates this account on startup with onboarding complete and Pro enabled.

---

## Pre-submission checklist

### Login & accounts
- [x] Email/password login works
- [x] Demo credentials documented for reviewers
- [x] **Delete account** in Settings (password required)
- [x] No Google login → Sign in with Apple not required
- [ ] Remove `VITE_ENABLE_DEV_LOGIN` from production builds

### Payments
- [x] **iOS**: Stripe disabled; Apple IAP flow in app
- [x] **Android EU**: Stripe Payment Sheet allowed
- [x] **Web**: Stripe Checkout
- [ ] Create subscription in **App Store Connect** → product ID `replock_pro_monthly`
- [ ] Install native IAP plugin: `@capgo/native-purchases` + `npx cap sync ios`
- [ ] Implement Apple Server API receipt verification (production)
- [ ] No “buy on our website” links in iOS app

### Legal
- [x] Privacy Policy at `/privacy` (link in Settings + Registration)
- [x] Terms of Service at `/terms`
- [x] Auto-renew subscription disclosure on pricing screen (iOS)

### Honest UI (no placeholder / false claims)
- [x] Onboarding no longer claims OS-level app blocking
- [x] Settings explains in-app tracking vs system blocking
- [x] Help links to support, not Stripe test docs
- [x] Removed fake star “social proof” from pricing
- [x] Notifications labeled as in-app (push coming later)
- [x] No “Coming soon” buttons that do nothing

### Permissions
- [ ] After `npx cap add ios`, add only needed `Info.plist` keys
- [ ] Current app: **no camera, microphone, or location** requested
- [ ] If adding push later: `NSUserNotificationsUsageDescription` with clear reason

### Screenshots
- [ ] Screenshots must match **actual** app UI
- [ ] Do not show OS blocking that does not exist
- [ ] Do not show features not in the build

### AI content
- [x] No AI generation — disclose in review notes if asked

---

## iOS project setup

```powershell
cd C:\Users\Admin\Documents\GitHub\App
npm.cmd run build
npx cap add ios
npx cap sync ios
npm.cmd run cap:ios
```

In Xcode:
1. Set **Bundle ID**: `app.replock.bleeker` (already set in `ios/App/App.xcodeproj`)
2. Signing & Capabilities → your team
3. Add **In-App Purchase** capability
4. Create subscription product `replock_pro_monthly` in App Store Connect

---

## Android (Google Play)

- Stripe is acceptable for digital subscriptions on Android (including EU).
- Set `VITE_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.
- Remove `android:usesCleartextTraffic="true"` for production API (HTTPS only).

---

## Environment variables (production)

```env
# Required
JWT_SECRET=
APP_REVIEW_EMAIL=RepLockIssue@outlook.com
APP_REVIEW_PASSWORD=

# iOS
VITE_APPLE_PRODUCT_ID=replock_pro_monthly

# Android / web payments
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Legal (optional — defaults to GitHub Pages URLs in production builds)
VITE_PRIVACY_URL=https://rutgermb.github.io/App/legal/privacy.html
VITE_TERMS_URL=https://rutgermb.github.io/App/legal/terms.html
VITE_SUPPORT_URL=https://rutgermb.github.io/App/legal/support.html
VITE_SUPPORT_EMAIL=RepLockIssue@outlook.com

# Do NOT set in production:
# VITE_ENABLE_DEV_LOGIN
```

---

## What Apple reviewers test (~90 seconds)

1. Tap buttons — nothing broken or placeholder
2. Log in with demo account
3. Subscription uses **Apple IAP** on iOS (not Stripe)
4. Permission prompts justified (we request none today)
5. Screenshots match app
6. Account deletion works in Settings
7. Privacy policy accessible

---

## Remaining before submit

| Item | Priority |
|------|----------|
| `npx cap add ios` + signing | Blocker |
| App Store Connect IAP product | Blocker |
| `@capgo/native-purchases` native sync | Blocker |
| Apple receipt server verification | High |
| Host privacy/terms on replock.app | High |
| Production API on HTTPS | High |
| Stripe webhooks for Android | Medium |
