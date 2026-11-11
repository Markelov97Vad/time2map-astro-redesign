import { config, collection, singleton, fields } from '@keystatic/core';

/**
 * Shared Keystatic schema for time2map.
 *
 * `path` (collection/singleton locations) and image `directory` values are
 * resolved relative to the Keystatic app's cwd, which differs per app:
 *   - apps/web (dev admin)      → prefix '' (content is in this app)
 *   - apps/server (hosted admin) → prefix '../web/' (content lives in apps/web)
 *
 * `publicPath` values are site URLs (served by apps/web) and are NOT prefixed.
 *
 * Keep this schema in sync with apps/web/src/content.config.ts (the Astro/Zod
 * schema used at build time).
 */
export function buildKeystaticConfig({ prefix = '' }: { prefix?: string } = {}) {
  /** Prefix a filesystem path/directory. */
  const p = (s: string) => prefix + s;

  // Per-page SEO fields, shared by every static page in the `seo` singleton.
  const pageSeoFields = (label: string) =>
    fields.object(
      {
        title: fields.text({ label: 'SEO title (browser tab)', validation: { isRequired: true } }),
        description: fields.text({
          label: 'Meta description',
          multiline: true,
          validation: { isRequired: true },
        }),
        ogTitle: fields.text({
          label: 'og:title (social preview — defaults to SEO title)',
        }),
        ogDescription: fields.text({
          label: 'og:description (social preview — defaults to meta description)',
          multiline: true,
        }),
        ogImage: fields.image({
          label: 'og:image (social image — defaults to /images/og-image.png)',
          directory: p('public/images'),
          publicPath: '/images/',
        }),
        noindex: fields.checkbox({ label: 'Hide from search engines (noindex)' }),
      },
      { label }
    );

  return config({
    storage: { kind: 'local' },
    ui: {
      brand: { name: 'time2map' },
    },

    collections: {
      useCases: collection({
        label: 'Use cases',
        path: p('src/content/use-cases/*'),
        slugField: 'title',
        format: { contentField: 'content' },
        schema: {
          title: fields.slug({ name: { label: 'Title' } }),
          order: fields.integer({
            label: 'Order',
            description: 'Position on the Use Cases page (1 = first)',
            validation: { isRequired: true },
          }),
          featured: fields.checkbox({
            label: 'Featured',
            description: 'Show in “See Our Work” on the home page',
          }),
          tags: fields.array(fields.text({ label: 'Tag' }), {
            label: 'Tech tags',
            itemLabel: (props) => props.value ?? 'tag',
          }),
          images: fields.array(
            fields.image({
              label: 'Screenshot',
              directory: p('public/images/use-cases'),
              publicPath: '/images/use-cases/',
            }),
            { label: 'Screenshots (slider)' }
          ),
          tryItUrl: fields.url({
            label: '“Try it” link',
            description: 'Leave empty to hide the button',
          }),
          caseStudyUrl: fields.url({
            label: 'Case study page',
            description: 'Internal page, for example /use-cases/ai-library',
          }),
          content: fields.markdoc({ label: 'Description', extension: 'md' }),
        },
      }),

      lab: collection({
        label: 'LAB articles',
        path: p('src/content/lab/*'),
        slugField: 'title',
        format: { contentField: 'content' },
        schema: {
          title: fields.slug({ name: { label: 'Title' } }),
          navLabel: fields.text({
            label: 'Menu label',
            description: 'Short name shown in the LAB dropdown',
            validation: { isRequired: true },
          }),
          // ——— SEO / social tags (grouped so they read as one block) ———
          seoTitle: fields.text({
            label: 'SEO title (browser tab — defaults to Title)',
          }),
          description: fields.text({
            label: 'Meta description',
            multiline: true,
            validation: { isRequired: true },
          }),
          ogTitle: fields.text({
            label: 'og:title (social preview — defaults to SEO title)',
          }),
          ogDescription: fields.text({
            label: 'og:description (social preview — defaults to meta description)',
            multiline: true,
          }),
          ogImage: fields.image({
            label: 'og:image (social preview image)',
            directory: p('public/images/lab'),
            publicPath: '/images/lab/',
          }),
          // ——— Article fields ———
          publishDate: fields.date({ label: 'Publish date', validation: { isRequired: true } }),
          displayDate: fields.text({ label: 'Displayed date (e.g. “May 2026”)', validation: { isRequired: true } }),
          readTime: fields.text({ label: 'Read time (e.g. “8 min read”)', validation: { isRequired: true } }),
          heroQuote: fields.text({ label: 'Intro quote', multiline: true }),
          mapEmbedUrl: fields.url({ label: 'Embedded map URL' }),
          mapHints: fields.array(
            fields.object({
              icon: fields.text({ label: 'Icon path (e.g. /images/icons/sidebar.svg)' }),
              text: fields.text({ label: 'Hint text', multiline: true }),
            }),
            { label: 'Map usage hints', itemLabel: (props) => props.fields.text.value }
          ),
          githubUrl: fields.url({ label: 'GitHub link' }),
          techStack: fields.array(
            fields.object({
              label: fields.text({ label: 'Label' }),
              url: fields.url({ label: 'URL' }),
            }),
            { label: 'Tech stack', itemLabel: (props) => props.fields.label.value }
          ),
          dataSources: fields.array(
            fields.object({
              label: fields.text({ label: 'Label' }),
              url: fields.url({ label: 'URL' }),
            }),
            { label: 'Data sources', itemLabel: (props) => props.fields.label.value }
          ),
          showAuthorCard: fields.checkbox({
            label: 'Show author card (under the article)',
            defaultValue: true,
          }),
          authorName: fields.text({
            label: 'Author name (defaults to site author)',
          }),
          authorPhoto: fields.image({
            label: 'Author photo (defaults to site author)',
            directory: p('public/images'),
            publicPath: '/images/',
          }),
          authorBio: fields.text({ label: 'Author bio (defaults to site author)', multiline: true }),
          content: fields.markdoc({
            label: 'Article',
            extension: 'md',
            options: {
              image: { directory: p('public/images/lab'), publicPath: '/images/lab/' },
            },
          }),
        },
      }),

      faq: collection({
        label: 'FAQ',
        path: p('src/content/faq/*'),
        slugField: 'question',
        format: { contentField: 'content' },
        schema: {
          question: fields.slug({ name: { label: 'Question' } }),
          order: fields.integer({ label: 'Order', validation: { isRequired: true } }),
          content: fields.markdoc({ label: 'Answer', extension: 'md' }),
        },
      }),

      testimonials: collection({
        label: 'Testimonials',
        path: p('src/content/testimonials/*'),
        slugField: 'name',
        format: { data: 'yaml' },
        schema: {
          name: fields.slug({ name: { label: 'Name' } }),
          company: fields.text({ label: 'Company', validation: { isRequired: true } }),
          order: fields.integer({ label: 'Order', validation: { isRequired: true } }),
          quote: fields.text({ label: 'Quote', multiline: true, validation: { isRequired: true } }),
        },
      }),
    },

    singletons: {
      site: singleton({
        label: 'Site settings',
        path: p('src/content/site'),
        format: { data: 'yaml' },
        schema: {
          title: fields.text({ label: 'Site name', validation: { isRequired: true } }),
          siteUrl: fields.url({ label: 'Site URL', validation: { isRequired: true } }),
          tagline: fields.text({ label: 'Tagline', validation: { isRequired: true } }),
          description: fields.text({ label: 'Default meta description', multiline: true, validation: { isRequired: true } }),
          email: fields.text({ label: 'Contact email', validation: { isRequired: true } }),
          bookCallUrl: fields.url({ label: '“Book a call” URL', validation: { isRequired: true } }),
          location: fields.text({ label: 'Location', validation: { isRequired: true } }),
          vat: fields.text({ label: 'VAT', validation: { isRequired: true } }),
          privacyPolicyUrl: fields.url({ label: 'Privacy Policy URL', validation: { isRequired: true } }),
          social: fields.object(
            {
              linkedinCompany: fields.url({ label: 'LinkedIn (company)' }),
              upworkAgency: fields.url({ label: 'Upwork (agency)' }),
              linkedinPersonal: fields.url({ label: 'LinkedIn (personal)' }),
              upworkFreelancer: fields.url({ label: 'Upwork (freelancer)' }),
              telegram: fields.url({ label: 'Telegram' }),
              whatsapp: fields.url({ label: 'WhatsApp' }),
            },
            { label: 'Social links' }
          ),
          author: fields.object(
            {
              name: fields.text({ label: 'Name' }),
              role: fields.text({ label: 'Role' }),
              photo: fields.image({ label: 'Photo', directory: p('public/images'), publicPath: '/images/' }),
              bio: fields.text({ label: 'Bio', multiline: true }),
            },
            { label: 'Author / founder' }
          ),
          formEndpoint: fields.text({
            label: 'Contact form endpoint',
            description:
              'POST endpoint for the contact form (the apps/server URL, e.g. https://api.time2map.com/api/contact). While empty, the contact page shows email + social links instead of the form.',
          }),
          googleSiteVerification: fields.text({ label: 'Google site verification code' }),
          iubendaWidgetId: fields.text({ label: 'iubenda widget id (cookie/privacy)' }),
        },
      }),

      seo: singleton({
        label: 'SEO (static pages)',
        path: p('src/content/seo'),
        format: { data: 'yaml' },
        schema: {
          home: pageSeoFields('Home page'),
          useCases: pageSeoFields('Use Cases page'),
          contact: pageSeoFields('Contact page'),
          notFound: pageSeoFields('404 page'),
        },
      }),

      home: singleton({
        label: 'Home page',
        path: p('src/content/pages/home'),
        format: { data: 'yaml' },
        schema: {
          hero: fields.object(
            {
              title: fields.text({ label: 'Title' }),
              subtitle: fields.text({ label: 'Subtitle', multiline: true }),
              videoEmbedUrl: fields.url({ label: 'Demo video embed URL (Vimeo)' }),
              videoPoster: fields.image({ label: 'Video poster', directory: p('public/images'), publicPath: '/images/' }),
            },
            { label: 'Hero' }
          ),
          stats: fields.array(
            fields.object({
              icon: fields.text({ label: 'Icon path' }),
              text: fields.text({ label: 'Text' }),
              href: fields.text({ label: 'Link (anchor or URL)' }),
            }),
            { label: 'Stats cards', itemLabel: (props) => props.fields.text.value }
          ),
          services: fields.object(
            {
              heading: fields.text({ label: 'Heading' }),
              groups: fields.array(
                fields.object({
                  title: fields.text({ label: 'Title' }),
                  items: fields.array(fields.text({ label: 'Item' }), {
                    label: 'Items',
                    itemLabel: (props) => props.value ?? '',
                  }),
                }),
                { label: 'Groups', itemLabel: (props) => props.fields.title.value }
              ),
            },
            { label: 'Services (“What we do?”)' }
          ),
          clients: fields.array(
            fields.object({
              name: fields.text({ label: 'Name' }),
              logo: fields.image({ label: 'Logo', directory: p('public/images/clients'), publicPath: '/images/clients/' }),
              url: fields.url({ label: 'Website' }),
            }),
            { label: 'Client logos', itemLabel: (props) => props.fields.name.value }
          ),
          faqHeading: fields.text({ label: 'FAQ heading' }),
          about: fields.object(
            {
              heading: fields.text({ label: 'Heading' }),
              quote: fields.text({ label: 'Quote', multiline: true }),
              badges: fields.array(
                fields.object({
                  icon: fields.text({ label: 'Icon path' }),
                  text: fields.text({ label: 'Text' }),
                }),
                { label: 'Badges', itemLabel: (props) => props.fields.text.value }
              ),
            },
            { label: '“Meet Alex” section' }
          ),
          process: fields.object(
            {
              heading: fields.text({ label: 'Heading' }),
              intro: fields.text({ label: 'Intro', multiline: true }),
              steps: fields.array(
                fields.object({
                  title: fields.text({ label: 'Title' }),
                  text: fields.text({ label: 'Text (supports **bold**)', multiline: true }),
                  showBookButton: fields.checkbox({ label: 'Show “Book a call” button' }),
                }),
                { label: 'Steps', itemLabel: (props) => props.fields.title.value }
              ),
            },
            { label: '“How We Work?” section' }
          ),
          workHeading: fields.text({ label: '“See Our Work” heading' }),
          technologies: fields.object(
            {
              heading: fields.text({ label: 'Heading' }),
              groups: fields.array(
                fields.object({
                  title: fields.text({ label: 'Group title' }),
                  items: fields.array(
                    fields.object({
                      name: fields.text({ label: 'Name' }),
                      icon: fields.text({ label: 'Icon path' }),
                    }),
                    { label: 'Items', itemLabel: (props) => props.fields.name.value }
                  ),
                }),
                { label: 'Groups', itemLabel: (props) => props.fields.title.value }
              ),
            },
            { label: 'Technologies section' }
          ),
          cta: fields.object(
            {
              heading: fields.text({ label: 'Heading' }),
              text: fields.text({ label: 'Text' }),
            },
            { label: 'CTA banner' }
          ),
        },
      }),
    },
  });
}
