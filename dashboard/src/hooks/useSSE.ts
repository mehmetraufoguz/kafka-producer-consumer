'use client'

import { useEffect, useRef, useState } from 'react'
import { SSE_URL } from '../lib/api'
import { commentsCollection, processedCommentSchema } from '../lib/comments-collection'

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(SSE_URL)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
      setError(null)
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      setIsConnected(false)
      setError('Connection lost. Retrying...')
      
      // EventSource will automatically reconnect
    }

    eventSource.addEventListener('comment', (event: MessageEvent) => {
      try {
        console.log(event);
        const rawComment = JSON.parse(event.data)
        // Validate and transform with schema
        const comment = processedCommentSchema.parse(rawComment)
        // Insert into TanStack DB collection - will automatically persist to localStorage
        // All components using useLiveQuery will automatically update
        commentsCollection.insert(comment)
      } catch (err) {
        console.error('Error parsing comment event:', err)
      }
    })

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [])

  return { isConnected, error }
}
