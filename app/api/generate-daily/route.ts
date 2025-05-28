import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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

interface InsightMetadata {
  focusArea: string
  insightType: InsightType
  confidenceScore: number
  dataPoints: string[]
  recommendationStrength: "high" | "medium" | "low"
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get comprehensive user profile for personalized insights
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user has enough profile data for meaningful insights
    const hasBasicInfo = profile.first_name && profile.age && profile.role
    const hasRelationshipInfo =
      profile.spouse_relationship_rating !== null || profile.children_relationship_rating !== null
    const hasHealthInfo = profile.current_health_rating !== null
    const hasMindsetInfo = profile.current_stress_level !== null

    if (!hasBasicInfo) {
      return NextResponse.json({ error: "Please complete your basic profile information first" }, { status: 400 })
    }

    // Get recent daily logs for context and trend analysis
    const { data: recentLogs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(14) // Increased from 7 to 14 days for better trend analysis

    // Get previous insights to avoid repetition and build on previous recommendations
    const { data: previousInsights } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Create comprehensive user context for AI with enriched data
    const userContext = {
      // Basic Info
      name: profile.first_name,
      age: profile.age,
      role: profile.role,
      children_count: profile.children_count || 0,
      children_ages: profile.children_ages || "N/A",

      // Relationships - Enhanced with more context
      spouse_relationship: {
        rating: profile.spouse_relationship_rating,
        reason: profile.spouse_relationship_reason,
        goal: profile.spouse_relationship_goal,
        spouse_name: profile.spouse_name || "partner",
      },
      children_relationship: {
        rating: profile.children_relationship_rating,
        reason: profile.children_relationship_reason,
        parenting_goal: profile.parenting_goal,
      },
      upcoming_events: profile.upcoming_events || [],

      // Health & Wellness - Structured for better analysis
      health: {
        current_rating: profile.current_health_rating,
        goal: profile.health_goal,
        exercise_frequency: profile.exercise_frequency || 0,
        sleep_hours: profile.sleep_hours || 0,
      },

      // Mindset & Stress - Structured for better analysis
      mindset: {
        current_stress_level: profile.current_stress_level,
        personal_goal: profile.personal_goal,
        mindfulness_practices: profile.mindfulness_practices || [],
      },

      // Goals & Values - Enhanced with more context
      routine_description: profile.routine_description,
      family_future_goal: profile.family_future_goal,
      family_value: profile.family_value,

      // Preferences
      notification_channel: profile.notification_channel,
    }

    // Process recent activity data to identify trends and patterns
    const recentActivity =
      recentLogs?.map((log) => ({
        date: log.log_date,
        sleep_hours: log.sleep_hours,
        exercise_minutes: log.exercise_minutes,
        mood_rating: log.mood_rating,
        quality_time: log.quality_time,
        notes: log.notes,
      })) || []

    // Calculate trends and patterns from recent logs
    const trends = calculateTrends(recentActivity)

    // Determine insight type based on available data, recent patterns, and rotation strategy
    const { insightType, focusArea } = determineInsightFocus(
      profile,
      recentActivity,
      trends,
      previousInsights?.map((i) => i.insight_type) || [],
    )

    // Enhanced prompt with more specific instructions and context
    const prompt = `You are MW3-GPT, a sophisticated family coaching AI specializing in personalized guidance. Generate an in-depth, actionable daily insight for this user.

USER PROFILE:
${JSON.stringify(userContext, null, 2)}

RECENT ACTIVITY (last 14 days):
${JSON.stringify(recentActivity, null, 2)}

IDENTIFIED TRENDS:
${JSON.stringify(trends, null, 2)}

PREVIOUS INSIGHTS:
${previousInsights?.map((i) => `- ${i.insight_text} (${i.insight_type})`).join("\n") || "No previous insights"}

FOCUS AREA: ${focusArea}
INSIGHT TYPE: ${insightType}

Generate a personalized insight that:
1. Is concise yet substantial (3-4 sentences, 250-300 characters)
2. Provides ONE specific, actionable recommendation with clear steps
3. References their specific situation, goals, and recent patterns
4. Is encouraging, supportive, and motivational
5. Focuses primarily on ${focusArea}
6. Builds upon previous insights without repetition
7. Connects to their long-term goals when relevant
8. Uses evidence-based approaches for the recommendation

Guidelines:
- Use their name (${profile.first_name}) naturally and conversationally
- Reference specific details from their profile and recent activity
- If they have relationship goals, provide practical relationship advice
- If they have health goals, offer specific wellness strategies
- If they have high stress, suggest effective stress management techniques
- Connect daily actions to their bigger picture goals
- Keep the tone warm, empathetic, and professional
- Avoid generic advice; be specific to their situation
- Include a clear "why" behind your recommendation

Return ONLY the insight text, no additional formatting or labels.`

    // Use a more capable model for deeper insights
    const { text } = await generateText({
      model: openai("gpt-4o"), // Upgraded from gpt-4o-mini for more sophisticated insights
      prompt,
      maxTokens: 300, // Increased token limit for more detailed responses
      temperature: 0.7,
    })

    // Extract and validate the insight
    const cleanedInsight = text.trim()

    // Validate insight quality
    const validationResult = await validateInsightQuality(cleanedInsight, insightType, focusArea)

    if (!validationResult.isValid) {
      console.warn("Generated insight failed quality validation:", validationResult.reason)
      // Fall back to a simpler model or approach if needed
    }

    // Save insight to database with enhanced metadata
    const { data: insight, error } = await supabase
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
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving insight:", error)
      return NextResponse.json({ error: "Failed to save insight" }, { status: 500 })
    }

    return NextResponse.json({ insight })
  } catch (error) {
    console.error("Error generating insight:", error)
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 })
  }
}

// Helper function to calculate trends from recent activity
function calculateTrends(recentActivity: any[]) {
  if (!recentActivity.length) return {}

  const trends: Record<string, any> = {}

  // Calculate sleep trends
  if (recentActivity.some((a) => a.sleep_hours !== undefined)) {
    const sleepData = recentActivity.filter((a) => a.sleep_hours !== undefined).map((a) => a.sleep_hours)
    trends.sleep = {
      average: sleepData.reduce((sum, hours) => sum + hours, 0) / sleepData.length,
      trend:
        sleepData.length > 3
          ? sleepData.slice(0, 3).reduce((sum, h) => sum + h, 0) / 3 -
            sleepData.slice(-3).reduce((sum, h) => sum + h, 0) / 3
          : "insufficient data",
      consistency: calculateConsistency(sleepData),
    }
  }

  // Calculate mood trends
  if (recentActivity.some((a) => a.mood_rating !== undefined)) {
    const moodData = recentActivity.filter((a) => a.mood_rating !== undefined).map((a) => a.mood_rating)
    trends.mood = {
      average: moodData.reduce((sum, rating) => sum + rating, 0) / moodData.length,
      trend:
        moodData.length > 3
          ? moodData.slice(-3).reduce((sum, r) => sum + r, 0) / 3 -
            moodData.slice(0, 3).reduce((sum, r) => sum + r, 0) / 3
          : "insufficient data",
      variability: calculateVariability(moodData),
    }
  }

  // Calculate exercise trends
  if (recentActivity.some((a) => a.exercise_minutes !== undefined)) {
    const exerciseData = recentActivity.filter((a) => a.exercise_minutes !== undefined).map((a) => a.exercise_minutes)
    trends.exercise = {
      average: exerciseData.reduce((sum, mins) => sum + mins, 0) / exerciseData.length,
      trend:
        exerciseData.length > 3
          ? exerciseData.slice(-3).reduce((sum, m) => sum + m, 0) / 3 -
            exerciseData.slice(0, 3).reduce((sum, m) => sum + m, 0) / 3
          : "insufficient data",
      consistency: calculateConsistency(exerciseData),
    }
  }

  // Calculate quality time trends
  if (recentActivity.some((a) => a.quality_time !== undefined)) {
    const qualityTimeData = recentActivity.filter((a) => a.quality_time !== undefined).map((a) => a.quality_time)
    trends.qualityTime = {
      average: qualityTimeData.reduce((sum, mins) => sum + mins, 0) / qualityTimeData.length,
      trend:
        qualityTimeData.length > 3
          ? qualityTimeData.slice(-3).reduce((sum, m) => sum + m, 0) / 3 -
            qualityTimeData.slice(0, 3).reduce((sum, m) => sum + m, 0) / 3
          : "insufficient data",
      consistency: calculateConsistency(qualityTimeData),
    }
  }

  return trends
}

// Helper function to calculate data consistency
function calculateConsistency(data: number[]): string {
  if (data.length < 3) return "insufficient data"

  const differences = []
  for (let i = 1; i < data.length; i++) {
    differences.push(Math.abs(data[i] - data[i - 1]))
  }

  const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length

  if (avgDifference < 1) return "very consistent"
  if (avgDifference < 2) return "consistent"
  if (avgDifference < 3) return "somewhat consistent"
  return "inconsistent"
}

// Helper function to calculate data variability
function calculateVariability(data: number[]): string {
  if (data.length < 3) return "insufficient data"

  const avg = data.reduce((sum, val) => sum + val, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)

  if (stdDev < 1) return "very stable"
  if (stdDev < 2) return "stable"
  if (stdDev < 3) return "somewhat variable"
  return "highly variable"
}

// Helper function to determine insight focus based on user data and rotation strategy
function determineInsightFocus(
  profile: any,
  recentActivity: any[],
  trends: any,
  previousInsightTypes: string[],
): { insightType: InsightType; focusArea: string } {
  // Default values
  let insightType: InsightType = "general_tip"
  let focusArea = "general wellbeing"

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

  // Check goal priorities
  if (profile.family_future_goal) {
    priorityAreas.push({
      type: "goal_tip" as InsightType,
      area: "goal achievement",
      priority: 5, // Medium priority
      lastUsed: previousInsightTypes.findIndex((t) => t === "goal_tip"),
    })
  }

  // Check work-life balance based on routine description
  if (
    profile.routine_description &&
    (profile.routine_description.toLowerCase().includes("work") ||
      profile.routine_description.toLowerCase().includes("busy"))
  ) {
    priorityAreas.push({
      type: "work_life_balance_tip" as InsightType,
      area: "work-life balance",
      priority: 6,
      lastUsed: previousInsightTypes.findIndex((t) => t === "work_life_balance_tip"),
    })
  }

  // Add daily habits if we have recent activity data
  if (recentActivity.length > 0) {
    priorityAreas.push({
      type: "daily_tip" as InsightType,
      area: "daily habits",
      priority: 4, // Lower priority
      lastUsed: previousInsightTypes.findIndex((t) => t === "daily_tip"),
    })
  }

  // If we have priority areas, select one based on priority and rotation
  if (priorityAreas.length > 0) {
    // Sort by priority (highest first)
    priorityAreas.sort((a, b) => b.priority - a.priority)

    // Check if the highest priority area was used recently
    const highestPriority = priorityAreas[0]

    // If highest priority wasn't used in the last 3 insights or has very high priority, use it
    if (highestPriority.lastUsed === -1 || highestPriority.lastUsed > 2 || highestPriority.priority > 8) {
      insightType = highestPriority.type
      focusArea = highestPriority.area
    } else {
      // Otherwise rotate through other areas that haven't been used recently
      const unusedAreas = priorityAreas.filter((area) => area.lastUsed === -1)
      const leastRecentlyUsed = priorityAreas.sort((a, b) => {
        // Sort by last used (oldest first, -1 means never used)
        if (a.lastUsed === -1) return -1
        if (b.lastUsed === -1) return 1
        return b.lastUsed - a.lastUsed
      })

      // Select either an unused area or least recently used
      const selected = unusedAreas.length > 0 ? unusedAreas[0] : leastRecentlyUsed[0]
      insightType = selected.type
      focusArea = selected.area
    }
  }

  return { insightType, focusArea }
}

// Helper function to validate insight quality
async function validateInsightQuality(
  insight: string,
  insightType: InsightType,
  focusArea: string,
): Promise<{ isValid: boolean; reason?: string }> {
  // Basic validation
  if (insight.length < 100) {
    return { isValid: false, reason: "Insight too short" }
  }

  if (!insight.includes(" ")) {
    return { isValid: false, reason: "Invalid formatting" }
  }

  // Check if insight contains actionable advice
  const actionWords = ["try", "consider", "start", "practice", "focus", "prioritize", "schedule", "create", "implement"]
  const containsActionableAdvice = actionWords.some((word) => insight.toLowerCase().includes(word))

  if (!containsActionableAdvice) {
    return { isValid: false, reason: "No actionable advice" }
  }

  // Check if insight is relevant to the focus area
  const focusAreaKeywords = focusArea.toLowerCase().split(" ")
  const isRelevantToFocusArea = focusAreaKeywords.some(
    (keyword) => insight.toLowerCase().includes(keyword) && keyword.length > 3,
  )

  if (!isRelevantToFocusArea) {
    return { isValid: false, reason: "Not relevant to focus area" }
  }

  return { isValid: true }
}
