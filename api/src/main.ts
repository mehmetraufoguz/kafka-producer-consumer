import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'
import { KAFKA_CONSUMER_GROUPS } from '@repo/shared'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // Create hybrid application (HTTP + Kafka)
  const app = await NestFactory.create(AppModule)

  // Enable CORS for dashboard
  app.enableCors({
    origin: process.env.API_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })

  // Add Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'api',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: KAFKA_CONSUMER_GROUPS.API,
      },
    },
  })

  await app.startAllMicroservices()
  logger.log('Kafka consumer microservice started')

  const port = process.env.API_PORT || 3001
  await app.listen(port)
  logger.log(`API service is running on: http://localhost:${port}`)
  logger.log(`SSE endpoint available at: http://localhost:${port}/api/sse/comments`)
}
bootstrap()
