"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { routineSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { z } from "zod"

type RoutineData = z.infer<typeof routineSchema>

interface RoutineFormProps {
  defaultValues?: Partial<RoutineData>
  onSubmit: (data: RoutineData) => void
}

export function RoutineForm({ defaultValues, onSubmit }: RoutineFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RoutineData>({
    resolver: zodResolver(routineSchema),
    defaultValues,
    mode: "onChange",
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Daily Routine</CardTitle>
        <CardDescription>
          Understanding your typical day helps us identify opportunities for positive changes and timely support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="routine_description">
              Briefly describe a typical weekday in your family (morning routine, work/school, evening, etc.), including
              any regular habits like family dinners or exercise.
            </Label>
            <Textarea
              id="routine_description"
              {...register("routine_description")}
              placeholder="Walk us through your day from morning to evening. Include details like:
• Morning routine (wake up time, breakfast, getting kids ready)
• Work schedule and responsibilities
• After-school/work activities
• Evening routine (dinner, homework, bedtime)
• Any regular family activities or personal habits
• Weekend differences (if any)"
              rows={8}
              className="min-h-[200px]"
            />
            {errors.routine_description && (
              <p className="text-sm text-destructive">{errors.routine_description.message}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> The more detail you provide, the better we can identify opportunities to support
              your family's goals and suggest improvements that fit naturally into your existing routine.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Future Goals
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
