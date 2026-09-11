/**
 * Public path of a page from the pathname Astro reports while building.
 *
 * With `build.format: 'file'` a page's pathname is `/contact-us.html` (and
 * `/index.html` for the home page); the site is served extensionless and
 * without trailing slashes (nginx `try_files $uri.html`, Vercel `cleanUrls`),
 * and the sitemap uses the same form. Canonical / og:url must match it.
 */
export function canonicalPath(pathname: string): string {
  return (
    pathname
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '')
      .replace(/\/$/, '') || '/'
  );
}
