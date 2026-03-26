import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { Partitioners } from 'kafkajs'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID || 'consumer-producer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            retry: {
              retries: 5,
              initialRetryTime: 300,
              multiplier: 2,
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
export class KafkaModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaModule.name)

  async onModuleInit() {
    this.logger.log('Kafka producer module initialized')
  }
}
