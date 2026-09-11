#!/usr/bin/env node
/**
 * Image pipeline for `public/images` (run from apps/web: `node scripts/optimize-images.mjs [--prune]`).
 *
 * Images are referenced by absolute `/images/...` paths (see docs/ARCHITECTURE.md), so
 * Astro's build-time image service is not in play; this script does the sizing instead:
 *
 *  - `variants`   → responsive WebP set `<name>-<width>.webp` for a source (PNG or WebP),
 *                   never enlarging; the markup references them via srcset/sizes.
 *  - `inPlace`    → resize/recompress a file under its own name (posters, screenshots the
 *                   content collections point at, og:images that must stay PNG).
 *  - `toWebp`     → same picture as WebP next to the original (references updated by hand).
 *  - `rasterise`  → traced "SVG" logos (hundreds of KB of paths) rendered to small PNGs.
 *
 * With `--prune`, sources of `variants`, `toWebp` and `rasterise` are deleted once their
 * outputs exist. Idempotent: outputs are regenerated on every run.
 */
import sharp from 'sharp';
import { readFile, rename, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/images');
const PRUNE = process.argv.includes('--prune');

const DEVICE = ['audio-guides-1', 'audio-guides-2', 'audio-guides-3', 'recycling-1', 'recycling-2', 'recycling-3', 'airport-maps-1', 'airport-maps-2', 'airport-maps-3'];
const PROJECTS = ['coal-mining', 'coal-mining-2', 'coal-mining-3', 'ski', 'land-certificates', 'land-certificates-2', 'land-certificates-3', 'georeferencing'];

/** @type {{ src: string, widths: number[], quality: number }[]} */
const variants = [
  // Device-frame slides: the frame is at most 860 CSS px wide (×2 for retina).
  ...DEVICE.map((n) => ({ src: `${n}.webp`, widths: [720, 1280, 1720], quality: 75 })),
  // Project carousel tiles: min(76vw, 1120px) wide, object-fit: cover.
  ...PROJECTS.map((n) => ({ src: `projects/${n}.webp`, widths: [640, 1120, 1600], quality: 72 })),
  // Expertise bento cards (PNG → WebP, alpha kept).
  { src: 'maps-card.png', widths: [700, 1100, 1360], quality: 75 },
  { src: 'postGIS.png', widths: [520, 900], quality: 75 },
  { src: 'inter-gis.png', widths: [700, 1200], quality: 75 },
  { src: 'cad-model.png', widths: [360, 600, 1000], quality: 75 },
  { src: '3d-mount.png', widths: [320, 640, 1000], quality: 75 },
  { src: 'mobile-maps.png', widths: [480, 900], quality: 75 },
  { src: 'phone.png', widths: [320, 400, 640], quality: 75 },
  { src: 'cicd-pipeline.png', widths: [700, 1360], quality: 75 },
  // Hero globe: the LCP image.
  { src: 'globe-light.png', widths: [800, 1400], quality: 80 },
];

/** @type {{ src: string, width?: number, quality?: number, png?: boolean }[]} */
const inPlace = [
  { src: 'hero-poster.webp', width: 1280, quality: 70 },
  // (The Time2Route og:image is stored as a 1600px JPEG: destination.jpg.)
  // Use-case screenshots referenced by the content collection (same names, capped at 1600px).
  { src: 'use-cases/audio-guides-1.webp', width: 1600, quality: 75 },
  { src: 'use-cases/audio-guides-3.webp', width: 1600, quality: 75 },
  { src: 'use-cases/georeferencing-1.webp', width: 1600, quality: 75 },
  { src: 'use-cases/land-certificates-1.webp', width: 1600, quality: 75 },
  { src: 'use-cases/ski-resort-1.webp', width: 1600, quality: 75 },
];

/** @type {{ src: string, quality: number }[]} */
const toWebp = [
  { src: 'lab/barcelona-crime-map/safety-indexes.png', quality: 80 },
  { src: 'lab/barcelona-crime-map/sants-montjuic-safety-rank.png', quality: 80 },
];

/** @type {{ src: string, out: string, width: number, height: number }[]} */
const rasterise = [
  { src: 'tech/postgis.svg', out: 'tech/postgis.png', width: 84, height: 84 },
  { src: 'tech/redis.svg', out: 'tech/redis.png', width: 84, height: 84 },
  { src: 'tech/java.svg', out: 'tech/java.png', width: 84, height: 84 },
  { src: 'clients/greenpeace.svg', out: 'clients/greenpeace.png', width: 570, height: 120 },
];

const abs = (p) => path.join(ROOT, p);
/** Sources to delete once everything is written (deferred: Windows/OneDrive may still hold them). */
const pending = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pruneAll() {
  for (const file of pending) {
    for (let attempt = 1; ; attempt++) {
      try { await unlink(file); break; } catch (err) {
        if (!['EBUSY', 'EPERM'].includes(err.code) || attempt >= 20) throw err;
        await sleep(500);
      }
    }
    console.log('removed', path.relative(ROOT, file));
  }
}
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const size = async (p) => (await stat(p)).size;
const log = (line) => console.log(line);

async function writeAtomic(pipeline, out) {
  const tmp = `${out}.tmp`;
  await pipeline.toFile(tmp);
  for (let attempt = 1; ; attempt++) {
    try { await rename(tmp, out); return; } catch (err) {
      if (!['EBUSY', 'EPERM'].includes(err.code) || attempt >= 20) throw err;
      await sleep(500);
    }
  }
}

async function runVariants() {
  const manifest = {};
  for (const v of variants) {
    const src = abs(v.src);
    if (!existsSync(src)) { log(`skip (missing) ${v.src}`); continue; }
    const input = await readFile(src);
    const meta = await sharp(input).metadata();
    const widths = [...new Set(v.widths.map((w) => Math.min(w, meta.width)))].sort((a, b) => a - b);
    const base = v.src.replace(/\.(png|webp|jpe?g)$/i, '');
    const outs = [];
    for (const w of widths) {
      const out = abs(`${base}-${w}.webp`);
      await writeAtomic(sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: v.quality, effort: 5 }), out);
      const m = await sharp(await readFile(out)).metadata();
      outs.push({ file: `/images/${base}-${w}.webp`, width: m.width, height: m.height, bytes: await size(out) });
    }
    manifest[`/images/${v.src}`] = outs;
    log(`${v.src} ${meta.width}×${meta.height} ${kb(await size(src))} → ${outs.map((o) => `${o.width}w ${kb(o.bytes)}`).join(', ')}`);
    if (PRUNE) pending.push(src);
  }
  return manifest;
}

async function runInPlace() {
  for (const it of inPlace) {
    const src = abs(it.src);
    if (!existsSync(src)) { log(`skip (missing) ${it.src}`); continue; }
    const before = await size(src);
    let p = sharp(await readFile(src));
    if (it.width) p = p.resize({ width: it.width, withoutEnlargement: true });
    p = it.png ? p.png({ palette: true, quality: 80, effort: 8, compressionLevel: 9 }) : p.webp({ quality: it.quality ?? 75, effort: 5 });
    await writeAtomic(p, src);
    const m = await sharp(await readFile(src)).metadata();
    log(`${it.src} in place: ${kb(before)} → ${kb(await size(src))} (${m.width}×${m.height})`);
  }
}

async function runToWebp() {
  for (const it of toWebp) {
    const src = abs(it.src);
    if (!existsSync(src)) { log(`skip (missing) ${it.src}`); continue; }
    const out = src.replace(/\.png$/i, '.webp');
    await writeAtomic(sharp(await readFile(src)).webp({ quality: it.quality, effort: 5 }), out);
    log(`${it.src} → ${path.basename(out)}: ${kb(await size(src))} → ${kb(await size(out))}`);
    if (PRUNE) pending.push(src);
  }
}

async function runRasterise() {
  for (const it of rasterise) {
    const src = abs(it.src);
    if (!existsSync(src)) { log(`skip (missing) ${it.src}`); continue; }
    const out = abs(it.out);
    await writeAtomic(
      sharp(await readFile(src), { density: 300 })
        .resize(it.width, it.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ palette: true, quality: 90, effort: 8, compressionLevel: 9 }),
      out
    );
    log(`${it.src} → ${it.out}: ${kb(await size(src))} → ${kb(await size(out))}`);
    if (PRUNE) pending.push(src);
  }
}

const manifest = await runVariants();
await runInPlace();
await runToWebp();
await runRasterise();
if (PRUNE) await pruneAll();
console.log('\nMANIFEST ' + JSON.stringify(manifest));
