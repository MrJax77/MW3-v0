"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { AISuggestion } from "@/components/ai-suggestion"
import { useAIUsage } from "@/lib/use-ai-usage"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  field: string
  formContext?: string
  onValueChange: (value: string) => void
  value: string
  maxLength?: number
}

export function EnhancedInput({
  label,
  field,
  formContext,
  onValueChange,
  value,
  maxLength,
  ...props
}: EnhancedInputProps) {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { usage, trackAPICall } = useAIUsage()
  const { toast } = useToast()

  // Handle suggestion request
  const handleRequestSuggestion = () => {
    if (usage.isLimited) {
      toast({
        title: "Daily limit reached",
        description: "You've reached your daily limit for AI suggestions. Try again tomorrow.",
        variant: "destructive",
      })
      return
    }

    setShowSuggestion(true)
    trackAPICall()
  }

  // Handle accepting a suggestion
  const handleAcceptSuggestion = (suggestion: string) => {
    onValueChange(suggestion)
    setShowSuggestion(false)

    // Focus the input after applying suggestion
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>

        {!showSuggestion && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 text-primary mr-1" />
              {usage.remainingCalls} AI assists left today
            </Badge>
            <button
              type="button"
              onClick={handleRequestSuggestion}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              title="Get AI suggestion"
            >
              <Sparkles className="h-4 w-4" />
              <span className="sr-only">Get AI suggestion</span>
            </button>
          </div>
        )}
      </div>

      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        maxLength={maxLength}
        {...props}
      />

      {maxLength && (
        <div className="text-xs text-muted-foreground text-right">
          {value.length}/{maxLength} characters
        </div>
      )}

      {showSuggestion && (
        <AISuggestion
          field={field}
          question={label}
          currentValue={value}
          formContext={formContext}
          maxLength={maxLength}
          onAccept={handleAcceptSuggestion}
        />
      )}
    </div>
  )
}
