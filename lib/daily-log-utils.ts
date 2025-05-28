"use client"

import { getSupabaseClient } from "./supabase-singleton"

export interface DailyLog {
  id: string
  user_id: string
  log_date: string
  sleep_hours: number
  exercise_minutes: number
  quality_time: number
  mood_rating: number
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getClientDailyLogs(limit = 14): Promise<DailyLog[]> {
  try {
    const supabase = getSupabaseClient()

    // Get current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return []
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching daily logs:", error)
      return []
    }

    return data as DailyLog[]
  } catch (error) {
    console.error("Error in getClientDailyLogs:", error)
    return []
  }
}

export async function getClientLatestDailyLog(): Promise<DailyLog | null> {
  try {
    const supabase = getSupabaseClient()

    // Get current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching latest daily log:", error)
      return null
    }

    return data as DailyLog
  } catch (error) {
    console.error("Error in getClientLatestDailyLog:", error)
    return null
  }
}
