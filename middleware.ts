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
    const isProtectedPage = ["/dashboard", "/intake"].some((path) => req.nextUrl.pathname.startsWith(path))

    if (session && isAuthPage) {
      logDebug("middleware", "Authenticated user accessing login, redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (!session && isProtectedPage) {
      logDebug("middleware", "Unauthenticated user accessing protected page, redirecting to login")
      return NextResponse.redirect(new URL("/login", req.url))
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
  ],
}
