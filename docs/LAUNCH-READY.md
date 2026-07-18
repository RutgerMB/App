# RepLock Launch Readiness

Last verified: **2026-07-18** — see **`docs/LAUNCH-NOW.md`** for the live verdict.

## Launch readiness: **NOT READY** (code ready, ops not)

Code, tests, docs, and production bake path are in repo. **Family Controls distribution approval, production API URL/secrets, physical device QA, and App Store Connect** remain before submit.

| Score | Meaning |
|-------|---------|
| **Not ready** ← current (ops) | Blockers outside the repo |
| **Almost ready** | Code ready; needs device QA + store wiring |
| **Ready** | Sandbox IAP verified on real devices, listings complete |

---

## Checklist

### DONE (automated / in repo)

| Area | Status | Notes |
|------|--------|-------|
| Onboarding + auth | ✓ | Explicit app selection or popular defaults |
| Home / Pro entitlement | ✓ | Server-authoritative |
| Mobile billing | ✓ | RevenueCat (iOS + Android) with Capgo fallback |
| Yearly plan | ✓ | €59.99/yr |
| Screen Time blocking | ✓ | RepLockControls (iOS 16+) |
| Delete account | ✓ | Settings + API |
| Cancel subscription | ✓ | Manage or cancel → Apple/Google subscription URL |
| Legal pages | ✓ | GitHub Pages privacy, terms, support |
| API security | ✓ | Rate limits, JSON-only, validation, IP ban |
| Notifications plist | ✓ | `NSUserNotificationsUsageDescription` |
| Production bake | ✓ | `npm run cap:ios:prod` |
| Dev login | ✓ | Disabled in production builds |
| i18n | ✓ | en + nl/de/fr/es |
| Docs | ✓ | LAUNCH-NOW, checklist, review, RevenueCat (correct bundle IDs) |

### USER-MUST-DO

See **`docs/LAUNCH-NOW.md`** and **`docs/LAUNCH-USER-CHECKLIST.md`**.

### DEFERRED (not launch blockers)

| Item | Notes |
|------|-------|
| Stripe web checkout | Legacy/dev only; mobile uses IAP |
| Web subscriptions | Testing surface only |
| Shield Xcode targets | Sources ready; add on Mac for branded shield |
| Push scheduling beyond local reminders | Permission + local notifications in place |
| Google Play full launch | Can follow iOS |

---

## Production env (summary)

```env
# Client bake-in
VITE_API_URL=https://YOUR-API-DOMAIN
VITE_REVENUECAT_API_KEY_IOS=appl_xxx

# API host
JWT_SECRET=<strong-random>
CLIENT_URL=https://YOUR-API-DOMAIN
REVENUECAT_WEBHOOK_SECRET=<from RevenueCat>
```

**Do not set** `VITE_ENABLE_DEV_LOGIN` or `VITE_ENABLE_DEV_LOGIN_NATIVE` in store builds.

## Legal / support (live)

- Privacy: https://rutgermb.github.io/App/legal/privacy.html
- Support: https://rutgermb.github.io/App/legal/support.html
- Terms: https://rutgermb.github.io/App/legal/terms.html
- Email: RepLockIssue@outlook.com

## Related docs

- **Verdict:** `docs/LAUNCH-NOW.md`
- **User steps:** `docs/LAUNCH-USER-CHECKLIST.md`
- **RevenueCat:** `docs/REVENUECAT_SETUP.md`
- **iOS build:** `IOS_SETUP.md`
- **Review:** `APP_STORE_REVIEW.md`
