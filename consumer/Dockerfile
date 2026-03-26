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
COPY consumer/package.json ./consumer/
RUN pnpm install --frozen-lockfile

# Build shared stage
FROM dependencies AS build-shared
COPY shared ./shared
WORKDIR /app/shared
RUN pnpm build

# Build stage
FROM dependencies AS build
COPY --from=build-shared /app/shared/dist ./shared/dist
COPY consumer ./consumer
WORKDIR /app/consumer
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/consumer/node_modules ./consumer/node_modules
COPY --from=build-shared /app/shared ./shared
COPY --from=build /app/consumer/dist ./consumer/dist
COPY consumer/package.json ./consumer/
COPY consumer/proto ./proto
WORKDIR /app/consumer

CMD ["node", "dist/main.js"]
