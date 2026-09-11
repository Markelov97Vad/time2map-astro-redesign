import { describe, it, expect, beforeEach } from 'vitest';
import { validateContact } from '../src/lib/validate';
import { rateLimit, resetRateLimit } from '../src/lib/rateLimit';

describe('validateContact', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', budget: '$10k', message: 'Hello', privacy: 'on' };

  it('accepts a complete submission and trims values', () => {
    const r = validateContact({ ...valid, name: '  Jane  ' });
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ name: 'Jane', email: 'jane@example.com', budget: '$10k', message: 'Hello' });
  });

  it('requires name, email, budget, message and privacy', () => {
    const r = validateContact({});
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['budget', 'email', 'message', 'name', 'privacy']);
    expect(r.data).toBeUndefined();
  });

  it('rejects a malformed email', () => {
    expect(validateContact({ ...valid, email: 'not-an-email' }).errors.email).toBeDefined();
  });

  it('accepts boolean and string truthy consent, rejects falsy', () => {
    expect(validateContact({ ...valid, privacy: true }).ok).toBe(true);
    expect(validateContact({ ...valid, privacy: 'on' }).ok).toBe(true);
    expect(validateContact({ ...valid, privacy: '' }).errors.privacy).toBeDefined();
  });

  it('rejects an over-long message', () => {
    expect(validateContact({ ...valid, message: 'x'.repeat(5001) }).errors.message).toBeDefined();
  });
});

describe('rateLimit', () => {
  beforeEach(() => resetRateLimit());

  it('allows up to the limit then blocks', () => {
    const opts = { limit: 3, windowMs: 60_000 };
    expect(rateLimit('1.1.1.1', opts).allowed).toBe(true);
    expect(rateLimit('1.1.1.1', opts).allowed).toBe(true);
    expect(rateLimit('1.1.1.1', opts).allowed).toBe(true);
    const blocked = rateLimit('1.1.1.1', opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks each IP independently', () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimit('a', opts).allowed).toBe(true);
    expect(rateLimit('a', opts).allowed).toBe(false);
    expect(rateLimit('b', opts).allowed).toBe(true);
  });
});
