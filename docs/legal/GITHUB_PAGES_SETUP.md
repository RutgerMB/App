# Host RepLocks legal pages on GitHub Pages

Static HTML in this folder — **public to read, editable only by repo collaborators** (not by random visitors).

## Enable GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings** → **Pages**
3. **Build and deployment** → Source: **Deploy from a branch**
4. Branch: **main** → Folder: **/docs**
5. **Save** — wait 1–3 minutes for the site to build.

## Your URLs

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub values.

| Page | URL |
|------|-----|
| **Privacy Policy** (use in App Store Connect) | `https://YOUR_USERNAME.github.io/YOUR_REPO/legal/privacy.html` |
| Terms of Service | `https://YOUR_USERNAME.github.io/YOUR_REPO/legal/terms.html` |

Example if repo is `App` under user `johndoe`:

```
https://johndoe.github.io/App/legal/privacy.html
```

## Keep it read-only for the public

- **Visitors** only see the published HTML — they cannot edit it.
- **Only people with write access** to the GitHub repo can change the files.
- Optional hardening:
  - **Settings → Branches** → protect `main` (require your approval for changes)
  - Do not add outside collaborators with write access
  - Use a **private repo** if you want the source hidden (Pages can still be public — check Pages settings)

## App Store Connect

Paste the **Privacy Policy URL** exactly:

```
https://YOUR_USERNAME.github.io/YOUR_REPO/legal/privacy.html
```

Must be `https://` and publicly reachable without login.

## Update app env (optional)

When the URL is live, set in production builds:

```env
VITE_PRIVACY_URL=https://YOUR_USERNAME.github.io/YOUR_REPO/legal/privacy.html
VITE_TERMS_URL=https://YOUR_USERNAME.github.io/YOUR_REPO/legal/terms.html
VITE_SUPPORT_EMAIL=support@replock.app
```
