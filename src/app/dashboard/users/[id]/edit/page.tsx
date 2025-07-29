import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import EditUserForm from '@/components/users/edit-user-form'

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { transactions: true } },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">
            Update user details and status
          </p>
        </div>

        <EditUserForm user={user} />
      </div>
    </DashboardLayout>
  )
}
