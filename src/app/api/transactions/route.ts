import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactionCreateSchema } from '@/lib/validations'
import { ActionType, TargetType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = transactionCreateSchema.parse(body)

    // Check if the book exists and is active
    const book = await db.book.findUnique({
      where: { id: validatedData.bookId },
    })

    if (!book) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 })
    }

    if (book.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Cannot add transactions to inactive books' },
        { status: 400 },
      )
    }

    // Check if transaction date is within book period
    const transactionDate = new Date(validatedData.transactionDate)
    const bookStartDate = new Date(book.startDate)
    const bookEndDate = new Date(book.endDate)

    if (transactionDate < bookStartDate || transactionDate > bookEndDate) {
      return NextResponse.json(
        { message: 'Transaction date must be within the book period' },
        { status: 400 },
      )
    }

    // Create the transaction
    const transaction = await db.transaction.create({
      data: {
        userId: session.user.id as string,
        bookId: validatedData.bookId,
        transactionDate: new Date(validatedData.transactionDate),
        amountGained: validatedData.amountGained,
        amountSpent: validatedData.amountSpent,
        note: validatedData.note,
      },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id as string,
        actionType: ActionType.TRANSACTION_CREATED,
        targetType: TargetType.TRANSACTION,
        targetId: transaction.id,
        details: `Created transaction: $${validatedData.amountGained} gained, $${validatedData.amountSpent} spent`,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)

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

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const userId = searchParams.get('userId')

    // Build where clause
    const where: any = {}

    if (bookId) {
      where.bookId = bookId
    }

    if (userId) {
      where.userId = userId
    } else if (session.user.role !== 'ADMIN') {
      // Non-admin users can only see their own transactions
      where.userId = session.user.id as string
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        user: { select: { name: true, username: true } },
        book: { select: { title: true, status: true } },
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
