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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { History, User, BookOpen, DollarSign } from 'lucide-react'

export default async function HistoryPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const actionLogs = await db.actionLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { name: true, username: true } },
    },
    take: 100, // Limit to last 100 actions
  })

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'BOOK_CREATED':
      case 'BOOK_UPDATED':
      case 'BOOK_CLOSED':
        return <BookOpen className="h-4 w-4" />
      case 'USER_CREATED':
      case 'USER_BANNED':
      case 'USER_REMOVED':
      case 'USER_UPDATED':
        return <User className="h-4 w-4" />
      case 'TRANSACTION_CREATED':
      case 'TRANSACTION_UPDATED':
      case 'TRANSACTION_DELETED':
        return <DollarSign className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getActionColor = (actionType: string) => {
    if (actionType.includes('CREATED')) return 'bg-green-100 text-green-800'
    if (actionType.includes('UPDATED')) return 'bg-blue-100 text-blue-800'
    if (
      actionType.includes('DELETED') ||
      actionType.includes('BANNED') ||
      actionType.includes('REMOVED')
    )
      return 'bg-red-100 text-red-800'
    if (actionType.includes('CLOSED')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Action History</h1>
          <p className="text-muted-foreground">
            Track all system actions and changes
          </p>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Recent Actions</span>
            </CardTitle>
            <CardDescription>
              Last 100 system actions performed by users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actionLogs.length === 0 ? (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No actions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No actions have been performed yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.actionType)}
                          <Badge className={getActionColor(log.actionType)}>
                            {formatActionType(log.actionType)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.actor.name}</span>
                          <span className="text-sm text-muted-foreground">
                            @{log.actor.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatActionType(log.targetType)}
                          </span>
                          {log.targetId && (
                            <span className="text-sm text-muted-foreground">
                              ID: {log.targetId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.details && (
                          <span className="text-sm text-muted-foreground">
                            {log.details}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
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
