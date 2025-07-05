import { type NextRequest, NextResponse } from "next/server"
import { writeLog } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    await writeLog("api", "info", "Login request received")

    const body = await request.json()

    // Forward request to Python backend
    const response = await fetch(`${process.env.PYTHON_API_URL || "http://localhost:5000"}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    await writeLog("api", "info", "Login response from Python backend", {
      status: response.status,
      success: response.ok,
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    await writeLog("api", "error", "Login proxy error", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }
}
