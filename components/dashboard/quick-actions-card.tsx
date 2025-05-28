"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, Settings, TrendingUp, Heart, Target, MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionsCardProps {
  profile: any
  profileCompleteness: any
  onNavigateToIntake: () => void
  onNavigateToProfileEditor: () => void
  onViewInsights: () => void
  onViewChatHistory: () => void
  onViewAISettings?: () => void // Add this new prop
}

export function QuickActionsCard({
  profile,
  profileCompleteness,
  onNavigateToIntake,
  onNavigateToProfileEditor,
  onViewInsights,
  onViewChatHistory,
  onViewAISettings, // Add this new parameter
}: QuickActionsCardProps) {
  const percentage = profileCompleteness?.percentage || 0
  const hasBasicInfo = profile?.first_name && profile?.role
  const hasGoals = profile?.family_future_goal || profile?.health_goal || profile?.personal_goal

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Profile Management */}
      <Card className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Profile Management
          </CardTitle>
          <CardDescription>
            {percentage === 100 ? "Your profile is complete" : "Manage your profile setup"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasBasicInfo && (
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>{profile.first_name}</strong> • {profile.role}
              </p>
              {profile.children_count > 0 && <p>{profile.children_count} children</p>}
            </div>
          )}
          <Button
            onClick={() => {
              if (percentage === 100) {
                onNavigateToProfileEditor()
              } else {
                onNavigateToIntake()
              }
            }}
            className={cn(
              "w-full",
              "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
              "text-white border-none",
            )}
          >
            {percentage === 100 ? "Update Profile" : percentage > 0 ? "Continue Setup" : "Start Setup"}
          </Button>
        </CardContent>
      </Card>

      {/* Coaching Insights */}
      <Card className="border-2 border-purple-500/20 hover:border-purple-500/40 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Coaching Insights
          </CardTitle>
          <CardDescription>
            {percentage >= 50
              ? "AI-powered recommendations for your growth"
              : "Complete more of your profile to unlock insights"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {percentage >= 50
              ? "Get personalized coaching tips based on your profile and daily logs."
              : `Complete ${50 - percentage}% more of your profile to unlock personalized coaching insights.`}
          </p>
          <Button
            className={cn(
              "w-full",
              "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
              "text-white border-none",
              percentage < 50 && "opacity-70 cursor-not-allowed",
            )}
            disabled={percentage < 50}
            onClick={onViewInsights}
          >
            {percentage >= 50 ? "View Latest Insights" : "Complete Profile First"}
          </Button>
        </CardContent>
      </Card>

      {/* Goals & Progress */}
      <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Your Goals
          </CardTitle>
          <CardDescription>
            {hasGoals ? "Track progress on your family goals" : "Set up goals in your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasGoals ? (
            <div className="space-y-2 text-sm">
              {profile.family_future_goal && (
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-muted-foreground">Family: {profile.family_future_goal.slice(0, 40)}...</span>
                </div>
              )}
              {profile.health_goal && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-muted-foreground">Health: {profile.health_goal.slice(0, 40)}...</span>
                </div>
              )}
              {profile.personal_goal && (
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span className="text-muted-foreground">Personal: {profile.personal_goal.slice(0, 40)}...</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete your profile setup to define and track your family goals.
            </p>
          )}
          <Button
            onClick={() => {
              if (percentage === 100) {
                onNavigateToProfileEditor()
              } else {
                onNavigateToIntake()
              }
            }}
            className={cn(
              "w-full",
              "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
              "text-white border-none",
            )}
          >
            {hasGoals ? "Update Goals" : "Set Up Goals"}
          </Button>
        </CardContent>
      </Card>

      {/* Chat History */}
      <Card className="border-2 border-gray-500/20 hover:border-gray-500/40 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            Chat History
          </CardTitle>
          <CardDescription>View your previous coaching conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Access your chat history to review past insights and guidance.
          </p>
          <Button
            onClick={onViewChatHistory}
            className={cn(
              "w-full",
              "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
              "text-white border-none",
            )}
          >
            View Chat History
          </Button>
          <Button
            onClick={onViewAISettings}
            className={cn(
              "w-full mt-2",
              "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
              "text-white border-none",
            )}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Usage Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
