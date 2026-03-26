'use client'

import { createFileRoute } from '@tanstack/react-router'
import { CommentsTable } from '#/components/CommentsTable'
import { useSSE } from '#/hooks/useSSE'
import { Activity } from 'lucide-react'

export const Route = createFileRoute('/comments')({
  component: CommentsPage,
  ssr: false
})

function CommentsPage() {
  const { isConnected } = useSSE()

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Restaurant Comments
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-time comment monitoring and sentiment analysis
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <Activity
            className={`h-4 w-4 ${isConnected ? 'text-green-500 animate-pulse' : 'text-red-500'}`}
          />
          <span className="text-sm font-medium">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <CommentsTable />
    </main>
  )
}
