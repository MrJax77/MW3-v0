import { Shield } from "lucide-react"

export function LogoFallback() {
  return (
    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
      <Shield className="h-6 w-6 text-white" />
    </div>
  )
}
