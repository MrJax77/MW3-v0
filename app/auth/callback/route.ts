import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  console.log("Auth callback received:", { code: !!code, error, errorDescription })

  if (error) {
    console.error("Auth error:", error, errorDescription)
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      console.log("Attempting to exchange code for session...")

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError)
        return NextResponse.redirect(new URL("/login?error=session_failed", request.url))
      }

      if (data.user) {
        console.log("User authenticated successfully:", data.user.email)
        return NextResponse.redirect(new URL("/intake", request.url))
      } else {
        console.error("No user data after successful exchange")
        return NextResponse.redirect(new URL("/login?error=no_user", request.url))
      }
    } catch (error) {
      console.error("Unexpected error in auth callback:", error)
      return NextResponse.redirect(new URL("/login?error=unexpected", request.url))
    }
  }

  // No code or error, redirect to login
  console.log("No code or error found, redirecting to login")
  return NextResponse.redirect(new URL("/login?error=no_code", request.url))
}
