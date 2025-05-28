// AI model configuration
export const AI_MODELS = {
  // For survey assistance (lighter model for quicker responses)
  SURVEY_ASSISTANT: "gpt-4o-mini",

  // For more complex reasoning (chat interface and insights)
  ADVANCED_REASONING: "gpt-4.1",

  // Fallback model if needed
  FALLBACK: "gpt-3.5-turbo",
}

// RAG configuration
export const RAG_CONFIG = {
  // Maximum number of documents to retrieve
  MAX_DOCUMENTS: 5,

  // Context window size in tokens
  CONTEXT_WINDOW: 4000,
}

// Prompt templates
export const PROMPT_TEMPLATES = {
  SURVEY_ASSISTANCE: (field: string, question: string, context: string) => `
You are an AI assistant helping a user complete a life coaching intake form.
The user is answering the question: "${question}"
Field name: ${field}

${context}

Please provide a thoughtful, personalized response that would be appropriate for this question.
Your response should be:
1. Authentic and personal-sounding (not generic)
2. Reflective and insightful
3. Specific and detailed
4. Written in first-person as if the user wrote it
5. Concise but comprehensive

Do not include any prefacing text like "Here's a suggestion:" - just provide the response itself.
`,

  DAILY_INSIGHT: (userProfile: any, recentActivity: any, trends: any, focusArea: string) => `
You are MW3-GPT, a sophisticated family coaching AI specializing in personalized guidance.
Generate an in-depth, actionable daily insight for this user.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

RECENT ACTIVITY:
${JSON.stringify(recentActivity, null, 2)}

IDENTIFIED TRENDS:
${JSON.stringify(trends, null, 2)}

FOCUS AREA: ${focusArea}

Generate a personalized insight that:
1. Is concise yet substantial (3-4 sentences, 250-300 characters)
2. Provides ONE specific, actionable recommendation with clear steps
3. References their specific situation, goals, and recent patterns
4. Is encouraging, supportive, and motivational
5. Focuses primarily on ${focusArea}
6. Connects to their long-term goals when relevant
7. Uses evidence-based approaches for the recommendation

Return ONLY the insight text, no additional formatting or labels.
`,
}
