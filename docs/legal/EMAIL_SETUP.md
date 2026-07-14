# Set up support@replock.app

The support page links to **support@replock.app**. You need to own the domain **replock.app** (or change the address everywhere to a domain you control).

## Option A — Cloudflare Email Routing (free, recommended)

If **replock.app** uses Cloudflare DNS:

1. Cloudflare dashboard → **replock.app** → **Email** → **Email Routing**
2. Enable Email Routing
3. Add **destination address** → your personal Gmail (verify it)
4. Create **custom address:** `support@replock.app` → forward to your Gmail
5. Send a test email to support@replock.app

No inbox to manage — mail forwards to Gmail. Replies can use “Send mail as” in Gmail settings.

## Option B — ImprovMX (free tier)

1. Sign up at https://improvmx.com
2. Add domain **replock.app**
3. Add ImprovMX MX records to your domain DNS (they show exact values)
4. Create alias `support@replock.app` → your Gmail
5. Verify and test

## Option C — Google Workspace (paid)

~€6/user/month — full mailbox at support@replock.app. Only needed if you want a separate inbox.

## If you do NOT own replock.app yet

Until the domain works:

1. Register **replock.app** (or **replocks.app** if available for the new name)
2. Complete Option A or B above
3. Or temporarily use your personal email on the support page only (update `support.html` and App Store Connect)

## After email works

App Store Connect **Support URL** (HTTPS, not mailto):

```
https://rutgermb.github.io/App/legal/support.html
```

DSA trader contact email can be the same: `support@replock.app`

## App env (optional)

```env
VITE_SUPPORT_EMAIL=support@replock.app
VITE_SUPPORT_URL=https://rutgermb.github.io/App/legal/support.html
VITE_PRIVACY_URL=https://rutgermb.github.io/App/legal/privacy.html
VITE_TERMS_URL=https://rutgermb.github.io/App/legal/terms.html
```
