import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookUpdateSchema } from '@/lib/validations'
import { ActionType, TargetType } from '@prisma/client'

interface BookRouteProps {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: BookRouteProps) {
  try {
    const session = await auth()
    

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const validatedData = bookUpdateSchema.parse(body)

    // Check if book exists
    const existingBook = await db.book.findUnique({
      where: { id: params.id },
    })

    if (!existingBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 })
    }

    // If setting to ACTIVE, ensure no other active books exist
    if (validatedData.status === 'ACTIVE') {
      const activeBooks = await db.book.findMany({
        where: {
          status: 'ACTIVE',
          id: { not: params.id },
        },
      })

      if (activeBooks.length > 0) {
        return NextResponse.json(
          { message: 'Only one book can be active at a time' },
          { status: 400 },
        )
      }
    }

    // Update the book
    const updatedBook = await db.book.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        durationDays: Math.ceil(
          (new Date(validatedData.endDate).getTime() -
            new Date(validatedData.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        status: validatedData.status,
      },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id as string,
        actionType: ActionType.BOOK_UPDATED,
        targetType: TargetType.BOOK,
        targetId: updatedBook.id,
        details: `Book updated: ${updatedBook.title}`,
      },
    })

    return NextResponse.json(updatedBook)
  } catch (error) {
    console.error('Error updating book:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: BookRouteProps) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 },
      )
    }

    // Check if book exists
    const existingBook = await db.book.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { transactions: true } },
      },
    })

    if (!existingBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 })
    }

    // Prevent deletion if book has transactions
    if (existingBook._count.transactions > 0) {
      return NextResponse.json(
        { message: 'Cannot delete book with existing transactions' },
        { status: 400 },
      )
    }

    // Delete the book
    await db.book.delete({
      where: { id: params.id },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id as string,
        actionType: ActionType.BOOK_UPDATED, // We'll use this for deletion
        targetType: TargetType.BOOK,
        targetId: params.id,
        details: `Book deleted: ${existingBook.title}`,
      },
    })

    return NextResponse.json({ message: 'Book deleted successfully' })
  } catch (error) {
    console.error('Error deleting book:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
