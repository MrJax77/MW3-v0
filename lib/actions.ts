"use server"

import { getSupabaseServerClient } from "./supabase-singleton"
import { validateIntakeData, sanitizeIntakeData } from "./validation-utils"
import { logError, logDebug, validateServerEnvironment } from "./debug-utils"

// Improved authentication function that uses the singleton
async function getAuthenticatedUser() {
  try {
    const supabase = getSupabaseServerClient()

    // Get the session first
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Only log actual errors, not missing sessions which are expected
      if (!sessionError.message.includes("Auth session missing")) {
        logError("getAuthenticatedUser", sessionError)
        throw new Error(`Session error: ${sessionError.message}`)
      } else {
        logDebug("getAuthenticatedUser", "No auth session found (normal for unauthenticated requests)")
      }
      return null
    }

    if (!session) {
      logDebug("getAuthenticatedUser", "No session found")
      return null
    }

    // Session exists, return the user
    return session.user
  } catch (error) {
    logError("getAuthenticatedUser", error)
    throw error
  }
}

export async function saveIntakeModule(moduleData: any) {
  try {
    logDebug("saveIntakeModule", "Starting save operation", { moduleData })
    validateServerEnvironment()

    // Use the improved authentication function
    const user = await getAuthenticatedUser()

    if (!user) {
      logDebug("saveIntakeModule", "No authenticated user found")
      throw new Error("Please log in to save your progress")
    }

    logDebug("saveIntakeModule", `Processing save for user: ${user.id}`)

    const supabase = getSupabaseServerClient()

    // Add data sanitization with better error handling
    const sanitizedData = sanitizeIntakeData(moduleData)
    logDebug("saveIntakeModule", "Data sanitized", { sanitizedData })

    // Enhanced validation
    const validation = validateIntakeData(sanitizedData, sanitizedData.completed_stages || 0)
    if (!validation.isValid) {
      logError("saveIntakeModule", new Error("Validation failed"), {
        errors: validation.errors,
        data: sanitizedData,
      })
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    // Test database connection before attempting save
    const { error: connectionError } = await supabase.from("profiles").select("user_id").limit(1)

    if (connectionError) {
      logError("saveIntakeModule", connectionError, { step: "connection_test" })
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }

    // Prepare data with explicit null handling
    const dbData = {
      user_id: user.id,
      // Ensure all fields have proper defaults
      consent_agreed: sanitizedData.consent_agreed ?? false,
      first_name: sanitizedData.first_name?.trim() || null,
      age: sanitizedData.age ? Number(sanitizedData.age) : null,
      role: sanitizedData.role?.trim() || null,
      spouse_name: sanitizedData.spouse_name?.trim() || null,
      children_count: sanitizedData.children_count ? Number(sanitizedData.children_count) : 0,
      children_ages: sanitizedData.children_ages?.trim() || null,
      // Add all other fields with proper null handling...
      spouse_relationship_rating:
        sanitizedData.spouse_relationship_rating !== undefined
          ? Math.max(0, Math.min(10, Number(sanitizedData.spouse_relationship_rating)))
          : null,
      spouse_relationship_reason: sanitizedData.spouse_relationship_reason
        ? String(sanitizedData.spouse_relationship_reason).trim().substring(0, 1000)
        : null,
      children_relationship_rating:
        sanitizedData.children_relationship_rating !== undefined
          ? Math.max(0, Math.min(10, Number(sanitizedData.children_relationship_rating)))
          : null,
      children_relationship_reason: sanitizedData.children_relationship_reason
        ? String(sanitizedData.children_relationship_reason).trim().substring(0, 1000)
        : null,
      spouse_relationship_goal: sanitizedData.spouse_relationship_goal
        ? String(sanitizedData.spouse_relationship_goal).trim().substring(0, 500)
        : null,
      parenting_goal: sanitizedData.parenting_goal
        ? String(sanitizedData.parenting_goal).trim().substring(0, 500)
        : null,
      upcoming_events: Array.isArray(sanitizedData.upcoming_events) ? sanitizedData.upcoming_events : [],

      // Stage 3: Health & Wellness
      current_health_rating:
        sanitizedData.current_health_rating !== undefined
          ? Math.max(0, Math.min(10, Number(sanitizedData.current_health_rating)))
          : null,
      health_rating_reason: sanitizedData.health_rating_reason
        ? String(sanitizedData.health_rating_reason).trim().substring(0, 1000)
        : null,
      health_goal: sanitizedData.health_goal ? String(sanitizedData.health_goal).trim().substring(0, 500) : null,
      exercise_frequency:
        sanitizedData.exercise_frequency !== undefined
          ? Math.max(0, Math.min(7, Number(sanitizedData.exercise_frequency)))
          : null,
      sleep_hours:
        sanitizedData.sleep_hours !== undefined ? Math.max(0, Math.min(24, Number(sanitizedData.sleep_hours))) : null,

      // Stage 4: Mindset & Stress
      current_stress_level:
        sanitizedData.current_stress_level !== undefined
          ? Math.max(0, Math.min(10, Number(sanitizedData.current_stress_level)))
          : null,
      stress_rating_reason: sanitizedData.stress_rating_reason
        ? String(sanitizedData.stress_rating_reason).trim().substring(0, 1000)
        : null,
      personal_goal: sanitizedData.personal_goal ? String(sanitizedData.personal_goal).trim().substring(0, 500) : null,
      mindfulness_practices: Array.isArray(sanitizedData.mindfulness_practices)
        ? sanitizedData.mindfulness_practices
        : [],

      // Stage 5: Daily Routine
      routine_description: sanitizedData.routine_description
        ? String(sanitizedData.routine_description).trim().substring(0, 2000)
        : null,

      // Stage 6: Future Goals
      family_future_goal: sanitizedData.family_future_goal
        ? String(sanitizedData.family_future_goal).trim().substring(0, 1000)
        : null,

      // Stage 7: Family Values
      family_value: sanitizedData.family_value ? String(sanitizedData.family_value).trim().substring(0, 1000) : null,

      // Stage 8: Technology
      wearable_usage: Array.isArray(sanitizedData.wearable_usage) ? sanitizedData.wearable_usage : [],
      google_calendar_sync: Boolean(sanitizedData.google_calendar_sync),
      apple_health_sync: Boolean(sanitizedData.apple_health_sync),

      // Stage 9: Preferences
      notification_channel: sanitizedData.notification_channel
        ? String(sanitizedData.notification_channel).substring(0, 20)
        : "email",
      quiet_hours_start: sanitizedData.quiet_hours_start
        ? String(sanitizedData.quiet_hours_start).substring(0, 10)
        : "22:00",
      quiet_hours_end: sanitizedData.quiet_hours_end ? String(sanitizedData.quiet_hours_end).substring(0, 10) : "07:00",
      data_deletion_acknowledged: Boolean(sanitizedData.data_deletion_acknowledged),
      completed_stages: sanitizedData.completed_stages ? Number(sanitizedData.completed_stages) : 0,
      is_complete: sanitizedData.is_complete ?? false,
      last_saved: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Remove undefined values
    Object.keys(dbData).forEach((key) => {
      if (dbData[key as keyof typeof dbData] === undefined) {
        delete dbData[key as keyof typeof dbData]
      }
    })

    logDebug("saveIntakeModule", "Prepared database data", { dbData })

    // Enhanced database operation with retry logic
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        logDebug("saveIntakeModule", `Attempting database save (attempt ${retryCount + 1})`)

        const { data, error } = await supabase
          .from("profiles")
          .upsert(dbData, { onConflict: "user_id" })
          .select()
          .single()

        if (error) {
          logError("saveIntakeModule", error, {
            step: "database_upsert",
            attempt: retryCount + 1,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            dbData: JSON.stringify(dbData, null, 2),
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

        logDebug("saveIntakeModule", "Save successful", { savedData: data })
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
    logError("saveIntakeModule", error, {
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

export async function getProfile() {
  try {
    logDebug("getProfile", "Starting profile fetch")
    validateServerEnvironment()

    const user = await getAuthenticatedUser()
    if (!user) {
      logDebug("getProfile", "No authenticated user found")
      return null
    }

    const supabase = getSupabaseServerClient()
    logDebug("getProfile", `Fetching profile for user: ${user.id}`)

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      logError("getProfile", error, { userId: user.id, errorCode: error.code })
      throw new Error(`Database error: ${error.message}`)
    }

    logDebug("getProfile", `Profile fetched successfully: ${profile ? "found" : "not found"}`)
    return profile
  } catch (error) {
    logError("getProfile", error)
    throw error
  }
}

export async function getLatestInsight() {
  try {
    validateServerEnvironment()

    const user = await getAuthenticatedUser()
    if (!user) {
      logDebug("getLatestInsight", "No authenticated user found")
      return null
    }

    const supabase = getSupabaseServerClient()
    const { data: insight, error } = await supabase
      .from("insights")
      .select("*, metadata") // Added metadata to the selection
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      logError("getLatestInsight", error, { userId: user.id })
      return null
    }

    return insight
  } catch (error) {
    logError("getLatestInsight", error)
    return null
  }
}

export async function calculateProfileCompleteness() {
  try {
    const profile = await getProfile()
    if (!profile) return { percentage: 0, completedStages: [], missingStages: [], totalStages: 10, isComplete: false }

    const stageChecks = [
      { stage: 0, name: "Consent", check: () => profile.consent_agreed === true },
      {
        stage: 1,
        name: "Basic Info",
        check: () => profile.first_name && profile.age && profile.role,
      },
      {
        stage: 2,
        name: "Relationships",
        check: () => profile.spouse_relationship_rating !== null || profile.children_relationship_rating !== null,
      },
      {
        stage: 3,
        name: "Health & Wellness",
        check: () => profile.current_health_rating !== null && profile.health_goal,
      },
      {
        stage: 4,
        name: "Mindset & Stress",
        check: () => profile.current_stress_level !== null && profile.personal_goal,
      },
      {
        stage: 5,
        name: "Daily Routine",
        check: () => profile.routine_description && profile.routine_description.length > 10,
      },
      {
        stage: 6,
        name: "Future Goals",
        check: () => profile.family_future_goal && profile.family_future_goal.length > 10,
      },
      {
        stage: 7,
        name: "Family Values",
        check: () => profile.family_value && profile.family_value.length > 10,
      },
      {
        stage: 8,
        name: "Technology",
        check: () => profile.wearable_usage !== null && Array.isArray(profile.wearable_usage),
      },
      {
        stage: 9,
        name: "Preferences",
        check: () => profile.notification_channel && profile.data_deletion_acknowledged === true,
      },
    ]

    const completedStages = stageChecks.filter((stage) => stage.check()).map((stage) => stage.stage)
    const missingStages = stageChecks
      .filter((stage) => !stage.check())
      .map((stage) => ({ stage: stage.stage, name: stage.name }))

    const percentage = Math.round((completedStages.length / stageChecks.length) * 100)

    return {
      percentage,
      completedStages,
      missingStages,
      totalStages: stageChecks.length,
      isComplete: profile.is_complete || false,
    }
  } catch (error) {
    logError("calculateProfileCompleteness", error)
    return { percentage: 0, completedStages: [], missingStages: [], totalStages: 10, isComplete: false }
  }
}

export async function getIntakeProgress() {
  try {
    logDebug("getIntakeProgress", "Starting progress fetch")
    validateServerEnvironment()

    const user = await getAuthenticatedUser()
    if (!user) {
      logDebug("getIntakeProgress", "No authenticated user found")
      return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
    }

    const supabase = getSupabaseServerClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("completed_stages, is_complete, last_saved, first_name")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      logError("getIntakeProgress", error, { userId: user.id })
      return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
    }

    logDebug("getIntakeProgress", { progress: profile })
    return profile || { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
  } catch (error) {
    logError("getIntakeProgress", error)
    return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
  }
}

export async function resetIntakeProgress() {
  try {
    validateServerEnvironment()

    const user = await getAuthenticatedUser()
    if (!user) {
      throw new Error("Please log in to reset profile")
    }

    const supabase = getSupabaseServerClient()

    // Reset all intake fields to null/default values
    const { data, error } = await supabase
      .from("profiles")
      .update({
        completed_stages: 0,
        is_complete: false,
        consent_agreed: false,
        // Reset all other fields to null
        first_name: null,
        age: null,
        role: null,
        spouse_name: null,
        children_count: 0,
        children_ages: null,
        spouse_relationship_rating: null,
        spouse_relationship_reason: null,
        children_relationship_rating: null,
        children_relationship_reason: null,
        spouse_relationship_goal: null,
        parenting_goal: null,
        upcoming_events: [],
        current_health_rating: null,
        health_rating_reason: null,
        health_goal: null,
        exercise_frequency: null,
        sleep_hours: null,
        current_stress_level: null,
        stress_rating_reason: null,
        personal_goal: null,
        mindfulness_practices: [],
        routine_description: null,
        family_future_goal: null,
        family_value: null,
        wearable_usage: [],
        google_calendar_sync: false,
        apple_health_sync: false,
        notification_channel: "email",
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        data_deletion_acknowledged: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) {
      logError("resetIntakeProgress", error)
      throw new Error(`Failed to reset intake progress: ${error.message}`)
    }

    return data
  } catch (error) {
    logError("resetIntakeProgress", error)
    throw error
  }
}

export async function validateProfileData() {
  try {
    const profile = await getProfile()
    if (!profile) return { isValid: false, errors: ["Profile not found"] }

    const errors: string[] = []

    // Validate required fields based on completion stage
    if (profile.completed_stages >= 1) {
      if (!profile.first_name) errors.push("First name is required")
      if (!profile.age || profile.age < 0 || profile.age > 120) errors.push("Valid age is required")
      if (!profile.role) errors.push("Role is required")
    }

    if (profile.completed_stages >= 2) {
      if (
        profile.spouse_relationship_rating !== null &&
        (profile.spouse_relationship_rating < 0 || profile.spouse_relationship_rating > 10)
      ) {
        errors.push("Spouse relationship rating must be between 0-10")
      }
      if (
        profile.children_relationship_rating !== null &&
        (profile.children_relationship_rating < 0 || profile.children_relationship_rating > 10)
      ) {
        errors.push("Children relationship rating must be between 0-10")
      }
    }

    if (profile.completed_stages >= 3) {
      if (
        profile.current_health_rating !== null &&
        (profile.current_health_rating < 0 || profile.current_health_rating > 10)
      ) {
        errors.push("Health rating must be between 0-10")
      }
      if (profile.exercise_frequency !== null && (profile.exercise_frequency < 0 || profile.exercise_frequency > 7)) {
        errors.push("Exercise frequency must be between 0-7 days")
      }
    }

    return { isValid: errors.length === 0, errors }
  } catch (error) {
    logError("validateProfileData", error)
    return { isValid: false, errors: ["Validation failed"] }
  }
}

export async function getProfileForIntake() {
  try {
    validateServerEnvironment()

    const user = await getAuthenticatedUser()
    if (!user) {
      return null
    }

    const supabase = getSupabaseServerClient()
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      logError("getProfileForIntake", error, { userId: user.id })
      return null
    }

    return profile
  } catch (error) {
    logError("getProfileForIntake", error)
    return null
  }
}
