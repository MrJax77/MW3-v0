import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface HalfwayModalProps {
  isOpen: boolean
  onClose: () => void
}

const HalfwayModal: React.FC<HalfwayModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Almost there!</DialogTitle>
          <DialogDescription>
            <div>You're halfway through the intake process.</div>
            <div className="text-sm">Please complete the remaining steps to finalize your application.</div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default HalfwayModal
