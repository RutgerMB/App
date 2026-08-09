# RepLock — Launch Now

Last updated: **2026-08-05**

## Verdict: **NOT READY TO SUBMIT** (app code is close; ops + store setup remain)

A full pre-launch audit was done for **iOS, Android, and payments**. The product works for development. Store submission is blocked by Apple/Google ops and production environment setup — not by missing core features.

---

## What works (code)

| Area | Status |
|------|--------|
| Exercise → earn minutes → unlock | Ready |
| iOS Screen Time / Family Controls blocking | Ready in repo (needs **distribution** entitlement for TestFlight/App Store) |
| Android Usage Access + Accessibility overlay | Ready in repo (needs Play Console declarations) |
| Auth + delete account | Ready |
| Legal (Privacy / Terms / Support) | Ready (GitHub Pages + in-app) |
| iOS payments (RevenueCat primary, Capgo StoreKit fallback) | Code ready |
| Android payments (RevenueCat) | Code ready when `goog_` key + Play products exist |
| 7-day free trial (no payment needed for basic review) | Ready |
| Production iOS bake | `npm run cap:ios:prod` |
| Production Android bake | `npm run cap:android:prod` (new) |
| Capacitor CORS in production | Fixed — allows `capacitor://localhost` / WebView origins |
| App Review demo account | Auto-seeds JWT + **Firebase** user when Admin credentials are set |

---

## Blockers before App Store (iOS)

1. **Family Controls distribution** — Development capability ≠ App Store. Account Holder must get **Assigned** distribution for `app.replock.bleeker` (+ Screen Time extension IDs). Without this, blocking fails on TestFlight/App Store.
2. **Live HTTPS API** with secrets: `JWT_SECRET`, `REVENUECAT_WEBHOOK_SECRET`, `APP_REVIEW_EMAIL`, `APP_REVIEW_PASSWORD`, `CLIENT_URL`, `TRUST_PROXY=1`, and if the store build uses Firebase: `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. **RevenueCat webhook** pointing at `https://YOUR-API/api/webhooks/revenuecat` (authorization header = secret).
4. **Bake with production, not LAN:** `VITE_API_URL=https://…` + `VITE_REVENUECAT_API_KEY_IOS=appl_…` → `npm run cap:ios:prod` → Archive. Never ship a `cap:ios:sync` / `.env.iphone-dev` build.
5. **ASC:** subscriptions `replock_pro_monthly` + `replock_pro_yearly` Ready + attached to v1.0; privacy form; screenshots; review notes.
6. **Sandbox IAP QA** on a physical iPhone (buy monthly + yearly + restore + manage).
7. **Demo account** in App Review notes (see `APP_STORE_REVIEW.md`) — must match auth mode (Firebase vs JWT).

## Blockers before Play Store (Android) — can wait if iOS-first

1. **Upload keystore / signingConfigs** in Gradle (currently debug-only).
2. `VITE_REVENUECAT_API_KEY_ANDROID=goog_…` + Play product `replock_pro` (base plans `monthly-plan` / `yearly-plan`) in RevenueCat.
3. `npm run cap:android:prod` then signed AAB.
4. Play Console declarations: **Usage Access** + **Accessibility** service purpose.

---

## Payments — is it launch-ready?

**iOS: yes, if ops are done.** Flow is:

`Upgrade → RevenueCat native paywall (preferred) → Capacitor RevenueCat → Capgo StoreKit fallback → local Pro unlock → server Pro via RevenueCat webhook.`

| Check | Needed |
|-------|--------|
| ASC products Ready + attached | You |
| RC entitlement `pro`, offering Current (`defaults` / Current) | You |
| Store build uses `appl_…` (not `test_…`) | `cap:ios:prod` enforces |
| Webhook secret on API | You |
| Capgo-only verify without RC | **Not** production-safe (Apple Server API not wired); keep RevenueCat as primary |

**Android: code ready, catalog/signing not.** No Capgo fallback — without `goog_` key purchases hard-fail.

**Stripe:** legacy / web only — not used for store IAP. Leave disabled for mobile launch.

---

## App Review admin / demo account

Yes — you need this.

```env
APP_REVIEW_EMAIL=RepLockIssue@outlook.com
APP_REVIEW_PASSWORD=ChooseAStrongReviewPassword1!
```

On API startup the server:

- Creates/updates an Express JWT review user with **Pro** + onboarding done
- If `FIREBASE_SERVICE_ACCOUNT_JSON` is set, also creates/updates the **Firebase Auth** user with the same password and grants Pro on that UID

Paste credentials into ASC Review Notes (template in `APP_STORE_REVIEW.md`).

Reviewers can also use the **7-day trial** without Pro, but the review account should show Subscription = Pro.

---

## Dev-only things that must NOT ship

| Dev | Store |
|-----|--------|
| `npm run cap:ios:sync` / LAN `VITE_API_URL_NATIVE` | `npm run cap:ios:prod` + HTTPS `VITE_API_URL` |
| `VITE_ENABLE_DEV_LOGIN*` | Unset (prod scripts refuse) |
| RevenueCat `test_…` keys | `appl_…` / `goog_…` |
| `.env.iphone-dev` / `.env.android-dev` | Root `.env` production values only |
| Cleartext LAN API | HTTPS only |

---

## Nice-to-have (not submission blockers)

- Add Shield Configuration / Action Xcode targets (branded shield UI; system shield still blocks)
- Privacy Nutrition Labels / `PrivacyInfo.xcprivacy` in ASC
- Handle RevenueCat `TRANSFER` webhook events
- Wire Apple App Store Server API if Capgo must verify alone

---

## After blockers are green

- [ ] Family Controls distribution Assigned  
- [ ] `GET https://API/api/health` OK + webhook receiving  
- [ ] Archive from `cap:ios:prod`  
- [ ] Sandbox purchase + restore OK  
- [ ] ASC listing + demo notes filled  

Then: **Submit for Review**.

Step-by-step ops: **`docs/LAUNCH-USER-CHECKLIST.md`** · Review notes: **`APP_STORE_REVIEW.md`**.
