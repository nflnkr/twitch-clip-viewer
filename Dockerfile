FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prod

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches patches

RUN pnpm fetch

COPY . ./

RUN pnpm install --offline
RUN pnpm run build

FROM base

COPY --from=prod /app/node_modules /app/node_modules
COPY --from=prod /app/.output /app/.output

EXPOSE 3000

CMD node /app/.output/server/index.mjs
