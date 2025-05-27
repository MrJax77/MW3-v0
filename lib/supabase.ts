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
  // Use the exact Vercel domain for redirects
  const redirectTo = "https://mw3-v0.vercel.app/auth/callback"

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
  if (error) throw error
}
