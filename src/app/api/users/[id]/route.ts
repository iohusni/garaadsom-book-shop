import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userUpdateSchema } from '@/lib/validations'
import { ActionType, TargetType } from '@prisma/client'

interface UserRouteProps {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: UserRouteProps) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 400 },
        )
      }
    }

    // Update the user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        status: validatedData.status,
      },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id,
        actionType: ActionType.USER_UPDATED,
        targetType: TargetType.USER,
        targetId: updatedUser.id,
        details: `User updated: ${updatedUser.username}`,
      },
    })

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: UserRouteProps) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 },
      )
    }

    // Prevent admin from deleting themselves
    if (params.id === session.user.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 },
      )
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { transactions: true } },
      },
    })

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Prevent deletion if user has transactions
    if (existingUser._count.transactions > 0) {
      return NextResponse.json(
        { message: 'Cannot delete user with existing transactions' },
        { status: 400 },
      )
    }

    // Delete the user
    await db.user.delete({
      where: { id: params.id },
    })

    // Log the action
    await db.actionLog.create({
      data: {
        actorId: session.user.id,
        actionType: ActionType.USER_REMOVED,
        targetType: TargetType.USER,
        targetId: params.id,
        details: `User deleted: ${existingUser.username}`,
      },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
