import { Injectable, Logger } from '@nestjs/common'
import { RATE_LIMITS } from '@repo/shared'
import { RegistrationService } from './registration.service'

interface RateLimitEntry {
  count: number
  resetTime: number
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name)
  private readonly limits = new Map<string, RateLimitEntry>()
  private readonly authenticatedRateLimit: number
  private readonly unauthenticatedRateLimit: number

  constructor(private readonly registrationService: RegistrationService) {
    this.authenticatedRateLimit = parseInt(
      process.env.SENTIMENT_AUTH_RATE_LIMIT || String(RATE_LIMITS.SENTIMENT_AUTHENTICATED_PER_SECOND),
    )
    this.unauthenticatedRateLimit = parseInt(
      process.env.SENTIMENT_UNAUTH_RATE_LIMIT || String(RATE_LIMITS.SENTIMENT_UNAUTHENTICATED_PER_SECOND),
    )
    this.logger.log(`Rate limits - Authenticated: ${this.authenticatedRateLimit}/sec, Unauthenticated: ${this.unauthenticatedRateLimit}/sec`)

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  async checkRateLimit(consumerId: string): Promise<boolean> {
    const now = Date.now()
    const entry = this.limits.get(consumerId)
    
    // Determine rate limit based on registration status
    const isRegistered = this.registrationService.isRegistered(consumerId)
    const rateLimit = isRegistered ? this.authenticatedRateLimit : this.unauthenticatedRateLimit
    
    if (!isRegistered) {
      this.logger.debug(`Unauthenticated request from: ${consumerId.substring(0, 8)}... (${this.unauthenticatedRateLimit}/sec limit)`)
    }

    if (!entry || now > entry.resetTime) {
      // New window
      this.limits.set(consumerId, {
        count: 1,
        resetTime: now + 1000, // 1 second window
      })
      return true
    }

    if (entry.count >= rateLimit) {
      const status = isRegistered ? 'registered' : 'unregistered'
      this.logger.warn(`Rate limit exceeded for ${status} consumer: ${consumerId.substring(0, 8)}... (${entry.count}/${rateLimit})`)
      return false
    }

    entry.count++
    return true
  }

  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime + 60000) {
        // Remove entries older than 1 minute
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.limits.delete(key))
    
    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} old rate limit entries`)
    }
  }

  getStats() {
    return {
      activeConsumers: this.limits.size,
      authenticatedRateLimit: this.authenticatedRateLimit,
      unauthenticatedRateLimit: this.unauthenticatedRateLimit,
    }
  }
}
