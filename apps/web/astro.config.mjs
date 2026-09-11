// @ts-check
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import yaml from '@rollup/plugin-yaml';
import keystatic from '@keystatic/astro';

// Keystatic admin is dev-only: it needs server routes, while the production
// build stays fully static. `astro build` sets NODE_ENV=production.
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Rehype plugin: lazy-load markdown images (lab articles). They all sit
 * below the fold, so this is safe and improves LCP/bandwidth.
 */
function rehypeLazyImages() {
  /** @param {any} node */
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'img') {
      node.properties.loading ??= 'lazy';
      node.properties.decoding ??= 'async';
    }
    for (const child of node.children ?? []) visit(child);
  };
  return (/** @type {any} */ tree) => visit(tree);
}

const SITE = 'https://time2map.com';

/**
 * The old Webflow site serves its sitemap at /sitemap.xml (and robots.txt
 * points there), while @astrojs/sitemap only emits sitemap-index.xml +
 * sitemap-0.xml. Publish the generated urlset at /sitemap.xml too, so the
 * URL search engines already know keeps working — same set of URLs, updated
 * automatically whenever pages are added.
 */
function sitemapXmlAlias() {
  return {
    name: 'sitemap-xml-alias',
    hooks: {
      /** @param {{ dir: URL }} options */
      'astro:build:done': async ({ dir }) => {
        const xml = await readFile(fileURLToPath(new URL('./sitemap-0.xml', dir)), 'utf8');
        // The Webflow sitemap lists the home page without a trailing slash.
        const out = xml.replace(`<loc>${SITE}/</loc>`, `<loc>${SITE}</loc>`);
        await writeFile(fileURLToPath(new URL('./sitemap.xml', dir)), out);
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  build: {
    format: 'file',
  },
  integrations: [
    sitemap({
      // Keep sitemap URLs identical to the canonical tags (no trailing
      // slash, matching the old Webflow URLs), so search engines get
      // consistent signals.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/' && url.pathname.endsWith('/')) {
          item.url = item.url.replace(/\/$/, '');
        }
        return item;
      },
    }),
    sitemapXmlAlias(),
    react(),
    ...(isDev ? [keystatic()] : []),
  ],
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeLazyImages],
    }),
  },
  vite: {
    plugins: [yaml()],
    build: {
      // Never inline font files into CSS: Vite base64-inlines assets under 4 KB, which put
      // ~35 KB of (unused, woff-fallback) font data into the render-blocking stylesheet.
      assetsInlineLimit: (file) => (/.(woff2?|ttf|otf)$/i.test(file) ? false : undefined),
    },
    // Dev only (ignored by `astro build`): forward the contact form to
    // apps/server (`npm run dev:server`, :4322) the way nginx does in
    // production, so the form is testable locally. Scoped to /api/contact —
    // /api/keystatic belongs to the dev admin.
    server: { proxy: { '/api/contact': 'http://localhost:4322' } },
  },
});
