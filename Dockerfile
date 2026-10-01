# KINZ Fidélité — image for the store PC (see docs/magasin.md).

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Full toolchain: builds the app; also runs migrations and admin scripts (owner account).
FROM deps AS builder
COPY . .
ENV BUILD_STANDALONE=1 DISABLE_HSTS=1 NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Lean runtime: only the self-contained Next.js server.
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN useradd --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
