import { getSupabaseClient, resetSupabaseClient } from "./supabase-singleton"
import { logDebug, logError } from "./debug-utils"

// User authentication functions
export async function getUser() {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("getUser", error)
      } else {
        logDebug("getUser", "No auth session found")
      }
      return null
    }

    return user
  } catch (error) {
    logError("getUser", error)
    return null
  }
}

export async function signInWithOtp(email: string) {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      logError("signInWithOtp", error)
      throw error
    }

    return data
  } catch (error) {
    logError("signInWithOtp", error)
    throw error
  }
}

export async function verifyOtp(email: string, token: string) {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      logError("verifyOtp", error)
      throw error
    }

    return data
  } catch (error) {
    logError("verifyOtp", error)
    throw error
  }
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      logError("signOut", error)
      throw error
    }

    // Reset the client instance after sign out
    resetSupabaseClient()

    return true
  } catch (error) {
    logError("signOut", error)
    throw error
  }
}

export async function getSession() {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      if (!error.message.includes("Auth session missing")) {
        logError("getSession", error)
      } else {
        logDebug("getSession", "No auth session found")
      }
      return null
    }

    return session
  } catch (error) {
    logError("getSession", error)
    return null
  }
}
