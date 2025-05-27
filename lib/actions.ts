"use server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getProfile() {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data: profile, error } = await supabaseServer.from("profiles").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      console.error("Profile fetch error:", error)
      throw new Error("Failed to fetch profile")
    }

    return profile
  } catch (error) {
    console.error("getProfile error:", error)
    throw error
  }
}

export async function saveIntakeModule(moduleData: any) {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    console.log("Saving intake module:", { userId: user.id, moduleData })

    // Prepare the data for database insertion
    const dbData = {
      user_id: user.id,
      // Stage 0: Consent
      consent_agreed: moduleData.consent_agreed ?? null,

      // Stage 1: Basic Info
      first_name: moduleData.first_name ?? null,
      age: moduleData.age ?? null,
      role: moduleData.role ?? null,
      spouse_name: moduleData.spouse_name ?? null,
      children_count: moduleData.children_count ?? 0,
      children_ages: moduleData.children_ages ?? null,

      // Stage 2: Relationships
      spouse_relationship_rating: moduleData.spouse_relationship_rating ?? null,
      spouse_relationship_reason: moduleData.spouse_relationship_reason ?? null,
      children_relationship_rating: moduleData.children_relationship_rating ?? null,
      children_relationship_reason: moduleData.children_relationship_reason ?? null,
      spouse_relationship_goal: moduleData.spouse_relationship_goal ?? null,
      parenting_goal: moduleData.parenting_goal ?? null,
      upcoming_events: moduleData.upcoming_events ?? [],

      // Stage 3: Health & Wellness
      current_health_rating: moduleData.current_health_rating ?? null,
      health_rating_reason: moduleData.health_rating_reason ?? null,
      health_goal: moduleData.health_goal ?? null,
      exercise_frequency: moduleData.exercise_frequency ?? null,
      sleep_hours: moduleData.sleep_hours ?? null,

      // Stage 4: Mindset & Stress
      current_stress_level: moduleData.current_stress_level ?? null,
      stress_rating_reason: moduleData.stress_rating_reason ?? null,
      personal_goal: moduleData.personal_goal ?? null,
      mindfulness_practices: moduleData.mindfulness_practices ?? [],

      // Stage 5: Daily Routine
      routine_description: moduleData.routine_description ?? null,

      // Stage 6: Future Goals
      family_future_goal: moduleData.family_future_goal ?? null,

      // Stage 7: Family Values
      family_value: moduleData.family_value ?? null,

      // Stage 8: Technology
      wearable_usage: moduleData.wearable_usage ?? [],
      google_calendar_sync: moduleData.google_calendar_sync ?? false,
      apple_health_sync: moduleData.apple_health_sync ?? false,

      // Stage 9: Preferences
      notification_channel: moduleData.notification_channel ?? "email",
      quiet_hours_start: moduleData.quiet_hours_start ?? "22:00",
      quiet_hours_end: moduleData.quiet_hours_end ?? "07:00",
      data_deletion_acknowledged: moduleData.data_deletion_acknowledged ?? false,

      // Meta fields
      completed_stages: moduleData.completed_stages ?? 0,
      is_complete: moduleData.is_complete ?? false,
      last_saved: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Remove undefined values to avoid database errors
    Object.keys(dbData).forEach((key) => {
      if (dbData[key as keyof typeof dbData] === undefined) {
        delete dbData[key as keyof typeof dbData]
      }
    })

    const { data, error } = await supabaseServer
      .from("profiles")
      .upsert(dbData, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("Intake module save error:", error)
      throw new Error(`Failed to save intake module: ${error.message}`)
    }

    console.log("Intake module saved successfully:", data)
    return data
  } catch (error) {
    console.error("saveIntakeModule error:", error)
    throw error
  }
}

export async function getIntakeProgress() {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data: profile, error } = await supabaseServer
      .from("profiles")
      .select("completed_stages, is_complete, last_saved, first_name")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Progress fetch error:", error)
      return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
    }

    return profile || { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
  } catch (error) {
    console.error("getIntakeProgress error:", error)
    return { completed_stages: 0, is_complete: false, last_saved: null, first_name: null }
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
    console.error("calculateProfileCompleteness error:", error)
    return { percentage: 0, completedStages: [], missingStages: [], totalStages: 10, isComplete: false }
  }
}

export async function getLatestInsight() {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data: insight, error } = await supabaseServer
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Insight fetch error:", error)
      return null
    }

    return insight
  } catch (error) {
    console.error("getLatestInsight error:", error)
    return null
  }
}

export async function saveDailyLog(logData: any) {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabaseServer.from("daily_logs").upsert({
      user_id: user.id,
      log_date: today,
      sleep_hours: logData.sleepHours,
      exercise_minutes: logData.exerciseMinutes,
      quality_time: logData.qualityTime,
      mood_rating: logData.mood,
      notes: logData.notes || null,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Daily log save error:", error)
      throw new Error(`Failed to save daily log: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("saveDailyLog error:", error)
    throw error
  }
}

export async function resetIntakeProgress() {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Reset all intake fields to null/default values
    const { data, error } = await supabaseServer
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
      console.error("Reset intake error:", error)
      throw new Error(`Failed to reset intake progress: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("resetIntakeProgress error:", error)
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
    console.error("validateProfileData error:", error)
    return { isValid: false, errors: ["Validation failed"] }
  }
}

export async function getProfileForIntake() {
  try {
    const cookieStore = cookies()
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      return null // Not authenticated, return null instead of throwing
    }

    const { data: profile, error } = await supabaseServer.from("profiles").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      console.error("Profile fetch error:", error)
      return null
    }

    return profile
  } catch (error) {
    console.error("getProfileForIntake error:", error)
    return null
  }
}
