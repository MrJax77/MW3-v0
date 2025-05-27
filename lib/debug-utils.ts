export function logError(context: string, error: any, additionalData?: any) {
  console.error(`[${context}] Error occurred:`, {
    message: error?.message || "Unknown error",
    stack: error?.stack,
    name: error?.name,
    cause: error?.cause,
    additionalData,
    timestamp: new Date().toISOString(),
  })
}

export function logDebug(context: string, data: any) {
  console.log(`[${context}] Debug:`, {
    data,
    timestamp: new Date().toISOString(),
  })
}

export function validateServerEnvironment() {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  return true
}
