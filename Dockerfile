# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2-alpine AS build
WORKDIR /usr/app/www
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
ENV NODE_ENV=production
RUN bun build src/index.ts --target=bun --outdir build --sourcemap=none

FROM oven/bun:1.4.2-alpine
ENV NODE_ENV=production
WORKDIR /usr/app/www
COPY --chown=bun:bun package.json ./
COPY --from=build --chown=bun:bun /usr/app/www/build/index.js ./index.js
RUN mkdir -p tmp && chown bun:bun tmp
USER bun
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/status || exit 1
CMD ["bun", "index.js"]
