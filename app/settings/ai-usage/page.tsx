"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { useToast } from "@/hooks/use-toast"

export default function AIUsagePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [usage, setUsage] = useState({
    totalCalls: 0,
    dailyCalls: 0,
    dailyLimit: 20,
    lastUsed: "",
  })

  useEffect(() => {
    loadUsageData()
  }, [])

  const loadUsageData = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase.from("ai_usage").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching AI usage:", error)
        toast({
          title: "Error",
          description: "Failed to load AI usage data",
          variant: "destructive",
        })
        return
      }

      if (data) {
        setUsage({
          totalCalls: data.total_calls || 0,
          dailyCalls: data.daily_calls || 0,
          dailyLimit: 20, // This could be dynamic based on user tier
          lastUsed: data.last_used || "Never",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">AI Usage Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Assistant Usage
            </CardTitle>
            <CardDescription>Track your AI assistant usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total AI Assists</p>
                    <p className="text-2xl font-bold">{usage.totalCalls}</p>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Today's Usage</p>
                    <p className="text-2xl font-bold">
                      {usage.dailyCalls} / {usage.dailyLimit}
                    </p>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Last Used</p>
                    <p className="text-2xl font-bold">
                      {usage.lastUsed === new Date().toISOString().split("T")[0]
                        ? "Today"
                        : new Date(usage.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>About AI Assists:</strong> AI assists help you complete the intake form with thoughtful,
                    personalized responses. Your daily limit resets at midnight.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={loadUsageData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
