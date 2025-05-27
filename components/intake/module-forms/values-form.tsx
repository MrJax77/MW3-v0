"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { valuesSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
    formState: { errors, isValid },
  } = useForm<ValuesData>({
    resolver: zodResolver(valuesSchema),
    defaultValues,
    mode: "onChange",
  })

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
            <Label htmlFor="family_value">
              What is one core value or principle that you want your family to live by?
            </Label>
            <Textarea
              id="family_value"
              {...register("family_value")}
              placeholder="Think about the fundamental principle that guides your family's decisions and actions. This could be:
• A character trait (kindness, integrity, perseverance)
• A way of living (gratitude, service to others, continuous learning)
• A relationship principle (unconditional love, respect, communication)
• A life philosophy (work hard/play hard, faith-centered living, adventure)

What's the one thing you want your children to remember about how your family approaches life?"
              rows={6}
              className="min-h-[150px]"
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
