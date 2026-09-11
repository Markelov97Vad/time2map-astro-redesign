import { describe, it, expect } from 'vitest';
import { canonicalPath } from '../src/lib/canonical';

describe('canonicalPath', () => {
  it('maps the home page to "/" in every build format', () => {
    expect(canonicalPath('/')).toBe('/');
    expect(canonicalPath('/index.html')).toBe('/');
  });

  it('strips the .html extension emitted by build.format "file"', () => {
    expect(canonicalPath('/contact-us.html')).toBe('/contact-us');
    expect(canonicalPath('/lab/time-2-route.html')).toBe('/lab/time-2-route');
    expect(canonicalPath('/404.html')).toBe('/404');
  });

  it('strips trailing slashes from directory-format paths', () => {
    expect(canonicalPath('/contact-us/')).toBe('/contact-us');
    expect(canonicalPath('/lab/time-2-route')).toBe('/lab/time-2-route');
  });
});
