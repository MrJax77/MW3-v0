"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { futureGoalsSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedTextarea } from "@/components/ui/enhanced-textarea"
import type { z } from "zod"

type FutureGoalsData = z.infer<typeof futureGoalsSchema>

interface FutureGoalsFormProps {
  defaultValues?: Partial<FutureGoalsData>
  onSubmit: (data: FutureGoalsData) => void
}

export function FutureGoalsForm({ defaultValues, onSubmit }: FutureGoalsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FutureGoalsData>({
    resolver: zodResolver(futureGoalsSchema),
    defaultValues,
    mode: "onChange",
  })

  const watchedFamilyFutureGoal = watch("family_future_goal") || ""

  // Form context to help the AI understand the purpose of this form
  const formContext = `This form is about the user's long-term vision and goals for their family. 
  We're looking for meaningful, aspirational responses about what they hope to achieve as a family.
  This could include travel plans, lifestyle goals, legacy creation, or community impact.`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Family's Future</CardTitle>
        <CardDescription>
          Share your long-term vision to help us provide wisdom and purpose-focused coaching over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <EnhancedTextarea
              label="Looking beyond the next few months, what is one big family goal or dream you hope to achieve in the future?"
              field="family_future_goal"
              formContext={formContext}
              value={watchedFamilyFutureGoal}
              onValueChange={(value) => setValue("family_future_goal", value, { shouldValidate: true })}
              placeholder="Think about your family's 'North Star' - what you're working toward together. This could be:
• A major family experience (travel, adventure, tradition)
• A lifestyle goal (financial freedom, moving somewhere special)
• A legacy you want to create (values you want to pass down)
• An impact you want to make (in your community, through your children)
• A personal or family transformation you envision

Be as specific or aspirational as you'd like!"
              rows={6}
              maxLength={1000}
            />
            {errors.family_future_goal && (
              <p className="text-sm text-destructive">{errors.family_future_goal.message}</p>
            )}
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              🌟 <strong>Your North Star:</strong> This goal will guide our long-term coaching approach, helping us
              suggest daily actions and decisions that align with your family's bigger picture.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Technology
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
