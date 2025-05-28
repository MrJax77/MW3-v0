import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { logError, logDebug } from "@/lib/debug-utils"
import { AI_MODELS, PROMPT_TEMPLATES } from "@/lib/ai-config"
import { retrieveRelevantDocuments, formatDocumentsAsContext, storeDocument } from "@/lib/rag-utils"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { field, question, currentValue, formContext, maxLength } = await request.json()

    if (!field || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check and update AI usage
    const today = new Date().toISOString().split("T")[0]

    // Get or create usage record
    const { data: usage, error: usageError } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (usageError && usageError.code !== "PGRST116") {
      throw usageError
    }

    const currentUsage = usage || {
      user_id: user.id,
      total_calls: 0,
      daily_calls: 0,
      last_used: today,
    }

    // Reset daily calls if it's a new day
    if (currentUsage.last_used !== today) {
      currentUsage.daily_calls = 0
      currentUsage.last_used = today
    }

    // Check daily limit
    if (currentUsage.daily_calls >= 20) {
      return NextResponse.json({ error: "Daily AI assist limit reached (20 per day)" }, { status: 429 })
    }

    // Get user profile for context if available
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    // Retrieve relevant documents using RAG
    const relevantDocuments = await retrieveRelevantDocuments(
      `${field} ${question} ${currentValue || ""}`,
      user.id,
      "survey_context",
    )

    // Format documents as context
    const documentContext = formatDocumentsAsContext(relevantDocuments)

    // Create a context-aware prompt
    const contextualInfo = createContextualInfo(field, question, currentValue, formContext, profile, maxLength)

    // Combine all context
    const fullContext = `
${contextualInfo}

RELEVANT CONTEXT:
${documentContext}
`

    // Create the final prompt using the template
    const prompt = PROMPT_TEMPLATES.SURVEY_ASSISTANCE(field, question, fullContext)

    logDebug("ai-assist", "Generating suggestion", { field, question, modelUsed: AI_MODELS.SURVEY_ASSISTANT })

    // Generate suggestion using the specified model for survey assistance
    const { text } = await generateText({
      model: openai(AI_MODELS.SURVEY_ASSISTANT),
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    })

    // Update usage
    currentUsage.daily_calls += 1
    currentUsage.total_calls += 1

    if (usage) {
      await supabase
        .from("ai_usage")
        .update({
          daily_calls: currentUsage.daily_calls,
          total_calls: currentUsage.total_calls,
          last_used: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
    } else {
      await supabase.from("ai_usage").insert({
        user_id: user.id,
        daily_calls: currentUsage.daily_calls,
        total_calls: currentUsage.total_calls,
        last_used: today,
      })
    }

    // Store this interaction as a document for future RAG
    if (text.trim().length > 50) {
      await storeDocument(text.trim(), user.id, {
        source: "ai_suggestion",
        category: "survey_context",
        date_created: new Date().toISOString(),
        field,
        question,
      })
    }

    return NextResponse.json({
      suggestion: text.trim(),
      remainingAssists: 20 - currentUsage.daily_calls,
    })
  } catch (error) {
    logError("ai-assist", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 })
  }
}

// Helper function to create contextual information
function createContextualInfo(
  field: string,
  question: string,
  currentValue: string | null,
  formContext: string | null,
  profile: any,
  maxLength = 500,
): string {
  let contextInfo = `
Field context: ${formContext || "No additional context provided"}
${currentValue ? `The user has already written: "${currentValue}"` : "The user hasn't written anything yet."}
${maxLength ? `The response should be no more than ${maxLength} characters.` : ""}
`

  // Add profile context if available
  if (profile) {
    contextInfo += `\nUser profile information to personalize the response:
- Name: ${profile.first_name || "Not provided"}
- Age: ${profile.age || "Not provided"}
- Role: ${profile.role || "Not provided"}
- Has children: ${profile.children_count > 0 ? "Yes" : "No"}
${profile.children_count > 0 ? `- Children ages: ${profile.children_ages || "Not specified"}` : ""}
${profile.spouse_name ? `- Spouse/partner name: ${profile.spouse_name}` : ""}
${profile.health_goal ? `- Health goal: ${profile.health_goal}` : ""}
${profile.personal_goal ? `- Personal goal: ${profile.personal_goal}` : ""}
${profile.family_future_goal ? `- Family goal: ${profile.family_future_goal}` : ""}`
  }

  return contextInfo
}
