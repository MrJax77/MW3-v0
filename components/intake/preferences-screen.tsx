"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Clock, Shield } from "lucide-react"

const preferencesSchema = z.object({
  notification_channel: z.string().min(1, "Please select a notification preference"),
  quiet_hours_start: z.string().min(1, "Please select quiet hours start time"),
  quiet_hours_end: z.string().min(1, "Please select quiet hours end time"),
  data_deletion_acknowledged: z.boolean().refine((val) => val === true, "Please acknowledge data deletion rights"),
})

type PreferencesData = z.infer<typeof preferencesSchema>

interface PreferencesScreenProps {
  defaultValues?: Partial<PreferencesData>
  onSubmit: (data: PreferencesData) => void
  profileSummary: any
}

export function PreferencesScreen({ defaultValues, onSubmit, profileSummary }: PreferencesScreenProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<PreferencesData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      notification_channel: "email",
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      data_deletion_acknowledged: false,
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedNotificationChannel = watch("notification_channel")
  const watchedQuietStart = watch("quiet_hours_start")
  const watchedQuietEnd = watch("quiet_hours_end")
  const watchedDataDeletion = watch("data_deletion_acknowledged")

  // Add this after the watch declarations for debugging
  console.log("Form validation state:", {
    isValid,
    errors,
    values: {
      notification_channel: watchedNotificationChannel,
      quiet_hours_start: watchedQuietStart,
      quiet_hours_end: watchedQuietEnd,
      data_deletion_acknowledged: watchedDataDeletion,
    },
  })

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0")
    return { value: `${hour}:00`, label: `${hour}:00` }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferences & Review
        </CardTitle>
        <CardDescription>Set your notification preferences and review your profile setup.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Profile Summary</h3>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              {profileSummary?.first_name && <p>• Name: {profileSummary.first_name}</p>}
              {profileSummary?.role && <p>• Role: {profileSummary.role}</p>}
              {profileSummary?.children_count !== undefined && <p>• Children: {profileSummary.children_count}</p>}
              {profileSummary?.family_future_goal && (
                <p>• Main Goal: {profileSummary.family_future_goal.slice(0, 50)}...</p>
              )}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3">
            <Label>How would you like to receive coaching insights?</Label>
            <RadioGroup
              value={watchedNotificationChannel}
              onValueChange={(value) => setValue("notification_channel", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email">Email notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="app" id="app" />
                <Label htmlFor="app">In-app notifications only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">No notifications (I'll check manually)</Label>
              </div>
            </RadioGroup>
            {errors.notification_channel && (
              <p className="text-sm text-destructive">{errors.notification_channel.message}</p>
            )}
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Quiet Hours (no notifications)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start" className="text-sm">
                  Start Time
                </Label>
                <Select value={watchedQuietStart} onValueChange={(value) => setValue("quiet_hours_start", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.quiet_hours_start && (
                  <p className="text-sm text-destructive">{errors.quiet_hours_start.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end" className="text-sm">
                  End Time
                </Label>
                <Select value={watchedQuietEnd} onValueChange={(value) => setValue("quiet_hours_end", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.quiet_hours_end && <p className="text-sm text-destructive">{errors.quiet_hours_end.message}</p>}
              </div>
            </div>
          </div>

          {/* Data Rights */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="data-deletion"
                checked={watchedDataDeletion}
                onCheckedChange={async (checked) => {
                  setValue("data_deletion_acknowledged", checked as boolean)
                  await trigger("data_deletion_acknowledged")
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="data-deletion" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Data Rights Acknowledgment
                </Label>
                <p className="text-xs text-muted-foreground">
                  I understand that I can request deletion of my data at any time by contacting support or using the
                  settings in my dashboard.
                </p>
              </div>
            </div>
            {errors.data_deletion_acknowledged && (
              <p className="text-sm text-destructive">{errors.data_deletion_acknowledged.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid}
            onClick={() => console.log("Button clicked, form valid:", isValid)}
          >
            Complete Setup {!isValid && "(Form Invalid)"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
