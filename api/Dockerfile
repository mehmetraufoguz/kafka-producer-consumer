# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src
COPY api/package.json ./api/
RUN pnpm install --frozen-lockfile

# Build shared stage
FROM dependencies AS build-shared
COPY shared ./shared
WORKDIR /app/shared
RUN pnpm build

# Build stage
FROM dependencies AS build
COPY --from=build-shared /app/shared/dist ./shared/dist
COPY api ./api
WORKDIR /app/api
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/api/node_modules ./api/node_modules
COPY --from=build-shared /app/shared ./shared
COPY --from=build /app/api/dist ./api/dist
COPY api/package.json ./api/
WORKDIR /app/api

EXPOSE 3001
CMD ["node", "dist/main.js"]
