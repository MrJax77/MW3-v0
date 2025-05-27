"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Heart, Target, Shield, Clock } from "lucide-react"
import Image from "next/image"

interface WelcomeScreenProps {
  onStart: (consentData: { consent_agreed: boolean }) => void
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [consentAgreed, setConsentAgreed] = useState(false)

  const handleStart = () => {
    if (consentAgreed) {
      onStart({ consent_agreed: true })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/mw3-logo.png"
              alt="MW3 Logo"
              width={100}
              height={50}
              className="h-14 w-auto rounded-full bg-white p-2 shadow-md"
            />
            <div className="text-xl font-light text-muted-foreground">GPT</div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to MW3-GPT</CardTitle>
          <CardDescription className="text-lg">
            <Clock className="inline h-4 w-4 mr-1" />
            10-minute setup for personalized family coaching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What you'll get:</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Personalized relationship and parenting insights</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-500" />
                <span>Daily coaching tips tailored to your family goals</span>
              </div>
              <div className="flex items-center gap-3">
                <Image
                  src="/mw3-logo.png"
                  alt="MW3 Logo"
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full bg-white p-1"
                />
                <span>AI-powered wellness and mindset recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Secure, private data with full control over your information</span>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Your Privacy Matters</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              We use secure encryption to protect your data. You can request deletion at any time, and we never share
              personal information with third parties.
            </p>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="consent"
              checked={consentAgreed}
              onCheckedChange={(checked) => setConsentAgreed(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to secure data processing
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you consent to MW3-GPT securely processing your responses to provide personalized
                coaching insights. You can withdraw consent and request data deletion at any time.
              </p>
            </div>
          </div>

          {/* Start Button */}
          <Button onClick={handleStart} disabled={!consentAgreed} className="w-full h-12 text-lg" size="lg">
            Start My 10-Minute Setup
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You can save your progress and finish later at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
