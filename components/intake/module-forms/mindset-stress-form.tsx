"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mindsetStressSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { z } from "zod"

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
    formState: { errors, isValid },
  } = useForm<MindsetStressData>({
    resolver: zodResolver(mindsetStressSchema),
    defaultValues: {
      current_stress_level: 5,
      mindfulness_practices: [],
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedStressLevel = watch("current_stress_level") || 5
  const watchedMindfulnessPractices = watch("mindfulness_practices") || []

  const handlePracticeChange = (practice: string, checked: boolean) => {
    const current = watchedMindfulnessPractices
    if (checked) {
      setValue("mindfulness_practices", [...current, practice])
    } else {
      setValue(
        "mindfulness_practices",
        current.filter((p) => p !== practice),
      )
    }
  }

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
              onValueChange={(value) => setValue("current_stress_level", value[0])}
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
            <Label htmlFor="stress_rating_reason">Why did you give that rating for your stress level?</Label>
            <Textarea
              id="stress_rating_reason"
              {...register("stress_rating_reason")}
              placeholder="Describe what's contributing to your stress level (work, family, health, finances, etc.)..."
              rows={3}
            />
            {errors.stress_rating_reason && (
              <p className="text-sm text-destructive">{errors.stress_rating_reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="personal_goal">
              What personal habit or skill would you like to develop in the next 3 months?
            </Label>
            <Textarea
              id="personal_goal"
              {...register("personal_goal")}
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
                    checked={watchedMindfulnessPractices.includes(practice)}
                    onCheckedChange={(checked) => handlePracticeChange(practice, checked as boolean)}
                  />
                  <Label htmlFor={practice} className="text-sm">
                    {practice}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Daily Routine
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
