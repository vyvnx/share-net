# syntax=docker/dockerfile:1

###############################################################################
# Base — Node 22 Alpine with pnpm provided by corepack (pinned via root
# package.json "packageManager"). Build context is the monorepo root.
# node 22 floor is required by the server's node:sqlite progress store.
###############################################################################
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

###############################################################################
# Build — install the workspace, build the web SPA (vite) and bundle the
# Express server into a single self-contained file (esbuild).
###############################################################################
FROM base AS build

# Copy manifests first so the install layer is cached until a manifest changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Sources needed for both builds (packages/types is shared).
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/server apps/server
COPY apps/web apps/web

# Web → apps/web/dist ; Server → apps/server/dist/index.cjs (deps bundled in).
RUN pnpm --filter @share-net/web build \
 && pnpm --filter @share-net/server build

###############################################################################
# Runtime — minimal image. The server bundle is self-contained (no
# node_modules), so we copy only the bundle + the built web app. Non-root.
###############################################################################
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0
ENV SHARE_DIR=/data
ENV STATE_DIR=/state
WORKDIR /app

COPY --from=build --chown=node:node /app/apps/server/dist ./dist
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist

# Folder whose files are exposed; mount your own over it. Writable by "node"
# (uid 1000) so uploads work.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

# app-owned mutable state (the node:sqlite reading-progress db). keep it on a
# named volume so resume positions survive container rebuilds.
RUN mkdir -p /state && chown node:node /state
VOLUME ["/state"]

USER node
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=5 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1
CMD ["node", "dist/index.cjs"]
