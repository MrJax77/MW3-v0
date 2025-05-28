import { createClient } from "@supabase/supabase-js"
import { logDebug, logError } from "./debug-utils"

// Interface for document metadata
interface DocumentMetadata {
  source: string
  category: string
  date_created: string
  author?: string
  [key: string]: any
}

// Interface for retrieved documents
export interface RetrievedDocument {
  content: string
  metadata: DocumentMetadata
  similarity: number
}

/**
 * Retrieves relevant documents based on a query using text search
 */
export async function retrieveRelevantDocuments(
  query: string,
  userId: string,
  category?: string,
  limit = 5,
): Promise<RetrievedDocument[]> {
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })

    // Prepare search terms
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .split(/\s+/)
      .filter((term) => term.length > 3)
      .join(" | ")

    if (!searchTerms) {
      return []
    }

    // Build the query
    let matchQuery = supabase
      .from("documents")
      .select("id, content, metadata, search_text")
      .or(`user_id.eq.${userId},user_id.eq.public`)

    // Only add text search if we have search terms
    if (searchTerms) {
      try {
        matchQuery = matchQuery.textSearch("search_text", searchTerms, {
          type: "plain",
          config: "english",
        })
      } catch (error) {
        logError("rag-utils", `Text search error: ${error instanceof Error ? error.message : String(error)}`)
        // Continue without text search if it fails
      }
    }

    // Add category filter if provided - Fix the JSON filter syntax
    if (category) {
      try {
        // Use eq filter with proper JSON syntax
        matchQuery = matchQuery.filter("metadata->>category", "eq", category)
      } catch (error) {
        logError("rag-utils", `Category filter error: ${error instanceof Error ? error.message : String(error)}`)
        // Continue without category filter if it fails
      }
    }

    // Limit results
    matchQuery = matchQuery.limit(limit)

    // Execute search with error handling
    const { data: documents, error: searchError } = await matchQuery

    if (searchError) {
      logError("rag-utils", new Error(`Document search failed: ${searchError.message}`))
      return []
    }

    logDebug("rag-utils", `Retrieved ${documents?.length || 0} relevant documents`)

    // Calculate simple similarity scores based on term frequency
    const scoredDocuments =
      documents?.map((doc: any) => {
        // Simple scoring based on term frequency
        const termFrequency = searchTerms.split(" | ").reduce((score, term) => {
          const regex = new RegExp(term, "gi")
          const matches = (doc.content.match(regex) || []).length
          return score + matches
        }, 0)

        // Normalize score between 0 and 1
        const similarity = Math.min(termFrequency / 10, 1)

        // Ensure metadata is properly parsed
        let metadata = doc.metadata
        if (typeof metadata === "string") {
          try {
            metadata = JSON.parse(metadata)
          } catch (e) {
            metadata = { source: "unknown", category: "unknown", date_created: new Date().toISOString() }
          }
        }

        return {
          content: doc.content,
          metadata: metadata || { source: "unknown", category: "unknown", date_created: new Date().toISOString() },
          similarity,
        }
      }) || []

    // Sort by similarity
    return scoredDocuments.sort((a, b) => b.similarity - a.similarity)
  } catch (error) {
    logError("rag-utils", error instanceof Error ? error : new Error(String(error)))
    return []
  }
}

/**
 * Formats retrieved documents into a context string for the AI
 */
export function formatDocumentsAsContext(documents: RetrievedDocument[]): string {
  if (!documents.length) return "No relevant context available."

  return documents
    .map((doc, index) => {
      const source = doc.metadata?.source ? `Source: ${doc.metadata.source}` : ""
      return `DOCUMENT ${index + 1} [${source}] (Relevance: ${Math.round((doc.similarity || 0) * 100)}%):
${doc.content}
---`
    })
    .join("\n\n")
}

/**
 * Stores a new document in the database
 */
export async function storeDocument(content: string, userId: string, metadata: DocumentMetadata): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })

    // Create search text by combining content and metadata
    const metadataText = Object.entries(metadata)
      .map(([key, value]) => {
        if (typeof value === "string") return value
        if (Array.isArray(value)) return value.join(" ")
        return ""
      })
      .join(" ")

    const searchText = `${content} ${metadataText}`

    // Store the document
    const { error: insertError } = await supabase.from("documents").insert({
      content,
      metadata,
      search_text: searchText,
      user_id: userId,
    })

    if (insertError) {
      logError("rag-utils", new Error(`Document storage failed: ${insertError.message}`))
      return false
    }

    return true
  } catch (error) {
    logError("rag-utils", error instanceof Error ? error : new Error(String(error)))
    return false
  }
}
