import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and the current path is not /login or /auth/callback, redirect to /login
    if (!session && !req.nextUrl.pathname.startsWith("/login") && !req.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If user is signed in and the current path is /login, redirect to /dashboard
    if (session && req.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    // If middleware fails, allow the request to continue
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
