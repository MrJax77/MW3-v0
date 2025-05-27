import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function signInWithMagicLink(email: string) {
  // Get the current origin, use the actual domain for redirects
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const redirectTo = `${origin}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
  if (error) throw error
}
