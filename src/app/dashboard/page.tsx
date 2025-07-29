import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Bell,
  Clock,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import NotificationBanner from '@/components/ui/notification-banner'
import AnalyticsChart from '@/components/dashboard/analytics-chart'
import { BookScheduler } from '@/lib/scheduler'

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  // Fetch dashboard data
  const [
    totalBooks,
    activeBooks,
    totalUsers,
    activeUsers,
    totalTransactions,
    recentTransactions,
    overdueBooks,
    upcomingBooks,
    userStats,
    transactionData,
  ] = await Promise.all([
    db.book.count(),
    db.book.count({ where: { status: 'ACTIVE' } }),
    db.user.count(),
    db.user.count({ where: { status: 'ACTIVE' } }),
    db.transaction.count(),
    db.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        book: { select: { title: true } },
      },
    }),
    BookScheduler.getOverdueBooks(),
    BookScheduler.getUpcomingBooks(),
    db.user.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
    }),
    db.transaction.findMany({
      orderBy: { transactionDate: 'desc' },
      take: 10,
    }),
  ])

  // Calculate total gains and spending
  const transactionStats = await db.transaction.aggregate({
    _sum: {
      amountGained: true,
      amountSpent: true,
    },
  })

  const totalGained = transactionStats._sum.amountGained || 0
  const totalSpent = transactionStats._sum.amountSpent || 0
  const netAmount = totalGained - totalSpent

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notifications */}
        {overdueBooks.length > 0 && (
          <NotificationBanner
            type="warning"
            title="Overdue Books"
            message={`${overdueBooks.length} book(s) have passed their end date and need to be closed.`}
          />
        )}

        {upcomingBooks.length > 0 && (
          <NotificationBanner
            type="info"
            title="Upcoming Books"
            message={`${upcomingBooks.length} book(s) are scheduled to start soon.`}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}!
            </p>
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              <Button asChild>
                <Link href="/dashboard/books/new">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Book
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/users/new">
                  <Users className="mr-2 h-4 w-4" />
                  Add User
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                {activeBooks} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gained
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalGained.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +{totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Net: ${netAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts - Admin Only */}
        {isAdmin && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Analytics & Insights</h2>
            <AnalyticsChart
              transactionData={transactionData.map((t) => ({
                date: new Date(t.transactionDate).toLocaleDateString(),
                gained: t.amountGained,
                spent: t.amountSpent,
                net: t.amountGained - t.amountSpent,
              }))}
              userStats={userStats.map((u) => ({
                name: u.name,
                totalGained: 0, // Would need to calculate from transactions
                totalSpent: 0, // Would need to calculate from transactions
                netAmount: 0, // Would need to calculate from transactions
              }))}
              totalGained={totalGained}
              totalSpent={totalSpent}
            />
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest transactions from all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet
                  </p>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">
                            {transaction.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.book.title}
                          </p>
                          {transaction.note && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {transaction.amountGained > 0 && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            +${transaction.amountGained}
                          </Badge>
                        )}
                        {transaction.amountSpent > 0 && (
                          <Badge variant="destructive">
                            -${transaction.amountSpent}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/transactions/new">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Transaction
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/books">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Books
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/transactions">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Transactions
                </Link>
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/dashboard/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/dashboard/history">
                      <Calendar className="mr-2 h-4 w-4" />
                      View History
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
