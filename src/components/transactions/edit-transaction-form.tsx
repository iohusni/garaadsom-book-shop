'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { DollarSign, Save, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Transaction, Book, User } from '@prisma/client'

const editTransactionSchema = z.object({
  transactionDate: z.string().min(1, 'Transaction date is required'),
  amountGained: z.number().min(0, 'Amount gained must be 0 or greater'),
  amountSpent: z.number().min(0, 'Amount spent must be 0 or greater'),
  note: z.string().optional(),
})

type EditTransactionForm = z.infer<typeof editTransactionSchema>

interface EditTransactionFormProps {
  transaction: Transaction & {
    book: Pick<Book, 'title' | 'status'>
    user: Pick<User, 'name'>
  }
}

export default function EditTransactionForm({
  transaction,
}: EditTransactionFormProps) {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditTransactionForm>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      transactionDate: new Date(transaction.transactionDate)
        .toISOString()
        .split('T')[0],
      amountGained: transaction.amountGained,
      amountSpent: transaction.amountSpent,
      note: transaction.note || '',
    },
  })

  const onSubmit = async (data: EditTransactionForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update transaction')
      }

      router.push('/dashboard/transactions')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this transaction? This action cannot be undone.',
      )
    ) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete transaction')
      }

      router.push('/dashboard/transactions')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Edit Transaction
        </CardTitle>
        <CardDescription>
          Update your transaction details. Book: {transaction.book.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="amountGained">Amount Gained</Label>
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
              <Label htmlFor="amountSpent">Amount Spent</Label>
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
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Update Transaction</span>
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Transaction</span>
                </div>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/transactions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transactions
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
