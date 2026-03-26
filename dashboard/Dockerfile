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
FROM nginx:alpine AS production
COPY --from=build /app/dashboard/dist /usr/share/nginx/html
COPY dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
