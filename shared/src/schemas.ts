import { z } from 'zod'
import { CommentTag } from './types'

export const RawCommentSchema = z.object({
  commentId: z.string().min(1),
  text: z.string().min(1),
  timestamp: z.number(),
  source: z.string().min(1),
})

export const ProcessedCommentSchema = z.object({
  id: z.number().optional(),
  commentId: z.string().min(1),
  text: z.string().min(1),
  textHash: z.string().min(1),
  tag: z.nativeEnum(CommentTag),
  processedAt: z.coerce.date(),
  consumerId: z.string().min(1),
  source: z.string().min(1),
  retryCount: z.number().int().min(0).optional().default(0),
})

export const RetryContextSchema = z.object({
  comment: RawCommentSchema,
  attempts: z.number().int().min(0),
  lastError: z.string().optional(),
  scheduledTime: z.number().optional(),
})

export type RawCommentParsed = z.infer<typeof RawCommentSchema>
export type ProcessedCommentParsed = z.infer<typeof ProcessedCommentSchema>
export type RetryContextParsed = z.infer<typeof RetryContextSchema>
