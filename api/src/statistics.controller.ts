import { Controller, Get, Logger } from '@nestjs/common'
import { CommentsService } from './comments.service'

@Controller('api/statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name)

  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getStatistics() {
    this.logger.debug('GET /api/statistics')
    return this.commentsService.getStatistics()
  }
}
