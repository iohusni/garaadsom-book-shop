import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import EditBookForm from '@/components/books/edit-book-form'

interface EditBookPageProps {
  params: {
    id: string
  }
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const book = await db.book.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { name: true } },
    },
  })

  if (!book) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Book</h1>
          <p className="text-muted-foreground">
            Update book details and status
          </p>
        </div>

        <EditBookForm book={book} />
      </div>
    </DashboardLayout>
  )
}
