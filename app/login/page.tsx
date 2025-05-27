"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { signInWithMagicLink } from "@/lib/supabase"
import { Mail, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const error = searchParams.get("error")

  useEffect(() => {
    if (error) {
      let errorMessage = "An error occurred during authentication."

      switch (error) {
        case "expired":
        case "otp_expired":
          errorMessage = "The magic link has expired. Please request a new one."
          break
        case "access_denied":
          errorMessage = "Access was denied. The link may be invalid or expired."
          break
        case "auth_failed":
          errorMessage = "Authentication failed. Please try again."
          break
        case "session_failed":
          errorMessage = "Failed to create session. Please try again."
          break
        case "no_user":
          errorMessage = "No user found after authentication. Please try again."
          break
        case "unexpected":
          errorMessage = "An unexpected error occurred. Please try again."
          break
        case "no_code":
          errorMessage = "Invalid authentication link. Please request a new one."
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await signInWithMagicLink(email)
      setIsEmailSent(true)
      toast({
        title: "Magic link sent!",
        description: "Check your email for a secure login link. The link will expire in 1 hour.",
      })
    } catch (error) {
      console.error("Magic link error:", error)
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = () => {
    setIsEmailSent(false)
    setEmail("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to MW3-GPT</CardTitle>
          <CardDescription>Enter your email to receive a secure login link</CardDescription>
        </CardHeader>
        <CardContent>
          {!isEmailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={isLoading || !email}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send secure link
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  We've sent a secure login link to <strong>{email}</strong>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to continue. The link expires in 1 hour.
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={handleResendEmail} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Send new link
                </Button>
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try a different email address.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
