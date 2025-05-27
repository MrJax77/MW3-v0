"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { healthWellnessSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import type { z } from "zod"

type HealthWellnessData = z.infer<typeof healthWellnessSchema>

interface HealthWellnessFormProps {
  defaultValues?: Partial<HealthWellnessData>
  onSubmit: (data: HealthWellnessData) => void
}

export function HealthWellnessForm({ defaultValues, onSubmit }: HealthWellnessFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<HealthWellnessData>({
    resolver: zodResolver(healthWellnessSchema),
    defaultValues: {
      current_health_rating: 7,
      exercise_frequency: 3,
      sleep_hours: 7.5,
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedHealthRating = watch("current_health_rating") || 7
  const watchedExerciseFrequency = watch("exercise_frequency") || 3
  const watchedSleepHours = watch("sleep_hours") || 7.5

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health & Wellness</CardTitle>
        <CardDescription>Tell us about your current health status and wellness goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>
              On a scale from 0–10, how would you rate your overall physical health and energy levels right now? (
              {watchedHealthRating}/10)
            </Label>
            <Slider
              value={[watchedHealthRating]}
              onValueChange={(value) => setValue("current_health_rating", value[0])}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor (0)</span>
              <span>Excellent (10)</span>
            </div>
            {errors.current_health_rating && (
              <p className="text-sm text-destructive">{errors.current_health_rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="health_rating_reason">Why did you give that rating for your health?</Label>
            <Textarea
              id="health_rating_reason"
              {...register("health_rating_reason")}
              placeholder="Describe factors affecting your health (e.g., fatigue, diet, fitness level, sleep quality)..."
              rows={3}
            />
            {errors.health_rating_reason && (
              <p className="text-sm text-destructive">{errors.health_rating_reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="health_goal">
              What health or wellness goal would you like to focus on in the next 3 months?
            </Label>
            <Textarea
              id="health_goal"
              {...register("health_goal")}
              placeholder="e.g., improve sleep quality, exercise regularly, eat healthier, lose weight, reduce stress..."
              rows={2}
            />
            {errors.health_goal && <p className="text-sm text-destructive">{errors.health_goal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>
              How many days per week do you typically exercise or stay active? ({watchedExerciseFrequency} days)
            </Label>
            <Select
              value={watchedExerciseFrequency.toString()}
              onValueChange={(value) => setValue("exercise_frequency", Number.parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i} {i === 1 ? "day" : "days"} per week
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.exercise_frequency && (
              <p className="text-sm text-destructive">{errors.exercise_frequency.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>How many hours of sleep do you usually get per night? ({watchedSleepHours} hours)</Label>
            <Slider
              value={[watchedSleepHours]}
              onValueChange={(value) => setValue("sleep_hours", value[0])}
              max={10}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 hours</span>
              <span>10 hours</span>
            </div>
            {errors.sleep_hours && <p className="text-sm text-destructive">{errors.sleep_hours.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Mindset & Stress
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
