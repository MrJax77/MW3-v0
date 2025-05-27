"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react"

interface SuccessScreenProps {
  onGoToDashboard: () => void
  userName?: string
}

export function SuccessScreen({ onGoToDashboard, userName }: SuccessScreenProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-900 dark:text-green-100">
            Welcome to Your Life Portfolio{userName ? `, ${userName}` : ""}!
          </CardTitle>
          <CardDescription className="text-lg text-green-700 dark:text-green-200">
            Your personalized coaching experience is ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {/* Success Message */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Setup Complete!</span>
            </div>
            <p className="text-green-700 dark:text-green-300">
              You've successfully created your personalized family coaching profile. MW3-GPT is now ready to provide
              tailored insights, daily tips, and goal tracking based on your unique situation.
            </p>
          </div>

          {/* What's Next */}
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">What's waiting for you:</h3>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <p>✨ Personalized daily coaching insights</p>
              <p>📊 Progress tracking for your family goals</p>
              <p>💡 AI-powered recommendations tailored to your lifestyle</p>
              <p>📝 Daily wellness logging and habit tracking</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button onClick={onGoToDashboard} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" size="lg">
            <ArrowRight className="mr-2 h-5 w-5" />
            Enter Your Dashboard
          </Button>

          <p className="text-xs text-green-600 dark:text-green-400">
            You can always update your profile or adjust preferences from your dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
