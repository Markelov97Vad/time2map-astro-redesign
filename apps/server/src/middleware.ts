import type { MiddlewareHandler } from 'astro';
import { timingSafeEqual } from 'node:crypto';

/**
 * HTTP Basic Auth for the admin surface. The contact API (`/api/contact`) stays
 * public; everything Keystatic and the publish trigger require credentials from
 * ADMIN_USER (default "admin") / ADMIN_PASS. If ADMIN_PASS is unset the admin is
 * refused outright, so it can never be exposed unprotected by accident.
 */
const PROTECTED = [
  /^\/keystatic(\/|$)/,
  /^\/api\/keystatic(\/|$)/,
  /^\/api\/publish(\/|$)/,
  /^\/publish(\/|$)/,
];

const REALM = 'Basic realm="time2map admin", charset="UTF-8"';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function unauthorized(message = 'Authentication required'): Response {
  return new Response(message, { status: 401, headers: { 'WWW-Authenticate': REALM } });
}

export const onRequest: MiddlewareHandler = (context, next) => {
  const { pathname } = context.url;
  if (!PROTECTED.some((re) => re.test(pathname))) return next();

  const expectedUser = import.meta.env.ADMIN_USER ?? process.env.ADMIN_USER ?? 'admin';
  const expectedPass = import.meta.env.ADMIN_PASS ?? process.env.ADMIN_PASS;
  if (!expectedPass) {
    return new Response('Admin is not configured (set ADMIN_PASS).', { status: 503 });
  }

  const header = context.request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(':');
  const user = sep === -1 ? decoded : decoded.slice(0, sep);
  const pass = sep === -1 ? '' : decoded.slice(sep + 1);

  if (safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) return next();
  return unauthorized('Invalid credentials');
};
