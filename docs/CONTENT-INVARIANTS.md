# Content invariants

Rules the built site must satisfy. Enforced by `@time2map/seo-audit`, which
parses every HTML file in `apps/web/dist/` after `astro build` and fails the
build on any **error**. **Warnings** are reported but do not fail the build.

The audit is the source of truth; this document explains intent. When you change
a rule, update both the rule code in `packages/seo-audit/src/` and this file.

## How it runs

- `npm run build` → `astro build && seo-audit dist` (audit runs automatically).
- `npm run audit` → re-run the audit against the existing `apps/web/dist/`
  without rebuilding.
- `npm test` → unit tests for the rules (`packages/seo-audit/test/`).

Thresholds live in `packages/seo-audit/src/config.js`.

## Rules

| Rule | Severity | What it checks |
| --- | --- | --- |
| `heading-h1` | error | Exactly one `<h1>` per page. |
| `heading-skip` | error | Heading levels never jump down by more than one (`h2`→`h4` is invalid; going back up, `h4`→`h2`, is fine). |
| `img-alt` | error | Every `<img>` has an `alt` attribute (empty `alt=""` is allowed for decorative images). |
| `img-dimensions` | warn | Every `<img>` has `width` and `height` (prevents layout shift). |
| `title` | error | `<title>` is present. |
| `title-length` | warn | `<title>` is 30–60 characters (skipped on `noindex` pages). |
| `description` | error | `<meta name="description">` is present. |
| `description-length` | warn | Description is 50–160 characters (skipped on `noindex` pages). |
| `canonical` | error | `<link rel="canonical">` is present. |
| `og` | error | `og:title`, `og:description`, `og:image` are present. |
| `jsonld` | error | Each `application/ld+json` block is valid JSON with `@context` and `@type`. |
| `jsonld-missing` | warn | Page carries no JSON-LD (exempt: `/404`). |
| `link-internal` | error | Internal links resolve to a file/route in the build. |
| `link-external` | warn | External links are syntactically valid URLs. |
| `image-weight` | warn | Image files are ≤ 300 KB. |

## Known warnings (acceptable, tracked)

The current content trips some warnings on purpose — they surface real
follow-ups without blocking the build:

- **`img-dimensions`** (45) — markdown (lab article) images and several
  component images lack explicit `width`/`height`. Target: add dimensions to
  reduce CLS.
- **`image-weight`** (8) — a handful of use-case `.webp` screenshots and
  `tech/postgis.svg` exceed 300 KB. Target: re-export/optimize.

Reducing these to zero is content work, not an audit change. Keep them as
warnings until addressed; do not silence a rule to hide a real issue.
