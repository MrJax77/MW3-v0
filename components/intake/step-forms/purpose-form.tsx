"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { purposeSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { z } from "zod"

type PurposeFormData = z.infer<typeof purposeSchema>

interface PurposeFormProps {
  defaultValues?: Partial<PurposeFormData>
  onSubmit: (data: PurposeFormData) => void
}

const lifeGoalOptions = [
  "Financial independence",
  "Career advancement",
  "Strong relationships",
  "Health & fitness",
  "Personal growth",
  "Travel & experiences",
  "Family & children",
  "Creative pursuits",
  "Making a difference",
  "Learning & education",
]

const valueOptions = [
  "Honesty",
  "Compassion",
  "Excellence",
  "Innovation",
  "Freedom",
  "Security",
  "Adventure",
  "Family",
  "Success",
  "Balance",
  "Justice",
  "Creativity",
]

export function PurposeForm({ defaultValues, onSubmit }: PurposeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<PurposeFormData>({
    resolver: zodResolver(purposeSchema),
    defaultValues: {
      lifeGoals: [],
      values: [],
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedLifeGoals = watch("lifeGoals") || []
  const watchedValues = watch("values") || []

  const handleLifeGoalChange = (goal: string, checked: boolean) => {
    const current = watchedLifeGoals
    if (checked) {
      setValue("lifeGoals", [...current, goal])
    } else {
      setValue(
        "lifeGoals",
        current.filter((g) => g !== goal),
      )
    }
  }

  const handleValueChange = (value: string, checked: boolean) => {
    const current = watchedValues
    if (checked) {
      setValue("values", [...current, value])
    } else {
      setValue(
        "values",
        current.filter((v) => v !== value),
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purpose & Values</CardTitle>
        <CardDescription>
          Understanding your deeper motivations helps us provide more meaningful guidance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>Life Goals (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {lifeGoalOptions.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={watchedLifeGoals.includes(goal)}
                    onCheckedChange={(checked) => handleLifeGoalChange(goal, checked as boolean)}
                  />
                  <Label htmlFor={goal} className="text-sm">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
            {errors.lifeGoals && <p className="text-sm text-destructive">{errors.lifeGoals.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Core Values (select all that apply)</Label>
            <div className="grid grid-cols-3 gap-3">
              {valueOptions.map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={value}
                    checked={watchedValues.includes(value)}
                    onCheckedChange={(checked) => handleValueChange(value, checked as boolean)}
                  />
                  <Label htmlFor={value} className="text-sm">
                    {value}
                  </Label>
                </div>
              ))}
            </div>
            {errors.values && <p className="text-sm text-destructive">{errors.values.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passions">What are you passionate about?</Label>
            <Textarea
              id="passions"
              {...register("passions")}
              placeholder="Describe what energizes and excites you..."
              rows={3}
            />
            {errors.passions && <p className="text-sm text-destructive">{errors.passions.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legacy">What legacy do you want to leave?</Label>
            <Textarea
              id="legacy"
              {...register("legacy")}
              placeholder="How do you want to be remembered? What impact do you want to make?"
              rows={3}
            />
            {errors.legacy && <p className="text-sm text-destructive">{errors.legacy.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Next Step
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
