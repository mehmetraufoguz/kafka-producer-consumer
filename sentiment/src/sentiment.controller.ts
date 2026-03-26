import { Controller, Logger } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { SentimentCacheService } from './sentiment-cache.service'
import { RateLimiterService } from './rate-limiter.service'
import { RegistrationService } from './registration.service'
import { CommentTag, RATE_LIMITS } from '@repo/shared'
import { RpcException } from '@nestjs/microservices'

interface RegisterRequest {
  consumerName: string
}

interface RegisterResponse {
  consumerId: string
  rateLimit: number
  message: string
}

interface SentimentRequest {
  commentId: string
  text: string
  textHash: string
  consumerId: string
}

interface SentimentResponse {
  commentId: string
  tag: string
  processingTime: number
  cached: boolean
}

@Controller()
export class SentimentController {
  private readonly logger = new Logger(SentimentController.name)
  private readonly failureRate: number

  constructor(
    private readonly cacheService: SentimentCacheService,
    private readonly rateLimiter: RateLimiterService,
    private readonly registrationService: RegistrationService,
  ) {
    this.failureRate = parseFloat(
      process.env.SENTIMENT_FAILURE_RATE || String(RATE_LIMITS.SENTIMENT_FAILURE_PROBABILITY),
    )
    this.logger.log(`Random failure rate set to: ${this.failureRate * 100}%`)
  }

  @GrpcMethod('SentimentService', 'RegisterConsumer')
  async registerConsumer(request: RegisterRequest): Promise<RegisterResponse> {
    const consumerId = this.registrationService.registerConsumer(request.consumerName)
    
    return {
      consumerId,
      rateLimit: RATE_LIMITS.SENTIMENT_AUTHENTICATED_PER_SECOND,
      message: `Successfully registered consumer: ${request.consumerName}`,
    }
  }

  @GrpcMethod('SentimentService', 'AnalyzeSentiment')
  async analyzeSentiment(request: SentimentRequest): Promise<SentimentResponse> {
    const startTime = Date.now()

    // Check rate limit
    const allowed = await this.rateLimiter.checkRateLimit(request.consumerId)
    if (!allowed) {
      throw new RpcException({
        code: 8, // RESOURCE_EXHAUSTED
        message: 'Rate limit exceeded',
      })
    }

    // Random failure simulation (1 in 32 chance)
    if (Math.random() < this.failureRate) {
      this.logger.warn(`Random failure triggered for comment: ${request.commentId.substring(0, 8)}...`)
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Random service failure',
      })
    }

    // Check cache
    const cached = this.cacheService.getCached(request.textHash)
    if (cached) {
      const processingTime = Date.now() - startTime
      this.logger.debug(`Returning cached sentiment for: ${request.commentId.substring(0, 8)}... [${cached.tag}]`)
      
      return {
        commentId: request.commentId,
        tag: cached.tag,
        processingTime,
        cached: true,
      }
    }

    // Simulate processing time based on comment length
    const baseProcessingTime = request.text.length * 2 // 2ms per character
    await new Promise((resolve) => setTimeout(resolve, baseProcessingTime))

    // Analyze sentiment (random for now, in production this would be ML/AI)
    const tag = this.analyzeSentimentLogic(request.text)

    // Cache the result
    this.cacheService.setCached(request.textHash, tag)

    const processingTime = Date.now() - startTime
    
    this.logger.log(`Analyzed sentiment for: ${request.commentId.substring(0, 8)}... [${tag}] in ${processingTime}ms`)

    return {
      commentId: request.commentId,
      tag,
      processingTime,
      cached: false,
    }
  }

  private analyzeSentimentLogic(text: string): CommentTag {
    const lowerText = text.toLowerCase()

    // Positive keywords
    const positiveKeywords = [
      'amazing', 'best', 'love', 'perfect', 'excellent', 'great',
      'outstanding', 'fantastic', 'wonderful', 'delicious', '😍', '❤️',
      'recommend', 'incredible', 'awesome'
    ]

    // Negative keywords
    const negativeKeywords = [
      'terrible', 'worst', 'bad', 'horrible', 'awful', 'disappointing',
      'cold', 'tasteless', 'overpriced', 'rude', 'dirty', 'unacceptable',
      'complaint', 'poisoning', 'waste'
    ]

    // Unrelated keywords
    const unrelatedKeywords = [
      'time', 'close', 'parking', 'blog', 'meet', 'wifi', 'password',
      'reservation', 'online', 'gluten-free', 'follow', 'spam', 'crypto'
    ]

    // Count matches
    let positiveCount = 0
    let negativeCount = 0
    let unrelatedCount = 0

    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) positiveCount++
    })

    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) negativeCount++
    })

    unrelatedKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) unrelatedCount++
    })

    // Determine sentiment
    if (unrelatedCount > 0) {
      return CommentTag.UNRELATED
    }

    if (positiveCount > negativeCount) {
      return CommentTag.POSITIVE
    } else if (negativeCount > positiveCount) {
      return CommentTag.NEGATIVE
    } else {
      return CommentTag.NEUTRAL
    }
  }
}
