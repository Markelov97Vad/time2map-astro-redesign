import type { APIRoute } from 'astro';
import { validateContact } from '../../lib/validate';
import { rateLimit } from '../../lib/rateLimit';
import { sendContactEmail } from '../../lib/mailer';

export const prerender = false;

const ALLOWED_ORIGIN = import.meta.env.ALLOWED_ORIGIN ?? process.env.ALLOWED_ORIGIN ?? '*';
const SITE_URL = import.meta.env.SITE_URL ?? process.env.SITE_URL ?? 'https://time2map.com';

const corsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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
function respond(wantsJson: boolean, status: number, body: Body, retryAfterSec?: number): Response {
  const headers = corsHeaders();
  if (retryAfterSec) headers['Retry-After'] = String(retryAfterSec);

  if (wantsJson) {
    headers['Content-Type'] = 'application/json';
    return new Response(JSON.stringify(body), { status, headers });
  }

  const query = body.ok ? 'sent=1' : `error=${body.error ?? (body.errors ? 'validation' : 'unknown')}`;
  headers.Location = `${SITE_URL}/contact-us?${query}`;
  return new Response(null, { status: 303, headers });
}

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: corsHeaders() });

export const POST: APIRoute = async ({ request, clientAddress }) => {
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
    return respond(wantsJson, 400, { ok: false, error: 'bad_request' });
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success, drop silently.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return respond(wantsJson, 200, { ok: true });
  }

  // Behind the nginx reverse proxy clientAddress is 127.0.0.1, so prefer the
  // forwarded client IP for rate limiting.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const limit = rateLimit(forwarded || clientAddress || 'unknown');
  if (!limit.allowed) {
    return respond(wantsJson, 429, { ok: false, error: 'rate_limited' }, Math.ceil(limit.retryAfterMs / 1000));
  }

  const { ok, errors, data } = validateContact(raw);
  if (!ok) return respond(wantsJson, 422, { ok: false, errors });

  try {
    await sendContactEmail(data!);
  } catch (err) {
    console.error('[contact] failed to send', err);
    return respond(wantsJson, 502, { ok: false, error: 'send_failed' });
  }

  return respond(wantsJson, 200, { ok: true });
};
