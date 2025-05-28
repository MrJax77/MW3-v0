import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { logDebug } from "./debug-utils"

// Singleton client for client-side usage
let clientInstance: SupabaseClient | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be called on the client side")
  }

  if (!clientInstance) {
    clientInstance = createClientComponentClient()
    logDebug("supabase-singleton", "Created new Supabase client instance")
  }

  return clientInstance
}

// Server-side client creation (always creates new instance as required by Next.js)
export function getSupabaseServerClient() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServerClient should only be called on the server side")
  }

  // Import cookies dynamically only when this function is called
  // This prevents the "next/headers" import from affecting client components
  const { cookies } = require("next/headers")
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Route handler client creation
export function getSupabaseRouteHandlerClient() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseRouteHandlerClient should only be called on the server side")
  }

  // Import cookies dynamically only when this function is called
  const { cookies } = require("next/headers")
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}

// Reset client instance (useful for testing or logout)
export function resetSupabaseClient() {
  if (typeof window !== "undefined") {
    clientInstance = null
    logDebug("supabase-singleton", "Reset Supabase client instance")
  }
}
