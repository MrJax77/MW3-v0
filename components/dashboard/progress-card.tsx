import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressCardProps {
  title: string
  description: string
  progress: number
  variant: "primary" | "accent" | "warning"
  icon: React.ReactNode
}

export function ProgressCard({ title, description, progress, variant, icon }: ProgressCardProps) {
  const variantStyles = {
    primary: "border-primary/20 bg-primary/5",
    accent: "border-accent/20 bg-accent/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
  }

  const progressStyles = {
    primary: "bg-primary",
    accent: "bg-accent",
    warning: "bg-yellow-500",
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{progress}%</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Progress
          value={progress}
          className="mt-3"
          style={
            {
              "--progress-background": `hsl(var(--${variant === "warning" ? "yellow-500" : variant}))`,
            } as React.CSSProperties
          }
        />
      </CardContent>
    </Card>
  )
}
