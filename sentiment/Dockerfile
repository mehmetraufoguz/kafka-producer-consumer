# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY sentiment/package.json ./sentiment/
RUN pnpm install --frozen-lockfile

# Build shared stage
FROM dependencies AS build-shared
COPY shared ./shared
WORKDIR /app/shared
RUN pnpm build

# Build stage
FROM dependencies AS build
COPY --from=build-shared /app/shared/dist ./shared/dist
COPY sentiment ./sentiment
WORKDIR /app/sentiment
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/sentiment/node_modules ./sentiment/node_modules
COPY --from=build-shared /app/shared ./shared
COPY --from=build /app/sentiment/dist ./sentiment/dist
COPY sentiment/package.json ./sentiment/
COPY sentiment/proto ./sentiment/proto
WORKDIR /app/sentiment

EXPOSE 3004
CMD ["node", "dist/main.js"]
