import { Injectable, Logger, Inject } from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProcessedComment } from './entities/processed-comment.entity'
import { RedisService } from './redis.service'
import { CacheService } from './cache.service'
import { SentimentClient } from './sentiment-client.service'
import { KAFKA_TOPICS, RETRY_CONFIG, RawComment, CommentTag } from '@repo/shared'

interface RetryContext {
  comment: RawComment
  attempts: number
  lastError?: string
}

@Injectable()
export class ConsumerService {
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

  async handleRawComment(data: any): Promise<void> {
    const comment: RawComment = JSON.parse(data.value)
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
      await this.kafkaProducer.emit(KAFKA_TOPICS.PROCESSED_COMMENTS, {
        key: comment.commentId,
        value: JSON.stringify(processedComment),
      })

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
    await this.kafkaProducer.emit(KAFKA_TOPICS.RETRY_QUEUE, {
      key: comment.commentId,
      value: JSON.stringify(retryContext),
      headers: {
        'retry-attempt': String(attempt),
        'scheduled-time': String(Date.now() + delay),
      },
    })
  }

  async handleRetryQueue(data: any): Promise<void> {
    const retryContext: RetryContext = JSON.parse(data.value)
    const scheduledTime = parseInt(data.headers['scheduled-time'])
    const now = Date.now()

    // Wait if not yet time to retry
    if (scheduledTime > now) {
      const waitTime = scheduledTime - now
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.logger.debug(`Retrying comment: ${retryContext.comment.commentId} (attempt ${retryContext.attempts})`)

    try {
      await this.handleRawComment({ value: JSON.stringify(retryContext.comment) })
    } catch (error) {
      await this.handleRetry(retryContext.comment, retryContext.attempts + 1, error.message)
    }
  }

  private async sendToDeadLetterQueue(comment: RawComment, errorMessage: string, attempts: number): Promise<void> {
    await this.kafkaProducer.emit(KAFKA_TOPICS.DEAD_LETTER_QUEUE, {
      key: comment.commentId,
      value: JSON.stringify({
        comment,
        errorMessage,
        attempts,
        timestamp: Date.now(),
      }),
    })
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
