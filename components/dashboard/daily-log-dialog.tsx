"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Calendar, Star, Loader2 } from "lucide-react"
import { saveDailyLogServerAction } from "@/lib/daily-log-actions"
import { useToast } from "@/hooks/use-toast"

const dailyLogSchema = z.object({
  sleepHours: z.number().min(0).max(12),
  exerciseMinutes: z.number().min(0).max(180),
  qualityTime: z.boolean(),
  mood: z.number().min(1).max(5),
  notes: z.string().optional(),
})

type DailyLogData = z.infer<typeof dailyLogSchema>

export function DailyLogDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<DailyLogData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      sleepHours: 8,
      exerciseMinutes: 30,
      qualityTime: false,
      mood: 3,
      notes: "",
    },
    mode: "onChange",
  })

  const sleepHours = watch("sleepHours")
  const exerciseMinutes = watch("exerciseMinutes")
  const qualityTime = watch("qualityTime")
  const mood = watch("mood")

  const onSubmit = async (data: DailyLogData) => {
    setIsLoading(true)
    try {
      await saveDailyLogServerAction(data)
      toast({
        title: "Daily log saved!",
        description: "Your progress has been recorded.",
      })
      setOpen(false)
      reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save daily log. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setValue("mood", i + 1)}
        className={`p-1 transition-colors ${i < mood ? "text-yellow-400" : "text-gray-300"}`}
      >
        <Star className="h-6 w-6 fill-current" />
      </button>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          Log Today
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Log</DialogTitle>
          <DialogDescription>Track your daily wellness metrics to improve your coaching insights.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>Sleep Hours: {sleepHours} hours</Label>
            <Slider
              value={[sleepHours]}
              onValueChange={(value) => setValue("sleepHours", value[0])}
              max={12}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 hours</span>
              <span>12 hours</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Exercise Minutes: {exerciseMinutes} minutes</Label>
            <Slider
              value={[exerciseMinutes]}
              onValueChange={(value) => setValue("exerciseMinutes", value[0])}
              max={180}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 min</span>
              <span>180 min</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="quality-time">Quality time with loved ones</Label>
            <Switch
              id="quality-time"
              checked={qualityTime}
              onCheckedChange={(checked) => setValue("qualityTime", checked)}
            />
          </div>

          <div className="space-y-3">
            <Label>Mood Rating</Label>
            <div className="flex justify-center gap-1">{renderStars()}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Log"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
