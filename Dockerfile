# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api build
RUN pnpm --filter api exec esbuild \
	../../packages/db/src/migrate.ts \
	--bundle \
	--platform=node \
	--format=esm \
	--packages=external \
	--outfile=../../packages/db/dist/migrate.js
RUN pnpm --filter api deploy --prod /prod/api

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV="production"
ENV PORT="3070"
ENV DATABASE_URL="/data/shelf.db"
ENV MIGRATIONS_FOLDER="/app/drizzle"

WORKDIR /app

COPY --from=builder --chown=node:node /prod/api ./
COPY --from=builder --chown=node:node /workspace/packages/db/dist/migrate.js ./migrate.js
COPY --from=builder --chown=node:node /workspace/packages/db/drizzle ./drizzle

RUN mkdir -p /data && chown node:node /data

USER node

EXPOSE 3070

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:3070/doc').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["sh", "-c", "node migrate.js && exec node dist/index.js"]
