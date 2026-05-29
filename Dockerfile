FROM oven/bun:1.1.42-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1.1.42-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM oven/bun:1.1.42-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache curl tini

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src/lib/db/migrations ./src/lib/db/migrations
COPY --from=build /app/src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY --from=build /app/src/lib/db/migrate.ts ./src/lib/db/migrate.ts
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/eggs ./eggs

ENV CHEST_EGG_DIR=/app/eggs

RUN mkdir -p /app/data && chown -R bun:bun /app/data

USER bun

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV BODY_SIZE_LIMIT=104857600
ENV DATABASE_URL=file:/app/data/db.sqlite

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/login >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "bun src/lib/db/migrate.ts && bun scripts/seed-admin.ts && bun build/index.js"]
