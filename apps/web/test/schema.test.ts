import { describe, it, expect } from 'vitest';
import {
  stripMarkdown,
  organizationSchema,
  websiteSchema,
  faqSchema,
  contactPageSchema,
  articleSchema,
  breadcrumbSchema,
} from '../src/lib/schema';

const site = {
  title: 'time2map',
  siteUrl: 'https://time2map.com',
  description: 'Maps and GIS.',
  tagline: 'Built by specialists.',
  vat: 'ES Z2405174T',
  email: 'contact@time2map.com',
  author: { name: 'Alexander Semenov' },
  social: { upworkAgency: 'https://upwork/a', linkedinCompany: 'https://li/c', linkedinPersonal: 'https://li/p' },
};

describe('stripMarkdown', () => {
  it('removes links, bold and italic, collapsing whitespace', () => {
    expect(stripMarkdown('See **this** and *that* and [a link](https://x.com).')).toBe(
      'See this and that and a link.'
    );
  });
});

describe('organizationSchema', () => {
  const testimonials = [{ data: { name: 'Jane', quote: 'Great', company: 'ACME' } }];
  const ld = organizationSchema(site, testimonials);

  it('is a valid Organization node', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    expect(ld.vatID).toBe(site.vat);
    expect(ld.logo.url).toBe('https://time2map.com/images/logo.svg');
    expect(ld.sameAs).toEqual([site.social.upworkAgency, site.social.linkedinCompany]);
  });

  it('maps testimonials to reviews', () => {
    expect(ld.review).toHaveLength(1);
    expect(ld.review[0].reviewBody).toBe('Great');
    expect(ld.review[0].publisher.name).toBe('ACME');
  });

  it('omits publisher when company is empty', () => {
    const ld2 = organizationSchema(site, [{ data: { name: 'Jo', quote: 'Ok', company: '' } }]);
    expect(ld2.review[0].publisher).toBeUndefined();
  });
});

describe('websiteSchema', () => {
  it('is a valid WebSite node', () => {
    const ld = websiteSchema(site);
    expect(ld['@type']).toBe('WebSite');
    expect(ld.url).toBe(site.siteUrl);
  });
});

describe('faqSchema', () => {
  it('builds Questions with markdown stripped from answers', () => {
    const faqs = [{ data: { question: 'How?' }, body: 'Use **bold** [docs](https://x).' }];
    const ld = faqSchema(faqs);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity[0].name).toBe('How?');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Use bold docs.');
  });
});

describe('contactPageSchema', () => {
  it('is a ContactPage with a sales contact point', () => {
    const ld = contactPageSchema(site);
    expect(ld['@type']).toBe('ContactPage');
    expect(ld.url).toBe('https://time2map.com/contact-us');
    expect(ld.mainEntity.contactPoint.contactType).toBe('sales');
  });
});

describe('articleSchema', () => {
  const data = {
    title: 'Crime Map',
    navLabel: 'Barcelona Crime',
    description: 'A map.',
    readTime: '8 min read',
    publishDate: new Date('2026-05-01T00:00:00Z'),
    ogImage: '/images/lab/x.png',
  };
  const url = 'https://time2map.com/lab/barcelona-crime-map';

  it('is an Article with ISO dates and absolute image', () => {
    const ld = articleSchema(site, data, url);
    expect(ld['@type']).toBe('Article');
    expect(ld.headline).toBe('Crime Map');
    expect(ld.datePublished).toBe('2026-05-01T00:00:00.000Z');
    expect(ld.image).toBe('https://time2map.com/images/lab/x.png');
    expect(ld.mainEntityOfPage).toBe(url);
  });

  it('omits image when ogImage is absent', () => {
    const ld = articleSchema(site, { ...data, ogImage: undefined }, url);
    expect(ld.image).toBeUndefined();
  });

  it('credits the site author with their profile link by default', () => {
    const ld = articleSchema(site, data, url);
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Alexander Semenov', sameAs: ['https://li/p'] });
  });

  it('credits a guest author from authorName without the founder profile link', () => {
    const ld = articleSchema(site, { ...data, authorName: 'Vadim Markelov' }, url);
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Vadim Markelov' });
  });
});

describe('breadcrumbSchema', () => {
  it('numbers crumbs from 1', () => {
    const ld = breadcrumbSchema([
      { name: 'Home', item: 'https://time2map.com' },
      { name: 'Use Cases', item: 'https://time2map.com/use-cases' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].name).toBe('Use Cases');
  });
});
