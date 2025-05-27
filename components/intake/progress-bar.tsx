import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  step: number
  totalSteps: number
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const progress = (step / totalSteps) * 100

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  )
}
