# API security (ops)

RepLock’s Express API accepts **JSON only** on `/api/*` body routes, rate-limits requests, and supports a simple IP ban list.

## What is already enforced

| Control | Behavior |
|--------|----------|
| JSON only | Mutating `/api` requests with a non-JSON `Content-Type` (e.g. XML) get **415**. Bodies capped at **256kb**. Invalid JSON → **400**. |
| Input validation | Email/password/name and ID fields: type checks, trim, length caps. JSON bodies reject `__proto__` / `constructor` / `prototype` keys. Sync strips client-set Pro fields. |
| Rate limits | All `/api` routes: **300 / 15 min** per IP (`/api/health` skipped). Auth login/register: **40 / 15 min**. Webhooks: **120 / 15 min**. |
| IP ban | `BANNED_IPS` env list → **403** before routes run. |
| Stripe webhook | Raw body + Stripe signature verification. |
| RevenueCat webhook | Shared-secret `Authorization` header (timing-safe). |

There is **no** `/api/recent` route today. If one is added under `/api`, it inherits the general API rate limiter automatically.

## Ban an IP

1. On the API host, set or update:

```env
BANNED_IPS=203.0.113.10,198.51.100.22
```

2. Restart the API process (env is read at startup).

3. Confirm with a request from that IP → `403 { "error": "Forbidden" }`.

Exact IPv4/IPv6 string match only (no CIDR). To unban, remove the IP from `BANNED_IPS` and restart.

## Trust proxy (Mac Mini / reverse proxy)

If the API sits behind nginx, Caddy, or Cloudflare, client IPs must come from `X-Forwarded-For`:

```env
TRUST_PROXY=1
```

Production defaults `trust proxy` on so rate limits and bans use the real client IP. Only terminate TLS / set forwarded headers on infrastructure you control.

## Deploy notes (Mac / API host)

```bash
cd /path/to/App
git pull
npm install
# ensure .env has JWT_SECRET, REVENUECAT_WEBHOOK_SECRET, BANNED_IPS (optional), TRUST_PROXY=1
npm run start:prod   # or your pm2/systemd unit
```

No client/app rebuild is required for these server-only changes.
