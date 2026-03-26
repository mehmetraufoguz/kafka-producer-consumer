import { Injectable, Logger } from '@nestjs/common'
import { LRUCache } from 'lru-cache'
import { createHash } from 'crypto'
import { CACHE_CONFIG } from '@repo/shared'

interface CachedSentiment {
  tag: string
  timestamp: number
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private readonly textHashCache: LRUCache<string, CachedSentiment>

  constructor() {
    const cacheSize = parseInt(
      process.env.CONSUMER_CACHE_SIZE || String(CACHE_CONFIG.CONSUMER_TEXT_HASH_SIZE),
    )

    this.textHashCache = new LRUCache<string, CachedSentiment>({
      max: cacheSize,
      ttl: 1000 * 60 * 60, // 1 hour
    })

    this.logger.log(`Initialized LRU cache with size: ${cacheSize}`)
  }

  hashText(text: string): string {
    return createHash('sha256').update(text.toLowerCase().trim()).digest('hex')
  }

  getCachedSentiment(textHash: string): CachedSentiment | undefined {
    return this.textHashCache.get(textHash)
  }

  setCachedSentiment(textHash: string, tag: string): void {
    this.textHashCache.set(textHash, {
      tag,
      timestamp: Date.now(),
    })
  }

  getCacheStats() {
    return {
      size: this.textHashCache.size,
      maxSize: this.textHashCache.max,
    }
  }
}
