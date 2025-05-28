import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient({
    cookies: () => cookieStore,
  })
}

export function createSupabaseRouteClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient({
    cookies: () => cookieStore,
  })
}

export async function getServerUser() {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Server auth error:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Server user fetch error:", error)
    return null
  }
}

export async function getServerSession() {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Server session error:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Server session fetch error:", error)
    return null
  }
}
