"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { relationshipsSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { z } from "zod"

type RelationshipsData = z.infer<typeof relationshipsSchema>

interface RelationshipsFormProps {
  defaultValues?: Partial<RelationshipsData>
  onSubmit: (data: RelationshipsData) => void
}

const upcomingEventsOptions = [
  "New baby",
  "Moving house",
  "Job change",
  "School transition",
  "Wedding",
  "Family vacation",
  "Health challenge",
  "Financial change",
  "Other major event",
]

export function RelationshipsForm({ defaultValues, onSubmit }: RelationshipsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<RelationshipsData>({
    resolver: zodResolver(relationshipsSchema),
    defaultValues: {
      spouse_relationship_rating: 7,
      children_relationship_rating: 8,
      upcoming_events: [],
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedSpouseRating = watch("spouse_relationship_rating") || 7
  const watchedChildrenRating = watch("children_relationship_rating") || 8
  const watchedUpcomingEvents = watch("upcoming_events") || []

  const handleEventChange = (event: string, checked: boolean) => {
    const current = watchedUpcomingEvents
    if (checked) {
      setValue("upcoming_events", [...current, event])
    } else {
      setValue(
        "upcoming_events",
        current.filter((e) => e !== event),
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Relationships</CardTitle>
        <CardDescription>Help us understand your family dynamics and relationship goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>
              On a scale from 0–10, how would you rate your relationship with your spouse/partner right now? (
              {watchedSpouseRating}/10)
            </Label>
            <Slider
              value={[watchedSpouseRating]}
              onValueChange={(value) => setValue("spouse_relationship_rating", value[0])}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor (0)</span>
              <span>Excellent (10)</span>
            </div>
            {errors.spouse_relationship_rating && (
              <p className="text-sm text-destructive">{errors.spouse_relationship_rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouse_relationship_reason">
              Why did you choose that rating for your relationship with your spouse?
            </Label>
            <Textarea
              id="spouse_relationship_reason"
              {...register("spouse_relationship_reason")}
              placeholder="Describe what's working well or what challenges you're facing..."
              rows={3}
            />
            {errors.spouse_relationship_reason && (
              <p className="text-sm text-destructive">{errors.spouse_relationship_reason.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>
              On a scale from 0–10, how would you rate your overall relationship with your children right now? (
              {watchedChildrenRating}/10)
            </Label>
            <Slider
              value={[watchedChildrenRating]}
              onValueChange={(value) => setValue("children_relationship_rating", value[0])}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Challenging (0)</span>
              <span>Amazing (10)</span>
            </div>
            {errors.children_relationship_rating && (
              <p className="text-sm text-destructive">{errors.children_relationship_rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="children_relationship_reason">
              Why did you choose that rating for your relationship with your children?
            </Label>
            <Textarea
              id="children_relationship_reason"
              {...register("children_relationship_reason")}
              placeholder="Share what's going well or what you'd like to improve..."
              rows={3}
            />
            {errors.children_relationship_reason && (
              <p className="text-sm text-destructive">{errors.children_relationship_reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouse_relationship_goal">
              What's one goal you have for your relationship with your spouse in the next 3 months?
            </Label>
            <Textarea
              id="spouse_relationship_goal"
              {...register("spouse_relationship_goal")}
              placeholder="e.g., Have more date nights, communicate better, plan a trip together..."
              rows={2}
            />
            {errors.spouse_relationship_goal && (
              <p className="text-sm text-destructive">{errors.spouse_relationship_goal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parenting_goal">
              What experiences or values do you want to emphasize with your children in the next 3 months?
            </Label>
            <Textarea
              id="parenting_goal"
              {...register("parenting_goal")}
              placeholder="e.g., Spend more quality time, teach responsibility, create family traditions..."
              rows={2}
            />
            {errors.parenting_goal && <p className="text-sm text-destructive">{errors.parenting_goal.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Are there any big family events or changes coming up soon?</Label>
            <div className="grid grid-cols-2 gap-3">
              {upcomingEventsOptions.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={watchedUpcomingEvents.includes(event)}
                    onCheckedChange={(checked) => handleEventChange(event, checked as boolean)}
                  />
                  <Label htmlFor={event} className="text-sm">
                    {event}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Health & Wellness
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
