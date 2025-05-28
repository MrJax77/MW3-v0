"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "./supabase-singleton"

interface AIUsageStats {
  totalCalls: number
  dailyCalls: number
  remainingCalls: number
  isLimited: boolean
}

// Default limits
const DEFAULT_DAILY_LIMIT = 20
const STORAGE_KEY = "mw3_ai_usage"

export function useAIUsage() {
  const [usage, setUsage] = useState<AIUsageStats>({
    totalCalls: 0,
    dailyCalls: 0,
    remainingCalls: DEFAULT_DAILY_LIMIT,
    isLimited: false,
  })

  // Load usage data on mount
  useEffect(() => {
    const loadUsage = async () => {
      try {
        // Try to get from local storage first (for quick access)
        const storedUsage = localStorage.getItem(STORAGE_KEY)
        if (storedUsage) {
          const parsedUsage = JSON.parse(storedUsage)
          const today = new Date().toISOString().split("T")[0]

          // Reset daily count if it's a new day
          if (parsedUsage.date !== today) {
            parsedUsage.dailyCalls = 0
            parsedUsage.date = today
          }

          setUsage({
            totalCalls: parsedUsage.totalCalls || 0,
            dailyCalls: parsedUsage.dailyCalls || 0,
            remainingCalls: DEFAULT_DAILY_LIMIT - (parsedUsage.dailyCalls || 0),
            isLimited: (parsedUsage.dailyCalls || 0) >= DEFAULT_DAILY_LIMIT,
          })
        }

        // Then try to get from database for persistence across devices
        const supabase = getSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase.from("ai_usage").select("*").eq("user_id", user.id).single()

          if (data) {
            const today = new Date().toISOString().split("T")[0]
            const dailyCalls = data.last_used === today ? data.daily_calls : 0

            setUsage({
              totalCalls: data.total_calls || 0,
              dailyCalls: dailyCalls,
              remainingCalls: DEFAULT_DAILY_LIMIT - dailyCalls,
              isLimited: dailyCalls >= DEFAULT_DAILY_LIMIT,
            })

            // Update local storage with DB data
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                totalCalls: data.total_calls,
                dailyCalls: dailyCalls,
                date: today,
              }),
            )
          }
        }
      } catch (error) {
        console.error("Error loading AI usage:", error)
      }
    }

    loadUsage()
  }, [])

  // Function to track a new API call
  const trackAPICall = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]

      // Update local state
      setUsage((prev) => {
        const newDailyCalls = prev.dailyCalls + 1
        return {
          totalCalls: prev.totalCalls + 1,
          dailyCalls: newDailyCalls,
          remainingCalls: Math.max(0, DEFAULT_DAILY_LIMIT - newDailyCalls),
          isLimited: newDailyCalls >= DEFAULT_DAILY_LIMIT,
        }
      })

      // Update local storage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          totalCalls: usage.totalCalls + 1,
          dailyCalls: usage.dailyCalls + 1,
          date: today,
        }),
      )

      // Update database
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("ai_usage").upsert(
          {
            user_id: user.id,
            total_calls: usage.totalCalls + 1,
            daily_calls: usage.dailyCalls + 1,
            last_used: today,
          },
          { onConflict: "user_id" },
        )
      }
    } catch (error) {
      console.error("Error tracking AI usage:", error)
    }
  }

  return { usage, trackAPICall }
}
