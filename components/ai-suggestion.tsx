"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Sparkles, Check, X, RefreshCw } from "lucide-react"

interface AISuggestionProps {
  field: string
  question: string
  currentValue: string
  formContext: any
  maxLength: number
  onAccept: (value: string) => void
  className?: string
}

export function AISuggestion({
  field,
  question,
  currentValue,
  formContext,
  maxLength,
  onAccept,
  className,
}: AISuggestionProps) {
  const [suggestion, setSuggestion] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSuggestion = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field,
          question,
          currentValue,
          formContext,
          maxLength,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI suggestion")
      }

      const data = await response.json()
      setSuggestion(data.suggestion)
    } catch (err) {
      console.error("Error fetching AI suggestion:", err)
      setError("Failed to get suggestion. Please try again.")
      toast({
        title: "Error",
        description: "Failed to get AI suggestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch suggestion on mount
  useEffect(() => {
    fetchSuggestion()
  }, [])

  if (!className) {
    return (
      <Card className="mt-2 border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              AI Suggestion
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={fetchSuggestion}
                disabled={isLoading}
                title="Regenerate suggestion"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Regenerate</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-destructive"
                onClick={() => onAccept(currentValue)}
                title="Dismiss suggestion"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-green-500"
                onClick={() => onAccept(suggestion)}
                disabled={isLoading || !suggestion}
                title="Accept suggestion"
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Accept</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : (
            <div className="text-sm">{suggestion}</div>
          )}
        </CardContent>
      </Card>
    )
  }

  // If className is provided, render just the button
  return (
    <button
      type="button"
      onClick={() => fetchSuggestion().then(() => onAccept(suggestion))}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0",
        className,
      )}
      disabled={isLoading}
      title="Get AI suggestion"
    >
      <Sparkles className="h-4 w-4" />
      <span className="sr-only">Get AI suggestion</span>
    </button>
  )
}
