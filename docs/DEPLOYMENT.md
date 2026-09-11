# Deployment

Docker Compose on a single Linux server. Host **nginx + certbot** terminate TLS
and proxy to the stack on `127.0.0.1:8080`. Images are built in GitHub Actions
and pushed to GHCR; content changes ship only via git → CI rebuild (no on-server
Publish / Keystatic admin in production).

```
              ┌──────────── nginx :443 (host, certbot) ────────────┐
  visitor ───▶│  proxy_pass http://127.0.0.1:8080                    │
              └───────────────────────┬────────────────────────────┘
                                      ▼
              ┌──────────── docker compose ────────────────────────┐
              │  web (nginx)  static + /api/contact → app:4322       │
              │  app (node)   contact form API only                  │
              └────────────────────────────────────────────────────┘
```

## Images

| Image | Role |
|-------|------|
| `ghcr.io/time2map/t2m-astro-web` | Static site + in-compose reverse proxy |
| `ghcr.io/time2map/t2m-astro-app` | Contact API (`apps/server`) |

Tags: `latest` and full git SHA (compose pins the SHA on each deploy).

## Server layout

```
/opt/time2map/                 # DEPLOY_PATH
  docker-compose.yml           # copied by CI each deploy
  .env                         # SMTP etc. (chmod 600) — never in git
/etc/nginx/sites-available/time2map
```

Files: [`docker-compose.yml`](../docker-compose.yml), [`Dockerfile`](../Dockerfile),
[`deploy/docker/`](../deploy/docker/), host proxy [`deploy/nginx.conf`](../deploy/nginx.conf).

## Prerequisites (server)

- Docker Engine + Compose plugin
- nginx, certbot
- DNS for `time2map.com` → this server (cutover at the end)

## First-time setup

1. **Docker login to GHCR** (private packages need a PAT with `read:packages`):

   ```bash
   sudo mkdir -p /opt/time2map && sudo chown "$USER" /opt/time2map
   echo YOUR_GHCR_PAT | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
   ```

2. **Env file** — first successful CI deploy uploads `.env` (from secrets +
   `envsubst`). For a manual smoke test before CI, render locally:

   ```bash
   export ADMIN_PASS='…' SMTP_HOST='…' SMTP_USER='…' SMTP_PASS='…'
   export ADMIN_USER=admin SMTP_PORT=587 SMTP_SECURE=false
   export CONTACT_TO=contact@time2map.com CONTACT_FROM=
   export SITE_URL=https://time2map.com ALLOWED_ORIGIN=https://time2map.com
   umask 077
   envsubst '$ADMIN_USER $ADMIN_PASS $CONTACT_TO $CONTACT_FROM $SMTP_HOST $SMTP_PORT $SMTP_SECURE $SMTP_USER $SMTP_PASS $SITE_URL $ALLOWED_ORIGIN' \
     < deploy/docker/server.env.template > /opt/time2map/.env
   chmod 600 /opt/time2map/.env
   ```

3. **First pull** (after CI has published images at least once, or build locally):

   ```bash
   cd /opt/time2map
   # get compose from the repo once
   curl -fsSL -o docker-compose.yml \
     https://raw.githubusercontent.com/time2map/t2m-astro/master/docker-compose.yml
   docker compose pull
   docker compose up -d
   curl -sI http://127.0.0.1:8080/ | head -n1   # expect HTTP/1.1 200
   ```

4. **Host nginx + TLS**

   ```bash
   sudo cp /path/to/repo/deploy/nginx.conf /etc/nginx/sites-available/time2map
   sudo ln -s /etc/nginx/sites-available/time2map /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d time2map.com -d www.time2map.com
   ```

## GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**.

### SSH / deploy

| Secret | Example | Purpose |
|--------|---------|---------|
| `DEPLOY_HOST` | `203.0.113.10` | SSH host |
| `DEPLOY_USER` | `deploy` | SSH user (in `docker` group) |
| `DEPLOY_SSH_KEY` | private key PEM | Deploy key (no passphrase) |
| `DEPLOY_PATH` | `/opt/time2map` | Directory with compose + `.env` |

### App `.env` (envsubst → `deploy/docker/server.env.template`)

| Secret | Required | Default if empty | Purpose |
|--------|----------|------------------|---------|
| `ADMIN_PASS` | **yes** | — | Basic Auth for admin routes |
| `ADMIN_USER` | no | `admin` | Admin username |
| `SMTP_HOST` | no* | empty | SMTP host (`*` form logs only if unset) |
| `SMTP_USER` | no | empty | SMTP user |
| `SMTP_PASS` | no | empty | SMTP password |
| `SMTP_PORT` | no | `587` | SMTP port |
| `SMTP_SECURE` | no | `false` | `true` for SMTPS |
| `CONTACT_TO` | no | `contact@time2map.com` | Inbox for form |
| `CONTACT_FROM` | no | empty | From header (optional) |
| `SITE_URL` | no | `https://time2map.com` | Redirects / links |
| `ALLOWED_ORIGIN` | no | `https://time2map.com` | CORS |

CI flow on push to `master`: npm test/build → bake & push GHCR → render `.env`
via `envsubst` → SCP compose + `.env` → `IMAGE_TAG=$GITHUB_SHA docker compose
pull && up -d`.

Ensure the SSH user can run `docker compose` without sudo (`usermod -aG docker deploy`).

## Content workflow (no prod admin)

1. Edit content locally (`npm run dev` + Keystatic at `/keystatic`, or edit files
   under `apps/web/src/content/`).
2. Commit and push / open PR to `master`.
3. After green CI, the new **web** image contains the rebuilt static site.

The contact form posts to same-origin `/api/contact` (proxied to the `app`
container). Hosted Keystatic / Publish on the server are **not** exposed in this
setup.

## Ongoing: manual deploy

```bash
cd /opt/time2map
export IMAGE_TAG=<git-sha>   # or latest
docker compose pull
docker compose up -d
```

## Rollback

```bash
cd /opt/time2map
export IMAGE_TAG=<previous-good-sha>
docker compose pull
docker compose up -d
```

## DNS cutover (from Webflow)

1. Verify over the server IP / hosts entry: home, `/use-cases`, `/contact-us`,
   `/lab/<slug>`, contact form, `/sitemap-index.xml`.
2. Point DNS A records at this server; confirm certbot.
3. Cancel Webflow when stable. URLs are unchanged.

## Local image build (optional)

```bash
docker buildx bake -f docker-bake.hcl --set "*.tags=" --load
# or:
docker build --target web -t t2m-web:local .
docker build --target app -t t2m-app:local .
```

## Notes

- Only `127.0.0.1:8080` is published; `app` is on the compose network only.
- Rate limiting uses `X-Forwarded-For` (set by host nginx, preserved by web).
- Legacy bare-metal scripts under `deploy/*.sh` are kept for reference; Docker
  is the supported path.
