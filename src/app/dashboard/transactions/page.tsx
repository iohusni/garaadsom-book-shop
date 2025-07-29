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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

export default async function TransactionsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  // Get active book
  const activeBook = await db.book.findFirst({
    where: { status: 'ACTIVE' },
  })

  // Get user's transactions
  const userTransactions = await db.transaction.findMany({
    where: { userId: session.user.id },
    include: {
      book: { select: { title: true, status: true } },
    },
    orderBy: { transactionDate: 'desc' },
  })

  // Calculate user's stats
  const userStats = await db.transaction.aggregate({
    where: { userId: session.user.id },
    _sum: {
      amountGained: true,
      amountSpent: true,
    },
  })

  const totalGained = userStats._sum.amountGained || 0
  const totalSpent = userStats._sum.amountSpent || 0
  const netAmount = totalGained - totalSpent

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              My Transactions
            </h1>
            <p className="text-muted-foreground">
              Track your daily gains and spending
            </p>
          </div>
          {activeBook && (
            <Button asChild>
              <Link href="/dashboard/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Link>
            </Button>
          )}
        </div>

        {/* Active Book Status */}
        {activeBook ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Active Book: {activeBook.title}
                  </h3>
                  <p className="text-sm text-green-600">
                    {new Date(activeBook.startDate).toLocaleDateString()} -{' '}
                    {new Date(activeBook.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    No Active Book
                  </h3>
                  <p className="text-sm text-yellow-600">
                    Wait for an admin to create a new book period
                  </p>
                </div>
                <Badge variant="secondary">Inactive</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${netAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your complete transaction history across all books
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userTransactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No transactions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeBook
                    ? 'Get started by adding your first transaction.'
                    : 'Add transactions when a book is active.'}
                </p>
                {activeBook && (
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/dashboard/transactions/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Gained</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(
                          transaction.transactionDate,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {transaction.book.title}
                          </span>
                          <Badge
                            variant={
                              transaction.book.status === 'ACTIVE'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {transaction.book.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.amountGained > 0 && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            +${transaction.amountGained}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.amountSpent > 0 && (
                          <Badge variant="destructive">
                            -${transaction.amountSpent}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.note && (
                          <span className="text-sm text-muted-foreground">
                            {transaction.note}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/dashboard/transactions/${transaction.id}/edit`}
                            >
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
