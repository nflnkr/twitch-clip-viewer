FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@9.15.2 --activate

FROM base AS prod

COPY . /app 

WORKDIR /app
RUN pnpm install
RUN pnpm run build

FROM base

COPY --from=prod /app/node_modules /app/node_modules
COPY --from=prod /app/.output /app/.output
COPY --from=prod /app/.tanstack /app/.tanstack
COPY --from=prod /app/.nitro /app/.nitro

EXPOSE 3000

CMD node /app/.output/server/index.mjs
