import { useEffect, useRef, useState } from 'react'
import { SSE_URL, type ProcessedComment, type CommentStatistics } from '../lib/api'
import { useCommentStore } from '../stores/comment-store'
import { useStatisticsStore } from '../stores/statistics-store'

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  
  const addComment = useCommentStore((state) => state.addComment)
  const setConnected = useCommentStore((state) => state.setConnected)
  const updateStatistics = useStatisticsStore((state) => state.updateStatistics)

  useEffect(() => {
    const eventSource = new EventSource(SSE_URL)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
      setConnected(true)
      setError(null)
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      setIsConnected(false)
      setConnected(false)
      setError('Connection lost. Retrying...')
      
      // EventSource will automatically reconnect
    }

    eventSource.addEventListener('comment', (event: MessageEvent) => {
      try {
        const comment: ProcessedComment = JSON.parse(event.data)
        addComment(comment)
      } catch (err) {
        console.error('Error parsing comment event:', err)
      }
    })

    eventSource.addEventListener('statistics', (event: MessageEvent) => {
      try {
        const statistics: CommentStatistics = JSON.parse(event.data)
        updateStatistics(statistics)
      } catch (err) {
        console.error('Error parsing statistics event:', err)
      }
    })

    return () => {
      eventSource.close()
      setIsConnected(false)
      setConnected(false)
    }
  }, [addComment, setConnected, updateStatistics])

  return { isConnected, error }
}
