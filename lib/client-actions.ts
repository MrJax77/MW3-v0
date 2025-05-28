import { getSupabaseClient } from "./supabase-singleton"
import { logDebug, logError } from "./debug-utils"

// Client-side function to get profile data
export async function getClientProfile() {
  try {
    logDebug("getClientProfile", "Starting client-side profile fetch")

    const supabase = getSupabaseClient()

    // Get current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      logError("getClientProfile", userError)
      throw new Error(`Authentication error: ${userError.message}`)
    }

    if (!user) {
      logDebug("getClientProfile", "No authenticated user found")
      return null
    }

    logDebug("getClientProfile", `Fetching profile for user: ${user.id}`)

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      logError("getClientProfile", error, { userId: user.id, errorCode: error.code })
      throw new Error(`Database error: ${error.message}`)
    }

    logDebug("getClientProfile", `Profile fetched successfully: ${profile ? "found" : "not found"}`)
    return profile
  } catch (error) {
    logError("getClientProfile", error)
    throw error
  }
}

// Client-side function to get intake progress
export async function getClientIntakeProgress() {
  try {
    logDebug("getClientIntakeProgress", "Starting client-side progress fetch")

    const supabase = getSupabaseClient()

    // Get current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      logError("getClientIntakeProgress", userError)
      return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
    }

    if (!user) {
      logDebug("getClientIntakeProgress", "No authenticated user found")
      return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("completed_stages, is_complete, last_saved, first_name")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      logError("getClientIntakeProgress", error, { userId: user.id })
      return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
    }

    logDebug("getClientIntakeProgress", { progress: profile })
    return profile || { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
  } catch (error) {
    logError("getClientIntakeProgress", error)
    return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
  }
}

// Client-side function to test database connection
export async function testClientDatabaseConnection() {
  try {
    const supabase = getSupabaseClient()

    // Simple query to test connection
    const { error } = await supabase.from("profiles").select("user_id").limit(1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Client-side function to save intake module data
export async function saveClientIntakeModule(moduleData: any) {
  try {
    logDebug("saveClientIntakeModule", "Starting client-side save operation", { moduleData })

    const supabase = getSupabaseClient()

    // Get current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      logError("saveClientIntakeModule", userError)
      throw new Error(`Authentication error: ${userError.message}`)
    }

    if (!user) {
      logDebug("saveClientIntakeModule", "No authenticated user found")
      throw new Error("Please log in to save your progress")
    }

    logDebug("saveClientIntakeModule", `Processing save for user: ${user.id}`)

    // Prepare data with explicit null handling
    const dbData = {
      user_id: user.id,
      // Ensure all fields have proper defaults
      consent_agreed: moduleData.consent_agreed ?? false,
      first_name: moduleData.first_name?.trim() || null,
      age: moduleData.age ? Number(moduleData.age) : null,
      role: moduleData.role?.trim() || null,
      spouse_name: moduleData.spouse_name?.trim() || null,
      children_count: moduleData.children_count ? Number(moduleData.children_count) : 0,
      children_ages: moduleData.children_ages?.trim() || null,
      // Add all other fields with proper null handling...
      spouse_relationship_rating:
        moduleData.spouse_relationship_rating !== undefined
          ? Math.max(0, Math.min(10, Number(moduleData.spouse_relationship_rating)))
          : null,
      spouse_relationship_reason: moduleData.spouse_relationship_reason
        ? String(moduleData.spouse_relationship_reason).trim().substring(0, 1000)
        : null,
      children_relationship_rating:
        moduleData.children_relationship_rating !== undefined
          ? Math.max(0, Math.min(10, Number(moduleData.children_relationship_rating)))
          : null,
      children_relationship_reason: moduleData.children_relationship_reason
        ? String(moduleData.children_relationship_reason).trim().substring(0, 1000)
        : null,
      spouse_relationship_goal: moduleData.spouse_relationship_goal
        ? String(moduleData.spouse_relationship_goal).trim().substring(0, 500)
        : null,
      parenting_goal: moduleData.parenting_goal ? String(moduleData.parenting_goal).trim().substring(0, 500) : null,
      upcoming_events: Array.isArray(moduleData.upcoming_events) ? moduleData.upcoming_events : [],

      // Stage 3: Health & Wellness
      current_health_rating:
        moduleData.current_health_rating !== undefined
          ? Math.max(0, Math.min(10, Number(moduleData.current_health_rating)))
          : null,
      health_rating_reason: moduleData.health_rating_reason
        ? String(moduleData.health_rating_reason).trim().substring(0, 1000)
        : null,
      health_goal: moduleData.health_goal ? String(moduleData.health_goal).trim().substring(0, 500) : null,
      exercise_frequency:
        moduleData.exercise_frequency !== undefined
          ? Math.max(0, Math.min(7, Number(moduleData.exercise_frequency)))
          : null,
      sleep_hours:
        moduleData.sleep_hours !== undefined ? Math.max(0, Math.min(24, Number(moduleData.sleep_hours))) : null,

      // Stage 4: Mindset & Stress
      current_stress_level:
        moduleData.current_stress_level !== undefined
          ? Math.max(0, Math.min(10, Number(moduleData.current_stress_level)))
          : null,
      stress_rating_reason: moduleData.stress_rating_reason
        ? String(moduleData.stress_rating_reason).trim().substring(0, 1000)
        : null,
      personal_goal: moduleData.personal_goal ? String(moduleData.personal_goal).trim().substring(0, 500) : null,
      mindfulness_practices: Array.isArray(moduleData.mindfulness_practices) ? moduleData.mindfulness_practices : [],

      // Stage 5: Daily Routine
      routine_description: moduleData.routine_description
        ? String(moduleData.routine_description).trim().substring(0, 2000)
        : null,

      // Stage 6: Future Goals
      family_future_goal: moduleData.family_future_goal
        ? String(moduleData.family_future_goal).trim().substring(0, 1000)
        : null,

      // Stage 7: Family Values
      family_value: moduleData.family_value ? String(moduleData.family_value).trim().substring(0, 1000) : null,

      // Stage 8: Technology
      wearable_usage: Array.isArray(moduleData.wearable_usage) ? moduleData.wearable_usage : [],
      google_calendar_sync: Boolean(moduleData.google_calendar_sync),
      apple_health_sync: Boolean(moduleData.apple_health_sync),

      // Stage 9: Preferences
      notification_channel: moduleData.notification_channel
        ? String(moduleData.notification_channel).substring(0, 20)
        : "email",
      quiet_hours_start: moduleData.quiet_hours_start ? String(moduleData.quiet_hours_start).substring(0, 10) : "22:00",
      quiet_hours_end: moduleData.quiet_hours_end ? String(moduleData.quiet_hours_end).substring(0, 10) : "07:00",
      data_deletion_acknowledged: Boolean(moduleData.data_deletion_acknowledged),
      completed_stages: moduleData.completed_stages ? Number(moduleData.completed_stages) : 0,
      is_complete: moduleData.is_complete ?? false,
      last_saved: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Remove undefined values
    Object.keys(dbData).forEach((key) => {
      if (dbData[key as keyof typeof dbData] === undefined) {
        delete dbData[key as keyof typeof dbData]
      }
    })

    logDebug("saveClientIntakeModule", "Prepared database data", { dbData })

    // Enhanced database operation with retry logic
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        logDebug("saveClientIntakeModule", `Attempting database save (attempt ${retryCount + 1})`)

        const { data, error } = await supabase
          .from("profiles")
          .upsert(dbData, { onConflict: "user_id" })
          .select()
          .single()

        if (error) {
          logError("saveClientIntakeModule", error, {
            step: "database_upsert",
            attempt: retryCount + 1,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
          })

          // Handle specific error codes
          if (error.code === "23505") {
            throw new Error("Duplicate entry detected")
          } else if (error.code === "23502") {
            throw new Error(`Required field missing: ${error.details || "unknown field"}`)
          } else if (error.code === "22001") {
            throw new Error("Text field too long")
          } else if (error.code === "42703") {
            throw new Error("Database column does not exist")
          } else if (error.code === "08006" || error.code === "08000") {
            // Connection errors - retry
            if (retryCount < maxRetries - 1) {
              retryCount++
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
              continue
            }
            throw new Error("Database connection failed after retries")
          } else {
            throw new Error(`Database error (${error.code}): ${error.message}`)
          }
        }

        logDebug("saveClientIntakeModule", "Save successful", { savedData: data })
        return data
      } catch (dbError) {
        if (retryCount >= maxRetries - 1) {
          throw dbError
        }
        retryCount++
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }
    }
  } catch (error) {
    logError("saveClientIntakeModule", error, {
      step: "overall_operation",
      moduleData: JSON.stringify(moduleData, null, 2),
    })

    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Please log in")) {
        throw new Error("Please log in to save your progress")
      } else if (error.message.includes("validation failed")) {
        throw new Error("Please check your input and try again.")
      } else if (error.message.includes("connection")) {
        throw new Error("Database connection failed. Please try again.")
      } else {
        throw new Error(`Save failed: ${error.message}`)
      }
    } else {
      throw new Error("Save failed: Unknown error occurred")
    }
  }
}
