import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // For now, let's disable middleware to get the app working
  // We'll add auth protection back once the basic app is running

  const { pathname } = request.nextUrl

  // Allow all requests for now
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
