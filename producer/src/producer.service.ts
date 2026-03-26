import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
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
    await this.kafkaClient.connect()
    this.logger.log('Kafka producer connected')
    
    // Start producing after a short delay
    setTimeout(() => this.startProducing(), 2000)
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
