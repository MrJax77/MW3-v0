import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton client for better session management
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "mw3-auth-token",
        debug: process.env.NODE_ENV === "development",
      },
      global: {
        headers: {
          "X-Client-Info": "mw3-gpt-app",
        },
      },
    })

    // Set up comprehensive auth state monitoring
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔄 Auth event: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : "N/A",
        refreshToken: session?.refresh_token ? "present" : "missing",
      })

      switch (event) {
        case "SIGNED_IN":
          console.log("✅ User signed in successfully")
          // Store session info for debugging
          if (session) {
            localStorage.setItem("mw3-last-login", new Date().toISOString())
            localStorage.setItem("mw3-session-expires", new Date(session.expires_at * 1000).toISOString())
          }
          break

        case "SIGNED_OUT":
          console.log("👋 User signed out")
          localStorage.removeItem("mw3-last-login")
          localStorage.removeItem("mw3-session-expires")
          break

        case "TOKEN_REFRESHED":
          console.log("🔄 Token refreshed successfully")
          if (session) {
            localStorage.setItem("mw3-session-expires", new Date(session.expires_at * 1000).toISOString())
          }
          break

        case "USER_UPDATED":
          console.log("👤 User updated")
          break

        default:
          console.log(`🔍 Auth event: ${event}`)
      }
    })
  }

  return supabaseClient
}

// Enhanced session management functions
export async function getUser() {
  try {
    const supabase = getSupabaseClient()

    // First check if we have a valid session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.warn("Session error:", sessionError.message)

      // Try to refresh the session if it's expired
      if (sessionError.message.includes("expired") || sessionError.message.includes("invalid")) {
        console.log("🔄 Attempting to refresh expired session...")
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          console.error("❌ Session refresh failed:", refreshError)
          return null
        }

        if (refreshData.session) {
          console.log("✅ Session refreshed successfully")
          return refreshData.user
        }
      }

      return null
    }

    if (!session) {
      console.log("ℹ️ No active session found")
      return null
    }

    // Check if session is close to expiring (within 5 minutes)
    const expiresAt = session.expires_at * 1000
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    if (expiresAt - now < fiveMinutes) {
      console.log("⚠️ Session expiring soon, refreshing...")
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error("❌ Proactive session refresh failed:", refreshError)
      } else if (refreshData.session) {
        console.log("✅ Session proactively refreshed")
        return refreshData.user
      }
    }

    return session.user
  } catch (error) {
    console.error("getUser exception:", error)
    return null
  }
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Sign out error:", error)
      throw error
    }

    console.log("✅ Signed out successfully")

    // Clear local storage
    localStorage.removeItem("mw3-last-login")
    localStorage.removeItem("mw3-session-expires")
  } catch (error) {
    console.error("Sign out exception:", error)
    throw error
  }
}

export async function signInWithOTP(email: string) {
  try {
    console.log("🔄 Sending OTP to:", email)
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("❌ signInWithOTP error:", error)
      throw error
    }

    console.log("✅ OTP sent successfully")
  } catch (error) {
    console.error("signInWithOTP exception:", error)
    throw error
  }
}

export async function verifyOTP(email: string, token: string) {
  try {
    console.log("🔄 Starting OTP verification for:", email)
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      console.error("❌ OTP verification failed:", error)
      throw error
    }

    console.log("✅ OTP verification successful", {
      hasUser: !!data.user,
      hasSession: !!data.session,
      userId: data.user?.id,
    })

    // Verify session was properly established
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ Session verification failed:", sessionError)
      throw new Error("Failed to establish session after verification")
    }

    if (!session) {
      console.error("❌ No session found after verification")
      throw new Error("Authentication failed - no session created")
    }

    console.log("✅ Session confirmed:", {
      userId: session.user.id,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
      hasRefreshToken: !!session.refresh_token,
    })

    return data
  } catch (error) {
    console.error("verifyOTP exception:", error)
    throw error
  }
}

// Session monitoring utility
export function startSessionMonitoring() {
  if (typeof window === "undefined") return

  const checkSession = async () => {
    try {
      const user = await getUser()
      const lastCheck = localStorage.getItem("mw3-last-session-check")
      const now = new Date().toISOString()

      localStorage.setItem("mw3-last-session-check", now)

      if (!user && lastCheck) {
        console.warn("⚠️ Session lost, user was logged out")
        // Could trigger a re-login flow here if needed
      }
    } catch (error) {
      console.error("Session check failed:", error)
    }
  }

  // Check session every 10 minutes
  const interval = setInterval(checkSession, 10 * 60 * 1000)

  // Initial check
  checkSession()

  return () => clearInterval(interval)
}
