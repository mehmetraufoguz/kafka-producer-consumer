import { Module, Logger } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { KAFKA_CONSUMER_GROUPS } from '@repo/shared'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID || 'api-client',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            retry: {
              retries: 5,
              initialRetryTime: 300,
              multiplier: 2,
            },
          },
          consumer: {
            groupId: KAFKA_CONSUMER_GROUPS.API,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {
  private readonly logger = new Logger(KafkaModule.name)

  constructor() {
    this.logger.log('Kafka module initialized')
  }
}
