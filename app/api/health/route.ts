import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
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

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // Test authentication
    console.log("🔍 Testing authentication...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    const authStatus = authError ? "failed" : user ? "authenticated" : "anonymous"

    // Test table structure
    console.log("🔍 Testing table structure...")
    const { data: tableInfo, error: tableError } = await supabase
      .rpc("get_table_info", { table_name: "profiles" })
      .single()

    // If the RPC doesn't exist, try a simple query instead
    let tableStatus = "unknown"
    if (tableError) {
      console.log("ℹ️ RPC not available, testing with simple query...")
      const { error: simpleError } = await supabase.from("profiles").select("user_id").limit(1)

      tableStatus = simpleError ? "error" : "accessible"
    } else {
      tableStatus = "accessible"
    }

    console.log("✅ Health check completed successfully")

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: "ok",
      database: "connected",
      authentication: authStatus,
      table_access: tableStatus,
      user_id: user?.id || null,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
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
