"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={error!}
            reset={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={error!}
          reset={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const { toast } = useToast()

  const copyErrorToClipboard = () => {
    const errorText = `Error: ${error.message}\nStack: ${error.stack}`
    navigator.clipboard.writeText(errorText)
    toast({
      title: "Error copied",
      description: "Error details copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Application Error</CardTitle>
          </div>
          <CardDescription>An unexpected error occurred. This information can help with debugging.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <h4 className="font-semibold text-destructive mb-2">Error Message:</h4>
            <p className="text-sm font-mono">{error.message}</p>
          </div>

          {error.stack && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Stack Trace:</h4>
              <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">{error.stack}</pre>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={copyErrorToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Error
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>If this error persists, please contact support with the error details above.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
