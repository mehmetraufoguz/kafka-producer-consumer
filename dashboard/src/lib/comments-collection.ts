import { createCollection } from '@tanstack/react-db'
import { localStorageCollectionOptions } from '@tanstack/react-db'
import { z } from 'zod'

// Schema for processed comments
export const processedCommentSchema = z.object({
  id: z.number(),
  commentId: z.string(),
  text: z.string(),
  textHash: z.string(),
  tag: z.enum(['positive', 'negative', 'neutral', 'unrelated']),
  processedAt: z.union([z.string(), z.date()])
    .transform(val => typeof val === 'string' ? new Date(val) : val),
  consumerId: z.string(),
  source: z.string(),
  retryCount: z.number(),
})

export type ProcessedComment = z.infer<typeof processedCommentSchema>

// Create the comments collection with localStorage persistence
export const commentsCollection = createCollection(
  localStorageCollectionOptions({
    id: 'processed-comments',
    storageKey: 'kafka-dashboard-comments',
    getKey: (item) => item.commentId, // Use commentId as unique key
    schema: processedCommentSchema,
  })
)
