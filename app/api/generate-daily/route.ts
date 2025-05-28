import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { AI_MODELS } from "@/lib/ai-config"
import { logDebug, logError } from "@/lib/debug-utils"

// Define insight types for better categorization and processing
type InsightType =
  | "relationship_tip"
  | "wellness_tip"
  | "mindset_tip"
  | "goal_tip"
  | "daily_tip"
  | "parenting_tip"
  | "work_life_balance_tip"
  | "general_tip"

export async function POST(request: NextRequest) {
  try {
    logDebug("generate-daily", "Starting insight generation")

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get user
    logDebug("generate-daily", "Getting user authentication")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      logError("generate-daily", `Auth error: ${authError.message}`)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      logError("generate-daily", "No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logDebug("generate-daily", `User authenticated: ${user.id}`)

    // Get user profile
    logDebug("generate-daily", "Fetching user profile")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError) {
      logError("generate-daily", `Profile fetch error: ${profileError.message}`)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (!profile) {
      logError("generate-daily", "Profile is null")
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    logDebug("generate-daily", `Profile found for: ${profile.first_name}`)

    // Check if user has enough profile data
    const hasBasicInfo = profile.first_name && profile.age && profile.role
    if (!hasBasicInfo) {
      logError("generate-daily", "Insufficient profile data")
      return NextResponse.json({ error: "Please complete your basic profile information first" }, { status: 400 })
    }

    // Get recent daily logs
    logDebug("generate-daily", "Fetching recent daily logs")
    const { data: recentLogs, error: logsError } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(14)

    if (logsError) {
      logError("generate-daily", `Daily logs fetch error: ${logsError.message}`)
      // Continue without logs
    }

    // Get previous insights
    logDebug("generate-daily", "Fetching previous insights")
    const { data: previousInsights, error: insightsError } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (insightsError) {
      logError("generate-daily", `Previous insights fetch error: ${insightsError.message}`)
      // Continue without previous insights
    }

    // Create user context
    logDebug("generate-daily", "Creating user context")
    const userContext = {
      name: profile.first_name || "User",
      age: profile.age || 30,
      role: profile.role || "Parent",
      children_count: profile.children_count || 0,
      children_ages: profile.children_ages || "N/A",
      spouse_relationship: {
        rating: profile.spouse_relationship_rating || 5,
        reason: profile.spouse_relationship_reason || "",
        goal: profile.spouse_relationship_goal || "",
        spouse_name: profile.spouse_name || "partner",
      },
      children_relationship: {
        rating: profile.children_relationship_rating || 5,
        reason: profile.children_relationship_reason || "",
        parenting_goal: profile.parenting_goal || "",
      },
      health: {
        current_rating: profile.current_health_rating || 5,
        goal: profile.health_goal || "",
        exercise_frequency: profile.exercise_frequency || 0,
        sleep_hours: profile.sleep_hours || 7,
      },
      mindset: {
        current_stress_level: profile.current_stress_level || 5,
        personal_goal: profile.personal_goal || "",
        mindfulness_practices: profile.mindfulness_practices || [],
      },
      routine_description: profile.routine_description || "",
      family_future_goal: profile.family_future_goal || "",
      family_value: profile.family_value || "",
    }

    // Process recent activity
    logDebug("generate-daily", "Processing recent activity")
    const recentActivity =
      recentLogs?.map((log) => ({
        date: log.log_date,
        sleep_hours: log.sleep_hours,
        exercise_minutes: log.exercise_minutes,
        mood_rating: log.mood_rating,
        quality_time: log.quality_time,
        notes: log.notes,
      })) || []

    // Calculate trends
    logDebug("generate-daily", "Calculating trends")
    const trends = calculateTrends(recentActivity)

    // Determine insight focus
    logDebug("generate-daily", "Determining insight focus")
    const { insightType, focusArea } = determineInsightFocus(
      profile,
      recentActivity,
      trends,
      previousInsights?.map((i) => i.insight_type) || [],
    )

    logDebug("generate-daily", `Focus determined: ${insightType} - ${focusArea}`)

    // Create prompt
    const prompt = `You are MW3-GPT, a family coaching AI. Generate a personalized daily insight for ${userContext.name}.

USER PROFILE:
- Name: ${userContext.name}
- Age: ${userContext.age}
- Role: ${userContext.role}
- Children: ${userContext.children_count}

CURRENT RATINGS:
- Spouse relationship: ${userContext.spouse_relationship.rating}/10
- Children relationship: ${userContext.children_relationship.rating}/10
- Health: ${userContext.health.current_rating}/10
- Stress level: ${userContext.mindset.current_stress_level}/10

FOCUS AREA: ${focusArea}
INSIGHT TYPE: ${insightType}

Generate a personalized insight that:
1. Is 2-3 sentences long
2. Provides ONE specific, actionable recommendation
3. References their specific situation
4. Is encouraging and supportive
5. Focuses on ${focusArea}

Return ONLY the insight text, no formatting or labels.`

    logDebug("generate-daily", "Generating insight with AI")

    // Try with primary model first, then fall back to alternatives if needed
    let cleanedInsight = ""
    let modelUsed = ""

    try {
      // Try with the advanced reasoning model first
      logDebug("generate-daily", `Attempting to use ${AI_MODELS.ADVANCED_REASONING}`)
      const { text } = await generateText({
        model: openai(AI_MODELS.ADVANCED_REASONING),
        prompt,
        maxTokens: 300,
        temperature: 0.7,
      })
      cleanedInsight = text.trim()
      modelUsed = AI_MODELS.ADVANCED_REASONING
      logDebug("generate-daily", `Successfully used ${modelUsed} model`)
    } catch (modelError) {
      // Log the specific error but don't treat it as a failure since we have fallbacks
      logDebug(
        "generate-daily",
        `Primary model (${AI_MODELS.ADVANCED_REASONING}) failed, trying fallback: ${modelError instanceof Error ? modelError.message : String(modelError)}`,
      )

      try {
        // Fall back to GPT-4o-mini
        logDebug("generate-daily", "Trying fallback model: gpt-4o-mini")
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
          maxTokens: 300,
          temperature: 0.7,
        })
        cleanedInsight = text.trim()
        modelUsed = "gpt-4o-mini"
        logDebug("generate-daily", `Successfully used fallback model ${modelUsed}`)
      } catch (fallbackError) {
        logDebug(
          "generate-daily",
          `Fallback model failed, trying final fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
        )

        // Last resort - use GPT-3.5-turbo
        logDebug("generate-daily", "Trying final fallback: gpt-3.5-turbo")
        const { text } = await generateText({
          model: openai("gpt-3.5-turbo"),
          prompt,
          maxTokens: 300,
          temperature: 0.7,
        })
        cleanedInsight = text.trim()
        modelUsed = "gpt-3.5-turbo"
        logDebug("generate-daily", `Successfully used final fallback model ${modelUsed}`)
      }
    }

    if (!cleanedInsight) {
      logError("generate-daily", "No insight generated from any model")
      return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 })
    }

    logDebug("generate-daily", `Generated insight: ${cleanedInsight.substring(0, 100)}...`)

    // Save insight to database
    logDebug("generate-daily", "Saving insight to database")
    const { data: insight, error: insertError } = await supabase
      .from("insights")
      .insert({
        user_id: user.id,
        insight_text: cleanedInsight,
        insight_type: insightType,
        focus_area: focusArea,
        created_at: new Date().toISOString(),
        metadata: {
          trends: trends,
          data_points_used: Object.keys(trends).length,
          previous_insight_count: previousInsights?.length || 0,
          model_used: modelUsed,
        },
      })
      .select()
      .single()

    if (insertError) {
      logError("generate-daily", `Error saving insight: ${insertError.message}`)
      return NextResponse.json({ error: "Failed to save insight" }, { status: 500 })
    }

    logDebug("generate-daily", "Insight saved successfully")

    return NextResponse.json({ insight })
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    logError("generate-daily", `Unexpected error: ${errorMessage}`, {
      stack: errorStack,
      error: error,
    })

    // Always return valid JSON
    return NextResponse.json({ error: "Failed to generate insight due to an unexpected error" }, { status: 500 })
  }
}

// Helper function to calculate trends
function calculateTrends(recentActivity: any[]) {
  try {
    if (!recentActivity || recentActivity.length === 0) return {}

    const trends: Record<string, any> = {}

    // Sleep trends
    const sleepData = recentActivity
      .filter((a) => a && a.sleep_hours !== null && a.sleep_hours !== undefined && !isNaN(a.sleep_hours))
      .map((a) => Number(a.sleep_hours))

    if (sleepData.length > 0) {
      trends.sleep = {
        average: sleepData.reduce((sum, hours) => sum + hours, 0) / sleepData.length,
        consistency: calculateConsistency(sleepData),
      }
    }

    // Mood trends
    const moodData = recentActivity
      .filter((a) => a && a.mood_rating !== null && a.mood_rating !== undefined && !isNaN(a.mood_rating))
      .map((a) => Number(a.mood_rating))

    if (moodData.length > 0) {
      trends.mood = {
        average: moodData.reduce((sum, rating) => sum + rating, 0) / moodData.length,
        variability: calculateVariability(moodData),
      }
    }

    // Exercise trends
    const exerciseData = recentActivity
      .filter((a) => a && a.exercise_minutes !== null && a.exercise_minutes !== undefined && !isNaN(a.exercise_minutes))
      .map((a) => Number(a.exercise_minutes))

    if (exerciseData.length > 0) {
      trends.exercise = {
        average: exerciseData.reduce((sum, mins) => sum + mins, 0) / exerciseData.length,
        consistency: calculateConsistency(exerciseData),
      }
    }

    return trends
  } catch (error) {
    logError("calculateTrends", error)
    return {}
  }
}

function calculateConsistency(data: number[]): string {
  try {
    if (!data || data.length < 3) return "insufficient data"

    const differences = []
    for (let i = 1; i < data.length; i++) {
      differences.push(Math.abs(data[i] - data[i - 1]))
    }

    const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length

    if (avgDifference < 1) return "very consistent"
    if (avgDifference < 2) return "consistent"
    return "inconsistent"
  } catch (error) {
    logError("calculateConsistency", error)
    return "unknown"
  }
}

function calculateVariability(data: number[]): string {
  try {
    if (!data || data.length < 3) return "insufficient data"

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length
    const stdDev = Math.sqrt(variance)

    if (stdDev < 1) return "very stable"
    if (stdDev < 2) return "stable"
    return "variable"
  } catch (error) {
    logError("calculateVariability", error)
    return "unknown"
  }
}

// Helper function to determine insight focus
function determineInsightFocus(
  profile: any,
  recentActivity: any[],
  trends: any,
  previousInsightTypes: string[],
): { insightType: InsightType; focusArea: string } {
  try {
    // Default values
    let insightType: InsightType = "general_tip"
    let focusArea = "personal growth"

    // Define priority areas based on profile data
    const priorityAreas = []

    // Check relationship priorities
    if (profile.spouse_relationship_rating !== null && profile.spouse_relationship_rating < 7) {
      priorityAreas.push({
        type: "relationship_tip" as InsightType,
        area: "relationship with " + (profile.spouse_name || "partner"),
        priority: 10 - profile.spouse_relationship_rating,
        lastUsed: previousInsightTypes.findIndex((t) => t === "relationship_tip"),
      })
    }

    if (profile.children_relationship_rating !== null && profile.children_relationship_rating < 7) {
      priorityAreas.push({
        type: "parenting_tip" as InsightType,
        area: "parenting and family relationships",
        priority: 10 - profile.children_relationship_rating,
        lastUsed: previousInsightTypes.findIndex((t) => t === "parenting_tip"),
      })
    }

    // Check health priorities
    if (profile.current_health_rating !== null && profile.current_health_rating < 7) {
      priorityAreas.push({
        type: "wellness_tip" as InsightType,
        area: "health and wellness",
        priority: 10 - profile.current_health_rating,
        lastUsed: previousInsightTypes.findIndex((t) => t === "wellness_tip"),
      })
    }

    // Check mindset priorities
    if (profile.current_stress_level !== null && profile.current_stress_level > 6) {
      priorityAreas.push({
        type: "mindset_tip" as InsightType,
        area: "stress management",
        priority: profile.current_stress_level,
        lastUsed: previousInsightTypes.findIndex((t) => t === "mindset_tip"),
      })
    }

    // Add general tip as fallback
    priorityAreas.push({
      type: "general_tip" as InsightType,
      area: "personal growth",
      priority: 3,
      lastUsed: previousInsightTypes.findIndex((t) => t === "general_tip"),
    })

    // If we have priority areas, select one based on priority
    if (priorityAreas.length > 0) {
      // Sort by priority (highest first)
      priorityAreas.sort((a, b) => b.priority - a.priority)

      // Use highest priority area
      const selected = priorityAreas[0]
      insightType = selected.type
      focusArea = selected.area
    }

    return { insightType, focusArea }
  } catch (error) {
    logError("determineInsightFocus", error)
    return { insightType: "general_tip", focusArea: "personal growth" }
  }
}
