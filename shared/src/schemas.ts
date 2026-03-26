import { z } from 'zod'
import { CommentTag } from './types'

export const RawCommentSchema = z.object({
  commentId: z.string().min(1),
  text: z.string().min(1),
  timestamp: z.number(),
  source: z.string().min(1),
})

export const RetryContextSchema = z.object({
  comment: RawCommentSchema,
  attempts: z.number().int().min(0),
  lastError: z.string().optional(),
  scheduledTime: z.number().optional(),
})

export type RawCommentParsed = z.infer<typeof RawCommentSchema>
export type RetryContextParsed = z.infer<typeof RetryContextSchema>
