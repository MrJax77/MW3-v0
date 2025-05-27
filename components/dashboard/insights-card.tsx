"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Insight {
  id: string
  insight_text: string
  insight_type: string
  created_at: string
}

interface InsightsCardProps {
  initialInsight: Insight | null
}

export function InsightsCard({ initialInsight }: InsightsCardProps) {
  const [insight, setInsight] = useState<Insight | null>(initialInsight)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const generateDailyTip = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/generate-daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to generate tip")
      }

      const data = await response.json()
      setInsight(data.insight)

      toast({
        title: "New insight generated!",
        description: "Your personalized daily tip is ready.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate daily tip. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="col-span-full" data-insights-card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Daily Insights
          </CardTitle>
          <CardDescription>Personalized coaching tips based on your progress</CardDescription>
        </div>
        <Button onClick={generateDailyTip} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Get Today's Tip
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {insight ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{insight.insight_type.replace("_", " ")}</Badge>
              <span className="text-sm text-muted-foreground">{formatDate(insight.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed">{insight.insight_text}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No insights yet</p>
            <Button onClick={generateDailyTip} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Your First Tip"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
