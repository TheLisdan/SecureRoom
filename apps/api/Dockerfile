FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm --filter @secure-room/api-contract build \
  && pnpm --filter api prisma:generate \
  && pnpm --filter api build

FROM base AS runner

ENV PRISMA_ENGINES_CACHE_DIR="/app/node_modules/.cache/prisma"

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages/api-contract/package.json ./packages/api-contract/package.json
COPY --from=build /app/packages/api-contract/node_modules ./packages/api-contract/node_modules
COPY --from=build /app/packages/api-contract/dist ./packages/api-contract/dist

RUN mkdir -p /app/apps/api/private-storage /app/node_modules/.cache/prisma \
  && chown -R node:node /app/apps/api/private-storage /app/node_modules/.cache

USER node

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
