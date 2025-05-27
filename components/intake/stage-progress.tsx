import { Progress } from "@/components/ui/progress"

interface StageProgressProps {
  currentStage: number
  totalStages: number
}

export function StageProgress({ currentStage, totalStages }: StageProgressProps) {
  // Custom progress calculation based on the flow
  const getProgressPercentage = (stage: number) => {
    if (stage === 0) return 0
    if (stage <= 4) return (stage / 4) * 45 // Core modules: 0 → 45%
    if (stage <= 7) return 45 + ((stage - 4) / 3) * 35 // Deep modules: 45% → 80%
    if (stage === 8) return 85 // Expert module: 85%
    if (stage === 9) return 95 // Preferences: 95%
    return 100 // Success: 100%
  }

  const progress = getProgressPercentage(currentStage)
  const isCore = currentStage >= 1 && currentStage <= 4
  const isDeep = currentStage >= 5 && currentStage <= 7
  const isExpert = currentStage === 8

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {currentStage === 0 && "Getting Started"}
          {isCore && `Core Setup: Stage ${currentStage} of 4`}
          {isDeep && `Deep Insights: Stage ${currentStage - 4} of 3`}
          {isExpert && "Expert Setup"}
          {currentStage === 9 && "Final Preferences"}
          {currentStage === 10 && "Complete!"}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <Progress value={progress} className="w-full" />

      {/* Stage indicators */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Start</span>
        <span>Core (45%)</span>
        <span>Deep (80%)</span>
        <span>Done</span>
      </div>
    </div>
  )
}
