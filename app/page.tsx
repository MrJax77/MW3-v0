"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Target, ArrowRight, Loader2, Lightbulb } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getUser()
        if (currentUser) {
          // User is logged in, redirect to dashboard
          console.log("User already logged in, redirecting to dashboard")
          router.push("/dashboard")
          return
        }
        setUser(null)
      } catch (error) {
        console.error("Auth check error:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Image
              src="/mw3-logo.png"
              alt="MW3 Logo"
              width={160}
              height={80}
              className="h-20 w-auto rounded-full bg-white p-2 shadow-lg"
              priority
            />
            <div className="text-3xl font-light text-muted-foreground">GPT</div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
              AI-Powered Family
              <span className="text-primary block">Coaching Platform</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized insights, daily coaching tips, and goal tracking tailored to your unique family
              situation.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button size="lg" className="h-14 px-8 text-lg" onClick={() => router.push("/login")}>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              10-minute setup • Personalized insights • Secure & private
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Relationship Insights</CardTitle>
              <CardDescription>
                Get personalized advice for strengthening your relationships with your spouse and children.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Goal Tracking</CardTitle>
              <CardDescription>
                Set and track family goals with AI-powered recommendations for achieving them.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Daily Coaching</CardTitle>
              <CardDescription>
                Receive daily insights and tips tailored to your family's unique needs and challenges.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pt-8 border-t">
          <p className="text-sm text-muted-foreground">Secure, private, and designed for busy families</p>
        </div>
      </div>
    </div>
  )
}
