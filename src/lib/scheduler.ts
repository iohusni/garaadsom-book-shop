import { db } from './db'
import { ActionType, TargetType, BookStatus } from '@prisma/client'

export class BookScheduler {
  // Check for books that need to be closed
  static async checkAndCloseExpiredBooks() {
    try {
      const now = new Date()

      // Find active books that have passed their end date
      const expiredBooks = await db.book.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: now,
          },
        },
      })

      for (const book of expiredBooks) {
        await this.closeBook(book.id)
      }

      return expiredBooks.length
    } catch (error) {
      console.error('Error checking expired books:', error)
      return 0
    }
  }

  // Close a specific book
  static async closeBook(bookId: string) {
    try {
      const book = await db.book.update({
        where: { id: bookId },
        data: { status: 'CLOSED' },
      })

      // Log the action
      await db.actionLog.create({
        data: {
          actorId: 'system', // System action
          actionType: ActionType.BOOK_CLOSED,
          targetType: TargetType.BOOK,
          targetId: book.id,
          details: `Book automatically closed: ${book.title}`,
        },
      })

      return book
    } catch (error) {
      console.error('Error closing book:', error)
      throw error
    }
  }

  // Auto-generate next book
  static async generateNextBook() {
    try {
      // Find the most recent book
      const lastBook = await db.book.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      if (!lastBook) {
        return null
      }

      // Calculate next week's dates
      const lastEndDate = new Date(lastBook.endDate)
      const nextStartDate = new Date(lastEndDate)
      nextStartDate.setDate(lastEndDate.getDate() + 1)

      const nextEndDate = new Date(nextStartDate)
      nextEndDate.setDate(nextStartDate.getDate() + 6)

      // Generate title for next week
      const weekNumber = this.getWeekNumber(nextStartDate)
      const monthName = nextStartDate.toLocaleDateString('en-US', {
        month: 'long',
      })
      const year = nextStartDate.getFullYear()
      const title = `Week ${weekNumber} - ${monthName} - ${year}`

      // Check if there's already an active book
      const activeBook = await db.book.findFirst({
        where: { status: 'ACTIVE' },
      })

      if (activeBook) {
        return null // Don't create if there's already an active book
      }

      // Create the new book
      const newBook = await db.book.create({
        data: {
          title,
          startDate: nextStartDate,
          endDate: nextEndDate,
          durationDays: 7,
          status: 'ACTIVE',
          createdBy: 'system', // System-generated
        },
      })

      // Log the action
      await db.actionLog.create({
        data: {
          actorId: 'system',
          actionType: ActionType.BOOK_CREATED,
          targetType: TargetType.BOOK,
          targetId: newBook.id,
          details: `Auto-generated book: ${newBook.title}`,
        },
      })

      return newBook
    } catch (error) {
      console.error('Error generating next book:', error)
      return null
    }
  }

  // Get week number of the year
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Send notifications for new books
  static async sendNewBookNotifications(bookId: string) {
    try {
      const book = await db.book.findUnique({
        where: { id: bookId },
      })

      if (!book) return

      // Get all active users
      const users = await db.user.findMany({
        where: { status: 'ACTIVE' },
      })

      // In a real application, you would send actual notifications here
      // For now, we'll just log them
      console.log(`📢 New book notification sent to ${users.length} users:`, {
        bookTitle: book.title,
        startDate: book.startDate,
        endDate: book.endDate,
        users: users.map((u) => u.name),
      })

      // You could integrate with:
      // - Email service (SendGrid, AWS SES)
      // - Push notifications
      // - SMS service
      // - WebSocket for real-time notifications
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  // Get upcoming books (next 4 weeks)
  static async getUpcomingBooks() {
    try {
      const now = new Date()
      const fourWeeksFromNow = new Date(now)
      fourWeeksFromNow.setDate(now.getDate() + 28)

      const upcomingBooks = await db.book.findMany({
        where: {
          startDate: {
            gte: now,
            lte: fourWeeksFromNow,
          },
        },
        orderBy: { startDate: 'asc' },
      })

      return upcomingBooks
    } catch (error) {
      console.error('Error getting upcoming books:', error)
      return []
    }
  }

  // Get overdue books (past end date but still active)
  static async getOverdueBooks() {
    try {
      const now = new Date()

      const overdueBooks = await db.book.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: now,
          },
        },
        orderBy: { endDate: 'desc' },
      })

      return overdueBooks
    } catch (error) {
      console.error('Error getting overdue books:', error)
      return []
    }
  }
}

// Cron job simulation (in a real app, use actual cron jobs or scheduled tasks)
export const scheduleBookManagement = () => {
  // Check every hour for expired books
  setInterval(async () => {
    const closedCount = await BookScheduler.checkAndCloseExpiredBooks()
    if (closedCount > 0) {
      console.log(`🔄 Auto-closed ${closedCount} expired book(s)`)
    }
  }, 60 * 60 * 1000) // 1 hour

  // Check daily for new book generation
  setInterval(async () => {
    const newBook = await BookScheduler.generateNextBook()
    if (newBook) {
      console.log(`📚 Auto-generated new book: ${newBook.title}`)
      await BookScheduler.sendNewBookNotifications(newBook.id)
    }
  }, 24 * 60 * 60 * 1000) // 24 hours
}
