# Kafka Restaurant Comment Analytics 🍽️

A proof-of-concept microservices platform for real-time restaurant comment sentiment analysis using Apache Kafka, NestJS, and React.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Kafka](https://img.shields.io/badge/Kafka-4.0.2-black)](https://kafka.apache.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

## Overview

This project demonstrates advanced microservices patterns with Kafka event streaming, featuring:

- ⚡ **Event-Driven Architecture**: Kafka-based message flow with retry mechanisms and dead-letter queues
- 🤖 **Intelligent Processing**: Sentiment analysis via gRPC with rate limiting and caching
- 🔄 **Real-time Updates**: Server-Sent Events for live dashboard updates
- 🚀 **Docker Ready**: Multi-service deployment with Docker Compose
- 🎯 **Edge Case Handling**: Deduplication, exponential backoff, failure simulation

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  Producer   │────▶│  Kafka   │────▶│   Consumer   │────▶│  Sentiment  │
│  (Mocks)    │     │ (Topics) │     │ (Processor)  │     │   (gRPC)    │
└─────────────┘     └──────────┘     └──────────────┘     └─────────────┘
                         │                   │
                         │                   ▼
                         │            ┌─────────────┐
                         │            │ PostgreSQL  │
                         │            │   + Redis   │
                         │            └─────────────┘
                         ▼                   │
                    ┌──────────┐            │
                    │   API    │◀───────────┘
                    │  (SSE)   │
                    └──────────┘
                         │
                         ▼
                    ┌──────────┐
                    │Dashboard │
                    │ (React)  │
                    └──────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd kafka-producer-consumer

# Install dependencies
pnpm install

# Start all services with Docker
pnpm docker:up
```

### Access the Application

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **SSE Stream**: http://localhost:3001/api/sse/comments
- **Documentation**: http://localhost:5173 (run `pnpm docs:dev`)

## Features

### 🎯 Core Functionality

- **Variable Speed Producer**: Generates mock comments at configurable intervals (100ms - 10s)
- **Dual-Layer Deduplication**: Redis (3h TTL) + LRU cache (100 entries)
- **Smart Retry Mechanism**: Exponential backoff with max 5 attempts
- **Dead Letter Queue**: Failed messages route to DLQ for manual intervention
- **gRPC Sentiment Analysis**: Keyword-based classification with caching
- **Two-Tier Rate Limiting**: 
  - Authenticated consumers: 100 req/sec
  - Unauthenticated: 10 req/sec
- **Live Dashboard**: Real-time updates with SSE, charts, and filtering

### 🛠️ Technology Stack

**Backend**
- NestJS 10 with TypeScript
- Apache Kafka 4.0.2 (KRaft mode)
- PostgreSQL 17 with TypeORM
- Redis 7.2 + LRU caches
- gRPC (@grpc/grpc-js)
- Server-Sent Events

**Frontend**
- React 19
- TanStack Router/Query/Table
- Zustand for state management
- Recharts for visualization
- shadcn/ui components
- Tailwind CSS 4

**Infrastructure**
- Docker & Docker Compose
- pnpm workspaces
- Multi-stage builds

## Project Structure

```
kafka-producer-consumer/
├── api/              # REST API & SSE service
├── consumer/         # Kafka consumer with processing logic
├── dashboard/        # React frontend
├── docs/             # Vocs documentation
├── producer/         # Mock comment generator
├── sentiment/        # gRPC sentiment analysis service
├── shared/           # Shared TypeScript types and constants
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

## Services

### Producer (Standalone)
Generates mock restaurant comments with 40+ templates, multiple sources, variable speed (100ms-10s), and 5% duplicate injection.

### Consumer (Standalone)
Processes comments through Redis deduplication, LRU cache, gRPC sentiment analysis, PostgreSQL storage, with retry and DLQ routing.

### Sentiment (Port 3004)
gRPC service with consumer registration, sentiment classification, rate limiting (100/sec auth, 10/sec unauth), LRU cache, and random failures.

### API (Port 3001)
HTTP + Kafka hybrid: `/api/comments` (paginated), `/api/statistics`, `/api/sse/comments` (real-time), `/health`.

### Dashboard (Port 3000)
React app with live statistics, charts, comments table with filtering/search, and real-time SSE updates.

## Development

```bash
# Build shared package (required first)
pnpm --filter shared build

# Run all services in development mode
pnpm dev:all

# Run specific service
pnpm --filter producer dev

# View documentation
pnpm docs:dev

# Docker commands
pnpm docker:build    # Build all images
pnpm docker:up       # Start services
pnpm docker:down     # Stop services
pnpm docker:logs     # View logs
```

## Key Design Patterns

- **Event Sourcing**: All state changes flow through Kafka
- **CQRS**: Separate read (API) and write (Consumer) models
- **Circuit Breaker**: Rate limiting and graceful degradation
- **Retry with Backoff**: Exponential backoff for failed operations
- **Dead Letter Queue**: Failed messages preserved
- **Smart Caching**: Multi-layer (Redis + LRU)

## Documentation

Full documentation: Run `pnpm docs:dev` or visit **https://newmindai.rauf.app**

Covers:
- Getting Started
- Architecture Deep Dive
- Service Details
- Deployment Guide
- Environment Configuration

## Environment Variables

```env
# Producer
PRODUCER_MIN_DELAY=100
PRODUCER_MAX_DELAY=10000

# Consumer
CONSUMER_MAX_RETRIES=5
CONSUMER_CACHE_SIZE=100

# Sentiment
SENTIMENT_AUTH_RATE_LIMIT=100
SENTIMENT_UNAUTH_RATE_LIMIT=10

# Infrastructure
KAFKA_BROKER=localhost:9092
POSTGRES_HOST=localhost
REDIS_HOST=localhost
```

## Monitoring

Health endpoints:
- API: `http://localhost:3001/health`
- Sentiment: `http://localhost:3004/health`

Monitor: Kafka lag, rate limits, DLQ count, processing time, cache hits

## Troubleshooting

**Kafka not connecting**: Wait 60s after starting (KRaft initialization)

**@repo/shared not found**: Run `pnpm --filter shared build`

**Database errors**: Run `cd consumer && pnpm run migration:run`

**Port conflicts**: Ensure 3000, 3001, 3004, 5432, 6379, 9092 are free

## License

MIT License - see [LICENSE](LICENSE) file

## Author

Created as a case study demonstrating event-driven microservices, Kafka patterns, real-time processing, and production deployment.

---

**Built with ❤️ for learning and demonstration purposes**

