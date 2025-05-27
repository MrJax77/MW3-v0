"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { technologySchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { z } from "zod"

type TechnologyData = z.infer<typeof technologySchema>

interface TechnologyFormProps {
  defaultValues?: Partial<TechnologyData>
  onSubmit: (data: TechnologyData) => void
}

const wearableOptions = [
  "Apple Watch",
  "Fitbit",
  "Oura Ring",
  "Garmin",
  "Samsung Galaxy Watch",
  "Whoop",
  "Polar",
  "Other fitness tracker",
  "Health apps on phone",
  "None currently",
]

export function TechnologyForm({ defaultValues, onSubmit }: TechnologyFormProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<TechnologyData>({
    resolver: zodResolver(technologySchema),
    defaultValues: {
      wearable_usage: [],
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedWearableUsage = watch("wearable_usage") || []

  const handleWearableChange = (wearable: string, checked: boolean) => {
    const current = watchedWearableUsage
    if (checked) {
      setValue("wearable_usage", [...current, wearable])
    } else {
      setValue(
        "wearable_usage",
        current.filter((w) => w !== wearable),
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Technology & Tracking</CardTitle>
          <Badge variant="secondary">Expert Level</Badge>
        </div>
        <CardDescription>
          Help us understand what health tracking tools you use so we can integrate with them in the future.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>Do you use any health tracking devices or apps?</Label>
            <div className="grid grid-cols-2 gap-3">
              {wearableOptions.map((wearable) => (
                <div key={wearable} className="flex items-center space-x-2">
                  <Checkbox
                    id={wearable}
                    checked={watchedWearableUsage.includes(wearable)}
                    onCheckedChange={(checked) => handleWearableChange(wearable, checked as boolean)}
                  />
                  <Label htmlFor={wearable} className="text-sm">
                    {wearable}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              🔮 <strong>Future Integration:</strong> While not used in the current version, this information helps us
              plan future features that could automatically sync your health data for more personalized coaching.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Family Values
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
