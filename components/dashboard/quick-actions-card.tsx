"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, Settings, TrendingUp, Heart, Target } from "lucide-react"

interface QuickActionsCardProps {
  profile: any
  profileCompleteness: any
  onNavigateToIntake: () => void
  onViewInsights: () => void
}

export function QuickActionsCard({
  profile,
  profileCompleteness,
  onNavigateToIntake,
  onViewInsights,
}: QuickActionsCardProps) {
  const percentage = profileCompleteness?.percentage || 0
  const hasBasicInfo = profile?.first_name && profile?.role
  const hasGoals = profile?.family_future_goal || profile?.health_goal || profile?.personal_goal

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Profile Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
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
          <Button variant="outline" onClick={onNavigateToIntake} className="w-full">
            {percentage === 100 ? "Update Profile" : percentage > 0 ? "Continue Setup" : "Start Setup"}
          </Button>
        </CardContent>
      </Card>

      {/* Coaching Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
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
          <Button variant="outline" className="w-full" disabled={percentage < 50} onClick={onViewInsights}>
            {percentage >= 50 ? "View Latest Insights" : "Complete Profile First"}
          </Button>
        </CardContent>
      </Card>

      {/* Goals & Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
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
          <Button variant="outline" className="w-full" onClick={onNavigateToIntake}>
            {hasGoals ? "Update Goals" : "Set Up Goals"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
