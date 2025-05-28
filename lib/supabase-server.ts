import { getSupabaseServerClient, getSupabaseRouteHandlerClient } from "./supabase-singleton"
import { logDebug, logError } from "./debug-utils"

export async function getServerSession() {
  try {
    const supabase = getSupabaseServerClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("getServerSession", error)
      } else {
        logDebug("getServerSession", "No auth session found")
      }
      return { session: null, supabase }
    }

    return { session, supabase }
  } catch (error) {
    logError("getServerSession", error)
    return { session: null, supabase: getSupabaseServerClient() }
  }
}

export function createSupabaseServerClient() {
  return getSupabaseServerClient()
}

// Add the missing export
export function createSupabaseRouteClient() {
  return getSupabaseRouteHandlerClient()
}
