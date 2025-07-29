import { z } from 'zod'

// User validation schemas
export const userCreateSchema = z.object({
  username: z.string().min(3).max(20),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['ACTIVE', 'BANNED', 'REMOVED']),
})

export const userLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

// Book validation schemas
export const bookCreateSchema = z.object({
  title: z.string().min(1).max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  durationDays: z.number().int().positive(),
})

export const bookUpdateSchema = z.object({
  title: z.string().min(1).max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']),
})

// Transaction validation schemas
export const transactionCreateSchema = z.object({
  bookId: z.string(),
  transactionDate: z.string().min(1, 'Transaction date is required'),
  amountGained: z.number().min(0).default(0),
  amountSpent: z.number().min(0).default(0),
  note: z.string().optional(),
})

export const transactionUpdateSchema = z.object({
  transactionDate: z.string().min(1, 'Transaction date is required'),
  amountGained: z.number().min(0, 'Amount gained must be 0 or greater'),
  amountSpent: z.number().min(0, 'Amount spent must be 0 or greater'),
  note: z.string().optional(),
})

// Book title validation (Week [number] of [Month] - [Month] - [Year])
export const bookTitleSchema = z
  .string()
  .regex(
    /^Week \d+ of [A-Za-z]+ - [A-Za-z]+ - \d{4}$/,
    'Book title must follow format: Week [number] of [Month] - [Month] - [Year]',
  )
