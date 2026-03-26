import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindOptionsWhere, ILike } from 'typeorm'
import { ProcessedComment } from './entities/processed-comment.entity'
import { CommentTag, PaginatedResponse, CommentStatistics } from '@repo/shared'

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name)

  constructor(
    @InjectRepository(ProcessedComment)
    private readonly commentRepository: Repository<ProcessedComment>,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 20,
    tag?: CommentTag,
    search?: string,
  ): Promise<PaginatedResponse<ProcessedComment>> {
    const skip = (page - 1) * pageSize

    const where: FindOptionsWhere<ProcessedComment> = {}

    if (tag) {
      where.tag = tag
    }

    if (search) {
      where.text = ILike(`%${search}%`)
    }

    const [data, total] = await this.commentRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: {
        processedAt: 'DESC',
      },
    })

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async getStatistics(): Promise<CommentStatistics> {
    const total = await this.commentRepository.count()

    // Get counts by tag
    const tagCounts = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.tag', 'tag')
      .addSelect('COUNT(*)', 'count')
      .groupBy('comment.tag')
      .getRawMany()

    const byTag = {
      [CommentTag.POSITIVE]: 0,
      [CommentTag.NEGATIVE]: 0,
      [CommentTag.NEUTRAL]: 0,
      [CommentTag.UNRELATED]: 0,
    }

    tagCounts.forEach((row) => {
      byTag[row.tag as CommentTag] = parseInt(row.count)
    })

    // Get recent count (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await this.commentRepository.count({
      where: {
        processedAt: new Date(oneHourAgo.getTime()),
      },
    })

    return {
      total,
      byTag,
      recentCount,
    }
  }

  async saveComment(comment: ProcessedComment): Promise<ProcessedComment> {
    try {
      const saved = await this.commentRepository.save(comment)
      this.logger.log(`Saved comment: ${saved.commentId.substring(0, 8)}... [${saved.tag}]`)
      return saved
    } catch (error) {
      this.logger.error(`Failed to save comment: ${error.message}`)
      throw error
    }
  }
}
