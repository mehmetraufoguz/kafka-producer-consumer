import { Controller, Logger } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { SseService } from './sse.service'
import { ProcessedComment } from './entities/processed-comment.entity'
import { KAFKA_TOPICS, ProcessedCommentSchema } from '@repo/shared'

@Controller()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name)

  constructor(
    private readonly sseService: SseService,
  ) {}

  @EventPattern(KAFKA_TOPICS.PROCESSED_COMMENTS)
  async handleProcessedComment(@Payload() message: any) {
    try {
      // @Payload() already extracts the value from Kafka message
      let commentData = message
      if (typeof commentData === 'string') {
        commentData = JSON.parse(commentData)
      }
      
      // Validate with schema
      const parsed = ProcessedCommentSchema.safeParse(commentData)
      if (!parsed.success) {
        return
      }
      
      const comment = parsed.data as ProcessedComment
      
      this.logger.log(`Received processed comment: ${comment.commentId.substring(0, 8)}... [${comment.tag}]`)

      // Comment is already saved by consumer service, just emit to SSE clients
      this.sseService.emitComment(comment)

    } catch (error) {
      this.logger.error(`Error handling processed comment: ${error.message}`, error.stack)
      // Re-throw to let Kafka handle retry based on consumer config
      throw error
    }
  }
}
