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

export async function signInWithOTP(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Allow new user creation
    },
  })
  if (error) throw error
}

export async function verifyOTP(email: string, token: string) {
  console.log("🔄 Starting OTP verification...")

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  })

  if (error) {
    console.error("❌ OTP verification failed:", error)
    throw error
  }

  console.log("✅ OTP verification successful:", data)

  // Wait a moment for the session to be fully established
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Verify the session was created
  const {
    data: { session },
  } = await supabase.auth.getSession()
  console.log("🔍 Session after verification:", session ? "exists" : "missing")

  return data
}
