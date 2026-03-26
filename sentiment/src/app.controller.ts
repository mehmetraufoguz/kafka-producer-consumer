import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { SentimentCacheService } from './sentiment-cache.service'
import { RateLimiterService } from './rate-limiter.service'
import { RegistrationService } from './registration.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: SentimentCacheService,
    private readonly rateLimiter: RateLimiterService,
    private readonly registrationService: RegistrationService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      service: 'sentiment-grpc',
      cache: this.cacheService.getCacheStats(),
      rateLimiter: this.rateLimiter.getStats(),
      registration: this.registrationService.getStats(),
      timestamp: new Date().toISOString(),
    }
  }
}
