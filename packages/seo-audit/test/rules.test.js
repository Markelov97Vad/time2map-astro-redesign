import { describe, it, expect } from 'vitest';
import { parse } from 'node-html-parser';
import { defaultConfig } from '../src/config.js';
import { checkHeadings, checkImages, checkMeta, checkJsonLd, checkLinks } from '../src/rules.js';
import { routeForHtml } from '../src/collect.js';

const rules = (findings, rule) => findings.filter((f) => f.rule === rule);
const errors = (findings) => findings.filter((f) => f.severity === 'error');

describe('checkHeadings', () => {
  it('passes a clean h1 -> h2 -> h3 outline', () => {
    const doc = parse('<h1>A</h1><h2>B</h2><h3>C</h3>');
    expect(errors(checkHeadings(doc))).toHaveLength(0);
  });

  it('flags a missing h1', () => {
    const doc = parse('<h2>B</h2>');
    expect(rules(checkHeadings(doc), 'heading-h1')).toHaveLength(1);
  });

  it('flags multiple h1', () => {
    const doc = parse('<h1>A</h1><h1>B</h1>');
    expect(rules(checkHeadings(doc), 'heading-h1')).toHaveLength(1);
  });

  it('flags a downward level jump (h2 -> h4)', () => {
    const doc = parse('<h1>A</h1><h2>B</h2><h4>D</h4>');
    expect(rules(checkHeadings(doc), 'heading-skip')).toHaveLength(1);
  });

  it('allows jumping back up (h4 -> h2)', () => {
    const doc = parse('<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h2>E</h2>');
    expect(rules(checkHeadings(doc), 'heading-skip')).toHaveLength(0);
  });
});

describe('checkImages', () => {
  it('flags an img with no alt attribute', () => {
    const doc = parse('<img src="/x.png" width="1" height="1">');
    expect(rules(checkImages(doc), 'img-alt')).toHaveLength(1);
  });

  it('accepts an empty alt (decorative)', () => {
    const doc = parse('<img src="/x.png" alt="" width="1" height="1">');
    expect(rules(checkImages(doc), 'img-alt')).toHaveLength(0);
  });

  it('warns when width/height are missing', () => {
    const doc = parse('<img src="/x.png" alt="x">');
    const warn = rules(checkImages(doc), 'img-dimensions');
    expect(warn).toHaveLength(1);
    expect(warn[0].severity).toBe('warn');
  });
});

describe('checkMeta', () => {
  const goodHead = `
    <title>${'x'.repeat(40)}</title>
    <meta name="description" content="${'d'.repeat(100)}">
    <link rel="canonical" href="https://time2map.com/">
    <meta property="og:title" content="t">
    <meta property="og:description" content="d">
    <meta property="og:image" content="/og.png">`;

  it('passes a complete head', () => {
    expect(errors(checkMeta(parse(goodHead), defaultConfig))).toHaveLength(0);
  });

  it('errors on missing title, description, canonical and og tags', () => {
    const found = checkMeta(parse('<head></head>'), defaultConfig);
    expect(rules(found, 'title')).toHaveLength(1);
    expect(rules(found, 'description')).toHaveLength(1);
    expect(rules(found, 'canonical')).toHaveLength(1);
    expect(rules(found, 'og')).toHaveLength(3);
  });

  it('warns on a short title', () => {
    const doc = parse('<title>short</title>' + goodHead.replace(/<title>.*<\/title>/, ''));
    expect(rules(checkMeta(doc, defaultConfig), 'title-length')[0].severity).toBe('warn');
  });

  it('skips title/description length warnings on noindex pages', () => {
    const doc = parse(
      '<meta name="robots" content="noindex, follow">' +
        '<title>x</title><meta name="description" content="d">' +
        '<link rel="canonical" href="/">' +
        '<meta property="og:title" content="t"><meta property="og:description" content="d"><meta property="og:image" content="/o.png">'
    );
    const found = checkMeta(doc, defaultConfig);
    expect(rules(found, 'title-length')).toHaveLength(0);
    expect(rules(found, 'description-length')).toHaveLength(0);
    expect(errors(found)).toHaveLength(0);
  });
});

describe('checkJsonLd', () => {
  it('accepts valid JSON-LD', () => {
    const doc = parse('<script type="application/ld+json">{"@context":"x","@type":"Article"}</script>');
    expect(errors(checkJsonLd(doc, '/lab/a', defaultConfig))).toHaveLength(0);
  });

  it('errors on malformed JSON', () => {
    const doc = parse('<script type="application/ld+json">{nope}</script>');
    expect(rules(checkJsonLd(doc, '/lab/a', defaultConfig), 'jsonld')).toHaveLength(1);
  });

  it('errors when @type is missing', () => {
    const doc = parse('<script type="application/ld+json">{"@context":"x"}</script>');
    expect(rules(checkJsonLd(doc, '/lab/a', defaultConfig), 'jsonld')).toHaveLength(1);
  });

  it('warns when a non-exempt page has no JSON-LD', () => {
    expect(rules(checkJsonLd(parse('<html></html>'), '/use-cases', defaultConfig), 'jsonld-missing')).toHaveLength(1);
  });

  it('does not warn for exempt routes (404)', () => {
    expect(checkJsonLd(parse('<html></html>'), '/404', defaultConfig)).toHaveLength(0);
  });
});

describe('checkLinks', () => {
  const targets = new Set(['/', '/use-cases', '/use-cases/', '/lab/a', '/lab/a/', '/images/x.svg']);

  it('accepts a known internal link with a trailing slash', () => {
    const doc = parse('<a href="/use-cases/">go</a>');
    expect(checkLinks(doc, targets)).toHaveLength(0);
  });

  it('accepts a direct file link', () => {
    const doc = parse('<a href="/images/x.svg">img</a>');
    expect(checkLinks(doc, targets)).toHaveLength(0);
  });

  it('errors on a broken internal link', () => {
    const doc = parse('<a href="/nope">x</a>');
    expect(rules(checkLinks(doc, targets), 'link-internal')).toHaveLength(1);
  });

  it('ignores mailto and bare hash links', () => {
    const doc = parse('<a href="mailto:a@b.com">m</a><a href="#top">t</a>');
    expect(checkLinks(doc, targets)).toHaveLength(0);
  });

  it('accepts a valid external URL and warns on a malformed one', () => {
    expect(checkLinks(parse('<a href="https://example.com/x">ok</a>'), targets)).toHaveLength(0);
    expect(rules(checkLinks(parse('<a href="https://">bad</a>'), targets), 'link-external')).toHaveLength(1);
  });
});

describe('routeForHtml', () => {
  it('maps index and nested index files to routes', () => {
    expect(routeForHtml('index.html')).toBe('/');
    expect(routeForHtml('use-cases/index.html')).toBe('/use-cases');
    expect(routeForHtml('lab/a/index.html')).toBe('/lab/a');
    expect(routeForHtml('404.html')).toBe('/404');
  });
});
