import { Injectable, Logger } from '@nestjs/common'
import { LRUCache } from 'lru-cache'
import { CommentTag, CACHE_CONFIG } from '@repo/shared'

interface CachedAnalysis {
  tag: CommentTag
  timestamp: number
}

@Injectable()
export class SentimentCacheService {
  private readonly logger = new Logger(SentimentCacheService.name)
  private readonly analysisCache: LRUCache<string, CachedAnalysis>

  constructor() {
    const cacheSize = parseInt(
      process.env.SENTIMENT_CACHE_SIZE || String(CACHE_CONFIG.SENTIMENT_ANALYSIS_SIZE),
    )

    this.analysisCache = new LRUCache<string, CachedAnalysis>({
      max: cacheSize,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
    })

    this.logger.log(`Initialized sentiment cache with size: ${cacheSize}`)
  }

  getCached(textHash: string): CachedAnalysis | undefined {
    return this.analysisCache.get(textHash)
  }

  setCached(textHash: string, tag: CommentTag): void {
    this.analysisCache.set(textHash, {
      tag,
      timestamp: Date.now(),
    })
  }

  getCacheStats() {
    return {
      size: this.analysisCache.size,
      maxSize: this.analysisCache.max,
    }
  }
}
