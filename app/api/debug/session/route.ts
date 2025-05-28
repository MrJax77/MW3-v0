import { getSupabaseRouteHandlerClient } from "@/lib/supabase-singleton"
import { NextResponse } from "next/server"
import { logError } from "@/lib/debug-utils"

export async function GET() {
  try {
    const supabase = getSupabaseRouteHandlerClient()

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      logError("debug-session", sessionError)
      return NextResponse.json({ error: sessionError.message, status: "error" }, { status: 500 })
    }

    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      logError("debug-session", userError)
      return NextResponse.json({ error: userError.message, status: "error" }, { status: 500 })
    }

    // Sanitize the response to remove sensitive data
    const sanitizedSession = sessionData.session
      ? {
          expires_at: sessionData.session.expires_at,
          user_id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          last_sign_in_at: sessionData.session.user.last_sign_in_at,
          created_at: sessionData.session.user.created_at,
          updated_at: sessionData.session.user.updated_at,
        }
      : null

    const sanitizedUser = userData.user
      ? {
          id: userData.user.id,
          email: userData.user.email,
          last_sign_in_at: userData.user.last_sign_in_at,
          created_at: userData.user.created_at,
          updated_at: userData.user.updated_at,
        }
      : null

    return NextResponse.json({
      status: "success",
      hasSession: !!sessionData.session,
      hasUser: !!userData.user,
      session: sanitizedSession,
      user: sanitizedUser,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError("debug-session", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: "Internal server error", status: "error" }, { status: 500 })
  }
}
