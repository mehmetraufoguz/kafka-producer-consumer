export const KAFKA_TOPICS = {
  RAW_COMMENTS: 'raw-comments',
  PROCESSED_COMMENTS: 'processed-comments',
  RETRY_QUEUE: 'retry-queue',
  DEAD_LETTER_QUEUE: 'dead-letter-queue',
} as const

export const KAFKA_CONSUMER_GROUPS = {
  CONSUMER: 'consumer-group',
  API: 'api-group',
} as const

export const REDIS_KEYS = {
  PROCESSED_COMMENT: (commentId: string) => `processed:${commentId}`,
  RATE_LIMIT: (consumerId: string) => `rate:${consumerId}`,
} as const

export const CACHE_CONFIG = {
  CONSUMER_TEXT_HASH_SIZE: 100,
  SENTIMENT_ANALYSIS_SIZE: 500,
  REDIS_TTL_SECONDS: 10800, // 3 hours
} as const

export const RATE_LIMITS = {
  SENTIMENT_AUTHENTICATED_PER_SECOND: 100,
  SENTIMENT_UNAUTHENTICATED_PER_SECOND: 10,
  SENTIMENT_FAILURE_PROBABILITY: 1 / 32,
} as const

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 5,
  INITIAL_DELAY: 1000, // milliseconds
  BACKOFF_MULTIPLIER: 2,
} as const
