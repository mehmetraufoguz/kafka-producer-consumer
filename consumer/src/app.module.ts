import { Module } from '@nestjs/common'
import { DatabaseModule } from './database.module'
import { KafkaModule } from './kafka.module'
import { RedisService } from './redis.service'
import { CacheService } from './cache.service'
import { SentimentClient } from './sentiment-client.service'
import { ConsumerService } from './consumer.service'

@Module({
  imports: [DatabaseModule, KafkaModule],
  controllers: [ConsumerService],
  providers: [RedisService, CacheService, SentimentClient],
})
export class AppModule {}
