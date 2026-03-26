import { Injectable, Logger } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { CommentsService } from './comments.service'
import { SseService } from './sse.service'
import { ProcessedComment } from './entities/processed-comment.entity'
import { KAFKA_TOPICS } from '@repo/shared'

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name)

  constructor(
    private readonly commentsService: CommentsService,
    private readonly sseService: SseService,
  ) {}

  @EventPattern(KAFKA_TOPICS.PROCESSED_COMMENTS)
  async handleProcessedComment(@Payload() message: any) {
    try {
      const comment = message.value as ProcessedComment
      
      this.logger.log(`Received processed comment: ${comment.commentId.substring(0, 8)}... [${comment.tag}]`)

      // Save to database
      const saved = await this.commentsService.saveComment(comment)

      // Emit to SSE clients
      this.sseService.emitComment(saved)

    } catch (error) {
      this.logger.error(`Error handling processed comment: ${error.message}`, error.stack)
    }
  }
}
