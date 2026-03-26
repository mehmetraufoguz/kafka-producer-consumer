import { Injectable, Logger } from '@nestjs/common'
import { Subject, Observable, interval } from 'rxjs'
import { map, share, startWith } from 'rxjs/operators'
import { ProcessedComment } from './entities/processed-comment.entity'

interface SseEvent {
  data: any
  type?: string
  id?: string
  retry?: number
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name)
  private readonly commentSubject = new Subject<ProcessedComment>()
  private readonly commentStream$: Observable<SseEvent>

  constructor() {
    // Create a shared stream that includes heartbeats
    this.commentStream$ = this.commentSubject.asObservable().pipe(
      map((comment) => ({
        data: comment,
        type: 'comment',
      })),
      share() // Make it hot observable
    )
  }

  getCommentStream(): Observable<SseEvent> {
    this.logger.log('New SSE client connected')
    return this.commentStream$
  }

  emitComment(comment: ProcessedComment): void {
    this.commentSubject.next(comment)
    this.logger.debug(`Emitted SSE event for comment: ${comment.commentId.substring(0, 8)}...`)
  }
}
