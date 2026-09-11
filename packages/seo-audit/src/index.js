import { statSync } from 'node:fs';
import path from 'node:path';
import { defaultConfig } from './config.js';
import { collect } from './collect.js';
import { checkHeadings, checkImages, checkMeta, checkJsonLd, checkLinks } from './rules.js';

/** @typedef {{ page: string, rule: string, severity: 'error' | 'warn', message: string }} Finding */

/**
 * Image files heavier than the configured limit get a warning. Operates on the
 * built output so it covers both `public/` assets and Astro-generated images.
 * @param {string} distDir
 * @param {string[]} files Paths relative to distDir (POSIX).
 * @param {typeof defaultConfig} config
 * @returns {Finding[]}
 */
function checkAssets(distDir, files, config) {
  /** @type {Finding[]} */
  const out = [];
  for (const rel of files) {
    if (!config.imageExtensions.includes(path.extname(rel).toLowerCase())) continue;
    const bytes = statSync(path.join(distDir, rel)).size;
    if (bytes > config.imageMaxBytes) {
      out.push({
        page: '/' + rel,
        rule: 'image-weight',
        severity: 'warn',
        message: `${(bytes / 1024).toFixed(0)} KB exceeds ${(config.imageMaxBytes / 1024).toFixed(0)} KB`,
      });
    }
  }
  return out;
}

/**
 * Run every invariant check against a built site.
 * @param {string} distDir Path to the Astro `dist/` directory.
 * @param {Partial<typeof defaultConfig>} [overrides]
 * @returns {{ findings: Finding[], pageCount: number, fileCount: number }}
 */
export function audit(distDir, overrides = {}) {
  const config = { ...defaultConfig, ...overrides };
  const { files, pages, targets } = collect(distDir);

  /** @type {Finding[]} */
  const findings = [];
  const add = (/** @type {string} */ page, /** @type {Finding[]} */ list) => {
    for (const f of list) findings.push({ page, ...f });
  };

  for (const page of pages) {
    add(page.route, checkHeadings(page.root));
    add(page.route, checkImages(page.root));
    add(page.route, checkMeta(page.root, config));
    add(page.route, checkJsonLd(page.root, page.route, config));
    add(page.route, checkLinks(page.root, targets));
  }
  findings.push(...checkAssets(distDir, files, config));

  return { findings, pageCount: pages.length, fileCount: files.length };
}

export { defaultConfig } from './config.js';
