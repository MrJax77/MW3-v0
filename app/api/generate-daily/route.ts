import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

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

    // Get user profile for personalized insights
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    // Get recent daily logs for context
    const { data: recentLogs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(7)

    // Create personalized prompt based on user data
    const userContext = profile
      ? {
          mindset: profile.mindset_json,
          wellness: profile.wellness_json,
          purpose: profile.purpose_json,
        }
      : {}

    const recentActivity =
      recentLogs?.map((log) => ({
        date: log.log_date,
        data: log.log_json,
      })) || []

    const prompt = `You are a personalized AI coach. Generate a brief, actionable daily insight for this user.

User Context:
${JSON.stringify(userContext, null, 2)}

Recent Activity (last 7 days):
${JSON.stringify(recentActivity, null, 2)}

Generate a personalized insight that:
1. Is 2-3 sentences maximum
2. Provides actionable advice
3. References their goals or recent patterns if available
4. Is encouraging and motivational
5. Focuses on one specific area (mindset, wellness, or productivity)

Return only the insight text, no additional formatting.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 150,
    })

    // Save insight to database
    const { data: insight, error } = await supabase
      .from("insights")
      .insert({
        user_id: user.id,
        insight_text: text,
        insight_type: "daily_tip",
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
