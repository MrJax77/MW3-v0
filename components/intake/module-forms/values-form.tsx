"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { valuesSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnhancedTextarea } from "@/components/ui/enhanced-textarea"
import type { z } from "zod"

type ValuesData = z.infer<typeof valuesSchema>

interface ValuesFormProps {
  defaultValues?: Partial<ValuesData>
  onSubmit: (data: ValuesData) => void
}

export function ValuesForm({ defaultValues, onSubmit }: ValuesFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ValuesData>({
    resolver: zodResolver(valuesSchema),
    defaultValues,
    mode: "onChange",
  })

  const watchedFamilyValue = watch("family_value") || ""

  // Form context to help the AI understand the purpose of this form
  const formContext = `This form is about the user's core family values and principles.
  We're looking for meaningful responses about the fundamental values that guide their family's decisions and actions.
  This could include character traits, relationship principles, or life philosophies they want to instill in their family.`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Family Values</CardTitle>
          <Badge variant="secondary">Expert Level</Badge>
        </div>
        <CardDescription>
          Define your family's core principle to enable more values-aligned coaching and deeper purpose-driven insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <EnhancedTextarea
              label="What is one core value or principle that you want your family to live by?"
              field="family_value"
              formContext={formContext}
              value={watchedFamilyValue}
              onValueChange={(value) => setValue("family_value", value, { shouldValidate: true })}
              placeholder="Think about the fundamental principle that guides your family's decisions and actions. This could be:
• A character trait (kindness, integrity, perseverance)
• A way of living (gratitude, service to others, continuous learning)
• A relationship principle (unconditional love, respect, communication)
• A life philosophy (work hard/play hard, faith-centered living, adventure)

What's the one thing you want your children to remember about how your family approaches life?"
              rows={6}
              maxLength={1000}
            />
            {errors.family_value && <p className="text-sm text-destructive">{errors.family_value.message}</p>}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⭐ <strong>Values-Aligned Coaching:</strong> This core value will help us provide guidance that feels
              authentic to your family's identity and supports the legacy you want to create.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Complete Your Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
