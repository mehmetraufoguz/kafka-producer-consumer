import { Controller, Sse, Logger } from '@nestjs/common'
import { Observable, interval, merge } from 'rxjs'
import { map } from 'rxjs/operators'
import { SseService } from './sse.service'

@Controller('api/sse')
export class SseController {
  private readonly logger = new Logger(SseController.name)

  constructor(private readonly sseService: SseService) {}

  @Sse('comments')
  streamComments(): Observable<any> {
    this.logger.log('New SSE client connected to /api/sse/comments')
    
    // Create a heartbeat to keep connection alive
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: 'heartbeat' }, type: 'heartbeat' }))
    )
    
    // Merge comment stream with heartbeat
    return merge(
      this.sseService.getCommentStream(),
      heartbeat$
    )
  }
}
