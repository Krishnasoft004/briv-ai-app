import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { writeLog } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const result = await query(
        `SELECT id, topic, summary, reflection, created_at 
         FROM reflections 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [user.user_id],
      )

      return NextResponse.json({ reflections: result.rows })
    } catch (dbError) {
      await writeLog("api", "error", "Database error fetching reflections", {
        user_id: user.user_id,
        error: dbError instanceof Error ? dbError.message : "Unknown error",
      })

      return NextResponse.json({ reflections: [] })
    }
  } catch (error) {
    await writeLog("api", "error", "Error fetching reflections", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { topic, reflection, summary } = body

    if (!topic || !reflection) {
      return NextResponse.json({ error: "Topic and reflection are required" }, { status: 400 })
    }

    try {
      const result = await query(
        `INSERT INTO reflections (user_id, topic, reflection, summary, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, topic, summary, reflection, created_at`,
        [user.user_id, topic, reflection, summary || ""],
      )

      const newReflection = result.rows[0]

      await writeLog("api", "info", "Reflection created", {
        user_id: user.user_id,
        reflection_id: newReflection.id,
      })

      return NextResponse.json({
        message: "Reflection saved successfully",
        reflection: newReflection,
      })
    } catch (dbError) {
      await writeLog("api", "error", "Database error creating reflection", {
        user_id: user.user_id,
        error: dbError instanceof Error ? dbError.message : "Unknown error",
      })

      return NextResponse.json({ error: "Failed to save reflection" }, { status: 500 })
    }
  } catch (error) {
    await writeLog("api", "error", "Error creating reflection", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
