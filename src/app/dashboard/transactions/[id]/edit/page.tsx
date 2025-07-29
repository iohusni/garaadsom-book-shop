import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import EditTransactionForm from '@/components/transactions/edit-transaction-form'

interface EditTransactionPageProps {
  params: {
    id: string
  }
}

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const transaction = await db.transaction.findUnique({
    where: { id: params.id },
    include: {
      book: { select: { title: true, status: true } },
      user: { select: { name: true } },
    },
  })

  if (!transaction) {
    notFound()
  }

  // Users can only edit their own transactions
  if (transaction.userId !== session.user.id) {
    redirect('/dashboard/transactions')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit Transaction
          </h1>
          <p className="text-muted-foreground">
            Update your transaction details
          </p>
        </div>

        <EditTransactionForm transaction={transaction} />
      </div>
    </DashboardLayout>
  )
}
