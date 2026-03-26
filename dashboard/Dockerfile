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
ENV PORT=3000
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/dashboard/node_modules ./dashboard/node_modules
COPY --from=build /app/dashboard/.output ./dashboard/.output
COPY dashboard/package.json ./dashboard/
WORKDIR /app/dashboard

EXPOSE 3000
CMD ["pnpm", "start"]
