import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

/**
 * Recursively list every file under `dir`, returned as paths relative to `dir`
 * using POSIX separators (so they map cleanly onto site URLs).
 * @param {string} dir
 * @returns {string[]}
 */
export function listFiles(dir) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} current */
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const abs = path.join(current, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else out.push(path.relative(dir, abs).split(path.sep).join('/'));
    }
  };
  walk(dir);
  return out;
}

/**
 * @typedef {object} Page
 * @property {string} route   Canonical route, e.g. "/use-cases" or "/".
 * @property {string} file    Path relative to dist, e.g. "use-cases/index.html".
 * @property {import('node-html-parser').HTMLElement} root Parsed document.
 */

/**
 * Map an HTML file (relative to dist) to its canonical route.
 * `index.html` -> "/", `use-cases/index.html` -> "/use-cases", `404.html` -> "/404".
 * @param {string} rel
 * @returns {string}
 */
export function routeForHtml(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel.slice(0, -'.html'.length);
}

/**
 * Parse all HTML pages plus build the set of valid internal link targets
 * (every emitted file, every route in both trailing-slash forms).
 * @param {string} distDir
 */
export function collect(distDir) {
  const files = listFiles(distDir);
  /** @type {Page[]} */
  const pages = [];
  /** Every link target that resolves to something in the build. */
  const targets = new Set(['/']);

  for (const rel of files) {
    const abs = '/' + rel;
    targets.add(abs); // direct file hit: /robots.txt, /images/x.svg, /favicon-32.png

    if (rel.endsWith('.html')) {
      const route = routeForHtml(rel);
      targets.add(route);
      targets.add(route === '/' ? '/' : route + '/');
      pages.push({ route, file: rel, root: parse(readFileSync(path.join(distDir, rel), 'utf8')) });
    }
  }

  return { files, pages, targets };
}
