import { NextResponse } from "next/server"
import { writeLog } from "@/lib/logger"

export async function GET() {
  try {
    await writeLog("api", "info", "Health check requested")

    // Check Python backend health
    const pythonApiUrl = process.env.PYTHON_API_URL || "http://localhost:5000"

    let pythonStatus = "unknown"
    try {
      const response = await fetch(`${pythonApiUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        pythonStatus = data.status

        await writeLog("api", "info", "Python backend health check successful", {
          pythonStatus: data,
        })
      } else {
        pythonStatus = "error"
        await writeLog("api", "warn", "Python backend health check failed", {
          status: response.status,
        })
      }
    } catch (error) {
      pythonStatus = "unreachable"
      await writeLog("api", "error", "Python backend unreachable", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        nextjs: "healthy",
        python_backend: pythonStatus,
      },
    })
  } catch (error) {
    await writeLog("api", "error", "Health check error", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
