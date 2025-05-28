"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mindsetStressSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { z } from "zod"
import { EnhancedTextarea } from "@/components/ui/enhanced-textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect } from "react"
import { logDebug } from "@/lib/debug-utils"

type MindsetStressData = z.infer<typeof mindsetStressSchema>

interface MindsetStressFormProps {
  defaultValues?: Partial<MindsetStressData>
  onSubmit: (data: MindsetStressData) => void
}

const mindfulnessPracticesOptions = [
  "Meditation",
  "Journaling",
  "Prayer",
  "Deep breathing exercises",
  "Yoga",
  "Mindful walking",
  "Gratitude practice",
  "Reading/reflection",
  "None currently",
]

export function MindsetStressForm({ defaultValues, onSubmit }: MindsetStressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<MindsetStressData>({
    resolver: zodResolver(mindsetStressSchema),
    defaultValues: {
      current_stress_level: 5,
      stress_rating_reason: defaultValues?.stress_rating_reason || "",
      personal_goal: defaultValues?.personal_goal || "",
      mindfulness_practices: defaultValues?.mindfulness_practices || [],
    },
    mode: "onChange",
  })

  const watchedStressLevel = watch("current_stress_level") || 5
  const watchedMindfulnessPractices = watch("mindfulness_practices") || []
  const watchedStressRatingReason = watch("stress_rating_reason")
  const watchedPersonalGoal = watch("personal_goal")

  // Debug form state
  useEffect(() => {
    logDebug("mindset-form", "Form state:", {
      isValid,
      isDirty,
      errors,
      values: {
        current_stress_level: watchedStressLevel,
        stress_rating_reason: watchedStressRatingReason,
        personal_goal: watchedPersonalGoal,
        mindfulness_practices: watchedMindfulnessPractices,
      },
    })
  }, [
    isValid,
    isDirty,
    errors,
    watchedStressLevel,
    watchedStressRatingReason,
    watchedPersonalGoal,
    watchedMindfulnessPractices,
  ])

  const handlePracticeChange = (practice: string, checked: boolean) => {
    const current = [...(watchedMindfulnessPractices || [])]

    if (checked) {
      // If selecting "None currently", deselect all others
      if (practice === "None currently") {
        setValue("mindfulness_practices", ["None currently"], { shouldValidate: true })
        return
      }

      // If selecting any other option, remove "None currently" if present
      const newPractices = current.filter((p) => p !== "None currently")
      setValue("mindfulness_practices", [...newPractices, practice], { shouldValidate: true })
    } else {
      setValue(
        "mindfulness_practices",
        current.filter((p) => p !== practice),
        { shouldValidate: true },
      )
    }
  }

  // Validate form on mount to ensure button state is correct
  useEffect(() => {
    trigger()
  }, [trigger])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mindset & Stress</CardTitle>
        <CardDescription>Help us understand your mental wellness and personal development goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>
              On a scale from 0–10, how would you rate your overall stress level lately? ({watchedStressLevel}/10)
            </Label>
            <Slider
              value={[watchedStressLevel]}
              onValueChange={(value) => setValue("current_stress_level", value[0], { shouldValidate: true })}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low (0)</span>
              <span>Very High (10)</span>
            </div>
            {errors.current_stress_level && (
              <p className="text-sm text-destructive">{errors.current_stress_level.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <EnhancedTextarea
              label="Why did you give that rating for your stress level?"
              field="stress_rating_reason"
              formContext="This form collects information about the user's mental wellness, stress levels, and personal development goals."
              value={watchedStressRatingReason || ""}
              onValueChange={(value) => {
                setValue("stress_rating_reason", value, { shouldValidate: true })
                trigger("stress_rating_reason")
              }}
              placeholder="Describe what's contributing to your stress level (work, family, health, finances, etc.)..."
              rows={3}
            />
            {errors.stress_rating_reason && (
              <p className="text-sm text-destructive">{errors.stress_rating_reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <EnhancedTextarea
              label="What personal habit or skill would you like to develop in the next 3 months?"
              field="personal_goal"
              formContext="This form collects information about the user's mental wellness, stress levels, and personal development goals."
              value={watchedPersonalGoal || ""}
              onValueChange={(value) => {
                setValue("personal_goal", value, { shouldValidate: true })
                trigger("personal_goal")
              }}
              placeholder="e.g., start meditating, build a reading habit, learn a new skill, practice gratitude..."
              rows={2}
            />
            {errors.personal_goal && <p className="text-sm text-destructive">{errors.personal_goal.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Do you currently practice any form of mindfulness or self-reflection?</Label>
            <div className="grid grid-cols-2 gap-3">
              {mindfulnessPracticesOptions.map((practice) => (
                <div key={practice} className="flex items-center space-x-2">
                  <Checkbox
                    id={practice}
                    checked={watchedMindfulnessPractices?.includes(practice) || false}
                    onCheckedChange={(checked) => handlePracticeChange(practice, checked as boolean)}
                  />
                  <Label htmlFor={practice} className="text-sm">
                    {practice}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
            Continue to Daily Routine
          </Button>

          {/* Debug information */}
          {process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
            <div className="mt-4 p-2 border border-dashed border-gray-300 rounded text-xs">
              <p>Debug: Form valid: {isValid ? "Yes" : "No"}</p>
              <p>Errors: {Object.keys(errors).length > 0 ? JSON.stringify(errors) : "None"}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
