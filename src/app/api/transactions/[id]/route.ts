import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactionUpdateSchema } from '@/lib/validations'
import { ActionType, TargetType } from '@prisma/client'

interface TransactionRouteProps {
  params: {
    id: string
  }
}

export async function PUT(
  request: NextRequest,
  { params }: TransactionRouteProps,
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = transactionUpdateSchema.parse(body)

    // Check if transaction exists and belongs to the user
    const existingTransaction = await db.transaction.findUnique({
      where: { id: params.id },
      include: {
        book: { select: { status: true, startDate: true, endDate: true } },
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 },
      )
    }

    // Users can only edit their own transactions
    if (existingTransaction.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own transactions' },
        { status: 403 },
      )
    }

    // Check if the book is still active
    if (existingTransaction.book.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Cannot edit transactions in inactive or closed books' },
        { status: 400 },
      )
    }

    // Validate transaction date is within book period
    const transactionDate = new Date(validatedData.transactionDate)
    const bookStartDate = new Date(existingTransaction.book.startDate)
    const bookEndDate = new Date(existingTransaction.book.endDate)

    if (transactionDate < bookStartDate || transactionDate > bookEndDate) {
      return NextResponse.json(
        { message: 'Transaction date must be within the book period' },
        { status: 400 },
      )
    }

    // Update the transaction
    const updatedTransaction = await db.transaction.update({
      where: { id: params.id },
      data: {
        transactionDate: transactionDate,
        amountGained: validatedData.amountGained,
        amountSpent: validatedData.amountSpent,
        note: validatedData.note,
      },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id,
        actionType: ActionType.TRANSACTION_UPDATED,
        targetType: TargetType.TRANSACTION,
        targetId: updatedTransaction.id,
        details: `Transaction updated: ${updatedTransaction.id}`,
      },
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Error updating transaction:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: TransactionRouteProps,
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if transaction exists and belongs to the user
    const existingTransaction = await db.transaction.findUnique({
      where: { id: params.id },
      include: {
        book: { select: { status: true } },
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 },
      )
    }

    // Users can only delete their own transactions
    if (existingTransaction.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Forbidden: You can only delete your own transactions' },
        { status: 403 },
      )
    }

    // Check if the book is still active
    if (existingTransaction.book.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Cannot delete transactions in inactive or closed books' },
        { status: 400 },
      )
    }

    // Delete the transaction
    await db.transaction.delete({
      where: { id: params.id },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id,
        actionType: ActionType.TRANSACTION_DELETED,
        targetType: TargetType.TRANSACTION,
        targetId: params.id,
        details: `Transaction deleted: ${params.id}`,
      },
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
