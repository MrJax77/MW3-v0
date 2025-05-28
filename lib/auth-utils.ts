import { getSupabaseClient } from "./supabase-singleton"
import { getSupabaseServerClient } from "./supabase-singleton"
import { getSupabaseRouteHandlerClient } from "./supabase-singleton"
import { logDebug, logError } from "./debug-utils"

// Client-side authentication functions
export async function getClientUser() {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("getClientUser", error)
      } else {
        logDebug("getClientUser", "No auth session found")
      }
      return null
    }

    return user
  } catch (error) {
    logError("getClientUser", error)
    return null
  }
}

// Server-side authentication functions
export async function getServerUser() {
  try {
    const supabase = getSupabaseServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Only log actual errors, not missing sessions
      if (!error.message.includes("Auth session missing")) {
        logError("getServerUser", error)
      } else {
        logDebug("getServerUser", "No auth session (normal for unauthenticated requests)")
      }
      return null
    }

    return user
  } catch (error) {
    logError("getServerUser", error)
    return null
  }
}

// Route handler authentication functions
export async function getRouteHandlerUser() {
  try {
    const supabase = getSupabaseRouteHandlerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("getRouteHandlerUser", error)
      } else {
        logDebug("getRouteHandlerUser", "No auth session found")
      }
      return null
    }

    return user
  } catch (error) {
    logError("getRouteHandlerUser", error)
    return null
  }
}

// Session verification function for server actions
export async function verifySession() {
  try {
    const supabase = getSupabaseServerClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("verifySession", error)
      } else {
        logDebug("verifySession", "No auth session found")
      }
      return null
    }

    if (!session) {
      logDebug("verifySession", "No active session")
      return null
    }

    return session
  } catch (error) {
    logError("verifySession", error)
    return null
  }
}

// Server-side authentication function
export async function getAuthenticatedUser() {
  try {
    if (typeof window !== "undefined") {
      throw new Error("getAuthenticatedUser should only be called on the server side")
    }

    const supabase = getSupabaseServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("getAuthenticatedUser", error)
      } else {
        logDebug("getAuthenticatedUser", "No auth session found")
      }
      return null
    }

    return user
  } catch (error) {
    logError("getAuthenticatedUser", error)
    throw error
  }
}
