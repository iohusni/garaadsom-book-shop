'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { transactionCreateSchema } from '@/lib/validations'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

type TransactionFormData = {
  transactionDate: string
  amountGained: number
  amountSpent: number
  note: string
}

interface ActiveBook {
  id: string
  title: string
  startDate: string
  endDate: string
}

export default function NewTransactionPage() {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeBook, setActiveBook] = useState<ActiveBook | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionCreateSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      amountGained: 0,
      amountSpent: 0,
      note: '',
    },
  })

  useEffect(() => {
    // Fetch active book
    const fetchActiveBook = async () => {
      try {
        const response = await fetch('/api/books?status=ACTIVE')
        if (response.ok) {
          const books = await response.json()
          if (books.length > 0) {
            setActiveBook(books[0])
          }
        }
      } catch (error) {
        console.error('Error fetching active book:', error)
      }
    }

    fetchActiveBook()
  }, [])

  const onSubmit = async (data: TransactionFormData) => {
    if (!activeBook) {
      setError('No active book found')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          bookId: activeBook.id,
          transactionDate: new Date(data.transactionDate),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create transaction')
      }

      router.push('/dashboard/transactions')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!activeBook) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/transactions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transactions
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Add Transaction
              </h1>
              <p className="text-muted-foreground">
                Add a new transaction to the active book
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No Active Book
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Wait for an admin to create a new book period before adding
                  transactions.
                </p>
                <div className="mt-6">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/transactions">
                      Back to Transactions
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/transactions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transactions
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Add Transaction
            </h1>
            <p className="text-muted-foreground">
              Add a new transaction to the active book
            </p>
          </div>
        </div>

        {/* Active Book Info */}
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
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Transaction Details</span>
            </CardTitle>
            <CardDescription>
              Enter the details of your transaction for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="transactionDate">Transaction Date</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  {...register('transactionDate')}
                  className={errors.transactionDate ? 'border-red-500' : ''}
                />
                {errors.transactionDate && (
                  <p className="text-sm text-red-500">
                    {errors.transactionDate.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountGained">Amount Gained ($)</Label>
                  <Input
                    id="amountGained"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('amountGained', { valueAsNumber: true })}
                    className={errors.amountGained ? 'border-red-500' : ''}
                  />
                  {errors.amountGained && (
                    <p className="text-sm text-red-500">
                      {errors.amountGained.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountSpent">Amount Spent ($)</Label>
                  <Input
                    id="amountSpent"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('amountSpent', { valueAsNumber: true })}
                    className={errors.amountSpent ? 'border-red-500' : ''}
                  />
                  {errors.amountSpent && (
                    <p className="text-sm text-red-500">
                      {errors.amountSpent.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add a note about this transaction..."
                  {...register('note')}
                  className={errors.note ? 'border-red-500' : ''}
                />
                {errors.note && (
                  <p className="text-sm text-red-500">{errors.note.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Add Transaction</span>
                    </div>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/transactions')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
