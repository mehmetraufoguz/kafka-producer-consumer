import { useEffect, useRef } from 'react'
import { commentsApi } from '../lib/api'
import { useCommentStore } from '../stores/comment-store'
import { useStatisticsStore } from '../stores/statistics-store'

const CHUNK_SIZE = 100 // Load 100 comments per chunk

export function useInitialDataLoad() {
  const hasLoadedRef = useRef(false)
  
  const addComments = useCommentStore((state) => state.addComments)
  const setInitialLoading = useCommentStore((state) => state.setInitialLoading)
  const setLoadingProgress = useCommentStore((state) => state.setLoadingProgress)
  
  const setStatistics = useStatisticsStore((state) => state.setStatistics)
  const setStatsLoading = useStatisticsStore((state) => state.setInitialLoading)

  useEffect(() => {
    // Only load once per session
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    async function loadInitialData() {
      try {
        // Load statistics first
        setStatsLoading(true)
        const stats = await commentsApi.getStatistics()
        setStatistics(stats)

        // Start loading comments in chunks
        setInitialLoading(true)
        
        // Get first chunk to determine total
        const firstChunk = await commentsApi.getComments({
          page: 1,
          pageSize: CHUNK_SIZE,
        })

        addComments(firstChunk.data)
        setLoadingProgress(firstChunk.data.length, firstChunk.total)

        // Load remaining chunks in parallel (limit concurrency to 3)
        const totalPages = firstChunk.totalPages
        const maxConcurrent = 3
        
        for (let i = 2; i <= totalPages; i += maxConcurrent) {
          const pagePromises = []
          
          for (let j = 0; j < maxConcurrent && (i + j) <= totalPages; j++) {
            pagePromises.push(
              commentsApi.getComments({
                page: i + j,
                pageSize: CHUNK_SIZE,
              })
            )
          }
          
          const chunks = await Promise.all(pagePromises)
          
          chunks.forEach(chunk => {
            addComments(chunk.data)
          })
          
          // Update progress
          const loaded = Math.min(i + maxConcurrent - 1, totalPages) * CHUNK_SIZE
          setLoadingProgress(Math.min(loaded, firstChunk.total), firstChunk.total)
          
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        setInitialLoading(false)
      } catch (error) {
        console.error('Error loading initial data:', error)
        setInitialLoading(false)
        setStatsLoading(false)
      }
    }

    loadInitialData()
  }, [addComments, setInitialLoading, setLoadingProgress, setStatistics, setStatsLoading])
}
