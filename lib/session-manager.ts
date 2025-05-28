import { getSupabaseClient } from "./supabase-singleton"
import { logDebug, logError } from "./debug-utils"

let refreshTimeout: NodeJS.Timeout | null = null

export function startSessionManager() {
  if (typeof window === "undefined") return () => {}

  // Clear any existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }

  const checkAndRefreshSession = async () => {
    try {
      const supabase = getSupabaseClient()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        logDebug("session-manager", "No active session found")
        return
      }

      // Calculate time until expiry
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      // If session expires in less than 10 minutes, refresh it
      if (timeUntilExpiry < 10 * 60 * 1000) {
        logDebug("session-manager", "Session expiring soon, refreshing...")

        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          logError("session-manager", error)
        } else if (data.session) {
          logDebug("session-manager", "Session refreshed successfully", {
            newExpiresAt: new Date(data.session.expires_at * 1000).toISOString(),
          })
        }
      }

      // Schedule next check (every 5 minutes or 1 minute before expiry, whichever is sooner)
      const nextCheckTime = Math.min(5 * 60 * 1000, Math.max(timeUntilExpiry - 60 * 1000, 30 * 1000))
      refreshTimeout = setTimeout(checkAndRefreshSession, nextCheckTime)
    } catch (error) {
      logError("session-manager", error)
      // Even on error, try again in 5 minutes
      refreshTimeout = setTimeout(checkAndRefreshSession, 5 * 60 * 1000)
    }
  }

  // Initial check
  checkAndRefreshSession()

  // Return cleanup function
  return () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
  }
}
