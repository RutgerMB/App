# RepLock

**Replace doomscrolling with exercise.** Do push-ups, squats, or planks to earn screen time and unlock your apps.

A production-quality mobile-first PWA built with React, Tailwind CSS, and Stripe.

## Features

- **Exercise to earn** — 9 workouts from jumping jacks to burpees, with varying earn rates
- **App locking** — Manage distracting apps, spend earned screen time to unlock them (in-app tracking)
- **Streak tracking** — Build daily exercise habits with streak counters
- **RepLock Pro** — €7.99/mo subscription with unlimited apps, custom limits, streak protection
- **5 languages** — English, Dutch, German, French, Spanish
- **Premium UI** — Dark, polished interface inspired by Linear, Stripe, and Arc

## Quick start

```bash
# Install dependencies
npm install

# Copy environment file (optional — works in demo mode without Stripe)
cp .env.example .env

# Start dev server (client + API)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on your phone or desktop.

## Stripe setup (test mode)

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Copy your **test** secret key from [API keys](https://dashboard.stripe.com/test/apikeys)
3. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   CLIENT_URL=http://localhost:5173
   ```
4. Use test card `4242 4242 4242 4242` with any future expiry and CVC

Pro is **€7.99/month** (EUR).

Without Stripe keys, the app runs in **demo mode** — checkout redirects to success automatically.

## Mobile app (Capacitor)

Build and sync to native projects:

```bash
npm run build:mobile    # build web + sync to android/
npm run cap:android     # open Android Studio (Samsung/Google Play)
npm run cap:ios         # open Xcode (requires Mac — App Store)
```

The `android/` folder is ready for Android Studio. See **[LAUNCH.md](./LAUNCH.md)** for store submission steps.


## Architecture

```
src/
├── components/     # UI primitives (Button, Card, Modal, etc.)
├── pages/          # Route pages (Home, Exercise, Apps, etc.)
├── store/          # Zustand state with localStorage persistence
├── lib/            # Utilities and API helpers
└── types/          # TypeScript definitions

server/
└── index.ts        # Express API (Stripe checkout, verification)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client (5173) + server (3001) |
| `npm run build` | Production build |
| `npm start` | Serve production build |

## Tech stack

- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion
- Zustand (persisted state)
- Express + Stripe Checkout
- Vite

## License

MIT
