"use server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getProfile() {
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
    throw new Error("Failed to fetch profile")
  }

  return profile
}

export async function getLatestInsight() {
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
    return null
  }

  return insight
}

export async function saveDailyLog(logData: any) {
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
    log_json: logData,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    throw new Error("Failed to save daily log")
  }

  return data
}
