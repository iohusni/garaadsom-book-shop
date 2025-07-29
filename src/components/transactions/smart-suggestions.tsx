'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface Suggestion {
  id: string
  type: 'recurring' | 'pattern' | 'budget'
  title: string
  description: string
  amount: number
  frequency: string
  confidence: number
}

interface SmartSuggestionsProps {
  userId: string
  onApplySuggestion: (suggestion: Suggestion) => void
}

export default function SmartSuggestions({
  userId,
  onApplySuggestion,
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching suggestions based on user's transaction history
    const fetchSuggestions = async () => {
      try {
        // In a real app, this would call an API endpoint
        const mockSuggestions: Suggestion[] = [
          {
            id: '1',
            type: 'recurring',
            title: 'Weekly Groceries',
            description: 'You typically spend $50-80 on groceries every week',
            amount: 65,
            frequency: 'Weekly',
            confidence: 85,
          },
          {
            id: '2',
            type: 'pattern',
            title: 'Transportation',
            description: 'Regular spending on fuel/transport around $30',
            amount: 30,
            frequency: 'Weekly',
            confidence: 72,
          },
          {
            id: '3',
            type: 'budget',
            title: 'Entertainment',
            description: 'Consider setting aside $20 for weekend activities',
            amount: 20,
            frequency: 'Weekly',
            confidence: 60,
          },
        ]

        setSuggestions(mockSuggestions)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [userId])

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recurring':
        return <Clock className="h-4 w-4" />
      case 'pattern':
        return <TrendingUp className="h-4 w-4" />
      case 'budget':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No suggestions available yet. Add more transactions to get
            personalized recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="text-blue-500">
                {getSuggestionIcon(suggestion.type)}
              </div>
              <div>
                <h4 className="font-medium">{suggestion.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {suggestion.frequency}
                  </Badge>
                  <Badge
                    className={`text-xs ${getConfidenceColor(
                      suggestion.confidence,
                    )}`}
                  >
                    {suggestion.confidence}% confidence
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-green-600">
                ${suggestion.amount}
              </span>
              <Button
                size="sm"
                onClick={() => onApplySuggestion(suggestion)}
                className="text-xs"
              >
                Apply
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
