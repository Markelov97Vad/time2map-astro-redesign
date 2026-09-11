# Adding a new LAB article

This guide explains, step by step, how to publish a new article in the **LAB**
section (a page at `/lab/<slug>`). No build tools knowledge is required — an
article is a single Markdown file plus a few images.

When you add the file, everything else happens automatically:

- the article appears at `/lab/<your-slug>`,
- it is added to the **LAB** dropdown in the header,
- it is included in `sitemap.xml`,
- it gets correct SEO tags (title, description, Open Graph, JSON-LD, breadcrumbs).

There are two ways to do it. Pick one:

- **A. Keystatic admin** (visual editor, no Markdown by hand) — easiest.
- **B. Markdown file** (edit/create the file directly, or ask an LLM) — most flexible.

---

## A. Using the Keystatic admin (recommended for non-developers)

1. Start the site locally: `npm run dev`.
2. Open <http://localhost:4321/keystatic> in your browser.
3. Click **LAB articles → + (Add)**.
4. Fill in the fields (they map 1:1 to the “frontmatter fields” described below).
   You can upload images right in the form.
5. Click **Save**. Keystatic writes a new `.md` file into `src/content/lab/`
   and copies images into `public/images/lab/`.
6. Check the result at `http://localhost:4321/lab/<slug>`.
7. **Publish** (see “Publishing” at the bottom).

That’s it — you can skip the rest. The sections below explain the same fields
in case you prefer editing the Markdown file directly.

---

## B. Creating the Markdown file by hand

### 1. Create the file

Add a new file in `src/content/lab/`. The **file name becomes the URL slug**:

```
src/content/lab/why-maps-matter.md   →   https://time2map.com/lab/why-maps-matter
```

Use a short, lowercase, hyphenated, English file name with keywords
(`barcelona-crime-map`, `offline-maps-guide`). Do not rename it later —
the slug is the public URL.

### 2. Add the frontmatter

The block between the two `---` lines at the top is the **frontmatter** — the
article’s settings. Copy this template and fill it in:

```markdown
---
title: 'Barcelona Crime Map: Safety Index'        # H1 shown on the page
navLabel: Barcelona Crime Map                      # short label in the LAB menu
seoTitle: 'Barcelona Crime by Neighborhood 2019–2025'  # browser tab + Google title
description: >-                                     # meta description (1–2 sentences)
  Crime analysis across Catalunya's 59 police zones: a composite safety index
  benchmarked against Spain's national average, with trends from 2019 to 2025.
publishDate: 2026-05-28                            # YYYY-MM-DD, used for sorting + SEO
displayDate: May 2026                              # human-friendly date shown on page
readTime: 8 min read                               # shown next to the date
heroQuote: >-                                       # optional intro quote under the title
  I built this map to make sense of public crime data...
mapEmbedUrl: https://catalunya-crimes.time2map.com/  # optional embedded iframe (map/app)
mapHints:                                          # optional usage hints under the map
  - icon: /images/icons/sidebar.svg
    text: Choose a crime type from the left panel.
  - icon: /images/icons/sliders.svg
    text: Drag the year slider to explore 2019–2025.
githubUrl: https://github.com/time2map/...          # optional "View source on GitHub" button
ogImage: /images/lab/why-maps-matter/cover.png      # optional social-share preview image
dataSources:                                        # optional "Data sources" link list
  - label: Mossos d'Esquadra — ICGC viewer
    url: https://visors.icgc.cat/mapa-delinquencial/
authorBio: >-                                        # optional bio in the author card
  Geospatial developer based in Barcelona...
---
```

**Field reference**

| Field | Required | What it does |
| --- | --- | --- |
| `title` | yes | The `<h1>` on the page. Make it descriptive and keyword-rich. |
| `navLabel` | yes | Short name in the LAB dropdown and breadcrumbs. |
| `seoTitle` | no | Title in the browser tab and Google results. If omitted, `title` is used. Keep it under ~60 characters. |
| `description` | yes | Meta description (Google snippet + social preview). 1–2 sentences, ~150–160 characters, with the main keywords. |
| `publishDate` | yes | `YYYY-MM-DD`. Sorts the LAB menu (newest first) and feeds the SEO/`<time>` tags. |
| `displayDate` | yes | Free text shown on the page (e.g. `May 2026`). |
| `readTime` | yes | Free text (e.g. `8 min read`). |
| `heroQuote` | no | A short lead-in quote between the meta row and the map/body. |
| `mapEmbedUrl` | no | If set, an interactive iframe (a live map or app) is embedded with an “Open full screen” button. |
| `mapHints` | no | List of `{ icon, text }` shown as tips under the map. Icons live in `/images/icons/`. |
| `githubUrl` | no | If set, shows a “View source on GitHub” button. |
| `ogImage` | no | Image used when the page is shared on social media / chat. ~1200×630 px. If omitted, the site default is used. |
| `dataSources` | no | List of `{ label, url }` rendered as a “Data sources” section. |
| `authorBio` | no | Overrides the default author bio in the card at the bottom. |

### 3. Write the body (Markdown)

Below the closing `---`, write the article in Markdown. **Heading levels are
styled to specific roles** — use them as intended:

| Markdown | Renders as | Use for |
| --- | --- | --- |
| `## Section` | small **terracotta** label | section names: `## Context`, `## Findings`, `## Methodology` |
| `### Heading` | big **UPPERCASE** heading | the main heading of a section |
| `#### Finding title` | 22px heading, **auto-numbered** `01, 02, …` | each “finding” / numbered point |
| normal text | black body text | paragraphs |

> **Important:** never type the numbers yourself. Every `####` inside the
> article is numbered automatically (`01`, `02`, …) and the counter restarts
> after each `##`. Just write `#### Theft is actually declining` and the `07`
> appears on its own. Use `###` (not `####`) for sub-headings you do **not**
> want numbered.

**Images and captions.** Put image files in
`public/images/lab/<your-slug>/` and reference them with an absolute path. An
*italic-only* line right after an image becomes its caption:

```markdown
![A short, descriptive alt text for the chart](/images/lab/why-maps-matter/chart.png)

*Caption shown in grey under the image.*
```

Always write meaningful `alt` text (in the `![...]` brackets) — it matters for
accessibility and image SEO.

**Links, lists, quotes** work as normal Markdown:

```markdown
Built on [open data]( https://example.com ) from the city.

> A pull-quote or an important note renders with a terracotta left border.

1. First step
2. Second step
```

### 4. Preview

Run `npm run dev` and open `http://localhost:4321/lab/<your-slug>`.
Check the heading sizes, the auto-numbered findings, images, and the map embed.

---

## SEO checklist (do this for every article)

- **`title` / `seoTitle`** — descriptive, contains the main keyword, `seoTitle`
  under ~60 characters.
- **`description`** — 150–160 characters, reads naturally, includes keywords.
- **One `# H1`** — that’s the `title` field; never add another `#` in the body.
- **Headings in order** — `##` for sections, `###`/`####` below; don’t skip
  levels for styling (the roles above already give you the look).
- **Image `alt` text** — every image describes what it shows.
- **`ogImage`** — set a ~1200×630 image so shared links look good.
- **`publishDate`** — correct; it powers `<time>`, sorting, and structured data.
- **Internal links** — where natural, link to `/use-cases` or other `/lab/...`
  articles.

The framework already adds, automatically: the canonical URL, Open Graph /
Twitter cards, `Article` + `BreadcrumbList` JSON-LD, the `<time>` element, and
the sitemap entry. You don’t need to touch those.

---

## Publishing

The site is static — changes go live after a rebuild/redeploy.

1. Make sure `npm run build` completes without errors.
2. Commit the new files (the `.md` and the images):
   ```bash
   git add .
   git commit -m "Add LAB article: <title>"
   git push
   ```
3. Deploy (see the deploy section in [README.md](../README.md)). If automatic
   deploy is configured, pushing is enough.

That’s the whole process — one Markdown file, a few images, and a commit.
