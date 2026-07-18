# RepLock — Launch Now

Last updated: **2026-07-18**

## Verdict: **NOT READY** (code ready, ops not)

App code, security controls, legal paths, and production bake scripts are in the repo. You still need Apple Family Controls **distribution** approval, a real production API URL + secrets, physical-device Screen Time / sandbox IAP QA, and App Store Connect listing/submit. Those cannot be finished from this machine.

---

## Done in repo

| Area | Notes |
|------|--------|
| Auth + delete account | Settings → Delete account (password); `DELETE /api/auth/account` |
| Cancel subscription | Pricing / Settings → Manage or cancel (store subscription management URL) |
| Legal | Privacy, terms, support on GitHub Pages + in-app |
| Billing | RevenueCat iOS/Android; Stripe legacy/dev only |
| Screen Time blocking | `RepLockControls` + Family Controls entitlements |
| DeviceActivityReport | Target **in** `App.xcodeproj` (confirm signing on Mac) |
| Shield extensions | **Sources** in repo; Xcode targets still need Mac add (below) |
| Notifications | `NSUserNotificationsUsageDescription` in `Info.plist` |
| API security | JSON-only, rate limits, validation, IP ban — `docs/API-SECURITY.md` |
| Production iOS bake | `npm run cap:ios:prod` requires `VITE_API_URL=https://…` + `appl_…` key |
| Docs | Bundle IDs corrected (`app.replock.bleeker` iOS / `com.replock.app` Android); Stripe/PWA leftovers cleaned |
| Review guide | `APP_STORE_REVIEW.md` aligned with RevenueCat + IAP |

---

## Blocked on you

1. **Apple Family Controls distribution approval** — Developer portal → App ID `app.replock.bleeker` (and extension IDs). Without this, blocking / authorize fails on TestFlight/App Store. *Why:* Apple must approve the entitlement for distribution.
2. **Set production secrets + redeploy API** — On your API host: `JWT_SECRET`, `REVENUECAT_WEBHOOK_SECRET`, `APP_REVIEW_*`, `CLIENT_URL`, `TRUST_PROXY=1`, then restart (`npm run start:prod` or your process manager). *Why:* phones need a live HTTPS API and webhooks.
3. **Set `VITE_API_URL` and Archive** — In Mac `.env`: `VITE_API_URL=https://YOUR-API-DOMAIN` + `VITE_REVENUECAT_API_KEY_IOS=appl_…`, then `npm run cap:ios:prod` → Xcode Archive. *Why:* store builds must not use LAN/`127.0.0.1`.
4. **Physical iPhone QA** — Authorize Screen Time, pick apps, exercise unlock, sandbox IAP (monthly + yearly + restore). *Why:* Simulator cannot do Family Controls / real StoreKit sandbox.
5. **App Store Connect** — Products Ready to Submit, attach to v1.0, screenshots, privacy form, Submit for Review. *Why:* only you have ASC access.
6. **Shield Configuration + Action targets (Mac / Xcode once)** — Sources exist; targets are **not** in `App.xcodeproj` yet. Exact clicks: **`IOS_SETUP.md` → Shield Configuration & Action extensions**. *Why:* branded “Earn minutes” shield; blocking still works without them (system default shield).
7. **Optional later:** Google Play listing + Android RevenueCat key (iOS-first is fine).

---

## After those, you’re ready to submit when…

- [ ] Family Controls approved for distribution on the App ID(s)
- [ ] Production API healthy at `https://…/api/health` and RevenueCat webhook receiving events
- [ ] Archive built with `cap:ios:prod` (no dev login, HTTPS API baked in)
- [ ] Sandbox purchase + restore verified on a real iPhone
- [ ] ASC listing + demo account notes from `APP_STORE_REVIEW.md` filled in

Then: **Submit for Review**.

Numbered copy-paste steps: **`docs/LAUNCH-USER-CHECKLIST.md`**.
