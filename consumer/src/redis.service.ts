import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_KEYS, CACHE_CONFIG } from '@repo/shared'

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis

  async onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    this.client.on('connect', () => {
      this.logger.log('Redis connected')
    })

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err}`)
    })
  }

  async isCommentProcessed(commentId: string): Promise<boolean> {
    const key = REDIS_KEYS.PROCESSED_COMMENT(commentId)
    const exists = await this.client.exists(key)
    return exists === 1
  }

  async markCommentAsProcessed(commentId: string): Promise<void> {
    const key = REDIS_KEYS.PROCESSED_COMMENT(commentId)
    const ttl = parseInt(process.env.REDIS_TTL || String(CACHE_CONFIG.REDIS_TTL_SECONDS))
    await this.client.setex(key, ttl, '1')
  }

  async incrementRateLimit(consumerId: string): Promise<number> {
    const key = REDIS_KEYS.RATE_LIMIT(consumerId)
    const count = await this.client.incr(key)
    
    // Set expiration on first increment
    if (count === 1) {
      await this.client.expire(key, 1) // 1 second window
    }
    
    return count
  }

  getClient(): Redis {
    return this.client
  }
}
