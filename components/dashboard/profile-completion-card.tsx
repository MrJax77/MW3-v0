"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { User, CheckCircle, Clock, RotateCcw, ArrowRight } from "lucide-react"

interface ProfileCompletionCardProps {
  completeness: any
  intakeProgress: any
  onContinueSetup: () => void
  onResetProfile: () => void
}

const stageNames = [
  "Welcome & Consent",
  "Basic Information",
  "Relationships",
  "Health & Wellness",
  "Mindset & Stress",
  "Daily Routine",
  "Future Goals",
  "Family Values",
  "Technology",
  "Preferences",
]

export function ProfileCompletionCard({
  completeness,
  intakeProgress,
  onContinueSetup,
  onResetProfile,
}: ProfileCompletionCardProps) {
  const percentage = completeness?.percentage || 0
  const isComplete = completeness?.isComplete || false
  const completedStages = completeness?.completedStages || []
  const missingStages = completeness?.missingStages || []

  const getStatusColor = () => {
    if (percentage === 0) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    if (percentage < 50) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
    if (percentage < 100) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
  }

  const getStatusText = () => {
    if (percentage === 0) return "Not Started"
    if (percentage < 50) return "Getting Started"
    if (percentage < 100) return "In Progress"
    return "Complete"
  }

  const getNextAction = () => {
    if (percentage === 0) return "Start Profile Setup"
    if (percentage < 100) return "Continue Setup"
    return "Review Profile"
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Setup Progress</CardTitle>
          </div>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </div>
        <CardDescription>Complete your profile to unlock personalized coaching insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {completedStages.length}/{completeness?.totalStages || 10}
            </span>
            <span className="text-lg font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="w-full h-3" />
        </div>

        {/* Stage Progress Grid */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Setup Stages</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stageNames.map((name, index) => {
              const isCompleted = completedStages.includes(index)
              const isExpert = index >= 8

              return (
                <div
                  key={name}
                  className={`p-2 rounded text-xs text-center transition-colors ${
                    isCompleted
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {isCompleted && <CheckCircle className="h-3 w-3" />}
                    {isExpert && "⭐"}
                  </div>
                  <div className="leading-tight">{name}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Missing Stages Alert */}
        {missingStages.length > 0 && percentage > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Still needed for full experience:
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {missingStages.slice(0, 3).map((stage: any, index: number) => (
                <span key={stage.stage}>
                  {stage.name}
                  {index < Math.min(missingStages.length, 3) - 1 && ", "}
                </span>
              ))}
              {missingStages.length > 3 && ` and ${missingStages.length - 3} more`}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onContinueSetup} className="flex-1">
            <ArrowRight className="mr-2 h-4 w-4" />
            {getNextAction()}
          </Button>
          {percentage > 0 && (
            <Button variant="outline" onClick={onResetProfile} size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Last Updated */}
        {intakeProgress?.last_saved && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(intakeProgress.last_saved).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
