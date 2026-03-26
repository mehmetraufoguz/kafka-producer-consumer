export enum CommentTag {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  UNRELATED = 'unrelated',
}

export interface RawComment {
  commentId: string
  text: string
  timestamp: number
  source: string // e.g., 'twitter', 'instagram', 'facebook'
}

export interface ProcessedComment {
  id?: number
  commentId: string
  text: string
  textHash: string
  tag: CommentTag
  processedAt: Date
  consumerId: string
  source: string
  retryCount?: number
}

export interface RegisterRequest {
  consumerName: string
}

export interface RegisterResponse {
  consumerId: string
  rateLimit: number
  message: string
}

export interface SentimentRequest {
  commentId: string
  text: string
  textHash: string
  consumerId: string
}

export interface SentimentResponse {
  commentId: string
  tag: CommentTag
  processingTime: number
  cached: boolean
}

export interface CommentStatistics {
  total: number
  byTag: {
    [key in CommentTag]: number
  }
  recentCount: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
