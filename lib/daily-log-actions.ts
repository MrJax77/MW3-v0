"use server"

import { getSupabaseServerClient } from "./supabase-singleton"
import { logError } from "./debug-utils"

export interface DailyLogData {
  sleepHours: number
  exerciseMinutes: number
  qualityTime: boolean
  mood: number
  notes?: string
}

export async function saveDailyLogServerAction(logData: DailyLogData) {
  try {
    const supabase = getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("Authentication required")
    }

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase.from("daily_logs").upsert({
      user_id: user.id,
      log_date: today,
      sleep_hours: logData.sleepHours,
      exercise_minutes: logData.exerciseMinutes,
      quality_time: logData.qualityTime ? 1 : 0, // Convert boolean to number for database
      mood_rating: logData.mood,
      notes: logData.notes || null,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      logError("saveDailyLogServerAction", error)
      throw new Error(`Failed to save daily log: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    logError("saveDailyLogServerAction", error)
    throw error
  }
}

export async function getDailyLogsServerAction(limit = 14) {
  try {
    const supabase = getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(limit)

    if (error) {
      logError("getDailyLogsServerAction", error)
      throw new Error(`Failed to fetch daily logs: ${error.message}`)
    }

    return data || []
  } catch (error) {
    logError("getDailyLogsServerAction", error)
    throw error
  }
}

export async function getLatestDailyLogServerAction() {
  try {
    const supabase = getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      logError("getLatestDailyLogServerAction", error)
      return null
    }

    return data
  } catch (error) {
    logError("getLatestDailyLogServerAction", error)
    return null
  }
}
