/**
 * Default thresholds for the content/SEO audit.
 * Override by passing a partial config to {@link audit}.
 *
 * The human-readable spec these encode lives in docs/CONTENT-INVARIANTS.md —
 * keep the two in sync when changing a rule.
 */
export const defaultConfig = {
  /** <title> length bounds (warning if outside). */
  title: { min: 30, max: 60 },
  /** meta description length bounds (warning if outside). */
  description: { min: 50, max: 160 },
  /** Image files larger than this (bytes) get a warning. */
  imageMaxBytes: 300 * 1024,
  /** Extensions treated as images for the weight check. */
  imageExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg'],
  /** Open Graph tags every page must expose. */
  requiredOg: ['og:title', 'og:description', 'og:image'],
  /** HTML files exempt from the "page should carry JSON-LD" warning. */
  jsonLdExempt: ['/404'],
};
