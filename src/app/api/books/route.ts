import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookCreateSchema } from '@/lib/validations'
import { ActionType, TargetType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bookCreateSchema.parse(body)

    // Check if there's already an active book
    const activeBook = await db.book.findFirst({
      where: { status: 'ACTIVE' },
    })

    if (activeBook) {
      return NextResponse.json(
        { message: 'There is already an active book. Please close it first.' },
        { status: 400 },
      )
    }

    // Create the new book
    const book = await db.book.create({
      data: {
        title: validatedData.title,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        durationDays: validatedData.durationDays,
        status: 'ACTIVE',
        createdBy: session.user.id as string,
      },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id as string,
        actionType: ActionType.BOOK_CREATED,
        targetType: TargetType.BOOK,
        targetId: book.id,
        details: `Created book: ${book.title}`,
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error creating book:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const books = await db.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
