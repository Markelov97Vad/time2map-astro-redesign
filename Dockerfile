# syntax=docker/dockerfile:1

# Multi-stage build for time2map:
#   web — nginx + static Astro site (apps/web/dist)
#   app — Node contact API (apps/server standalone)

FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/seo-audit/package.json packages/seo-audit/
COPY packages/keystatic-config/package.json packages/keystatic-config/
# Workspace package sources are needed at `npm ci` time so bin links
# (e.g. seo-audit) are created; lockfile still keeps versions pinned.
COPY packages/seo-audit packages/seo-audit
COPY packages/keystatic-config packages/keystatic-config
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build:all

# --- static site ---
FROM nginx:1.27-alpine AS web
COPY deploy/docker/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# --- contact API ---
FROM base AS app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4322
# Runtime needs the server build + workspace node_modules (hoisted).
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/packages ./packages
USER node
EXPOSE 4322
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4322/api/contact',{method:'OPTIONS'}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/server/dist/server/entry.mjs"]
