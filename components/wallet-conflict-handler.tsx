"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

export function WalletConflictHandler() {
  const [hasWalletConflict, setHasWalletConflict] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [conflictingWallets, setConflictingWallets] = useState<string[]>([])

  useEffect(() => {
    // Check for wallet extension conflicts
    const checkWalletConflicts = () => {
      try {
        const detectedWallets: string[] = []

        // Check for various wallet extensions
        if (typeof window !== "undefined") {
          if ((window as any).ethereum) detectedWallets.push("MetaMask/Ethereum")
          if ((window as any).backpack) detectedWallets.push("Backpack")
          if ((window as any).phantom) detectedWallets.push("Phantom")
          if ((window as any).solana) detectedWallets.push("Solana")
          if ((window as any).coinbaseWalletExtension) detectedWallets.push("Coinbase Wallet")
          if ((window as any).trustWallet) detectedWallets.push("Trust Wallet")
        }

        if (detectedWallets.length > 1) {
          setHasWalletConflict(true)
          setConflictingWallets(detectedWallets)
          console.warn("🔶 Multiple wallet extensions detected:", detectedWallets)
        }
      } catch (error) {
        console.warn("Wallet conflict check failed:", error)
      }
    }

    // Override console.error to catch ethereum property errors
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(" ")
      if (
        (message.includes("ethereum") && message.includes("getter")) ||
        message.includes("Cannot set property ethereum") ||
        message.includes("Cannot redefine property: ethereum")
      ) {
        setHasWalletConflict(true)
        console.warn("🔶 Wallet extension conflict detected in console errors")
      }
      originalError.apply(console, args)
    }

    // Check immediately and after a short delay
    checkWalletConflicts()
    const timeoutId = setTimeout(checkWalletConflicts, 1000)

    // Cleanup
    return () => {
      console.error = originalError
      clearTimeout(timeoutId)
    }
  }, [])

  if (!hasWalletConflict || isDismissed) {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">Wallet Extension Conflict Detected</AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <div className="space-y-2">
          <div>Multiple wallet extensions are conflicting: {conflictingWallets.join(", ")}</div>
          <div className="text-sm">
            This may cause JavaScript errors in the console but won't affect your data saving or the app functionality.
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800"
            >
              <X className="mr-1 h-3 w-3" />
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
