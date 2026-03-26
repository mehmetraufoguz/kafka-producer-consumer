import { Injectable, Logger, MessageEvent } from '@nestjs/common'
import { Subject, Observable } from 'rxjs'
import { ProcessedComment } from './entities/processed-comment.entity'

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name)
  private readonly commentSubject = new Subject<MessageEvent>()

  getCommentStream(): Observable<MessageEvent> {
    return this.commentSubject.asObservable()
  }

  emitComment(comment: ProcessedComment): void {
    const event: MessageEvent = {
      data: comment,
      type: 'comment',
    }
    
    this.commentSubject.next(event)
    this.logger.debug(`Emitted SSE event for comment: ${comment.commentId.substring(0, 8)}...`)
  }

  emitStatisticsUpdate(statistics: any): void {
    const event: MessageEvent = {
      data: statistics,
      type: 'statistics',
    }
    
    this.commentSubject.next(event)
    this.logger.debug('Emitted SSE event for statistics update')
  }
}
