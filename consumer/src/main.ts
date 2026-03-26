import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'
import { KAFKA_CONSUMER_GROUPS, KAFKA_TOPICS } from '@repo/shared'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  try {
    // Create standalone Kafka microservice (no HTTP server)
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID || 'consumer',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          retry: {
            retries: 8,
            initialRetryTime: 300,
            multiplier: 2,
          },
        },
        consumer: {
          groupId: KAFKA_CONSUMER_GROUPS.CONSUMER,
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          maxWaitTimeInMs: 5000,
          allowAutoTopicCreation: false,
          retry: {
            retries: 8,
            initialRetryTime: 300,
          },
        },
        subscribe: {
          fromBeginning: true, // Process all messages from beginning
        },
        run: {
          autoCommit: true,
          autoCommitInterval: 5000,
          autoCommitThreshold: 100,
        },
      },
    })

    // Enable graceful shutdown
    app.enableShutdownHooks()

    await app.listen()
    logger.log('Consumer service started - Running as standalone Kafka microservice')
    logger.log(`Subscribed to topics: ${KAFKA_TOPICS.RAW_COMMENTS}, ${KAFKA_TOPICS.RETRY_QUEUE}`)
  } catch (error) {
    logger.error(`Failed to start consumer service: ${error.message}`, error.stack)
    process.exit(1)
  }
}
bootstrap()
