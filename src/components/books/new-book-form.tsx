'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, Save, ArrowLeft, Calendar, Zap } from 'lucide-react'
import Link from 'next/link'

const newBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  durationDays: z.number().int().positive(),
})

type NewBookForm = z.infer<typeof newBookSchema>

export default function NewBookForm() {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoTitle, setAutoTitle] = useState<string>('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewBookForm>({
    resolver: zodResolver(newBookSchema),
    defaultValues: {
      title: '',
      startDate: '',
      endDate: '',
      durationDays: 7,
    },
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Auto-generate title based on start date
  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate)
      const weekNumber = getWeekNumber(date)
      const monthName = date.toLocaleDateString('en-US', { month: 'long' })
      const year = date.getFullYear()

      const generatedTitle = `Week ${weekNumber} - ${monthName} - ${year}`
      setAutoTitle(generatedTitle)
      setValue('title', generatedTitle)
    }
  }, [startDate, setValue])

  // Calculate duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      setValue('durationDays', diffDays)
    }
  }, [startDate, endDate, setValue])

  // Get week number of the year
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Auto-set end date to 7 days after start date
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value
    if (startDate) {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 6) // 7 days including start date
      setValue('endDate', end.toISOString().split('T')[0])
    }
  }

  const onSubmit = async (data: NewBookForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create book')
      }

      router.push('/dashboard/books')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Create New Book
        </CardTitle>
        <CardDescription>
          Create a new weekly book period with auto-generated title
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              Book Title
              <Zap className="h-4 w-4 text-blue-500" />
            </Label>
            <Input
              id="title"
              placeholder="Auto-generated title"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {autoTitle && (
              <p className="text-sm text-muted-foreground">
                Auto-generated: {autoTitle}
              </p>
            )}
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                Start Date
                <Calendar className="h-4 w-4" />
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                onChange={handleStartDateChange}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationDays">Duration (Days)</Label>
            <Input
              id="durationDays"
              type="number"
              min="1"
              max="365"
              {...register('durationDays', { valueAsNumber: true })}
              className={errors.durationDays ? 'border-red-500' : ''}
              readOnly
            />
            {errors.durationDays && (
              <p className="text-sm text-red-500">
                {errors.durationDays.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Create Book</span>
                </div>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/books">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Books
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
