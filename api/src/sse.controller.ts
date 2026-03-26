import { Controller, Sse, Logger, MessageEvent } from '@nestjs/common'
import { Observable } from 'rxjs'
import { SseService } from './sse.service'

@Controller('api/sse')
export class SseController {
  private readonly logger = new Logger(SseController.name)

  constructor(private readonly sseService: SseService) {}

  @Sse('comments')
  streamComments(): Observable<MessageEvent> {
    this.logger.log('New SSE client connected to /api/sse/comments')
    return this.sseService.getCommentStream()
  }
}
