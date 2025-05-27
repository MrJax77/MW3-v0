import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  if (error) {
    console.error("Auth error:", error, errorDescription)

    // Handle specific error cases
    if (error === "access_denied" && errorDescription?.includes("expired")) {
      return NextResponse.redirect(new URL("/login?error=expired", request.url))
    }

    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
      return NextResponse.redirect(new URL("/intake", request.url))
    } catch (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(new URL("/login?error=session_failed", request.url))
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(new URL("/login", request.url))
}
