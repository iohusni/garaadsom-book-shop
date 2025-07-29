import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userCreateSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { ActionType, TargetType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userCreateSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          { email: validatedData.email },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 400 },
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create the user
    const user = await db.user.create({
      data: {
        username: validatedData.username,
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role,
        status: 'ACTIVE',
      },
    })

    // Log the action (if we had an admin user, we'd use their ID)
    await db.actionLog.create({
      data: {
        actorId: "cmdowxhb10000mirk5ihl5zkg", // Self-registration
        actionType: ActionType.USER_CREATED,
        targetType: TargetType.USER,
        targetId: user.id,
        details: `User registered: ${user.username}`,
      },
    })

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
