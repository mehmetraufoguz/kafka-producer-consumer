import { Module } from '@nestjs/common'
import { KafkaModule } from './kafka.module'
import { CommentGeneratorService } from './comment-generator.service'
import { ProducerService } from './producer.service'

@Module({
  imports: [KafkaModule],
  controllers: [],
  providers: [CommentGeneratorService, ProducerService],
})
export class AppModule {}
