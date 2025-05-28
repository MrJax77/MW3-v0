import { getSupabaseServerClient } from "./supabase-singleton"
import { getSupabaseClient } from "./supabase-singleton"
import { logError } from "./debug-utils"

export interface ChatInteraction {
  id: string
  user_id: string
  insight_id: string | null
  user_message: string
  assistant_response: string
  created_at: string
  metadata?: any
}

// Server-side function to get chat history
export async function getServerChatHistory(userId: string, limit = 20, insightId?: string) {
  try {
    const supabase = getSupabaseServerClient()

    let query = supabase
      .from("chat_interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    // Filter by insight if provided
    if (insightId) {
      query = query.eq("insight_id", insightId)
    }

    const { data, error } = await query

    if (error) {
      logError("getServerChatHistory", error)
      return []
    }

    return data as ChatInteraction[]
  } catch (error) {
    logError("getServerChatHistory", error)
    return []
  }
}

// Client-side function to get chat history
export async function getClientChatHistory(limit = 20, insightId?: string) {
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

    let query = supabase
      .from("chat_interactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    // Filter by insight if provided
    if (insightId) {
      query = query.eq("insight_id", insightId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching chat history:", error)
      return []
    }

    return data as ChatInteraction[]
  } catch (error) {
    console.error("Error in getClientChatHistory:", error)
    return []
  }
}

// Function to save a chat interaction
export async function saveClientChatInteraction(
  userMessage: string,
  assistantResponse: string,
  insightId?: string,
  metadata?: any,
) {
  try {
    const supabase = getSupabaseClient()

    // Get current user first
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase.from("chat_interactions").insert({
      user_id: user.id,
      insight_id: insightId || null,
      user_message: userMessage,
      assistant_response: assistantResponse,
      created_at: new Date().toISOString(),
      metadata: metadata || null,
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error saving chat interaction:", error)
    throw error
  }
}
