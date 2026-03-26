import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { Kafka } from 'kafkajs'
import { KAFKA_TOPICS } from '@repo/shared'
import { CommentGeneratorService } from './comment-generator.service'

@Injectable()
export class ProducerService implements OnModuleInit {
  private readonly logger = new Logger(ProducerService.name)
  private isProducing = false

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly commentGenerator: CommentGeneratorService,
  ) {}

  async onModuleInit() {
    await this.ensureTopicsExist()
    await this.kafkaClient.connect()
    this.logger.log('Kafka producer connected')
    
    // Start producing after a short delay
    setTimeout(() => this.startProducing(), 2000)
  }

  private async ensureTopicsExist() {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'producer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    })
    const admin = kafka.admin()
    try {
      await admin.connect()
      const topics = Object.values(KAFKA_TOPICS)
      const existingTopics = await admin.listTopics()
      const missingTopics = topics.filter((t) => !existingTopics.includes(t))
      if (missingTopics.length > 0) {
        await admin.createTopics({
          topics: missingTopics.map((topic) => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        })
        this.logger.log(`Created Kafka topics: ${missingTopics.join(', ')}`)
      }
    } finally {
      await admin.disconnect()
    }
  }

  private async startProducing() {
    this.isProducing = true
    this.logger.log('Started producing comments to Kafka')

    await this.produceLoop()
  }

  private async produceLoop() {
    while (this.isProducing) {
      try {
        const comment = this.commentGenerator.generateComment()
        
        await this.kafkaClient.emit(KAFKA_TOPICS.RAW_COMMENTS, {
          key: comment.commentId,
          value: JSON.stringify(comment),
        })

        this.logger.debug(`Produced comment: ${comment.commentId.substring(0, 8)}...`)

        // Wait for random delay before next comment
        const delay = this.commentGenerator.getRandomDelay()
        await new Promise((resolve) => setTimeout(resolve, delay))
      } catch (error) {
        this.logger.error(`Error producing comment: ${error.message}`)
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
  }

  async stopProducing() {
    this.isProducing = false
    this.logger.log('Stopped producing comments')
  }

  getStatus() {
    return {
      isProducing: this.isProducing,
      minDelay: parseInt(process.env.PRODUCER_MIN_DELAY || '100'),
      maxDelay: parseInt(process.env.PRODUCER_MAX_DELAY || '10000'),
      duplicateRate: parseFloat(process.env.PRODUCER_DUPLICATE_RATE || '0.05'),
    }
  }
}
