/**
 * Per-page invariant rules. Each returns an array of findings:
 *   { rule, severity: 'error' | 'warn', message }
 * The page route is attached by the orchestrator.
 */

/** @typedef {{ rule: string, severity: 'error' | 'warn', message: string }} Finding */

const LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * Exactly one <h1>, and heading levels never jump down by more than one
 * (h2 -> h4 is a violation; going back up, h4 -> h2, is fine).
 * @param {import('node-html-parser').HTMLElement} root
 * @returns {Finding[]}
 */
export function checkHeadings(root) {
  /** @type {Finding[]} */
  const out = [];
  const headings = root.querySelectorAll(LEVELS.join(','));
  const h1s = headings.filter((h) => h.tagName.toLowerCase() === 'h1');

  if (h1s.length === 0) out.push({ rule: 'heading-h1', severity: 'error', message: 'page has no <h1>' });
  else if (h1s.length > 1)
    out.push({ rule: 'heading-h1', severity: 'error', message: `page has ${h1s.length} <h1> elements, expected 1` });

  let prev = 0;
  for (const h of headings) {
    const level = Number(h.tagName.slice(1));
    if (prev && level > prev + 1) {
      out.push({
        rule: 'heading-skip',
        severity: 'error',
        message: `heading jumps from h${prev} to h${level} ("${h.text.trim().slice(0, 50)}")`,
      });
    }
    prev = level;
  }
  return out;
}

/**
 * Every <img> must carry an alt attribute (empty alt is allowed for decorative
 * images). Missing width/height is a warning (layout shift).
 * @param {import('node-html-parser').HTMLElement} root
 * @returns {Finding[]}
 */
export function checkImages(root) {
  /** @type {Finding[]} */
  const out = [];
  for (const img of root.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '(no src)';
    if (img.getAttribute('alt') === undefined)
      out.push({ rule: 'img-alt', severity: 'error', message: `<img> missing alt attribute: ${src}` });
    if (img.getAttribute('width') === undefined || img.getAttribute('height') === undefined)
      out.push({ rule: 'img-dimensions', severity: 'warn', message: `<img> missing width/height: ${src}` });
  }
  return out;
}

/**
 * Required <head> SEO tags: title, meta description, canonical, Open Graph.
 * Length bounds on title/description are warnings.
 * @param {import('node-html-parser').HTMLElement} root
 * @param {import('./config.js').defaultConfig} config
 * @returns {Finding[]}
 */
export function checkMeta(root, config) {
  /** @type {Finding[]} */
  const out = [];

  // noindex pages are excluded from search, so SEO copy-length nags don't apply.
  const robots = root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  const noindex = /noindex/i.test(robots);

  const title = root.querySelector('title')?.text.trim() ?? '';
  if (!title) out.push({ rule: 'title', severity: 'error', message: 'missing <title>' });
  else if (!noindex && (title.length < config.title.min || title.length > config.title.max))
    out.push({
      rule: 'title-length',
      severity: 'warn',
      message: `<title> is ${title.length} chars (recommended ${config.title.min}–${config.title.max})`,
    });

  const desc = root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
  if (!desc) out.push({ rule: 'description', severity: 'error', message: 'missing meta description' });
  else if (!noindex && (desc.length < config.description.min || desc.length > config.description.max))
    out.push({
      rule: 'description-length',
      severity: 'warn',
      message: `meta description is ${desc.length} chars (recommended ${config.description.min}–${config.description.max})`,
    });

  if (!root.querySelector('link[rel="canonical"]'))
    out.push({ rule: 'canonical', severity: 'error', message: 'missing canonical link' });

  for (const prop of config.requiredOg) {
    if (!root.querySelector(`meta[property="${prop}"]`))
      out.push({ rule: 'og', severity: 'error', message: `missing ${prop}` });
  }

  return out;
}

/**
 * Each <script type="application/ld+json"> must be valid JSON with @context
 * and @type. A page carrying no JSON-LD at all is a (configurable) warning.
 * @param {import('node-html-parser').HTMLElement} root
 * @param {string} route
 * @param {import('./config.js').defaultConfig} config
 * @returns {Finding[]}
 */
export function checkJsonLd(root, route, config) {
  /** @type {Finding[]} */
  const out = [];
  const blocks = root.querySelectorAll('script[type="application/ld+json"]');

  if (blocks.length === 0) {
    if (!config.jsonLdExempt.includes(route))
      out.push({ rule: 'jsonld-missing', severity: 'warn', message: 'page has no JSON-LD structured data' });
    return out;
  }

  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block.text);
    } catch (err) {
      out.push({ rule: 'jsonld', severity: 'error', message: `invalid JSON-LD: ${(err && err.message) || err}` });
      continue;
    }
    for (const node of Array.isArray(data) ? data : [data]) {
      if (!node || typeof node !== 'object' || !node['@context'])
        out.push({ rule: 'jsonld', severity: 'error', message: 'JSON-LD node missing @context' });
      if (!node || typeof node !== 'object' || !node['@type'])
        out.push({ rule: 'jsonld', severity: 'error', message: 'JSON-LD node missing @type' });
    }
  }
  return out;
}

/**
 * Internal links must resolve to a file/route in the build; external links must
 * be syntactically valid URLs.
 * @param {import('node-html-parser').HTMLElement} root
 * @param {Set<string>} targets Valid internal targets (from {@link collect}).
 * @returns {Finding[]}
 */
export function checkLinks(root, targets) {
  /** @type {Finding[]} */
  const out = [];
  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) continue;
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;

    if (/^https?:\/\//i.test(href) || href.startsWith('//')) {
      try {
        new URL(href.startsWith('//') ? 'https:' + href : href);
      } catch {
        out.push({ rule: 'link-external', severity: 'warn', message: `malformed external URL: ${href}` });
      }
      continue;
    }

    // Internal link: strip query/hash, normalise trailing slash, decode.
    let pathname = href.split('#')[0].split('?')[0];
    if (!pathname) continue; // was a bare #hash or ?query on the current page
    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      /* leave as-is */
    }
    const normalised = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    if (!targets.has(normalised) && !targets.has(pathname)) {
      out.push({ rule: 'link-internal', severity: 'error', message: `broken internal link: ${href}` });
    }
  }
  return out;
}
