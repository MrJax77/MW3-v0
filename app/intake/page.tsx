"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useIntakeStore } from "@/lib/intake-store"
import { getUser } from "@/lib/supabase"
import { getProfile } from "@/lib/actions"
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
import { ArrowLeft, Loader2, Save, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveIntakeModule } from "@/lib/actions"

const AUTOSAVE_INTERVAL = 30000 // 30 seconds

export default function IntakePage() {
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
  const [isSaving, setIsSaving] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showMidpointModal, setShowMidpointModal] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Initialize user and load existing profile data
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserId(user.id)

        // Load existing profile data if not already initialized
        if (!isInitialized) {
          try {
            const existingProfile = await getProfile()
            if (existingProfile) {
              console.log("Loading existing profile data:", existingProfile)
              initializeFromProfile(existingProfile)

              // Show success message if resuming
              if (existingProfile.completed_stages > 0) {
                toast({
                  title: "Welcome back!",
                  description: `Resuming from stage ${existingProfile.completed_stages + 1}. Your progress has been saved.`,
                })
              }
            } else {
              // No existing profile, start fresh
              setInitialized(true)
            }
          } catch (error) {
            console.error("Error loading profile:", error)
            // Continue with fresh start if profile load fails
            setInitialized(true)
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error)
        router.push("/login")
      } finally {
        setIsInitializing(false)
      }
    }

    initUser()
  }, [router, isInitialized, initializeFromProfile, setInitialized, toast])

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!userId || currentStage === 0 || currentStage === 10) return

    setIsSaving(true)
    try {
      await saveIntakeModule({
        ...data,
        completed_stages: currentStage,
      })
      updateLastAutoSave()
    } catch (error) {
      console.error("Auto-save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }, [userId, currentStage, data, updateLastAutoSave])

  // Set up auto-save interval
  useEffect(() => {
    const interval = setInterval(autoSave, AUTOSAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [autoSave])

  const saveToSupabase = async (stageData: any, isComplete = false) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      })
      router.push("/login")
      return false
    }

    setIsLoading(true)
    try {
      console.log("Saving stage data:", { currentStage, stageData, isComplete })

      const saveData = {
        ...data,
        ...stageData,
        completed_stages: currentStage,
        is_complete: isComplete,
      }

      console.log("Complete save data:", saveData)

      const result = await saveIntakeModule(saveData)
      console.log("Save result:", result)

      if (!isComplete) {
        toast({
          title: "Progress saved",
          description: "Your information has been saved successfully.",
        })
      }
      return true
    } catch (error) {
      console.error("Error saving stage:", error)

      let errorMessage = "Failed to save your progress. Please try again."
      let errorTitle = "Save Error"

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()

        if (errorMsg.includes("not authenticated") || errorMsg.includes("session")) {
          errorTitle = "Session Expired"
          errorMessage = "Your session has expired. Please log in again."
          router.push("/login")
          return false
        } else if (errorMsg.includes("required field")) {
          errorTitle = "Missing Information"
          errorMessage = "Please fill in all required fields before continuing."
        } else if (errorMsg.includes("too long")) {
          errorTitle = "Text Too Long"
          errorMessage = "One of your responses is too long. Please shorten it and try again."
        } else if (errorMsg.includes("network") || errorMsg.includes("connection")) {
          errorTitle = "Connection Error"
          errorMessage = "Please check your internet connection and try again."
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

  const saveWithRetry = async (stageData: any, isComplete = false, attempt = 1) => {
    try {
      return await saveToSupabase(stageData, isComplete)
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(`Save attempt ${attempt} failed, retrying...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        return saveWithRetry(stageData, isComplete, attempt + 1)
      } else {
        throw error
      }
    }
  }

  const handleStageSubmit = async (stageData: any) => {
    // Update local store
    updateData(stageData)

    // Save to database
    try {
      const saveSuccess = await saveWithRetry(stageData, currentStage === 9)

      if (!saveSuccess) return

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
    } catch (error) {
      console.error("Final save failed after multiple retries:", error)
      toast({
        title: "Critical Error",
        description:
          "Failed to save your progress after multiple attempts. Please check your connection and try again later.",
        variant: "destructive",
      })
    }
  }

  const handleMidpointKeepGoing = () => {
    setShowMidpointModal(false)
    setStage(5)
  }

  const handleMidpointFinishLater = async () => {
    finishLater()
    await saveToSupabase(data, false)
    setShowMidpointModal(false)
    router.push("/dashboard")
  }

  const handleSaveAndFinishLater = async () => {
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

  const showNavigation = currentStage > 0 && currentStage < 10
  const showSaveAndFinishLater = currentStage >= 1 && currentStage <= 8

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
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
              {isSaving && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  Auto-saving...
                </p>
              )}
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>
        )}

        {/* Progress Bar */}
        {showNavigation && <StageProgress currentStage={currentStage} totalStages={10} />}

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
