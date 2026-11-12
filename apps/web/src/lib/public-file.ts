import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Resolve a site-public path (`/images/...`) to a real file on disk.
 * Do not use `import.meta.url` from Astro components — Vite rewrites it
 * during build, so `../../public` points at the wrong folder and media
 * falls back to "Screenshot reserved" placeholders.
 */
export function resolvePublicFile(src: string): string {
  const rel = src.replace(/^\/+/, '');
  const candidates = [
    path.join(process.cwd(), 'public', rel),
    path.join(process.cwd(), 'apps/web/public', rel),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export function publicFileExists(src: string): boolean {
  return existsSync(resolvePublicFile(src));
}
