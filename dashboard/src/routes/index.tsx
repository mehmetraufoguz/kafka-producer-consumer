import { createFileRoute } from '@tanstack/react-router'
import { useSSE } from '../hooks/useSSE'
import { useInitialDataLoad } from '../hooks/useInitialDataLoad'
import { useStatisticsStore } from '../stores/statistics-store'
import { StatisticsCharts } from '#/components/StatisticsCharts'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Activity, TrendingUp, MessageSquare, Clock, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  // Connect to SSE for real-time updates
  const { isConnected } = useSSE()
  
  // Load initial data in chunks on mount
  useInitialDataLoad()
  
  // Use Zustand store for statistics (loaded initially and updated via SSE)
  const statistics = useStatisticsStore((state) => state.statistics)
  const isLoading = useStatisticsStore((state) => state.isInitialLoading)

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="mb-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="display-title mb-3 text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
                Restaurant Comment Analytics
              </h1>
              <p className="mb-4 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
                Real-time sentiment analysis powered by Kafka microservices
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-sm">
              <Activity
                className={`h-4 w-4 ${isConnected ? 'text-green-500 animate-pulse' : 'text-red-500'}`}
              />
              <span className="text-sm font-medium">
                {isConnected ? 'Live Stream Active' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--sea-ink-soft)]" />
              <p className="text-[var(--sea-ink-soft)]">Loading statistics...</p>
            </div>
          </div>
        ) : statistics ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Comments
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All processed comments
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Positive
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.byTag.positive.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.total > 0 
                      ? `${((statistics.byTag.positive / statistics.total) * 100).toFixed(1)}%` 
                      : '0%'} of total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Negative
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.byTag.negative.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.total > 0 
                      ? `${((statistics.byTag.negative / statistics.total) * 100).toFixed(1)}%` 
                      : '0%'} of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Hour
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.recentCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recently processed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <StatisticsCharts statistics={statistics} />

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/comments"
                className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
              >
                View All Comments
              </a>
              <a
                href="/about"
                className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
              >
                About This Project
              </a>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
