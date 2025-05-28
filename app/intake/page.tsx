"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useIntakeStore } from "@/lib/intake-store"
import { getClientUser } from "@/lib/auth-utils"
import { getClientProfile, testClientDatabaseConnection, saveClientIntakeModule } from "@/lib/client-actions"
import { ErrorBoundary } from "@/components/error-boundary"
import { StageProgress } from "@/components/intake/stage-progress"
import { WelcomeScreen } from "@/components/intake/welcome-screen"
import { MidpointModal } from "@/components/intake/midpoint-modal"
import { PreferencesScreen } from "@/components/intake/preferences-screen"
import { SuccessScreen } from "@/components/intake/success-screen"
import { BasicInfoForm } from "@/components/intake/module-forms/basic-info-form"
import { RelationshipsForm } from "@/components/intake/module-forms/relationships-form"
import { HealthWellnessForm } from "@/components/intake/module-forms/health-wellness-form"
import { MindsetStressForm } from "@/components/intake/module-forms/mindset-stress-form"
import { RoutineForm } from "@/components/intake/module-forms/routine-form"
import { FutureGoalsForm } from "@/components/intake/module-forms/future-goals-form"
import { ValuesForm } from "@/components/intake/module-forms/values-form"
import { TechnologyForm } from "@/components/intake/module-forms/technology-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Clock, AlertTriangle, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { WalletConflictHandler } from "@/components/wallet-conflict-handler"
import { startSessionManager } from "@/lib/session-manager"

function IntakePageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    currentStage,
    data,
    hasShownMidpointModal,
    isInitialized,
    setStage,
    updateData,
    setMidpointModalShown,
    updateLastAutoSave,
    finishLater,
    resetForm,
    initializeFromProfile,
    setInitialized,
  } = useIntakeStore()

  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showMidpointModal, setShowMidpointModal] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize session manager
  useEffect(() => {
    const cleanup = startSessionManager()
    return cleanup
  }, [])

  // Initialize user and load existing profile data
  useEffect(() => {
    const initUser = async () => {
      try {
        console.log("🔄 Initializing user...")

        // Use client-side authentication function
        const user = await getClientUser()
        if (!user) {
          console.log("❌ No user found - will show welcome screen without auth")
          setIsAuthenticated(false)
          setIsInitializing(false)
          setInitialized(true) // Set initialized to true so welcome screen shows
          return
        }

        console.log("✅ User authenticated:", user.id)
        setUserId(user.id)
        setIsAuthenticated(true)
        setAuthError(null)

        // Load existing profile data if not already initialized
        if (!isInitialized) {
          try {
            console.log("🔄 Loading existing profile...")
            // Use client-side profile fetching function
            const existingProfile = await getClientProfile()

            if (existingProfile) {
              console.log("✅ Profile loaded:", existingProfile)
              initializeFromProfile(existingProfile)

              // Show success message if resuming
              if (existingProfile.completed_stages > 0) {
                toast({
                  title: "Welcome back!",
                  description: `Resuming from stage ${existingProfile.completed_stages + 1}. Your progress has been saved.`,
                })
              }
            } else {
              console.log("ℹ️ No existing profile, starting fresh")
              setInitialized(true)
            }
          } catch (error) {
            console.error("❌ Error loading profile:", error)

            // Check if it's an auth error
            if (error instanceof Error && error.message.includes("Auth session missing")) {
              setAuthError("Your session has expired. Please log in again.")
              setIsAuthenticated(false)
              setIsInitializing(false)
              return
            }

            setLastError(`Profile load failed: ${error instanceof Error ? error.message : "Unknown error"}`)
            // Continue with fresh start if profile load fails
            setInitialized(true)
          }
        }
      } catch (error) {
        console.error("❌ Error initializing user:", error)

        if (error instanceof Error && error.message.includes("Auth session missing")) {
          console.log("🚫 Auth session missing during init - will show welcome screen")
          setIsAuthenticated(false)
          setInitialized(true) // Allow welcome screen to show
        } else {
          setLastError(`Initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`)
          setAuthError("Failed to initialize. Please try refreshing the page.")
          setIsAuthenticated(false)
        }
      } finally {
        setIsInitializing(false)
      }
    }

    initUser()
  }, [router, isInitialized, initializeFromProfile, setInitialized, toast])

  // Monitor auth state
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Use client-side authentication function
        const user = await getClientUser()
        setIsAuthenticated(!!user)
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
      }
    }

    // Check auth status every 5 minutes to prevent session timeouts
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Update the saveToSupabase function to handle authentication errors better
  const saveToSupabase = async (stageData: any, isComplete = false) => {
    if (!userId || !isAuthenticated) {
      // Check authentication status again before giving up
      try {
        console.log("🔄 Re-checking authentication before save...")
        // Use client-side authentication function
        const user = await getClientUser()

        if (!user) {
          const errorMsg = "Your session has expired. Please log in again."
          setLastError(errorMsg)
          setAuthError(errorMsg)
          setIsAuthenticated(false)
          toast({
            title: "Authentication Error",
            description: errorMsg,
            variant: "destructive",
          })
          return false
        } else {
          // User is authenticated, update state and continue
          console.log("✅ Authentication re-verified successfully")
          setUserId(user.id)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("❌ Authentication re-check failed:", error)
        const errorMsg = "Your session has expired. Please log in again."
        setLastError(errorMsg)
        setAuthError(errorMsg)
        setIsAuthenticated(false)
        toast({
          title: "Authentication Error",
          description: errorMsg,
          variant: "destructive",
        })
        return false
      }
    }

    setIsLoading(true)
    setLastError(null)

    try {
      console.log("🔄 Saving stage data:", { currentStage, stageData, isComplete })

      const saveData = {
        ...data,
        ...stageData,
        completed_stages: currentStage,
        is_complete: isComplete,
      }

      // Add data validation before sending
      if (currentStage >= 1 && !saveData.first_name?.trim()) {
        throw new Error("First name is required")
      }
      if (currentStage >= 1 && (!saveData.age || saveData.age < 0 || saveData.age > 120)) {
        throw new Error("Valid age is required")
      }

      console.log("🔄 Complete save data:", saveData)

      const result = await saveClientIntakeModule(saveData)
      console.log("✅ Save successful:", result)

      if (!isComplete) {
        toast({
          title: "Progress saved",
          description: "Your information has been saved successfully.",
        })
      }

      // Update last save timestamp
      updateLastAutoSave()

      return true
    } catch (error) {
      console.error("❌ Save error:", error)

      let errorMessage = "Failed to save your progress. Please try again."
      let errorTitle = "Save Error"

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        setLastError(error.message)

        if (
          errorMsg.includes("session has expired") ||
          errorMsg.includes("not authenticated") ||
          errorMsg.includes("auth session missing")
        ) {
          errorTitle = "Session Expired"
          errorMessage = "Your session has expired. Please log in again."
          setAuthError(errorMessage)
          setIsAuthenticated(false)
          return false
        } else if (errorMsg.includes("validation failed") || errorMsg.includes("required")) {
          errorTitle = "Missing Information"
          errorMessage = "Please fill in all required fields before continuing."
        } else if (errorMsg.includes("too long")) {
          errorTitle = "Text Too Long"
          errorMessage = "One of your responses is too long. Please shorten it and try again."
        } else if (errorMsg.includes("connection") || errorMsg.includes("network")) {
          errorTitle = "Connection Error"
          errorMessage = "Please check your internet connection and try again."
        } else if (errorMsg.includes("database")) {
          errorTitle = "Database Error"
          errorMessage = "There was a problem saving your data. Please try again in a moment."
        } else {
          errorMessage = `Save failed: ${error.message}`
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleStageSubmit = async (stageData: any) => {
    console.log("🔄 Handling stage submit:", {
      currentStage,
      stageData,
      isAuthenticated,
      userId: !!userId,
      dataKeys: Object.keys(stageData || {}),
    })

    // Update local store first (this is safe and doesn't require auth)
    updateData(stageData)

    // Stage 0 (welcome screen) - just move to next stage, no saving
    if (currentStage === 0) {
      console.log("✅ Stage 0 (welcome) complete, moving to stage 1 - NO SAVE ATTEMPTED")
      setStage(1)
      return
    }

    // For stages 1+, authentication is absolutely required
    if (!isAuthenticated || !userId) {
      console.log("❌ Not authenticated for stage", currentStage, "- cannot save")
      setAuthError("Please log in to save your progress")
      toast({
        title: "Authentication Required",
        description: "Please log in to save your progress and continue.",
        variant: "destructive",
      })
      return
    }

    console.log("✅ Authentication verified, proceeding with save for stage", currentStage)

    // Save to database for stages 1-9
    const saveSuccess = await saveToSupabase(stageData, currentStage === 9)

    if (!saveSuccess) {
      console.log("❌ Save failed, not progressing to next stage")
      return
    }

    // Handle stage progression
    if (currentStage === 4 && !hasShownMidpointModal) {
      setShowMidpointModal(true)
      setMidpointModalShown(true)
    } else if (currentStage === 9) {
      // Final stage - mark as complete
      setStage(10)
    } else {
      setStage(currentStage + 1)
    }
  }

  const handleMidpointKeepGoing = () => {
    setShowMidpointModal(false)
    setStage(5)
  }

  const handleMidpointFinishLater = async () => {
    if (!isAuthenticated) {
      setAuthError("Please log in to save your progress")
      return
    }

    finishLater()
    await saveToSupabase(data, false)
    setShowMidpointModal(false)
    router.push("/dashboard")
  }

  const handleSaveAndFinishLater = async () => {
    if (!isAuthenticated) {
      setAuthError("Please log in to save your progress")
      return
    }

    finishLater()
    await saveToSupabase(data, false)
    router.push("/dashboard")
  }

  const handleBack = () => {
    if (currentStage > 0) {
      setStage(currentStage - 1)
    }
  }

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  const handleGoToLogin = () => {
    router.push("/login")
  }

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 0:
        return <WelcomeScreen onStart={handleStageSubmit} />
      case 1:
        return <BasicInfoForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 2:
        return <RelationshipsForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 3:
        return <HealthWellnessForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 4:
        return <MindsetStressForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 5:
        return <RoutineForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 6:
        return <FutureGoalsForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 7:
        return <ValuesForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 8:
        return <TechnologyForm defaultValues={data} onSubmit={handleStageSubmit} />
      case 9:
        return <PreferencesScreen defaultValues={data} onSubmit={handleStageSubmit} profileSummary={data} />
      case 10:
        return <SuccessScreen onGoToDashboard={handleGoToDashboard} userName={data.first_name} />
      default:
        return <div>Invalid stage</div>
    }
  }

  const showNavigation = currentStage > 0 && currentStage < 10 && (isAuthenticated || currentStage === 0)
  const showSaveAndFinishLater = currentStage >= 1 && currentStage <= 8 && isAuthenticated

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Show authentication error screen - but allow stage 0 (welcome) to proceed
  if (!isAuthenticated && currentStage > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            Please log in to continue with the intake form and save your progress.
          </p>
          <div className="space-y-2">
            <Button onClick={handleGoToLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
            <Button variant="outline" onClick={() => setStage(0)} className="w-full">
              Back to Welcome
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const testConnection = async () => {
    try {
      setConnectionStatus("Testing...")
      // Use client-side database connection test
      const result = await testClientDatabaseConnection()
      if (result.success) {
        setConnectionStatus("✅ Database connection successful!")
        toast({
          title: "Connection Test",
          description: "Database is working properly!",
        })
      } else {
        setConnectionStatus(`❌ Connection failed: ${result.error}`)
        toast({
          title: "Connection Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus(`❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Add wallet conflict handler */}
        <WalletConflictHandler />

        {/* Header with Navigation */}
        {showNavigation && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStage === 0 || isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">MW3-GPT Setup</h1>
              {isLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </p>
              )}
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>
        )}

        {showNavigation && (
          <div className="flex items-center justify-center mb-4">
            <Button variant="outline" size="sm" onClick={testConnection} disabled={isLoading}>
              Test Database Connection
            </Button>
            {connectionStatus && <p className="ml-3 text-sm text-muted-foreground">{connectionStatus}</p>}
          </div>
        )}

        {/* Progress Bar */}
        {showNavigation && <StageProgress currentStage={currentStage} totalStages={10} />}

        {/* Error Display */}
        {lastError && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Last Error:</p>
              <p className="text-xs text-destructive/80">{lastError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLastError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200">Saving your progress...</span>
          </div>
        )}

        {/* Current Stage Content */}
        {renderCurrentStage()}

        {/* Save and Finish Later Button */}
        {showSaveAndFinishLater && (
          <div className="text-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleSaveAndFinishLater}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <Clock className="mr-2 h-4 w-4" />
              Save & Finish Later
            </Button>
          </div>
        )}

        {/* Midpoint Modal */}
        <MidpointModal
          isOpen={showMidpointModal}
          onKeepGoing={handleMidpointKeepGoing}
          onFinishLater={handleMidpointFinishLater}
        />
      </div>
    </div>
  )
}

export default function IntakePage() {
  return (
    <ErrorBoundary>
      <IntakePageContent />
    </ErrorBoundary>
  )
}
