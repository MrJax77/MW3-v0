export function logError(context: string, error: any, additionalData?: any) {
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || process.env.NODE_ENV === "development"

  const errorInfo = {
    context,
    message: error?.message || "Unknown error",
    stack: error?.stack,
    name: error?.name,
    cause: error?.cause,
    additionalData,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "server",
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
  }

  if (isDebugMode) {
    console.error(`[${context}] Error occurred:`, errorInfo)
  } else {
    console.error(`[${context}] Error:`, error?.message || "Unknown error")
  }

  // In production, you could send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error tracking service
    // sendToErrorTracking(errorInfo)
  }
}

export function logDebug(context: string, data: any) {
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || process.env.NODE_ENV === "development"

  if (isDebugMode) {
    console.log(`[${context}] Debug:`, {
      data,
      timestamp: new Date().toISOString(),
    })
  }
}

export function validateServerEnvironment() {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    const error = new Error(`Missing required environment variables: ${missing.join(", ")}`)
    logError("validateServerEnvironment", error, { missing })
    throw error
  }

  return true
}

export function logPerformance(context: string, startTime: number) {
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || process.env.NODE_ENV === "development"

  if (isDebugMode) {
    const duration = Date.now() - startTime
    console.log(`[${context}] Performance:`, {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  }
}

// Client-side error boundary helper
export function setupGlobalErrorHandler() {
  if (typeof window === "undefined") return

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logError("unhandledrejection", event.reason, {
      promise: event.promise,
      type: "unhandledrejection",
    })
  })

  // Catch uncaught errors
  window.addEventListener("error", (event) => {
    logError("uncaughtError", event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: "uncaughtError",
    })
  })
}
