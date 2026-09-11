/**
 * JSON-LD builders — the single source of truth for the site's structured data.
 *
 * Structural approach (see docs/ARCHITECTURE.md): pages pass editable content
 * fields in, and valid schema.org JSON-LD comes out. Keeping the shapes here
 * (instead of inline in each .astro page) means one place to review, one place
 * to test, and no risk of a page hand-rolling an invalid block.
 *
 * Every builder returns a plain object with `@context`/`@type`, which the
 * post-build audit validates in the rendered HTML.
 */

/** Loosely-typed YAML singletons (`site.yaml` etc.) — imported as `any`. */
type Site = any;
type Entry = any;

/** Absolute URL for a site-relative path. */
const abs = (site: Site, path: string): string => new URL(path, site.siteUrl).href;

/** Strip inline markdown (links, **bold**, *italic*) to plain text. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** schema.org Organization, including testimonials as reviews. */
export function organizationSchema(site: Site, testimonials: Entry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.title,
    url: site.siteUrl,
    description: site.description,
    slogan: site.tagline,
    address: { '@type': 'PostalAddress', addressLocality: 'Barcelona', addressCountry: 'ES' },
    vatID: site.vat,
    email: site.email,
    logo: { '@type': 'ImageObject', url: abs(site, '/images/logo.svg') },
    founder: {
      '@type': 'Person',
      name: site.author.name,
      jobTitle: 'Founder',
      description: '10+ years in GIS & Web development',
    },
    sameAs: [site.social.upworkAgency, site.social.linkedinCompany],
    areaServed: 'Worldwide',
    review: testimonials.map((t) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      author: { '@type': 'Person', name: t.data.name },
      reviewBody: t.data.quote,
      ...(t.data.company && { publisher: { '@type': 'Organization', name: t.data.company } }),
    })),
  };
}

/** schema.org WebSite. */
export function websiteSchema(site: Site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.title,
    url: site.siteUrl,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: site.title, url: site.siteUrl },
  };
}

/** schema.org FAQPage from FAQ collection entries (answers are markdown bodies). */
export function faqSchema(faqs: Entry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((entry) => ({
      '@type': 'Question',
      name: entry.data.question,
      acceptedAnswer: { '@type': 'Answer', text: stripMarkdown(entry.body ?? '') },
    })),
  };
}

/** schema.org CollectionPage listing the use cases. */
export function useCasesSchema(site: Site, useCases: Entry[], description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Use Cases',
    description,
    url: abs(site, '/use-cases'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: useCases.map((useCase, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: useCase.data.title,
          keywords: useCase.data.tags.join(', '),
          image: abs(site, useCase.data.images[0]),
          ...(useCase.data.tryItUrl && { url: useCase.data.tryItUrl }),
        },
      })),
    },
  };
}

/** schema.org ContactPage with the organization as its main entity. */
export function contactPageSchema(site: Site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Us',
    url: abs(site, '/contact-us'),
    mainEntity: {
      '@type': 'Organization',
      name: site.title,
      email: site.email,
      url: site.siteUrl,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: site.email,
        areaServed: 'Worldwide',
        availableLanguage: 'English',
      },
    },
  };
}

/** schema.org Article for a lab post (`data` = the lab entry's frontmatter).
 * Guest posts (`authorName` set) credit that person; otherwise the site author
 * with their profile link. */
export function articleSchema(site: Site, data: Entry, url: string) {
  const author =
    data.authorName && data.authorName !== site.author.name
      ? { '@type': 'Person', name: data.authorName }
      : { '@type': 'Person', name: site.author.name, sameAs: [site.social.linkedinPersonal] };
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    name: data.navLabel,
    description: data.description,
    url,
    mainEntityOfPage: url,
    ...(data.ogImage && { image: abs(site, data.ogImage) }),
    author,
    publisher: {
      '@type': 'Organization',
      name: site.title,
      logo: { '@type': 'ImageObject', url: abs(site, '/images/logo.svg') },
    },
    datePublished: data.publishDate.toISOString(),
    dateModified: data.publishDate.toISOString(),
    inLanguage: 'en',
    timeRequired: data.readTime,
  };
}

/** schema.org BreadcrumbList from ordered `{ name, item }` crumbs. */
export function breadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}
