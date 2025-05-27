// Completely disable middleware by commenting everything out
// This will help us isolate if middleware is the root cause

/*
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
*/

// Empty file - no middleware at all
