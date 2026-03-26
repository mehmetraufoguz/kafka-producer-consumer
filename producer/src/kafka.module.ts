import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { KAFKA_TOPICS } from '@repo/shared'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID || 'producer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            retry: {
              initialRetryTime: 300,
              retries: 10,
            },
          },
          producer: {
            allowAutoTopicCreation: true,
            transactionTimeout: 30000,
            metadataMaxAge: 5000,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
