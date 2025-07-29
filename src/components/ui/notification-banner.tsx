'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react'

interface NotificationBannerProps {
  type?: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

const notificationStyles = {
  info: {
    className: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: Info,
  },
  warning: {
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    icon: AlertTriangle,
  },
  success: {
    className: 'border-green-200 bg-green-50 text-green-800',
    icon: CheckCircle,
  },
  error: {
    className: 'border-red-200 bg-red-50 text-red-800',
    icon: AlertTriangle,
  },
}

export default function NotificationBanner({
  type = 'info',
  title,
  message,
  dismissible = true,
  onDismiss,
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const style = notificationStyles[type]
  const Icon = style.icon

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <Alert className={style.className}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon className="h-5 w-5 mt-0.5" />
          <div>
            <h4 className="font-medium">{title}</h4>
            <AlertDescription className="mt-1">{message}</AlertDescription>
          </div>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-current hover:bg-current hover:bg-opacity-20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
