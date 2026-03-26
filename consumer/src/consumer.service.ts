import { Controller, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProcessedComment } from './entities/processed-comment.entity'
import { RedisService } from './redis.service'
import { CacheService } from './cache.service'
import { SentimentClient } from './sentiment-client.service'
import { KAFKA_TOPICS, RETRY_CONFIG, RawComment, CommentTag, RawCommentSchema, RetryContextSchema } from '@repo/shared'
import { lastValueFrom } from 'rxjs'

interface RetryContext {
  comment: RawComment
  attempts: number
  lastError?: string
  scheduledTime?: number
}

@Controller()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsumerService.name)
  private readonly consumerId = `consumer-${Date.now()}`

  constructor(
    @Inject('KAFKA_PRODUCER') private readonly kafkaProducer: ClientKafka,
    @InjectRepository(ProcessedComment)
    private readonly commentRepository: Repository<ProcessedComment>,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
    private readonly sentimentClient: SentimentClient,
  ) {}

  async onModuleInit() {
    // Subscribe to response topics (if needed for request-response pattern)
    const topics = [
      KAFKA_TOPICS.PROCESSED_COMMENTS,
      KAFKA_TOPICS.RETRY_QUEUE,
      KAFKA_TOPICS.DEAD_LETTER_QUEUE,
    ]
    
    topics.forEach(topic => {
      this.kafkaProducer.subscribeToResponseOf(topic)
    })

    try {
      await this.kafkaProducer.connect()
      this.logger.log('Kafka producer connected successfully')
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error.message}`, error.stack)
      throw error
    }
  }

  async onModuleDestroy() {
    try {
      await this.kafkaProducer.close()
      this.logger.log('Kafka producer disconnected')
    } catch (error) {
      this.logger.error(`Error disconnecting Kafka producer: ${error.message}`)
    }
  }

  @EventPattern(KAFKA_TOPICS.RAW_COMMENTS)
  async handleRawComment(@Payload() message: any): Promise<void> {
    // @Payload() already extracts the value from Kafka message
    let commentData = message
    if (typeof commentData === 'string') {
      commentData = JSON.parse(commentData)
    }

    const parsed = RawCommentSchema.safeParse(commentData)
    if (!parsed.success) {
      return
    }
    const comment: RawComment = parsed.data
    this.logger.debug(`Received comment: ${comment.commentId.substring(0, 8)}...`)

    try {
      // Step 1: Check Redis for deduplication
      const isProcessed = await this.redisService.isCommentProcessed(comment.commentId)
      if (isProcessed) {
        this.logger.debug(`Comment ${comment.commentId} already processed, skipping`)
        return
      }

      // Step 2: Hash the comment text
      const textHash = this.cacheService.hashText(comment.text)

      // Step 3: Check in-memory cache
      const cachedSentiment = this.cacheService.getCachedSentiment(textHash)
      
      let tag: CommentTag

      if (cachedSentiment) {
        this.logger.debug(`Using cached sentiment for hash: ${textHash.substring(0, 8)}...`)
        tag = cachedSentiment.tag as CommentTag
      } else {
        // Step 4: Call sentiment service
        const sentimentResponse = await this.sentimentClient.analyzeSentiment({
          commentId: comment.commentId,
          text: comment.text,
          textHash,
          consumerId: this.consumerId,
        })

        tag = sentimentResponse.tag as CommentTag
        this.cacheService.setCachedSentiment(textHash, tag)
      }

      // Step 5: Save to database
      const processedComment = this.commentRepository.create({
        commentId: comment.commentId,
        text: comment.text,
        textHash,
        tag,
        source: comment.source,
        consumerId: this.consumerId,
        retryCount: 0,
      })

      await this.commentRepository.save(processedComment)

      // Step 6: Mark as processed in Redis
      await this.redisService.markCommentAsProcessed(comment.commentId)

      // Step 7: Publish to processed-comments topic
      await lastValueFrom(
        this.kafkaProducer.emit(KAFKA_TOPICS.PROCESSED_COMMENTS, {
          key: comment.commentId,
          value: JSON.stringify(processedComment),
        })
      )

      this.logger.log(`Successfully processed comment: ${comment.commentId.substring(0, 8)}... [${tag}]`)
    } catch (error) {
      this.logger.error(`Error processing comment ${comment.commentId}: ${error.message}`)
      await this.handleRetry(comment, 1, error.message)
    }
  }

  private async handleRetry(comment: RawComment, attempt: number, errorMessage: string): Promise<void> {
    const maxRetries = parseInt(process.env.CONSUMER_MAX_RETRIES || String(RETRY_CONFIG.MAX_ATTEMPTS))

    if (attempt >= maxRetries) {
      this.logger.warn(`Max retries reached for comment ${comment.commentId}, sending to DLQ`)
      await this.sendToDeadLetterQueue(comment, errorMessage, attempt)
      return
    }

    const delay = this.calculateRetryDelay(attempt)
    this.logger.debug(`Scheduling retry ${attempt}/${maxRetries} for comment ${comment.commentId} in ${delay}ms`)

    const retryContext: RetryContext = {
      comment,
      attempts: attempt,
      lastError: errorMessage,
    }

    // Send to retry queue
    await lastValueFrom(
      this.kafkaProducer.emit(KAFKA_TOPICS.RETRY_QUEUE, {
        key: comment.commentId,
        value: JSON.stringify(retryContext),
        headers: {
          'retry-attempt': String(attempt),
          'scheduled-time': String(Date.now() + delay),
        },
      })
    )
  }

  @EventPattern(KAFKA_TOPICS.RETRY_QUEUE)
  async handleRetryQueue(@Payload() message: any): Promise<void> {
    // @Payload() already extracts the value from Kafka message
    let retryData = message
    if (typeof retryData === 'string') {
      retryData = JSON.parse(retryData)
    }

    const parsed = RetryContextSchema.safeParse(retryData)
    if (!parsed.success) {
      this.logger.warn(`Invalid retry payload: ${parsed.error.message}`)
      return
    }
    const retryContext = parsed.data
    const scheduledTime = retryContext.scheduledTime || Date.now()
    const now = Date.now()

    // Skip if not yet time to retry - don't block with setTimeout as it causes heartbeat timeout
    if (scheduledTime > now) {
      this.logger.debug(`Retry for ${retryContext.comment.commentId} not yet due, will be reprocessed later`)
      return
    }

    this.logger.debug(`Retrying comment: ${retryContext.comment.commentId} (attempt ${retryContext.attempts})`)

    try {
      // @Payload() already extracts the value, so pass the comment directly
      await this.handleRawComment(retryContext.comment)
    } catch (error) {
      await this.handleRetry(retryContext.comment, retryContext.attempts + 1, error.message)
    }
  }

  private async sendToDeadLetterQueue(comment: RawComment, errorMessage: string, attempts: number): Promise<void> {
    await lastValueFrom(
      this.kafkaProducer.emit(KAFKA_TOPICS.DEAD_LETTER_QUEUE, {
        key: comment.commentId,
        value: JSON.stringify({
          comment,
          errorMessage,
          attempts,
          timestamp: Date.now(),
        }),
      })
    )
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = parseInt(process.env.CONSUMER_RETRY_DELAY || String(RETRY_CONFIG.INITIAL_DELAY))
    const multiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER
    return baseDelay * Math.pow(multiplier, attempt - 1)
  }

  getStats() {
    return {
      consumerId: this.consumerId,
      cache: this.cacheService.getCacheStats(),
    }
  }
}
