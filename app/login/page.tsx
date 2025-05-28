"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { startSessionManager } from "@/lib/session-manager"
import { getUser } from "@/lib/supabase"
import { getSupabaseClient } from "@/lib/supabase-singleton"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const error = searchParams.get("error")

  // Start session monitoring
  useEffect(() => {
    // Initialize the session manager for token refresh
    const sessionCleanup = startSessionManager()

    // Check for existing auth and survey completion
    const checkExistingAuth = async () => {
      try {
        console.log("🔍 Checking existing authentication...")
        const user = await getUser()
        if (user) {
          console.log("✅ User already authenticated:", user.id)

          // Check survey completion status
          const supabase = getSupabaseClient()
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_complete, completed_stages")
            .eq("user_id", user.id)
            .single()

          if (profileError && profileError.code !== "PGRST116") {
            console.warn("⚠️ Could not check profile, defaulting to intake")
            setIsRedirecting(true)
            router.replace("/intake")
            return
          }

          setIsRedirecting(true)
          if (profile?.is_complete) {
            console.log("🔄 User completed survey, redirecting to dashboard...")
            router.replace("/dashboard")
          } else {
            console.log("🔄 User has not completed survey, redirecting to intake...")
            router.replace("/intake")
          }
        } else {
          console.log("ℹ️ No existing auth session - showing login form")
        }
      } catch (error) {
        console.log("ℹ️ No existing auth session (this is normal)")
      }
    }

    checkExistingAuth()

    return () => {
      sessionCleanup()
    }
  }, [router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [cooldownSeconds])

  useEffect(() => {
    if (error) {
      let errorMessage = "An error occurred during authentication."

      switch (error) {
        case "expired":
        case "otp_expired":
          errorMessage = "The code has expired. Please request a new one."
          break
        case "invalid_otp":
          errorMessage = "Invalid code. Please check and try again."
          break
        case "auth_failed":
          errorMessage = "Authentication failed. Please try again."
          break
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      })

      // Clear the error from URL after showing it
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [error, toast])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || cooldownSeconds > 0) return

    setIsLoading(true)
    try {
      console.log("🔄 Sending OTP to:", email)

      // Use the Supabase client directly for sending OTP
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setIsOtpSent(true)
      setCooldownSeconds(60) // Set 60 second cooldown
      toast({
        title: "Code sent!",
        description: "Check your email for a 6-digit verification code.",
      })
    } catch (error: any) {
      console.error("❌ OTP send error:", error)

      // Handle rate limiting specifically
      if (error.message?.includes("you can only request this after")) {
        const match = error.message.match(/after (\d+) seconds/)
        const seconds = match ? Number.parseInt(match[1]) : 60
        setCooldownSeconds(seconds)
        toast({
          title: "Please wait",
          description: `You can request a new code in ${seconds} seconds.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) return

    setIsLoading(true)
    try {
      console.log("🔄 Verifying OTP for:", email)

      // Use the Supabase client directly for OTP verification
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })

      if (error) {
        console.error("❌ OTP verification failed:", error)
        throw error
      }

      console.log("✅ OTP verification successful", {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
      })

      // Verify session was properly established
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("❌ Session verification failed:", sessionError)
        throw new Error("Failed to establish session after verification")
      }

      if (!session) {
        console.error("❌ No session found after verification")
        throw new Error("Authentication failed - no session created")
      }

      console.log("✅ Session confirmed:", {
        userId: session.user.id,
        expiresAt: new Date(session.expires_at * 1000).toISOString(),
        hasRefreshToken: !!session.refresh_token,
      })

      // Check survey completion status before redirecting
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_complete, completed_stages")
        .eq("user_id", session.user.id)
        .single()

      toast({
        title: "Success!",
        description: "You've been logged in successfully.",
      })

      setIsRedirecting(true)

      // Add a small delay to ensure cookies are properly set
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Route based on survey completion
      if (profileError && profileError.code !== "PGRST116") {
        console.warn("⚠️ Could not check profile, defaulting to intake")
        router.replace("/intake")
      } else if (profile?.is_complete) {
        console.log("🔄 User completed survey, redirecting to dashboard...")
        router.replace("/dashboard")
      } else {
        console.log("🔄 User has not completed survey, redirecting to intake...")
        router.replace("/intake")
      }
    } catch (error) {
      console.error("❌ OTP verify error:", error)

      // Reset form state on error
      setIsOtpSent(false)
      setOtp("")

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid code. Please check and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = () => {
    if (cooldownSeconds > 0) return
    setIsOtpSent(false)
    setOtp("")
  }

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-center text-muted-foreground">Checking your profile...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/mw3-logo.png"
              alt="MW3 Logo"
              width={80}
              height={40}
              className="h-12 w-auto rounded-full bg-white p-2 shadow-md"
            />
            <div className="text-lg font-light text-muted-foreground">GPT</div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            {!isOtpSent
              ? "Enter your email to receive a verification code"
              : "Enter the 6-digit code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOtpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !email || cooldownSeconds > 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldownSeconds > 0 ? (
                  `Wait ${cooldownSeconds}s`
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send verification code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We've sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <Button
                  variant="outline"
                  onClick={handleResendOTP}
                  className="w-full"
                  disabled={isLoading || cooldownSeconds > 0}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : "Send new code"}
                </Button>
                <p className="text-xs text-muted-foreground">Didn't receive the code? Check your spam folder.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
