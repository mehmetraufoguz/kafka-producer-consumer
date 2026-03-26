import { create } from 'zustand'
import type { ProcessedComment } from '../lib/api'

interface CommentStore {
  comments: ProcessedComment[]
  isConnected: boolean
  isInitialLoading: boolean
  loadingProgress: number
  totalToLoad: number
  addComment: (comment: ProcessedComment) => void
  addComments: (comments: ProcessedComment[]) => void
  setComments: (comments: ProcessedComment[]) => void
  setConnected: (connected: boolean) => void
  setInitialLoading: (loading: boolean) => void
  setLoadingProgress: (loaded: number, total: number) => void
  clearComments: () => void
}

export const useCommentStore = create<CommentStore>((set) => ({
  comments: [],
  isConnected: false,
  isInitialLoading: false,
  loadingProgress: 0,
  totalToLoad: 0,
  
  addComment: (comment) =>
    set((state) => {
      // Prevent duplicates based on commentId
      const exists = state.comments.some(c => c.commentId === comment.commentId)
      if (exists) return state
      
      return {
        comments: [comment, ...state.comments],
      }
    }),
  
  addComments: (newComments) =>
    set((state) => {
      // Merge new comments, avoiding duplicates
      const existingIds = new Set(state.comments.map(c => c.commentId))
      const uniqueNew = newComments.filter(c => !existingIds.has(c.commentId))
      
      return {
        comments: [...state.comments, ...uniqueNew],
      }
    }),
  
  setComments: (comments) => set({ comments }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setInitialLoading: (loading) => set({ isInitialLoading: loading }),
  
  setLoadingProgress: (loaded, total) => 
    set({ loadingProgress: loaded, totalToLoad: total }),
  
  clearComments: () => set({ comments: [], loadingProgress: 0, totalToLoad: 0 }),
}))
