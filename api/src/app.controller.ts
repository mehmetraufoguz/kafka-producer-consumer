import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { CommentsService } from './comments.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  async getHealth() {
    const statistics = await this.commentsService.getStatistics()
    
    return {
      status: 'healthy',
      service: 'api',
      statistics,
      timestamp: new Date().toISOString(),
    }
  }
}
