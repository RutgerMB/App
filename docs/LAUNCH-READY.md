# RepLock Launch Readiness

Last verified: **2026-07-14** — run `npm test && npm run build && npx tsc --noEmit` before submission.

## Launch readiness: **Almost ready**

Code, tests, and polish are complete. **Physical device QA and store configuration** remain before App Store / Play submission.

| Score | Meaning |
|-------|---------|
| **Not ready** | Blockers in core flows |
| **Almost ready** ← current | Code ready; needs device QA + store wiring |
| **Ready** | Sandbox IAP verified on real devices, listings complete |

---

## Checklist

### DONE (automated / in repo)

| Area | Status | Notes |
|------|--------|-------|
| Onboarding + auth | ✓ | 15 effective steps (POTENTIAL + WEEK_ONE skipped at runtime); explicit app selection or “Use popular defaults” |
| Home screen | ✓ | Apps strip, single primary upsell (TrialBanner), header upgrade chip |
| Pro entitlement | ✓ | Server-authoritative; Success page fails on refresh error |
| Mobile billing | ✓ | RevenueCat (iOS + Android) with Capgo/Apple fallback |
| Yearly plan | ✓ | €59.99/yr (37% off monthly) |
| Screen Time blocking | ✓ | RepLockControls (iOS 16+) |
| Apps page | ✓ | Pro/trial custom daily limits UI; trial expiry toast when apps trimmed |
| Settings | ✓ | Notifications toggle requests push permission; honest “scheduled reminders coming” copy |
| Dev login | ✓ | Disabled in production builds (`dev-auth.ts`) |
| i18n | ✓ | en + nl/de/fr/es — activity insights + exercise/workout keys synced |
| Legal pages | ✓ | GitHub Pages privacy, terms, support |
| Tests / build | ✓ | `npm test`, `npm run build`, `npx tsc --noEmit` |
| Docs | ✓ | `docs/LAUNCH-USER-CHECKLIST.md` for Mac/ASC/RevenueCat steps |

### USER-MUST-DO (cannot automate)

See **`docs/LAUNCH-USER-CHECKLIST.md`** for numbered copy-paste steps.

| Priority | Task | Where |
|----------|------|-------|
| P0 | Xcode archive + upload build v1.0 | Mac + Xcode |
| P0 | Attach subscriptions to v1.0 | App Store Connect |
| P0 | Sandbox IAP test (monthly, yearly, restore) | Physical iPhone |
| P0 | RevenueCat production API keys + webhook URL | RevenueCat dashboard |
| P0 | Entitlement `pro` + publish paywall | RevenueCat dashboard |
| P1 | Screenshots, description, App Privacy, submit | App Store Connect |
| P1 | Play listing, billing, permissions | Google Play Console |
| P1 | Deploy server with `REVENUECAT_WEBHOOK_SECRET` | Your API host |

### DEFERRED (not launch blockers)

| Item | Notes |
|------|-------|
| Stripe web checkout | Dev/legacy only; mobile uses IAP |
| Web PWA subscriptions | Testing surface only |
| iOS daily usage totals from Screen Time | Blocking works via shield UI |
| Push notification scheduling | Permission requested; local/push scheduling planned |
| Workout templates on Apps page | “Coming soon” placeholder |
| Onboarding further shortening | 15 steps kept for conversion (permission + goal setup + trial CTA) |

---

## Why onboarding has ~15 steps

Internal step IDs go up to 17, but **POTENTIAL (7) and WEEK_ONE (8) are skipped** after YEARS — users see **~15 screens**. Remaining steps are intentional:

1. **Trust & personalization** — language, screen-time estimate, years-on-phone reveal  
2. **Permissions** — Screen Time / usage access (required for blocking)  
3. **Setup** — app picker (explicit selection or confirmed defaults), daily goal  
4. **Conversion** — notifications permission, trial/pricing fork, difficulty, name  

Removing permission or goal steps would break blocking or leave users without apps configured.

---

## Launch model

**Mobile-only.** RepLock ships on App Store + Google Play. The web build is for development and testing — subscriptions are not offered on web.

## Pricing (recommended)

| Plan | Price |
|------|-------|
| Monthly | €7.99/mo |
| Yearly | €59.99/yr (~€5/mo) |

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

## Related docs

- **User steps:** `docs/LAUNCH-USER-CHECKLIST.md`
- **RevenueCat:** `docs/REVENUECAT_SETUP.md`
- **iOS build:** `IOS_SETUP.md`
