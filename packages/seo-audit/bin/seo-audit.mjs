#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { audit } from '../src/index.js';

const distArg = process.argv[2] ?? 'dist';
const distDir = path.resolve(process.cwd(), distArg);

if (!existsSync(distDir)) {
  console.error(`seo-audit: dist directory not found: ${distDir}\nRun the build first, then point seo-audit at the output.`);
  process.exit(2);
}

const { findings, pageCount, fileCount } = audit(distDir);
const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warn');

/** @param {typeof findings} list */
const printGroup = (list) => {
  /** @type {Map<string, typeof findings>} */
  const byPage = new Map();
  for (const f of list) {
    if (!byPage.has(f.page)) byPage.set(f.page, []);
    byPage.get(f.page).push(f);
  }
  for (const [page, items] of [...byPage].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`\n  ${page}`);
    for (const f of items) console.log(`    ${f.severity === 'error' ? '✗' : '!'} [${f.rule}] ${f.message}`);
  }
};

console.log(`seo-audit: scanned ${pageCount} pages / ${fileCount} files in ${distArg}`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  printGroup(warnings);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  printGroup(errors);
  console.log(`\nseo-audit: FAILED — ${errors.length} error(s) must be fixed.`);
  process.exit(1);
}

console.log(`\nseo-audit: OK — no errors${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`);
