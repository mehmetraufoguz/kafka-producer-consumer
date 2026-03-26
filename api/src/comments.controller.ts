import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Logger } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CommentTag } from '@repo/shared'

@Controller('api/comments')
export class CommentsController {
  private readonly logger = new Logger(CommentsController.name)

  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('tag') tag?: CommentTag,
    @Query('search') search?: string,
  ) {
    this.logger.debug(`GET /api/comments - page: ${page}, pageSize: ${pageSize}, tag: ${tag}, search: ${search}`)
    
    return this.commentsService.findAll(page, pageSize, tag, search)
  }
}
