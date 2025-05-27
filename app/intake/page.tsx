"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useIntakeStore, stepKeys } from "@/lib/intake-store"
import { supabase, getUser } from "@/lib/supabase"
import { ProgressBar } from "@/components/intake/progress-bar"
import { HalfwayModal } from "@/components/intake/halfway-modal"
import { IdentityForm } from "@/components/intake/step-forms/identity-form"
import { HouseholdForm } from "@/components/intake/step-forms/household-form"
import { MindsetForm } from "@/components/intake/step-forms/mindset-form"
import { WellnessForm } from "@/components/intake/step-forms/wellness-form"
import { PurposeForm } from "@/components/intake/step-forms/purpose-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function IntakePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStep, data, setStep, updateData, resetForm } = useIntakeStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showHalfwayModal, setShowHalfwayModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initUser = async () => {
      const user = await getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    initUser()
  }, [])

  const saveToSupabase = async (stepData: any) => {
    if (!userId) return

    setIsLoading(true)
    try {
      const stepKey = stepKeys[currentStep - 1]
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId,
        [stepKey]: stepData,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Progress saved",
        description: "Your information has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving to Supabase:", error)
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepSubmit = async (stepData: any) => {
    const stepKey = stepKeys[currentStep - 1]
    updateData(stepKey, stepData)

    await saveToSupabase(stepData)

    if (currentStep === 5) {
      setShowHalfwayModal(true)
    } else if (currentStep === 10) {
      // Final step - redirect to dashboard
      router.push("/dashboard")
    } else {
      setStep(currentStep + 1)
    }
  }

  const handleHalfwayContinue = () => {
    setShowHalfwayModal(false)
    setStep(6)
  }

  const handleHalfwayLater = () => {
    setShowHalfwayModal(false)
    router.push("/dashboard")
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1)
    }
  }

  const renderCurrentStep = () => {
    const stepKey = stepKeys[currentStep - 1]
    const defaultValues = data[stepKey]

    switch (currentStep) {
      case 1:
        return <IdentityForm defaultValues={defaultValues} onSubmit={handleStepSubmit} />
      case 2:
        return <HouseholdForm defaultValues={defaultValues} onSubmit={handleStepSubmit} />
      case 3:
        return <MindsetForm defaultValues={defaultValues} onSubmit={handleStepSubmit} />
      case 4:
        return <WellnessForm defaultValues={defaultValues} onSubmit={handleStepSubmit} />
      case 5:
        return <PurposeForm defaultValues={defaultValues} onSubmit={handleStepSubmit} />
      case 6:
        return <div className="text-center p-8">Work form coming soon...</div>
      case 7:
        return <div className="text-center p-8">Lifestyle form coming soon...</div>
      case 8:
        return <div className="text-center p-8">Devices form coming soon...</div>
      case 9:
        return <div className="text-center p-8">Finance form coming soon...</div>
      case 10:
        return <div className="text-center p-8">Preferences form coming soon...</div>
      default:
        return <div>Invalid step</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">MW3-GPT Intake</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        <ProgressBar step={currentStep} totalSteps={10} />

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Saving your progress...</span>
          </div>
        )}

        {renderCurrentStep()}

        <HalfwayModal isOpen={showHalfwayModal} onContinue={handleHalfwayContinue} onLater={handleHalfwayLater} />
      </div>
    </div>
  )
}
