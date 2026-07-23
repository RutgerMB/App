# RepLock

**Replace doomscrolling with exercise.** Do push-ups, squats, or planks to earn screen time and unlock your apps.

Native **iOS + Android** apps (Capacitor) with Screen Time / usage blocking and **RevenueCat** subscriptions. The web build is for development and testing only.

| Platform | ID |
|----------|-----|
| iOS | `app.replock.bleeker` |
| Android | `com.replock.app` |

## Features

- **Exercise to earn** — workouts with varying earn rates
- **OS-level app locking** — Family Controls (iOS) / Usage Access (Android)
- **Streak tracking** — daily exercise habits
- **RepLock Pro** — €7.99/mo or €59.99/yr (unlimited apps, custom limits, insights)
- **5 languages** — English, Dutch, German, French, Spanish

## Quick start (dev)

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API runs on port 3001.

## Production iOS (App Store / TestFlight)

On a **Mac**, set secrets in `.env` (never commit real values):

```env
VITE_API_URL=https://YOUR-API-DOMAIN
VITE_REVENUECAT_API_KEY_IOS=appl_YOUR_KEY
```

Then:

```bash
npm run cap:ios:prod
open ios/App/App.xcodeproj
# Product → Archive
```

Dev device builds (LAN API): `npm run cap:ios:sync` — see **[IOS_SETUP.md](./IOS_SETUP.md)**.  
Android phone builds: `npm run cap:android:sync` — see **[ANDROID_SETUP.md](./ANDROID_SETUP.md)**.

## Launch docs

| Doc | Purpose |
|-----|---------|
| **[docs/LAUNCH-NOW.md](./docs/LAUNCH-NOW.md)** | Done in repo · blocked on you · verdict |
| [docs/LAUNCH-USER-CHECKLIST.md](./docs/LAUNCH-USER-CHECKLIST.md) | Numbered Mac / ASC / RevenueCat steps |
| [APP_STORE_REVIEW.md](./APP_STORE_REVIEW.md) | Review notes + checklist |
| [docs/REVENUECAT_SETUP.md](./docs/REVENUECAT_SETUP.md) | RevenueCat dashboard |
| [docs/API-SECURITY.md](./docs/API-SECURITY.md) | Rate limits, bans, deploy notes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Client (5173) + API (3001) |
| `npm run build` | Production web build |
| `npm test` | Vitest |
| `npm run check:env` | Report `.env` keys set/missing (never prints secrets) |
| `npm run cap:ios:sync` | Dev iPhone sync (LAN IP) |
| `npm run cap:ios:prod` | Production bake + iOS sync (requires `VITE_API_URL`) |
| `npm run cap:android:sync` | Dev Android sync (LAN IP) |
| `npm run cap:android` | Open Android Studio |
| `npm run start:prod` | Run API with `NODE_ENV=production` |

## Architecture

```
src/          React UI + Zustand
server/       Express API (JWT fallback auth, Pro entitlement, RevenueCat webhooks, review account)
ios/          Capacitor + Family Controls plugins / extensions
android/      Capacitor + usage / blocker plugins
```

Primary sign-in/sync is **Firebase** when configured; Express remains required for billing webhooks and store bake (`VITE_API_URL`).
## License

MIT
