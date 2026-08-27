FROM node:22-bookworm-slim AS base

ENV NODE_ENV=production

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm/store"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable

FROM base AS pruned

RUN pnpm add -g turbo@^2

COPY . .

RUN turbo prune web --docker

FROM base AS builder

COPY --from=pruned /app/out/json/ .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

COPY --from=pruned /app/out/full/ .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --ignore-scripts && pnpm run build

FROM base AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.output .output

EXPOSE 4135

CMD ["node", "/app/.output/server/index.mjs"]
