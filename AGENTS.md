# RepLock

React 19 + Vite + TypeScript app (Capacitor iOS/Android shells) with an Express API. Users do exercises to earn screen time and unlock blocked apps. Native OS-level blocking (Family Controls / Usage Access) and RevenueCat billing only run on real devices; the **web build is for development and testing only**.

## Cursor Cloud specific instructions

- **Runs fully locally in demo mode.** No database, Docker, Firebase, Stripe, or RevenueCat setup is required for web dev/testing. With no `STRIPE_SECRET_KEY`/Firebase env, the API logs `Demo mode: true` and Pro/billing flows are stubbed. A `.env` file is not needed for the web dev environment (the server has working defaults; `dotenv.config()` is a no-op when `.env` is absent).
- **Start everything:** `npm run dev` (from `package.json`) runs the Vite client on `http://localhost:5173` and the Express API on port `3001` concurrently. Vite proxies `/api` → `3001`. Use the Vite URL (5173) for the app, not the API port.
- **Auth locally:** Firebase is the primary auth path when configured; without it the app falls back to the Express JWT auth (`/api/auth/*`), which works out of the box. Register/login through the UI (welcome → register → onboarding → home) creates a user in `server/data/users.json` (gitignored).
- **App entry flow:** unauthenticated users are routed `/welcome` → `/get-started` → `/register` (or `/login`) → `/onboarding` → `/` (home). Core loop: pick an exercise, complete a session, earn screen-time minutes.
- **Lint/typecheck:** there is no ESLint config or `lint` script. The type-safety gate is `npx tsc --noEmit` (strict mode, passes clean).
- **Tests:** `npm test` (Vitest, `vitest run`). Known pre-existing failure on `main`: `src/lib/__tests__/daily-earn-cap.test.ts > sums per-app minutes across a week` — its `week` window is computed relative to the real current date rather than the test's anchor date, so it fails once wall-clock time moves past the fixture. Unrelated to environment setup.
- **Native (iOS/Android):** `cap:*` scripts and `ios/` / `android/` require Xcode/Android Studio and are out of scope for the cloud Linux VM. Vite is configured to ignore/deny those dirs.
- **Do not commit `server/data/`** (local user JSON) or `.env*` — already gitignored.
