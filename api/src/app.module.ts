import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database.module'
import { KafkaModule } from './kafka.module'
import { CommentsService } from './comments.service'
import { CommentsController } from './comments.controller'
import { StatisticsController } from './statistics.controller'
import { SseController } from './sse.controller'
import { SseService } from './sse.service'
import { KafkaConsumerService } from './kafka-consumer.service'

@Module({
  imports: [DatabaseModule, KafkaModule],
  controllers: [AppController, CommentsController, StatisticsController, SseController],
  providers: [AppService, CommentsService, SseService, KafkaConsumerService],
})
export class AppModule {}
