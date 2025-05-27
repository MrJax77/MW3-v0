"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, signOut } from "@/lib/supabase"
import { getProfile, getLatestInsight, calculateProfileCompleteness, getIntakeProgress } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { ProgressCard } from "@/components/dashboard/progress-card"
import { InsightsCard } from "@/components/dashboard/insights-card"
import { DailyLogDialog } from "@/components/dashboard/daily-log-dialog"
import { ProfileCompletionCard } from "@/components/dashboard/profile-completion-card"
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card"
import { LogOut, Target, Lightbulb, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [insight, setInsight] = useState<any>(null)
  const [profileCompleteness, setProfileCompleteness] = useState<any>(null)
  const [intakeProgress, setIntakeProgress] = useState<any>(null)
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

        // Fetch all data in parallel
        const [profileData, insightData, completenessData, progressData] = await Promise.all([
          getProfile().catch(() => null),
          getLatestInsight().catch(() => null),
          calculateProfileCompleteness().catch(() => null),
          getIntakeProgress().catch(() => null),
        ])

        setProfile(profileData)
        setInsight(insightData)
        setProfileCompleteness(completenessData)
        setIntakeProgress(progressData)
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

  const getWelcomeMessage = () => {
    const firstName = profile?.first_name || intakeProgress?.first_name
    if (!firstName) return "Welcome to MW3-GPT!"

    const completeness = profileCompleteness?.percentage || 0
    if (completeness === 0) {
      return `Hi ${firstName}! Ready to get started?`
    } else if (completeness < 50) {
      return `Welcome back, ${firstName}! Let's continue your setup.`
    } else if (completeness < 100) {
      return `Great progress, ${firstName}! Almost there.`
    } else {
      return `Welcome back, ${firstName}!`
    }
  }

  const getSubMessage = () => {
    const completeness = profileCompleteness?.percentage || 0
    if (completeness === 0) {
      return "Complete your profile setup to unlock personalized coaching insights."
    } else if (completeness < 50) {
      return "Continue your profile setup to unlock more personalized features."
    } else if (completeness < 100) {
      return "Finish your profile to get the full MW3-GPT experience."
    } else {
      return "Your personalized coaching experience is ready!"
    }
  }

  const getCoreProgress = () => {
    if (!profileCompleteness) return 0
    const coreStages = profileCompleteness.completedStages.filter((stage: number) => stage >= 1 && stage <= 4)
    return Math.round((coreStages.length / 4) * 100)
  }

  const getDeepProgress = () => {
    if (!profileCompleteness) return 0
    const deepStages = profileCompleteness.completedStages.filter((stage: number) => stage >= 5 && stage <= 7)
    return Math.round((deepStages.length / 3) * 100)
  }

  const getExpertProgress = () => {
    if (!profileCompleteness) return 0
    const expertStages = profileCompleteness.completedStages.filter((stage: number) => stage >= 8 && stage <= 9)
    return Math.round((expertStages.length / 2) * 100)
  }

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
          <div className="flex items-center gap-4">
            <Image
              src="/mw3-logo.png"
              alt="MW3 Logo"
              width={60}
              height={30}
              className="h-10 w-auto rounded-full bg-white p-2 shadow-sm"
            />
            <div>
              <h1 className="text-3xl font-bold">{getWelcomeMessage()}</h1>
              <p className="text-muted-foreground">{getSubMessage()}</p>
              {intakeProgress?.last_saved && (
                <p className="text-xs text-muted-foreground mt-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Last updated {new Date(intakeProgress.last_saved).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DailyLogDialog />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Completion Card */}
        <ProfileCompletionCard
          completeness={profileCompleteness}
          intakeProgress={intakeProgress}
          onContinueSetup={() => router.push("/intake")}
          onResetProfile={() => {
            // TODO: Implement reset functionality
            toast({
              title: "Reset Profile",
              description: "This feature will be available soon.",
            })
          }}
        />

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProgressCard
            title="Core Setup"
            description="Essential profile information"
            progress={getCoreProgress()}
            variant="primary"
            icon={
              <Image
                src="/mw3-logo.png"
                alt="MW3 Logo"
                width={16}
                height={16}
                className="h-4 w-4 rounded-full bg-white p-0.5"
              />
            }
          />
          <ProgressCard
            title="Deep Insights"
            description="Goals, values & lifestyle"
            progress={getDeepProgress()}
            variant="accent"
            icon={<Target className="h-4 w-4 text-accent" />}
          />
          <ProgressCard
            title="Expert Features"
            description="Technology & preferences"
            progress={getExpertProgress()}
            variant="warning"
            icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
          />
        </div>

        {/* Insights Card */}
        <InsightsCard
          initialInsight={insight}
          canGenerateInsights={profileCompleteness?.percentage >= 50}
          profileCompleteness={profileCompleteness?.percentage || 0}
        />

        {/* Quick Actions */}
        <QuickActionsCard
          profile={profile}
          profileCompleteness={profileCompleteness}
          onNavigateToIntake={() => router.push("/intake")}
          onViewInsights={() => {
            document.querySelector("[data-insights-card]")?.scrollIntoView({
              behavior: "smooth",
            })
          }}
        />
      </div>
    </div>
  )
}
