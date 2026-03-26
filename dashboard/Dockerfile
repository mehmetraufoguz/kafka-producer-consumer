# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY dashboard/package.json ./dashboard/
RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS build
COPY dashboard ./dashboard
WORKDIR /app/dashboard
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/dashboard/node_modules ./dashboard/node_modules
COPY --from=build /app/dashboard/dist ./dashboard/dist
COPY dashboard/package.json ./dashboard/
COPY dashboard/vite.config.ts ./dashboard/
WORKDIR /app/dashboard

EXPOSE 3000
CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "3000"]
