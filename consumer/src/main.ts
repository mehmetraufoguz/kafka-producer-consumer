import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'
import { KAFKA_CONSUMER_GROUPS } from '@repo/shared'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // Create standalone Kafka microservice (no HTTP server)
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'consumer',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: KAFKA_CONSUMER_GROUPS.CONSUMER,
      },
    },
  })

  await app.listen()
  logger.log('Consumer service started - Running as standalone Kafka microservice')
  logger.log('Consuming from raw-comments and retry-queue topics...')
}
bootstrap()
