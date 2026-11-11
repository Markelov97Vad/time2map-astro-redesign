# Architecture

time2map.com — a business-card site for a GIS/web development agency, migrated
from Webflow. The public site is **100% static**. The repo is an npm-workspaces
monorepo so a backend (contact form, authenticated admin) can live alongside the
static site without compromising it.

## Monorepo layout

```
time2map/
  apps/
    web/                Astro static site (the public site)
    server/             Astro SSR (Node) backend: contact-form API + hosted admin
  packages/
    seo-audit/          post-build content/SEO invariant checker (CLI + lib)
    keystatic-config/   shared Keystatic schema (factory, path-prefixed)
  docs/                 this folder
```

- Root `package.json` declares `workspaces: ["apps/*", "packages/*"]` and
  delegates scripts to `@time2map/web` (`npm run dev` / `npm run build` from the
  repo root still work). `npm run build:all` builds the web site and the server.
- Planned: `packages/content` once it's worth extracting the content files into a
  package shared by `web` and `server`.

## apps/server — the backend

Astro SSR with the Node standalone adapter. Two responsibilities:

**Contact API** — `POST /api/contact` (public): validation mirroring the
front-end, hidden-field honeypot, per-IP rate limit, SMTP email via nodemailer,
JSON or 303-redirect responses. Without `SMTP_HOST` it logs submissions instead
of sending. CSRF origin checking is disabled (`security.checkOrigin: false`)
because it's a public, cookie-less endpoint that intentionally accepts
cross-origin form posts; access is scoped via `ALLOWED_ORIGIN` CORS.

**Hosted Keystatic admin** — `/keystatic` plus the publish trigger
(`/publish`, `POST /api/publish`), all behind HTTP Basic Auth in
`src/middleware.ts` (`ADMIN_USER`/`ADMIN_PASS`; refused with 503 if `ADMIN_PASS`
is unset). Used in **local/dev** (`npm run dev:server`). Production Docker
deploys only the contact API (admin is not proxied); content goes live via git
→ GHCR image rebuild — see [DEPLOYMENT.md](DEPLOYMENT.md).

> Keystatic's local reader resolves content paths relative to `process.cwd()`
> and rejects `../`, so the admin config uses `apps/web/`-prefixed paths and the
> server **must run with `cwd` = repo root** when using the hosted admin.
> Config is via env vars — see `apps/server/.env.example`.

Run config is via env vars (see `apps/server/.env.example`).

## apps/web — the static site

Stack: Astro, content collections, plain CSS (no framework), Keystatic admin
(dev-only). No client-side framework on public pages — only two small vanilla JS
scripts (mobile menu in `Header.astro`, image slider in `UseCaseCard.astro`).

### Content

- **All editable content lives in `apps/web/src/content/`** — never hardcode
  text/links in components.
  - `site.yaml` — global settings (email, social links, book-a-call URL, form endpoint).
  - `pages/home.yaml` — home page sections (hero, stats, services, clients, about, process, technologies, cta).
  - `seo.yaml` — per-page SEO (title, description, ogImage, noindex) for the
    static pages (home, use-cases, contact, 404). Lab articles carry their own
    SEO fields per markdown file.
  - `use-cases/*.md`, `lab/*.md`, `faq/*.md`, `testimonials/*.yaml` — collections, schemas in `apps/web/src/content.config.ts`.
- YAML singletons are imported directly (`import site from '../content/site.yaml'`)
  via `@rollup/plugin-yaml`; collections via `getCollection()`.
- The Keystatic schema lives in `packages/keystatic-config` (a factory shared by
  both admins). **When adding/renaming a content field, update BOTH
  `apps/web/src/content.config.ts` (Astro/Zod) and
  `packages/keystatic-config/index.ts` (Keystatic).** The thin
  `keystatic.config.ts` in each app just calls the factory with a path prefix
  (`''` for apps/web, `'apps/web/'` for apps/server).
- Images live in `apps/web/public/images/` and are referenced by absolute path
  strings (`/images/...`), not Astro image imports. Because of that there is no
  build-time resizing: `apps/web/scripts/optimize-images.mjs` (sharp) generates the
  responsive WebP sets (`<name>-<width>.webp`) the home and use-cases pages reference via
  `srcset`/`sizes`, rasterises traced SVG logos and recompresses screenshots in
  place. Run it after adding or replacing a picture (`node scripts/optimize-images.mjs
  --prune` from `apps/web`), then reference the variants. The SEO audit warns on any
  file over 300 KB.
- **Every page's `<head>` is rendered by `apps/web/src/components/SeoHead.astro`**
  — title/description, canonical, robots (incl. the `PUBLIC_STAGING` noindex),
  Open Graph, Twitter cards, JSON-LD, Google site verification and the iubenda
  widget. The classic `Base` layout wraps it; the redesigned pages (`index`,
  `contact-us`, `lab/time-2-route`, `lab/barcelona-crime-map`) render their own
  `<html>`/`<body>` and use it directly. Never hand-write these tags in a page —
  SEO copy comes from `seo.yaml` / the lab entry's frontmatter.
- **JSON-LD structured data is built in `apps/web/src/lib/schema.ts`** — one
  tested module of builder functions (Organization, WebSite, FAQPage,
  CollectionPage, ContactPage, Article, BreadcrumbList). Pages pass content
  fields in and get valid schema.org objects out; never hand-roll JSON-LD
  inline in a page. The post-build audit validates the rendered output.

### Performance notes

- Everything below the first screen is lazy: images carry `loading="lazy"`, the demo
  video's Vimeo iframe is created by the home page script only when its section
  approaches the viewport. The poster (a plain `<img>`) stays on screen until the
  player reports playback through its postMessage API (`timeupdate`), so visitors never
  see the player's black box while it buffers.
- The hero globe is the LCP image: it has `fetchpriority="high"` and a `<link
  rel="preload">` in the head; keep it that way if the hero changes.
- The project carousel must never scroll smoothly at load: a smooth (CSS
  `scroll-behavior`) scroll before the first paint makes Chrome stop reporting LCP for
  the whole page, so the container uses `scroll-behavior: auto` and the script asks for
  `behavior: 'instant'` when positioning on load/resize, and `'smooth'` only for clicks.
- Fonts are self-hosted through `@fontsource` (imported from `palette.css`); do not
  add Google Fonts `@import`s, they put two render-blocking round trips before text.
- Third-party scripts (iubenda) load `async` from `SeoHead.astro`.

### Styling

- Design tokens (colors, fonts, container width) are CSS custom properties in
  `apps/web/src/styles/global.css`. Accent color `#c94e43`, headings IBM Plex
  Sans 500, body Roboto 300/400 (self-hosted via @fontsource).

### Build & deploy

- Keystatic integration is excluded from production builds (see
  `apps/web/astro.config.mjs`); the deployed site is 100% static.
- `npm run build` runs `astro build` then the SEO audit (see
  [CONTENT-INVARIANTS.md](CONTENT-INVARIANTS.md)); output is `apps/web/dist/`.
- `build.format: 'file'` emits `/contact-us.html` (not `/contact-us/index.html`)
  so the server can answer `/contact-us` directly without a trailing-slash
  redirect (nginx `try_files $uri.html`, Vercel `cleanUrls`). Canonicals, og:url
  and the sitemap stay extensionless and slash-less (`/contact-us`).
- Staging (Vercel) builds with `PUBLIC_STAGING=true`, which adds
  `noindex, follow` to every page; production never sets it.

### Lab articles

- In lab article markdown, an italic-only paragraph right after an image is
  styled as its caption (see `.rich-text` in global.css).
- Heading roles (`.rich-text`, mirrors the Webflow original): `##` renders as a
  small terracotta section label ("Context", "Findings", "Methodology"), `###`
  as a big uppercase section heading, `####` as a 22px finding/sub heading.
  Every `####` inside `.article-body` is auto-numbered (01, 02, …) via a CSS
  counter that resets at each `##` — so write findings as plain
  `#### Finding title` and never hardcode the number. Keep `####` for the
  numbered findings only; use `###` for other subheadings so they aren't
  numbered.

## Conventions

- Page URLs must stay identical to the old Webflow site: `/`, `/use-cases`,
  `/contact-us`, `/lab/<slug>`.
- Lab dropdown in the header and `/lab/<slug>` pages are generated from the
  `lab` collection — adding an md file is enough.
- The contact form renders only when `site.yaml → formEndpoint` is set;
  otherwise an email button + social links are shown.
