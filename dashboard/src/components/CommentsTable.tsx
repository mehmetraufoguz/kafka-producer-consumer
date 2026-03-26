import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type FilterFn,
  flexRender,
} from '@tanstack/react-table'
import { type ProcessedComment } from '#/lib/api'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react'
import { useCommentStore } from '#/stores/comment-store'

// Simple fuzzy filter to satisfy type augmentation from demo/table.tsx
const fuzzyFilter: FilterFn<any> = (row, columnId, value) => {
  const itemValue = row.getValue(columnId)
  return String(itemValue).toLowerCase().includes(String(value).toLowerCase())
}

export function CommentsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'processedAt', desc: true } // Sort by newest first
  ])
  const [tagFilter, setTagFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Get all comments from store
  const allComments = useCommentStore((state) => state.comments)
  const isInitialLoading = useCommentStore((state) => state.isInitialLoading)
  const loadingProgress = useCommentStore((state) => state.loadingProgress)
  const totalToLoad = useCommentStore((state) => state.totalToLoad)

  // Client-side filtering
  const filteredComments = useMemo(() => {
    let filtered = [...allComments]

    // Filter by tag
    if (tagFilter) {
      filtered = filtered.filter(c => c.tag === tagFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.text.toLowerCase().includes(query) ||
        c.commentId.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [allComments, tagFilter, searchQuery])

  const columns = useMemo<ColumnDef<ProcessedComment>[]>(
    () => [
      {
        accessorKey: 'commentId',
        header: 'ID',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            {row.original.commentId.substring(0, 8)}...
          </div>
        ),
      },
      {
        accessorKey: 'text',
        header: 'Comment',
        cell: ({ row }) => (
          <div className="max-w-md truncate">{row.original.text}</div>
        ),
      },
      {
        accessorKey: 'tag',
        header: 'Sentiment',
        cell: ({ row }) => {
          const tag = row.original.tag
          const variantMap: Record<string, any> = {
            positive: 'default',
            negative: 'destructive',
            neutral: 'secondary',
            unrelated: 'outline',
          }
          return (
            <Badge variant={variantMap[tag]} className="capitalize">
              {tag}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <div className="capitalize">{row.original.source}</div>
        ),
      },
      {
        accessorKey: 'processedAt',
        header: 'Processed At',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            {new Date(row.original.processedAt).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: 'retryCount',
        header: 'Retries',
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.retryCount || 0}
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filteredComments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: {
      fuzzy: fuzzyFilter, // Required by global type augmentation
    },
  })

  return (
    <div className="space-y-4">
      {/* Loading Progress */}
      {isInitialLoading && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-900 dark:text-blue-100">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <div className="flex-1">
              <div className="font-medium mb-1">Loading comments...</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {loadingProgress} / {totalToLoad} comments loaded
              </div>
              <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(loadingProgress / totalToLoad) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={tagFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTagFilter('')}
          >
            All ({allComments.length})
          </Button>
          <Button
            variant={tagFilter === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTagFilter('positive')}
          >
            Positive ({allComments.filter(c => c.tag === 'positive').length})
          </Button>
          <Button
            variant={tagFilter === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTagFilter('negative')}
          >
            Negative ({allComments.filter(c => c.tag === 'negative').length})
          </Button>
          <Button
            variant={tagFilter === 'neutral' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTagFilter('neutral')}
          >
            Neutral ({allComments.filter(c => c.tag === 'neutral').length})
          </Button>
          <Button
            variant={tagFilter === 'unrelated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTagFilter('unrelated')}
          >
            Unrelated ({allComments.filter(c => c.tag === 'unrelated').length})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isInitialLoading && allComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading comments...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            filteredComments.length
          )} of {filteredComments.length} results
          {searchQuery || tagFilter ? ` (filtered from ${allComments.length} total)` : ''}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-2 px-3 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
