import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logDebug, logError } from "@/lib/debug-utils"

export async function middleware(req: NextRequest) {
  // Skip middleware for static files, API routes, and auth callback
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/auth/callback") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    // Get session without forcing refresh to avoid unnecessary calls
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // Log session status for debugging
    logDebug("middleware", `Auth check for ${req.nextUrl.pathname}`, {
      hasSession: !!session,
      error: error?.message,
      userId: session?.user?.id,
    })

    // Handle authentication redirects
    const isAuthPage = req.nextUrl.pathname === "/login"
    const isProtectedPage = ["/dashboard", "/intake", "/profile", "/chat", "/chat-history"].some((path) =>
      req.nextUrl.pathname.startsWith(path),
    )

    if (session && isAuthPage) {
      logDebug("middleware", "Authenticated user accessing login, checking survey completion")

      // Check survey completion status
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_complete, completed_stages")
        .eq("user_id", session.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        logDebug("middleware", "Could not check profile, redirecting to intake")
        return NextResponse.redirect(new URL("/intake", req.url))
      }

      if (profile?.is_complete) {
        logDebug("middleware", "User completed survey, redirecting to dashboard")
        return NextResponse.redirect(new URL("/dashboard", req.url))
      } else {
        logDebug("middleware", "User has not completed survey, redirecting to intake")
        return NextResponse.redirect(new URL("/intake", req.url))
      }
    }

    if (!session && isProtectedPage) {
      logDebug("middleware", "Unauthenticated user accessing protected page, redirecting to login")
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Additional check: if user is authenticated and accessing dashboard but hasn't completed survey
    if (session && req.nextUrl.pathname.startsWith("/dashboard")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_complete")
        .eq("user_id", session.user.id)
        .single()

      if (!profileError && !profile?.is_complete) {
        logDebug("middleware", "User accessing dashboard without completing survey, redirecting to intake")
        return NextResponse.redirect(new URL("/intake", req.url))
      }
    }

    return res
  } catch (error) {
    logError("middleware", error instanceof Error ? error : new Error(String(error)))
    // Don't redirect on middleware errors, let the page handle it
    return res
  }
}

export const config = {
  matcher: [
    // Only run middleware on specific routes
    "/",
    "/login",
    "/dashboard/:path*",
    "/intake/:path*",
    "/profile/:path*",
    "/chat/:path*",
    "/chat-history/:path*",
  ],
}
