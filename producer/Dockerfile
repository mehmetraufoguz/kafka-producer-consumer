# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY producer/package.json ./producer/
RUN pnpm install --frozen-lockfile

# Build shared stage
FROM dependencies AS build-shared
COPY shared ./shared
WORKDIR /app/shared
RUN pnpm build

# Build stage
FROM dependencies AS build
COPY --from=build-shared /app/shared/dist ./shared/dist
COPY producer ./producer
WORKDIR /app/producer
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/producer/node_modules ./producer/node_modules
COPY --from=build-shared /app/shared ./shared
COPY --from=build /app/producer/dist ./producer/dist
COPY producer/package.json ./producer/
WORKDIR /app/producer

EXPOSE 3002
CMD ["node", "dist/main.js"]
