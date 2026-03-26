'use client'

import { useEffect, useRef, useState } from 'react'
import { commentsApi } from '#/lib/api'
import { commentsCollection } from '#/lib/comments-collection'

const CHUNK_SIZE = 100 // Load 100 comments per chunk

export interface LoadingProgress {
  isLoading: boolean
  loaded: number
  total: number
  error: string | null
}

export function useCommentsDataLoader() {
  const hasLoadedRef = useRef(false)
  const [progress, setProgress] = useState<LoadingProgress>({
    isLoading: false,
    loaded: 0,
    total: 0,
    error: null,
  })

  useEffect(() => {
    // Only load once per session
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    async function loadCommentsInBatches() {
      try {
        setProgress(prev => ({ ...prev, isLoading: true, error: null }))
        
        // Get first chunk to determine total
        const firstChunk = await commentsApi.getComments({
          page: 1,
          pageSize: CHUNK_SIZE,
        })

        // Insert first batch into collection
        firstChunk.data.forEach(comment => {
          commentsCollection.insert(comment)
        })
        
        setProgress({
          isLoading: true,
          loaded: firstChunk.data.length,
          total: firstChunk.total,
          error: null,
        })

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
          
          // Insert all comments from this batch
          chunks.forEach(chunk => {
            chunk.data.forEach(comment => {
              commentsCollection.insert(comment)
            })
          })
          
          // Update progress
          const loaded = Math.min(i + maxConcurrent - 1, totalPages) * CHUNK_SIZE
          setProgress({
            isLoading: true,
            loaded: Math.min(loaded, firstChunk.total),
            total: firstChunk.total,
            error: null,
          })
          
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        setProgress(prev => ({ ...prev, isLoading: false }))
      } catch (error) {
        console.error('Error loading initial data:', error)
        setProgress(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load comments',
        }))
      }
    }

    loadCommentsInBatches()
  }, [])

  return progress
}
