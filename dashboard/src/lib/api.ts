import axios from 'axios'
import type { ProcessedComment } from './comments-collection'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface CommentTag {
  POSITIVE: 'positive'
  NEGATIVE: 'negative'
  NEUTRAL: 'neutral'
  UNRELATED: 'unrelated'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CommentStatistics {
  total: number
  byTag: {
    positive: number
    negative: number
    neutral: number
    unrelated: number
  }
  recentCount: number
}

export const commentsApi = {
  getComments: async (params: {
    page?: number
    pageSize?: number
    tag?: string
    search?: string
  }): Promise<PaginatedResponse<ProcessedComment>> => {
    const response = await apiClient.get('/api/comments', { params })
    return response.data
  },

  getStatistics: async (): Promise<CommentStatistics> => {
    const response = await apiClient.get('/api/statistics')
    return response.data
  },
}

export const SSE_URL = `${API_BASE_URL}/api/sse/comments`
