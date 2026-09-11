// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// On-demand server (Node, standalone). Hosts the contact-form API and the
// hosted, password-protected Keystatic admin (auth is enforced in middleware.ts).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4322 },
  integrations: [react(), keystatic()],
  // The contact API is a public, cookie-less endpoint that intentionally accepts
  // cross-origin form posts from the static site. Astro's CSRF origin check would
  // 403 those, so it's disabled here; spam is handled by the honeypot + rate limit
  // and access is scoped via CORS (ALLOWED_ORIGIN).
  security: { checkOrigin: false },
});
