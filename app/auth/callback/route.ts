import { getSupabaseRouteHandlerClient } from "@/lib/supabase-singleton"
import { type NextRequest, NextResponse } from "next/server"
import { logDebug, logError } from "@/lib/debug-utils"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  // Log all URL parameters for debugging
  logDebug("auth-callback", "Auth callback URL:", { url: requestUrl.toString() })
  logDebug("auth-callback", "All search params:", { params: Object.fromEntries(requestUrl.searchParams.entries()) })

  if (error) {
    logError("auth-callback", new Error(`Auth error: ${error} - ${errorDescription}`))
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${encodeURIComponent(errorDescription || "")}`, request.url),
    )
  }

  if (!code) {
    logError("auth-callback", new Error("No code parameter found in callback URL"))
    return NextResponse.redirect(new URL("/login?error=no_code", request.url))
  }

  try {
    const supabase = getSupabaseRouteHandlerClient()

    logDebug("auth-callback", "Exchanging code for session...")

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      logError("auth-callback", exchangeError, { step: "code_exchange" })
      return NextResponse.redirect(
        new URL(
          `/login?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`,
          request.url,
        ),
      )
    }

    if (!data.session) {
      logError("auth-callback", new Error("No session returned after code exchange"))
      return NextResponse.redirect(new URL("/login?error=no_session", request.url))
    }

    logDebug("auth-callback", "Session established successfully", {
      userId: data.user?.id,
      sessionExpires: new Date(data.session.expires_at * 1000).toISOString(),
    })

    // Verify session was properly established
    const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionCheck.session) {
      logError("auth-callback", sessionError || new Error("Session verification failed"))
      return NextResponse.redirect(new URL("/login?error=session_verification_failed", request.url))
    }

    // Check user's survey completion status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_complete, completed_stages")
      .eq("user_id", data.user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      logError("auth-callback", profileError, { step: "profile_check" })
      // If we can't check profile, default to intake
      return NextResponse.redirect(new URL("/intake", request.url))
    }

    // Determine where to redirect based on survey completion
    if (profile?.is_complete) {
      logDebug("auth-callback", "User has completed survey, redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      logDebug("auth-callback", "User has not completed survey, redirecting to intake", {
        completedStages: profile?.completed_stages || 0,
      })
      return NextResponse.redirect(new URL("/intake", request.url))
    }
  } catch (error) {
    logError("auth-callback", error instanceof Error ? error : new Error(String(error)), { step: "overall_process" })
    return NextResponse.redirect(new URL("/login?error=unexpected", request.url))
  }
}
