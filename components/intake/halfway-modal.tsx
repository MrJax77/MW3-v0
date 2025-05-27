"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, ArrowRight, Clock } from "lucide-react"

interface HalfwayModalProps {
  isOpen: boolean
  onContinue: () => void
  onLater: () => void
}

export function HalfwayModal({ isOpen, onContinue, onLater }: HalfwayModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">You're halfway there!</DialogTitle>
          <DialogDescription className="text-base">
            Great progress! Continue for smarter, more personalized coaching recommendations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0">
          <Button onClick={onContinue} className="w-full">
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue to get smarter coaching
          </Button>
          <Button variant="outline" onClick={onLater} className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            I'll finish this later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
