import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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

    // Get recent daily logs for context
    const { data: recentLogs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(7)

    // Create comprehensive user context for AI
    const userContext = {
      // Basic Info
      name: profile.first_name,
      age: profile.age,
      role: profile.role,
      children_count: profile.children_count,
      children_ages: profile.children_ages,

      // Relationships
      spouse_relationship_rating: profile.spouse_relationship_rating,
      spouse_relationship_reason: profile.spouse_relationship_reason,
      children_relationship_rating: profile.children_relationship_rating,
      spouse_relationship_goal: profile.spouse_relationship_goal,
      parenting_goal: profile.parenting_goal,
      upcoming_events: profile.upcoming_events,

      // Health & Wellness
      current_health_rating: profile.current_health_rating,
      health_goal: profile.health_goal,
      exercise_frequency: profile.exercise_frequency,
      sleep_hours: profile.sleep_hours,

      // Mindset & Stress
      current_stress_level: profile.current_stress_level,
      personal_goal: profile.personal_goal,
      mindfulness_practices: profile.mindfulness_practices,

      // Goals & Values
      routine_description: profile.routine_description,
      family_future_goal: profile.family_future_goal,
      family_value: profile.family_value,

      // Preferences
      notification_channel: profile.notification_channel,
    }

    const recentActivity =
      recentLogs?.map((log) => ({
        date: log.log_date,
        sleep_hours: log.sleep_hours,
        exercise_minutes: log.exercise_minutes,
        mood_rating: log.mood_rating,
        quality_time: log.quality_time,
        notes: log.notes,
      })) || []

    // Determine insight type based on available data and recent patterns
    let insightType = "general_tip"
    let focusArea = "general"

    if (hasRelationshipInfo && (profile.spouse_relationship_rating < 7 || profile.children_relationship_rating < 7)) {
      insightType = "relationship_tip"
      focusArea = "relationships"
    } else if (hasHealthInfo && profile.current_health_rating < 7) {
      insightType = "wellness_tip"
      focusArea = "health"
    } else if (hasMindsetInfo && profile.current_stress_level > 6) {
      insightType = "mindset_tip"
      focusArea = "stress management"
    } else if (profile.family_future_goal) {
      insightType = "goal_tip"
      focusArea = "goal achievement"
    } else if (recentActivity.length > 0) {
      insightType = "daily_tip"
      focusArea = "daily habits"
    }

    const prompt = `You are MW3-GPT, a personalized family coaching AI. Generate a brief, actionable daily insight for this user.

User Profile:
${JSON.stringify(userContext, null, 2)}

Recent Activity (last 7 days):
${JSON.stringify(recentActivity, null, 2)}

Focus Area: ${focusArea}
Insight Type: ${insightType}

Generate a personalized insight that:
1. Is 2-3 sentences maximum (under 200 characters)
2. Provides ONE specific, actionable tip
3. References their specific situation, goals, or recent patterns when relevant
4. Is encouraging and supportive
5. Focuses on ${focusArea}

Guidelines:
- Use their name (${profile.first_name}) naturally
- Reference specific details from their profile when relevant
- If they have relationship goals, focus on practical relationship advice
- If they have health goals, focus on wellness tips
- If they have high stress, focus on stress management
- If they have family goals, connect daily actions to bigger picture
- Keep it conversational and warm

Return only the insight text, no additional formatting or labels.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 100,
      temperature: 0.7,
    })

    // Save insight to database
    const { data: insight, error } = await supabase
      .from("insights")
      .insert({
        user_id: user.id,
        insight_text: text.trim(),
        insight_type: insightType,
        created_at: new Date().toISOString(),
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
