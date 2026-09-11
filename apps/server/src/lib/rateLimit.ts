/**
 * Tiny in-memory fixed-window rate limiter, keyed by client IP. Good enough for
 * a low-traffic contact form on a single process; swap for a shared store if the
 * service is ever scaled horizontally.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 10 * 60 * 1000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  const win = windows.get(key);

  if (!win || now > win.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (win.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: win.resetAt - now };
  }

  win.count += 1;
  return { allowed: true, remaining: limit - win.count, retryAfterMs: 0 };
}

/** Test helper: forget all recorded windows. */
export function resetRateLimit(): void {
  windows.clear();
}
