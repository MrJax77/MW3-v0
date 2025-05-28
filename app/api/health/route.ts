import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Health check starting...")

    // Check environment variables
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

    if (missingEnvVars.length > 0) {
      console.error("❌ Missing environment variables:", missingEnvVars)
      return NextResponse.json(
        {
          status: "error",
          environment: "failed",
          missing_vars: missingEnvVars,
          error: `Missing required environment variables: ${missingEnvVars.join(", ")}`,
        },
        { status: 500 },
      )
    }

    console.log("✅ Environment variables present")

    const supabase = createSupabaseServerClient()

    // Test basic database connection
    console.log("🔍 Testing database connection...")
    const { data: connectionTest, error: connectionError } = await supabase.from("profiles").select("count").limit(1)

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError)
      return NextResponse.json(
        {
          status: "error",
          database: "failed",
          error: connectionError.message,
          error_code: connectionError.code,
          error_details: connectionError.details,
        },
        { status: 500 },
      )
    }

    console.log("✅ Database connection successful")

    // Test authentication using our improved method
    console.log("🔍 Testing authentication...")
    const user = await getServerUser()

    let authStatus = "anonymous"
    let userId = null

    if (user) {
      console.log("✅ User authenticated:", user.id)
      authStatus = "authenticated"
      userId = user.id
    } else {
      console.log("ℹ️ No user session (anonymous)")
      authStatus = "anonymous"
    }

    // Test table structure
    console.log("🔍 Testing table structure...")
    const { error: simpleError } = await supabase.from("profiles").select("user_id").limit(1)

    const tableStatus = simpleError ? "error" : "accessible"

    console.log("✅ Health check completed successfully")

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: "ok",
      database: "connected",
      authentication: authStatus,
      table_access: tableStatus,
      user_id: userId,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      debug_mode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
    })
  } catch (error) {
    console.error("❌ Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
