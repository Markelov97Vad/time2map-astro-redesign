# @time2map/server

Backend service for time2map (Astro SSR, Node standalone adapter). Hosts the
contact-form API and the password-protected Keystatic admin.

## Contact API

`POST /api/contact` — accepts the contact form as `application/json` or
`application/x-www-form-urlencoded`/`multipart/form-data`. Public (no auth).

- Spam protection: hidden `website` honeypot field + per-IP rate limit
  (5 requests / 10 min).
- Validation mirrors the front-end form (name, email, budget, message, privacy
  consent).
- Responds with JSON for fetch requests (`Accept: application/json` or
  `X-Requested-With: fetch`); otherwise 303-redirects back to
  `${SITE_URL}/contact-us?sent=1` (or `?error=…`) so the plain form degrades
  gracefully without JS.
- Sends email via SMTP (see env vars). Without `SMTP_HOST` the submission is
  logged instead — the endpoint is fully testable locally.

## Hosted admin (Keystatic)

`/keystatic` — the visual content editor, protected by **HTTP Basic Auth**
(`ADMIN_USER` / `ADMIN_PASS`; if `ADMIN_PASS` is unset the admin returns 503).
It edits the content that lives in `apps/web` and shares its schema with the
dev admin via `packages/keystatic-config`.

> **Important — run with `cwd` = repo root.** Keystatic's local reader resolves
> content paths relative to `process.cwd()` and rejects `../`, so the admin
> config uses `apps/web/`-prefixed paths and the server must run from the repo
> root. The root `start:server` script does this; a systemd unit should set
> `WorkingDirectory` to the repo root.

`/publish` (+ `POST /api/publish`) — also behind Basic Auth. Stages and commits
content edited through the admin, then rebuilds the static site (`astro build` +
SEO audit). The atomic dist swap / nginx reload is added in Phase 5.

For local content editing you can also use apps/web's own dev admin
(`npm run dev` → http://localhost:4321/keystatic), which writes the same files.

## Run

```bash
# from the repo root:
npm run dev:server        # dev API on :4322 (Keystatic dev admin: use apps/web)
npm run build:server      # build to apps/server/dist/
npm run start:server      # run the built server from the repo root (admin works)
```

Configuration is via environment variables — see [.env.example](.env.example).

## Wiring the public site

Set `formEndpoint` in `apps/web/src/content/site.yaml` to this service's public
contact URL (e.g. `https://api.time2map.com/api/contact`). The form then renders
and posts here. The final URL is set during deployment (Phase 5).
