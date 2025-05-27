"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { wellnessSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { z } from "zod"

type WellnessFormData = z.infer<typeof wellnessSchema>

interface WellnessFormProps {
  defaultValues?: Partial<WellnessFormData>
  onSubmit: (data: WellnessFormData) => void
}

const healthGoalOptions = [
  "Weight loss",
  "Weight gain",
  "Muscle building",
  "Cardiovascular health",
  "Flexibility",
  "Mental health",
  "Better sleep",
  "Stress reduction",
]

const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", "Paleo", "No restrictions"]

export function WellnessForm({ defaultValues, onSubmit }: WellnessFormProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<WellnessFormData>({
    resolver: zodResolver(wellnessSchema),
    defaultValues: {
      healthGoals: [],
      dietaryRestrictions: [],
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedFitnessLevel = watch("fitnessLevel")
  const watchedHealthGoals = watch("healthGoals") || []
  const watchedDietaryRestrictions = watch("dietaryRestrictions") || []
  const watchedSleepHours = watch("sleepHours") || 8

  const handleHealthGoalChange = (goal: string, checked: boolean) => {
    const current = watchedHealthGoals
    if (checked) {
      setValue("healthGoals", [...current, goal])
    } else {
      setValue(
        "healthGoals",
        current.filter((g) => g !== goal),
      )
    }
  }

  const handleDietaryChange = (restriction: string, checked: boolean) => {
    const current = watchedDietaryRestrictions
    if (checked) {
      setValue("dietaryRestrictions", [...current, restriction])
    } else {
      setValue(
        "dietaryRestrictions",
        current.filter((r) => r !== restriction),
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health & Wellness</CardTitle>
        <CardDescription>Tell us about your health goals and current wellness habits.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Current Fitness Level</Label>
            <Select value={watchedFitnessLevel} onValueChange={(value) => setValue("fitnessLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your fitness level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                <SelectItem value="very-active">Very Active (2x/day or intense)</SelectItem>
              </SelectContent>
            </Select>
            {errors.fitnessLevel && <p className="text-sm text-destructive">{errors.fitnessLevel.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Health Goals (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {healthGoalOptions.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={watchedHealthGoals.includes(goal)}
                    onCheckedChange={(checked) => handleHealthGoalChange(goal, checked as boolean)}
                  />
                  <Label htmlFor={goal} className="text-sm">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
            {errors.healthGoals && <p className="text-sm text-destructive">{errors.healthGoals.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Average Sleep Hours: {watchedSleepHours} hours</Label>
            <Slider
              value={[watchedSleepHours]}
              onValueChange={(value) => setValue("sleepHours", value[0])}
              max={12}
              min={4}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4 hours</span>
              <span>12 hours</span>
            </div>
            {errors.sleepHours && <p className="text-sm text-destructive">{errors.sleepHours.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Dietary Restrictions (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {dietaryOptions.map((restriction) => (
                <div key={restriction} className="flex items-center space-x-2">
                  <Checkbox
                    id={restriction}
                    checked={watchedDietaryRestrictions.includes(restriction)}
                    onCheckedChange={(checked) => handleDietaryChange(restriction, checked as boolean)}
                  />
                  <Label htmlFor={restriction} className="text-sm">
                    {restriction}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Next Step
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
