import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClientComponentClient()

    // Test basic connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown connection error",
    }
  }
}

export async function testUserAuthentication(): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = createClientComponentClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!user) {
      return { success: false, error: "No authenticated user" }
    }

    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown auth error",
    }
  }
}
