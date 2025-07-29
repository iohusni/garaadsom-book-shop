'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface TransactionData {
  date: string
  gained: number
  spent: number
  net: number
}

interface UserStats {
  name: string
  totalGained: number
  totalSpent: number
  netAmount: number
}

interface AnalyticsChartProps {
  transactionData: TransactionData[]
  userStats: UserStats[]
  totalGained: number
  totalSpent: number
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

export default function AnalyticsChart({
  transactionData,
  userStats,
  totalGained,
  totalSpent,
}: AnalyticsChartProps) {
  const pieData = [
    { name: 'Total Gained', value: totalGained, color: '#10b981' },
    { name: 'Total Spent', value: totalSpent, color: '#ef4444' },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Transaction Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar dataKey="gained" fill="#10b981" name="Gained" />
              <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Bar dataKey="totalGained" fill="#10b981" name="Gained" />
              <Bar dataKey="totalSpent" fill="#ef4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overall Summary Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Net Amount by User */}
      <Card>
        <CardHeader>
          <CardTitle>Net Amount by User</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Bar
                dataKey="netAmount"
                fill={(entry) => (entry.netAmount >= 0 ? '#10b981' : '#ef4444')}
                name="Net Amount"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
