"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, signOut } from "@/lib/supabase"
import { getProfile, getLatestInsight } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressCard } from "@/components/dashboard/progress-card"
import { InsightsCard } from "@/components/dashboard/insights-card"
import { DailyLogDialog } from "@/components/dashboard/daily-log-dialog"
import { LogOut, Brain, Heart, Lightbulb, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [insight, setInsight] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const currentUser = await getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        // Fetch profile and insights in parallel
        const [profileData, insightData] = await Promise.all([
          getProfile().catch(() => null),
          getLatestInsight().catch(() => null),
        ])

        setProfile(profileData)
        setInsight(insightData)
      } catch (error) {
        console.error("Error loading dashboard:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initDashboard()
  }, [router, toast])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const calculateProgress = (data: any) => {
    if (!data) return 0
    const fields = Object.keys(data)
    const filledFields = fields.filter((key) => data[key] !== null && data[key] !== undefined && data[key] !== "")
    return Math.round((filledFields.length / fields.length) * 100)
  }

  const mindsetProgress = profile?.mindset_json ? calculateProgress(profile.mindset_json) : 0
  const wellnessProgress = profile?.wellness_json ? calculateProgress(profile.wellness_json) : 0
  const wisdomProgress = profile?.purpose_json ? calculateProgress(profile.purpose_json) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email?.split("@")[0] || "there"}!</p>
          </div>
          <div className="flex items-center gap-3">
            <DailyLogDialog />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProgressCard
            title="Mindset Progress"
            description="Personality & mental wellness setup"
            progress={mindsetProgress}
            variant="primary"
            icon={<Brain className="h-4 w-4 text-primary" />}
          />
          <ProgressCard
            title="Wellness Progress"
            description="Health goals & fitness tracking"
            progress={wellnessProgress}
            variant="accent"
            icon={<Heart className="h-4 w-4 text-accent" />}
          />
          <ProgressCard
            title="Wisdom Progress"
            description="Purpose & values alignment"
            progress={wisdomProgress}
            variant="warning"
            icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
          />
        </div>

        {/* Insights Card */}
        <InsightsCard initialInsight={insight} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Status
              </CardTitle>
              <CardDescription>
                {profile ? "Your profile is set up" : "Complete your intake to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Profile completed on {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                  <Button variant="outline" onClick={() => router.push("/intake")} className="w-full">
                    Update Profile
                  </Button>
                </div>
              ) : (
                <Button onClick={() => router.push("/intake")} className="w-full">
                  Complete Intake
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coaching Insights</CardTitle>
              <CardDescription>AI-powered recommendations for your growth</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized coaching tips based on your progress and daily logs.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Scroll to insights card
                  document.querySelector("[data-insights-card]")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }}
              >
                View Latest Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
