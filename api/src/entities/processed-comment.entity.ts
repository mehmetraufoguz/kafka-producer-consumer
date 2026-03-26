import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { CommentTag } from '@repo/shared'

@Entity('processed_comments')
export class ProcessedComment {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  @Index()
  commentId: string

  @Column({ type: 'text' })
  text: string

  @Column()
  @Index()
  textHash: string

  @Column({
    type: 'enum',
    enum: CommentTag,
  })
  @Index()
  tag: CommentTag

  @Column()
  source: string

  @CreateDateColumn()
  @Index()
  processedAt: Date

  @Column()
  consumerId: string

  @Column({ default: 0 })
  retryCount: number
}
