FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN corepack enable

WORKDIR /app

FROM base AS prod

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches

RUN pnpm fetch

COPY . ./

RUN pnpm install --offline
RUN pnpm run build

FROM base

COPY --from=prod /app/node_modules ./node_modules
COPY --from=prod /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
