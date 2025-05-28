"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, RefreshCw, Loader2, Info, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

interface InsightMetadata {
  trends?: Record<string, any>
  data_points_used?: number
  previous_insight_count?: number
}

interface Insight {
  id: string
  insight_text: string
  insight_type: string
  focus_area?: string
  created_at: string
  metadata?: InsightMetadata
}

interface InsightsCardProps {
  initialInsight: Insight | null
  canGenerateInsights?: boolean
  profileCompleteness?: number
  userName?: string
}

export function InsightsCard({
  initialInsight,
  canGenerateInsights = true,
  profileCompleteness = 0,
  userName = "User",
}: InsightsCardProps) {
  const [insight, setInsight] = useState<Insight | null>(initialInsight)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const router = useRouter()

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
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate tip")
      }

      const data = await response.json()
      setInsight(data.insight)

      toast({
        title: "New insight generated!",
        description: "Your personalized coaching tip is ready.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate daily tip. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToChat = () => {
    if (!insight) return

    // Create URL parameters for the chat page
    const params = new URLSearchParams({
      insightId: insight.id,
      insightText: encodeURIComponent(insight.insight_text),
      insightType: encodeURIComponent(insight.insight_type),
      ...(insight.focus_area && { focusArea: encodeURIComponent(insight.focus_area) }),
      createdAt: insight.created_at,
    })

    // Navigate to chat page within the application
    router.push(`/chat?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format insight type for display
  const formatInsightType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <Card className="col-span-full" data-insights-card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Daily Insights
          </CardTitle>
          <CardDescription>Personalized coaching tips based on your progress</CardDescription>
        </div>
        <Button onClick={generateDailyTip} disabled={isLoading || !canGenerateInsights} variant="outline" size="sm">
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{formatInsightType(insight.insight_type)}</Badge>
              {insight.focus_area && <Badge variant="outline">{insight.focus_area}</Badge>}
              <span className="text-sm text-muted-foreground">{formatDate(insight.created_at)}</span>

              {insight.metadata && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Insight details</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p>Based on {insight.metadata.data_points_used || 0} data points</p>
                        {insight.metadata.trends && Object.keys(insight.metadata.trends).length > 0 && (
                          <p>Analyzed trends in: {Object.keys(insight.metadata.trends).join(", ")}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm leading-relaxed">{insight.insight_text}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button onClick={navigateToChat} variant="default" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Ask Follow-up Questions
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            {canGenerateInsights ? (
              <>
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
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">Complete your profile to unlock insights</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You need {50 - profileCompleteness}% more profile completion to generate personalized coaching
                  insights.
                </p>
                <Button disabled variant="outline">
                  Complete Profile First
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
