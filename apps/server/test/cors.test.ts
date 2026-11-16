import { describe, it, expect } from 'vitest';
import { allowedOriginFor, parseAllowedOrigins } from '../src/lib/cors';

describe('parseAllowedOrigins', () => {
  it('splits a comma-separated list, trimming spaces and trailing slashes', () => {
    expect(parseAllowedOrigins('https://time2map.com, https://archi2go.time2map.com/')).toEqual([
      'https://time2map.com',
      'https://archi2go.time2map.com',
    ]);
  });

  it('allows any origin when unset or empty', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(['*']);
    expect(parseAllowedOrigins('')).toEqual(['*']);
    expect(parseAllowedOrigins(' , ')).toEqual(['*']);
  });
});

describe('allowedOriginFor', () => {
  const allowed = ['https://time2map.com', 'https://archi2go.time2map.com'];

  it('echoes a listed origin', () => {
    expect(allowedOriginFor(allowed, 'https://archi2go.time2map.com')).toBe('https://archi2go.time2map.com');
    expect(allowedOriginFor(allowed, 'https://time2map.com')).toBe('https://time2map.com');
  });

  it('answers an unlisted or missing origin with the first one, which the browser then rejects', () => {
    expect(allowedOriginFor(allowed, 'https://evil.example')).toBe('https://time2map.com');
    expect(allowedOriginFor(allowed, null)).toBe('https://time2map.com');
  });

  it('answers * when any origin is allowed', () => {
    expect(allowedOriginFor(['*'], 'https://archi2go.time2map.com')).toBe('*');
  });
});
