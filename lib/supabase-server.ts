import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient({
    cookies: () => cookieStore,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
