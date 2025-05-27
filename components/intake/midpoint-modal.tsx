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
import { Trophy, ArrowRight, Clock, Star } from "lucide-react"

interface MidpointModalProps {
  isOpen: boolean
  onKeepGoing: () => void
  onFinishLater: () => void
}

export function MidpointModal({ isOpen, onKeepGoing, onFinishLater }: MidpointModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">You're halfway there!</DialogTitle>
          <DialogDescription className="text-base space-y-2">
            <p>Great progress! You've completed the core setup.</p>
            <p className="text-sm text-muted-foreground">
              Add a few extra details for smarter coaching, or finish later and start using MW3-GPT now.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Star className="h-4 w-4" />
              <span>Continuing unlocks advanced insights and goal tracking</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0">
          <Button onClick={onKeepGoing} className="w-full">
            <ArrowRight className="mr-2 h-4 w-4" />
            Keep Going for Smarter Coaching
          </Button>
          <Button variant="outline" onClick={onFinishLater} className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Finish Later & Start Using MW3-GPT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
