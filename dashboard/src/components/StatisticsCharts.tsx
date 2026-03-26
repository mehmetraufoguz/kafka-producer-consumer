import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import type { CommentStatistics } from '#/lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface StatisticsChartsProps {
  statistics: CommentStatistics
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
  unrelated: '#eab308',
}

export function StatisticsCharts({ statistics }: StatisticsChartsProps) {
  const pieData = [
    { name: 'Positive', value: statistics.byTag.positive, color: COLORS.positive },
    { name: 'Negative', value: statistics.byTag.negative, color: COLORS.negative },
    { name: 'Neutral', value: statistics.byTag.neutral, color: COLORS.neutral },
    { name: 'Unrelated', value: statistics.byTag.unrelated, color: COLORS.unrelated },
  ].filter(item => item.value > 0)

  const barData = [
    { tag: 'Positive', count: statistics.byTag.positive },
    { tag: 'Negative', count: statistics.byTag.negative },
    { tag: 'Neutral', count: statistics.byTag.neutral },
    { tag: 'Unrelated', count: statistics.byTag.unrelated },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comment Counts by Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tag" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f8fb8">
                {barData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.tag.toLowerCase() as keyof typeof COLORS]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
