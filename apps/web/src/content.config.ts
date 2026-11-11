import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const useCases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/use-cases' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    images: z.array(z.string()).min(1),
    tryItUrl: z.string().optional(),
    caseStudyUrl: z.string().optional(),
  }),
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
  schema: z.object({
    title: z.string(),
    navLabel: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    publishDate: z.coerce.date(),
    displayDate: z.string(),
    readTime: z.string(),
    heroQuote: z.string().optional(),
    mapEmbedUrl: z.string().optional(),
    mapHints: z.array(z.object({ icon: z.string(), text: z.string() })).default([]),
    githubUrl: z.string().optional(),
    ogImage: z.string().optional(),
    dataSources: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    techStack: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    authorBio: z.string().optional(),
    authorName: z.string().optional(),
    authorPhoto: z.string().optional(),
    showAuthorCard: z.boolean().default(true),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/testimonials' }),
  schema: z.object({
    name: z.string(),
    company: z.string(),
    order: z.number(),
    quote: z.string(),
  }),
});

export const collections = { useCases, lab, faq, testimonials };
