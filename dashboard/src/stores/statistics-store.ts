import { create } from 'zustand'
import type { CommentStatistics } from '../lib/api'

interface StatisticsStore {
  statistics: CommentStatistics | null
  isInitialLoading: boolean
  setStatistics: (statistics: CommentStatistics) => void
  updateStatistics: (statistics: CommentStatistics) => void
  setInitialLoading: (loading: boolean) => void
}

export const useStatisticsStore = create<StatisticsStore>((set) => ({
  statistics: null,
  isInitialLoading: false,
  
  setStatistics: (statistics) => set({ statistics, isInitialLoading: false }),
  
  updateStatistics: (statistics) => set({ statistics }),
  
  setInitialLoading: (loading) => set({ isInitialLoading: loading }),
}))
