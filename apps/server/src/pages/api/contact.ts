import type { APIRoute } from 'astro';
import { validateContact } from '../../lib/validate';
import { rateLimit } from '../../lib/rateLimit';
import { sendContactEmail } from '../../lib/mailer';
import { allowedOriginFor, parseAllowedOrigins } from '../../lib/cors';

export const prerender = false;

const ALLOWED_ORIGINS = parseAllowedOrigins(import.meta.env.ALLOWED_ORIGIN ?? process.env.ALLOWED_ORIGIN);
const SITE_URL = import.meta.env.SITE_URL ?? process.env.SITE_URL ?? 'https://time2map.com';

const corsHeaders = (origin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': allowedOriginFor(ALLOWED_ORIGINS, origin),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  Vary: 'Origin',
});

interface Body {
  ok: boolean;
  error?: string;
  errors?: Record<string, string>;
}

/**
 * Respond as JSON (fetch/AJAX) or as a 303 redirect back to the contact page
 * (a plain no-JS HTML form POST), so the form degrades gracefully.
 */
function respond(
  origin: string | null,
  wantsJson: boolean,
  status: number,
  body: Body,
  retryAfterSec?: number
): Response {
  const headers = corsHeaders(origin);
  if (retryAfterSec) headers['Retry-After'] = String(retryAfterSec);

  if (wantsJson) {
    headers['Content-Type'] = 'application/json';
    return new Response(JSON.stringify(body), { status, headers });
  }

  const query = body.ok ? 'sent=1' : `error=${body.error ?? (body.errors ? 'validation' : 'unknown')}`;
  headers.Location = `${SITE_URL}/contact-us?${query}`;
  return new Response(null, { status: 303, headers });
}

export const OPTIONS: APIRoute = ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  const contentType = request.headers.get('content-type') ?? '';
  const accept = request.headers.get('accept') ?? '';
  const wantsJson =
    contentType.includes('application/json') ||
    accept.includes('application/json') ||
    request.headers.get('x-requested-with') === 'fetch';

  let raw: Record<string, unknown> = {};
  try {
    if (contentType.includes('application/json')) {
      raw = (await request.json()) as Record<string, unknown>;
    } else {
      raw = Object.fromEntries(await request.formData());
    }
  } catch {
    return respond(origin, wantsJson, 400, { ok: false, error: 'bad_request' });
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success, drop silently.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return respond(origin, wantsJson, 200, { ok: true });
  }

  // Behind the nginx reverse proxy clientAddress is 127.0.0.1, so prefer the
  // forwarded client IP for rate limiting.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const limit = rateLimit(forwarded || clientAddress || 'unknown');
  if (!limit.allowed) {
    const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
    return respond(origin, wantsJson, 429, { ok: false, error: 'rate_limited' }, retryAfterSec);
  }

  const { ok, errors, data } = validateContact(raw);
  if (!ok) return respond(origin, wantsJson, 422, { ok: false, errors });

  try {
    await sendContactEmail(data!);
  } catch (err) {
    console.error('[contact] failed to send', err);
    return respond(origin, wantsJson, 502, { ok: false, error: 'send_failed' });
  }

  return respond(origin, wantsJson, 200, { ok: true });
};
