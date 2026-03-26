import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SentimentController } from './sentiment.controller'
import { SentimentCacheService } from './sentiment-cache.service'
import { RateLimiterService } from './rate-limiter.service'
import { RegistrationService } from './registration.service'

@Module({
  imports: [],
  controllers: [AppController, SentimentController],
  providers: [AppService, SentimentCacheService, RateLimiterService, RegistrationService],
})
export class AppModule {}
