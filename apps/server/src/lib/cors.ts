/**
 * CORS for the contact API. ALLOWED_ORIGIN is a comma-separated list of the
 * browser origins allowed to call it (e.g. the time2map site and the Archi2go
 * site at https://archi2go.time2map.com); `*` allows any. A browser only
 * accepts a single origin in Access-Control-Allow-Origin, so the request's own
 * Origin is echoed back when it is on the list. Native apps send no Origin and
 * are not subject to CORS at all.
 */

export function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return origins.length ? origins : ['*'];
}

/** The Access-Control-Allow-Origin value for a request from `origin` (null when the request has none). */
export function allowedOriginFor(allowed: readonly string[], origin: string | null): string {
  if (allowed.includes('*')) return '*';
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0];
}
