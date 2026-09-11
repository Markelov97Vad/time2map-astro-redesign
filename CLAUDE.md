# time2map.com

npm-workspaces monorepo. The public site (`apps/web`) is a 100% static Astro
site migrated from Webflow; a backend (contact form, authenticated admin) is
planned alongside it. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the
full layout, content model, and conventions.

## Commands (run from repo root)

- `npm run dev` — dev server at :4321, Keystatic admin at /keystatic
- `npm run build` — static build of `apps/web` + SEO audit (must pass before committing)
- `npm run audit` — re-run the SEO audit against the existing build
- `npm test` — unit tests (`packages/seo-audit`)

## Must-know rules

- **All editable content lives in `apps/web/src/content/`** — never hardcode
  text/links in components.
- **When adding/renaming a content field, update BOTH
  `apps/web/src/content.config.ts` (Astro/Zod) and
  `packages/keystatic-config/index.ts` (the shared Keystatic schema).**
- Page URLs must stay identical to the old Webflow site: `/`, `/use-cases`,
  `/contact-us`, `/lab/<slug>`.
- **Every page's `<head>` comes from `apps/web/src/components/SeoHead.astro`**
  (via the `Base` layout, or directly on pages that render their own
  `<html>`) — never hand-write title/meta/OG/JSON-LD tags in a page.
- Per-page SEO (static pages) lives in `apps/web/src/content/seo.yaml`; build
  JSON-LD via the tested builders in `apps/web/src/lib/schema.ts` — never
  hand-roll structured data inline in a page.
- The built site must satisfy the content/SEO invariants in
  [docs/CONTENT-INVARIANTS.md](docs/CONTENT-INVARIANTS.md) — `npm run build`
  enforces them. Don't silence a rule to hide a real issue.
- Lab article heading roles and auto-numbered findings: see
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#lab-articles). Use `####` only for
  numbered findings; `###` for other subheadings.
