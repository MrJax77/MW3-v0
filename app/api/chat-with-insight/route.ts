import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
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

    // Get request body
    const { message, insight, insightType, focusArea, insightId, chatHistory } = await request.json()

    if (!message || !insight) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user profile for context
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Format chat history for the prompt
    const formattedChatHistory = chatHistory
      ? chatHistory
          .filter((msg: ChatMessage) => msg.role !== "system") // Filter out system messages
          .map((msg: ChatMessage) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
          .join("\n")
      : ""

    // Create the prompt
    const prompt = `You are MW3-GPT, a sophisticated family coaching AI specializing in personalized guidance. 
You're having a conversation with ${profile.first_name || "the user"} about a daily insight they received.

INSIGHT DETAILS:
- Type: ${insightType}
- Focus Area: ${focusArea || "general wellbeing"}
- Content: "${insight}"

USER PROFILE:
- Name: ${profile.first_name || "User"}
- Age: ${profile.age || "Not specified"}
- Role: ${profile.role || "Not specified"}
- Has children: ${profile.children_count > 0 ? "Yes" : "No"}
${profile.children_count > 0 ? `- Children ages: ${profile.children_ages || "Not specified"}` : ""}
- Health goal: ${profile.health_goal || "Not specified"}
- Personal goal: ${profile.personal_goal || "Not specified"}
- Family goal: ${profile.family_future_goal || "Not specified"}

${formattedChatHistory ? `PREVIOUS CONVERSATION:\n${formattedChatHistory}\n` : ""}

USER'S QUESTION: ${message}

Provide a helpful, personalized response that:
1. Directly addresses their question about the insight
2. Offers practical, actionable advice they can implement
3. Is encouraging and supportive
4. Connects to their specific goals and situation when relevant
5. Is conversational and warm, like a supportive coach

Your response should be thorough but concise, focusing on quality guidance rather than length.

IMPORTANT: Respond in plain text only. Do not use any markdown formatting such as **bold**, *italic*, \`code\`, or # headers. Use simple bullet points (•) for lists if needed, but avoid all other formatting.`

    // Generate response using OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 800,
      temperature: 0.7,
    })

    // Save the chat interaction to the database
    await supabase.from("chat_interactions").insert({
      user_id: user.id,
      user_message: message,
      assistant_response: text,
      insight_id: insightId || null,
      created_at: new Date().toISOString(),
      metadata: {
        insightType,
        focusArea,
      },
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat with insight:", error)
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
