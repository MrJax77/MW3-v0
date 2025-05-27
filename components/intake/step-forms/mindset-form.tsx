"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mindsetSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { z } from "zod"

type MindsetFormData = z.infer<typeof mindsetSchema>

interface MindsetFormProps {
  defaultValues?: Partial<MindsetFormData>
  onSubmit: (data: MindsetFormData) => void
}

export function MindsetForm({ defaultValues, onSubmit }: MindsetFormProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<MindsetFormData>({
    resolver: zodResolver(mindsetSchema),
    defaultValues,
    mode: "onChange",
  })

  const watchedPersonalityType = watch("personalityType")
  const watchedMotivationStyle = watch("motivationStyle")
  const watchedLearningStyle = watch("learningStyle")
  const watchedStressLevel = watch("stressLevel") || 5

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Mindset & Personality</CardTitle>
        <CardDescription>Understanding your personality helps us tailor coaching to your style.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Personality Type</Label>
            <Select value={watchedPersonalityType} onValueChange={(value) => setValue("personalityType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your personality type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="introvert">Introvert</SelectItem>
                <SelectItem value="extrovert">Extrovert</SelectItem>
                <SelectItem value="ambivert">Ambivert</SelectItem>
                <SelectItem value="not-sure">Not sure</SelectItem>
              </SelectContent>
            </Select>
            {errors.personalityType && <p className="text-sm text-destructive">{errors.personalityType.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Current Stress Level: {watchedStressLevel}/10</Label>
            <Slider
              value={[watchedStressLevel]}
              onValueChange={(value) => setValue("stressLevel", value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
            {errors.stressLevel && <p className="text-sm text-destructive">{errors.stressLevel.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Motivation Style</Label>
            <Select value={watchedMotivationStyle} onValueChange={(value) => setValue("motivationStyle", value)}>
              <SelectTrigger>
                <SelectValue placeholder="What motivates you most?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="achievement">Achievement & Goals</SelectItem>
                <SelectItem value="recognition">Recognition & Praise</SelectItem>
                <SelectItem value="autonomy">Independence & Freedom</SelectItem>
                <SelectItem value="connection">Connection & Relationships</SelectItem>
                <SelectItem value="growth">Learning & Growth</SelectItem>
                <SelectItem value="security">Security & Stability</SelectItem>
              </SelectContent>
            </Select>
            {errors.motivationStyle && <p className="text-sm text-destructive">{errors.motivationStyle.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Learning Style</Label>
            <Select value={watchedLearningStyle} onValueChange={(value) => setValue("learningStyle", value)}>
              <SelectTrigger>
                <SelectValue placeholder="How do you learn best?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visual">Visual (seeing, reading)</SelectItem>
                <SelectItem value="auditory">Auditory (listening, discussing)</SelectItem>
                <SelectItem value="kinesthetic">Hands-on (doing, practicing)</SelectItem>
                <SelectItem value="mixed">Mixed approach</SelectItem>
              </SelectContent>
            </Select>
            {errors.learningStyle && <p className="text-sm text-destructive">{errors.learningStyle.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Next Step
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
